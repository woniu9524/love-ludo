import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // 1. 验证用户登录状态
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const { keyCode } = await request.json();
    if (!keyCode) {
      return NextResponse.json(
        { error: '请输入产品密钥' },
        { status: 400 }
      );
    }

    // 2. 验证密钥有效性
    const { data: keyData, error: keyError } = await supabase
      .from('access_keys')
      .select('*')
      .eq('key_code', keyCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: '密钥无效或已被禁用' },
        { status: 400 }
      );
    }

    if (keyData.used_count >= keyData.max_uses) {
      return NextResponse.json(
        { error: '该密钥使用次数已达上限' },
        { status: 400 }
      );
    }

    // 检查密钥本身是否过期
    if (keyData.key_expires_at && new Date() > new Date(keyData.key_expires_at)) {
      return NextResponse.json(
        { error: '密钥已过期' },
        { status: 400 }
      );
    }

    // 3. 获取用户当前信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_expires_at')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 400 }
      );
    }

    // 4. 计算新的有效期
    let newExpiryDate = new Date();
    // 如果当前还没过期，则在原有效期上累加
    if (profile.account_expires_at && new Date(profile.account_expires_at) > new Date()) {
      newExpiryDate = new Date(profile.account_expires_at);
    }
    // 加上密钥对应的天数
    newExpiryDate.setDate(newExpiryDate.getDate() + (keyData.account_valid_for_days || 30));

    // 5. 更新用户资料
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        access_key_id: keyData.id,
        account_expires_at: newExpiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: '更新用户信息失败' },
        { status: 500 }
      );
    }

    // 6. 更新密钥使用次数
    await supabase
      .from('access_keys')
      .update({
        used_count: (keyData.used_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyData.id);

    return NextResponse.json({
      success: true,
      message: `续费成功！您的账号已延长${keyData.account_valid_for_days}天，新的有效期至：${newExpiryDate.toLocaleDateString('zh-CN')}`,
      new_expiry: newExpiryDate.toISOString(),
    });

  } catch (error: any) {
    console.error('续费API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
