// /lib/admin/auth.ts
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function validateAdminSession() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient();
    
    // 1. 验证用户是否登录
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ 未登录用户尝试访问后台');
      return { isAdmin: false, user: null };
    }

    // 2. 获取环境变量中的管理员邮箱
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    // 3. 检查用户邮箱是否在管理员列表中
    const isAdmin = adminEmails.includes(user.email || '');
    
    if (!isAdmin) {
      console.log(`❌ 非管理员尝试访问: ${user.email}`);
      return { isAdmin: false, user };
    }
    
    console.log(`✅ 管理员登录成功: ${user.email}`);
    return { isAdmin: true, user };
    
  } catch (error) {
    console.error('🔥 管理员验证出错:', error);
    return { isAdmin: false, user: null };
  }
}

export async function requireAdmin() {
  const { isAdmin } = await validateAdminSession();
  if (!isAdmin) {
    redirect('/login');
  }
}
