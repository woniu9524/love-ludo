// /lib/admin/auth.ts - 修复版本
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function validateAdminSession() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ 验证失败: 用户未登录');
      return { isAdmin: false, user: null };
    }

    // 获取环境变量中的管理员邮箱
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    console.log('📋 管理员邮箱列表:', adminEmails);
    console.log('👤 当前用户邮箱:', user.email);
    
    // 检查用户邮箱是否在管理员列表中
    const isAdmin = adminEmails.includes(user.email || '');
    console.log('🔐 是否是管理员:', isAdmin);
    
    if (!isAdmin) {
      console.log(`❌ 非管理员尝试访问: ${user.email}`);
      return { isAdmin: false, user };
    }
    
    console.log(`✅ 管理员验证成功: ${user.email}`);
    return { isAdmin: true, user };
    
  } catch (error) {
    console.error('🔥 管理员验证出错:', error);
    return { isAdmin: false, user: null };
  }
}

export async function requireAdmin() {
  const { isAdmin, user } = await validateAdminSession();
  
  console.log('📊 最终验证结果:', {
    是否管理员: isAdmin,
    用户邮箱: user?.email
  });
  
  if (!isAdmin) {
    if (user) {
      // 已登录但不是管理员
      console.log('➡️ 已登录但不是管理员，重定向到无权限页');
      redirect('/admin/unauthorized');
    } else {
      // 未登录
      console.log('➡️ 未登录，重定向到登录页');
      redirect('/login');
    }
  }
  
  console.log('🎯 验证通过，继续渲染');
}
