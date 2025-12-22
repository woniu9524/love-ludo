import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('[API] 注册开始');
  try {
    const cookieStore = await cookies();
    
    // 🔥 修复：正确的Cookie设置
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // 1. 解析数据
    const { email, password, keyCode } = await request.json();
    const formattedKeyCode = keyCode?.trim().toUpperCase();
    
    if (!email || !password || !keyCode) {
      return NextResponse.json({ error: '邮箱、密码和密钥必填' }, { status: 400 });
    }

    // 2. 查询密钥
    const { data: keyData, error: keyError } = await supabase
      .from('access_keys')
      .select('id, key_code, used_count, max_uses, key_expires_at, account_valid_for_days')
      .eq('key_code', formattedKeyCode)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      console.error('[API] 密钥查询失败:', keyError);
      return NextResponse.json({ error: '产品密钥无效' }, { status: 400 });
    }
    
    if (keyData.used_count >= keyData.max_uses) {
      return NextResponse.json({ error: '密钥使用次数已达上限' }, { status: 400 });
    }
    
    if (keyData.key_expires_at && new Date() > new Date(keyData.key_expires_at)) {
      return NextResponse.json({ error: '密钥已过期' }, { status: 400 });
    }

    // 3. 创建用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });
    
    if (authError || !authData.user) {
      console.error('[API] 创建用户失败:', authError);
      return NextResponse.json({ error: `注册失败: ${authError?.message}` }, { status: 400 });
    }

    // 4. 立即尝试自动登录
    console.log('[API] 尝试自动登录...');
    let loginData: any = null;
    let autoLoginSuccess = false;
    
    // 第一次尝试登录
    const { data: firstLoginData, error: firstLoginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (firstLoginError) {
      console.log('[API] 首次自动登录失败（可能用户未同步），1秒后重试:', firstLoginError.message);
      
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 第二次尝试登录
      const { data: secondLoginData, error: secondLoginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (!secondLoginError && secondLoginData?.session) {
        console.log('[API] 自动登录重试成功');
        autoLoginSuccess = true;
        loginData = secondLoginData;
      } else {
        console.error('[API] 自动登录重试失败:', secondLoginError?.message);
      }
    } else {
      console.log('[API] 自动登录成功');
      autoLoginSuccess = true;
      loginData = firstLoginData;
    }

    // 5. 计算有效期
    const validDays = keyData.account_valid_for_days || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validDays);
    const accountExpiresAt = expiryDate.toISOString();

    // 🔥 获取当前会话用于生成标识
    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionId = session ? `sess_${session.user.id}_${session.access_token.substring(0, 12)}` : 'new';
    
    // 6. 更新用户资料（profiles 表）
    const now = new Date();
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: email.trim(),
      access_key_id: keyData.id,
      account_expires_at: accountExpiresAt,
      last_login_at: now.toISOString(),
      last_login_session: currentSessionId,
      created_at: now.toISOString(), // 🔥 重要：设置创建时间用于新用户判断
      updated_at: now.toISOString(),
    });
    
    if (profileError) {
      console.error('[API] 更新profiles失败:', profileError);
    }

    // 7. 更新密钥使用次数
    await supabase
      .from('access_keys')
      .update({ 
        used_count: (keyData.used_count || 0) + 1, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', keyData.id);

    console.log('[API] 注册完成:', { 
      userId: authData.user.id, 
      expiresAt: accountExpiresAt,
      autoLoginSuccess,
      sessionId: currentSessionId
    });

    // 🔥 创建响应并设置新用户标记Cookie
    const response = NextResponse.json({
      success: true,
      message: autoLoginSuccess ? '注册成功！已自动登录' : '注册成功，请手动登录',
      user: { 
        id: authData.user.id, 
        email: authData.user.email 
      },
      expires_at: accountExpiresAt,
      auto_login: autoLoginSuccess,
      redirect_to: '/lobby'
    });
    
    // 🔥 设置新用户标记Cookie，有效时间1分钟
    response.cookies.set({
      name: 'new_user_grace_period',
      value: 'true',
      path: '/',
      maxAge: 60, // 1分钟
      httpOnly: false, // 前端也需要访问
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;

  } catch (error: any) {
    console.error('[API] 未处理异常:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
