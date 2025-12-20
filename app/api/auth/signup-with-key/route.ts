import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('[API] 注册请求开始');

  try {
    // 1. 创建 Supabase 客户端
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options); } catch {}
            });
          },
        },
      }
    );

    // 2. 解析请求数据
    const { email, password, keyCode } = await request.json();
    console.log('[API] 接收到数据:', { 
      email: email?.trim(), 
      keyCode: keyCode?.trim().toUpperCase(),
      hasPassword: !!password 
    });

    if (!email || !password || !keyCode) {
      return NextResponse.json(
        { error: '邮箱、密码和产品密钥均为必填' },
        { status: 400 }
      );
    }

    const formattedKeyCode = keyCode.trim().toUpperCase();
    const formattedEmail = email.trim().toLowerCase();

    // 3. 验证产品密钥 - 明确指定字段，修正字段名
    console.log('[API] 正在验证密钥:', formattedKeyCode);
    const { data: keyData, error: keyError } = await supabase
      .from('access_keys')
      .select('id, key_code, is_active, used_count, max_uses, key_expires_at, account_valid') // 修正：account_valid
      .eq('key_code', formattedKeyCode)
      .eq('is_active', true)
      .single();

    console.log('[API] 密钥查询结果:', { keyData, keyError, formattedKeyCode });

    if (keyError || !keyData) {
      console.error('[API] 密钥无效:', keyError);
      return NextResponse.json(
        { error: '产品密钥无效、已被禁用或不存在' },
        { status: 400 }
      );
    }

    // 密钥使用次数检查
    if (keyData.used_count >= keyData.max_uses) {
      return NextResponse.json(
        { error: '产品密钥使用次数已达上限' },
        { status: 400 }
      );
    }

    // 密钥过期检查
    if (keyData.key_expires_at && new Date() > new Date(keyData.key_expires_at)) {
      return NextResponse.json(
        { error: '产品密钥已过期' },
        { status: 400 }
      );
    }

    // 4. 创建用户账户
    console.log('[API] 正在创建用户...', formattedEmail);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formattedEmail,
      password: password.trim(),
    });

    console.log('[API] 用户创建结果:', { 
      authError: authError?.message, 
      userId: authData?.user?.id 
    });

    if (authError) {
      console.error('[API] 创建用户失败:', authError);
      return NextResponse.json(
        { error: `注册失败: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '用户创建失败，未返回用户信息' },
        { status: 500 }
      );
    }

    console.log('[API] 用户创建成功，ID:', authData.user.id);

    // 5. 计算账户有效期 - 修正字段名并增强逻辑
    let accountExpiresAt = null;
    let validDays = 30; // 默认值
    
    // 核心修复：使用正确的字段名 account_valid
    if (keyData.account_valid !== null && keyData.account_valid !== undefined) {
      validDays = Number(keyData.account_valid);
      console.log(`[API] 从密钥读取有效期天数: ${validDays} (字段: account_valid)`);
    } else {
      console.warn(`[API] 密钥 ${formattedKeyCode} 的 account_valid 字段为空，使用默认值 30 天`);
    }
    
    // 确保 validDays 是有效正数
    if (isNaN(validDays) || validDays <= 0) {
      console.warn(`[API] 有效期天数无效 (${validDays})，重置为默认值 30`);
      validDays = 30;
    }
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validDays);
    accountExpiresAt = expiryDate.toISOString();
    
    console.log(`[API] 账户有效期计算完成:`, {
      有效期至: accountExpiresAt,
      基于天数: validDays,
      密钥: formattedKeyCode
    });

    // 6. 更新用户资料到 profiles 表
    const profileData = {
      id: authData.user.id,
      email: formattedEmail,
      access_key_id: keyData.id,
      account_expires_at: accountExpiresAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[API] 正在更新用户资料:', { userId: authData.user.id, profileData });

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData);

    if (profileError) {
      console.error('[API] 更新用户资料失败:', profileError);
      // 注意：这里不进行用户回滚，因为Auth用户已创建成功
    } else {
      console.log('[API] 用户资料更新成功');
    }

    // 7. 更新密钥使用次数
    const newUsedCount = (keyData.used_count || 0) + 1;
    console.log(`[API] 更新密钥使用次数: ${keyData.used_count || 0} -> ${newUsedCount}`);
    
    const { error: updateKeyError } = await supabase
      .from('access_keys')
      .update({
        used_count: newUsedCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyData.id);

    if (updateKeyError) {
      console.error('[API] 更新密钥状态失败:', updateKeyError);
    } else {
      console.log('[API] 密钥状态更新成功');
    }

    // 8. 返回最终成功响应
    console.log('[API] 注册流程全部完成');
    return NextResponse.json({
      success: true,
      message: '注册成功！',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      expires_at: accountExpiresAt,
      license_key: formattedKeyCode,
      valid_days: validDays
    });

  } catch (error: any) {
    // 9. 捕获任何未预期的异常
    console.error('[API] 服务器内部捕获到未处理异常:', error);
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        message: error.message || '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 可选：保留GET方法用于测试（如需移除请删除此部分）
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: '注册API已就绪，请使用POST方法提交注册信息',
    timestamp: new Date().toISOString(),
    note: '此端点仅接受POST请求。浏览器直接访问会返回405错误，这是正常行为。'
  });
}
