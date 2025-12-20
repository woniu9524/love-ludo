import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('[API] 注册请求开始 =============');

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
    
    if (!email || !password || !keyCode) {
      return NextResponse.json(
        { error: '邮箱、密码和产品密钥均为必填' },
        { status: 400 }
      );
    }

    const formattedKeyCode = keyCode.trim().toUpperCase();
    const formattedEmail = email.trim().toLowerCase();

    console.log('[API] 开始处理注册:', { email: formattedEmail, keyCode: formattedKeyCode });

    // 3. 验证产品密钥 - 使用 SELECT * 来查看所有实际字段
    console.log('[API] 查询密钥结构...');
    const { data: keyData, error: keyError } = await supabase
      .from('access_keys')
      .select('*') // 改为 *，查看所有字段
      .eq('key_code', formattedKeyCode)
      .eq('is_active', true)
      .single();

    // 输出完整的密钥数据用于诊断
    console.log('[API] 密钥查询完整结果:', JSON.stringify({ keyData, keyError }, null, 2));

    if (keyError || !keyData) {
      console.error('[API] 密钥无效或查询失败');
      return NextResponse.json(
        { error: '产品密钥无效、已被禁用或不存在' },
        { status: 400 }
      );
    }

    // 输出所有字段，让我们看到真实结构
    console.log('[API] 密钥表所有字段:', Object.keys(keyData));
    console.log('[API] 密钥数据详情:', keyData);

    // 4. 检查密钥限制（使用更安全的属性访问）
    const usedCount = keyData.used_count || 0;
    const maxUses = keyData.max_uses || 1;
    
    if (usedCount >= maxUses) {
      return NextResponse.json(
        { error: '产品密钥使用次数已达上限' },
        { status: 400 }
      );
    }

    if (keyData.key_expires_at && new Date() > new Date(keyData.key_expires_at)) {
      return NextResponse.json(
        { error: '产品密钥已过期' },
        { status: 400 }
      );
    }

    // 5. 创建用户账户
    console.log('[API] 正在创建用户账户...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formattedEmail,
      password: password.trim(),
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

    // 6. 【核心修复】智能计算账户有效期
    let validDays = 30; // 默认值
    let expirySource = '默认';
    
    // 策略1：首先尝试从密钥数据中读取有效期字段（兼容不同字段名）
    if (keyData.account_valid !== undefined && keyData.account_valid !== null) {
      validDays = Number(keyData.account_valid);
      expirySource = 'account_valid字段';
    } 
    // 策略2：如果策略1失败，尝试其他可能的字段名
    else if (keyData.account_valid_for_days !== undefined && keyData.account_valid_for_days !== null) {
      validDays = Number(keyData.account_valid_for_days);
      expirySource = 'account_valid_for_days字段';
    }
    // 策略3：如果无明确字段，根据密钥代码前缀智能判断
    else {
      console.log('[API] 未找到有效期字段，尝试从密钥代码推断...');
      if (formattedKeyCode.includes('XY-1-')) validDays = 1;
      else if (formattedKeyCode.includes('XY-7-')) validDays = 7;
      else if (formattedKeyCode.includes('XY-30-')) validDays = 30;
      else if (formattedKeyCode.includes('XY-90-')) validDays = 90;
      else if (formattedKeyCode.includes('XY-180-')) validDays = 180;
      else if (formattedKeyCode.includes('XY-365-')) validDays = 365;
      else validDays = 30; // 默认值
      expirySource = '密钥代码前缀推断';
    }
    
    // 最终验证
    if (isNaN(validDays) || validDays <= 0) {
      console.warn(`[API] 计算出的有效期天数无效(${validDays})，使用默认值30`);
      validDays = 30;
      expirySource = '默认(纠错后)';
    }
    
    // 计算具体过期时间
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validDays);
    const accountExpiresAt = expiryDate.toISOString();
    
    console.log(`[API] 有效期设置完成:`, {
      计算依据: expirySource,
      有效天数: validDays,
      过期时间: accountExpiresAt,
      密钥代码: formattedKeyCode
    });

    // 7. 更新用户资料
    const profileData = {
      id: authData.user.id,
      email: formattedEmail,
      access_key_id: keyData.id,
      account_expires_at: accountExpiresAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[API] 更新用户资料:', profileData);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData);

    if (profileError) {
      console.error('[API] 更新用户资料失败:', profileError);
    } else {
      console.log('[API] 用户资料更新成功');
    }

    // 8. 更新密钥使用次数
    const newUsedCount = usedCount + 1;
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
      console.log(`[API] 密钥使用次数更新: ${usedCount} -> ${newUsedCount}`);
    }

    // 9. 返回成功响应
    console.log('[API] 注册流程全部完成 =============');
    return NextResponse.json({
      success: true,
      message: '注册成功！',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      expires_at: accountExpiresAt,
      valid_days: validDays,
      license_key: formattedKeyCode,
      note: `有效期基于${expirySource}设置`
    });

  } catch (error: any) {
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
