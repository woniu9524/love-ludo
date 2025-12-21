// /middleware.ts - 修复版本
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 辅助函数：从JWT中解析创建时间
function getJwtCreationTime(jwt: string): Date | null {
  try {
    const payloadBase64 = jwt.split('.')[1];
    if (!payloadBase64) return null;
    
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    
    const payloadJson = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(payloadJson);
    
    if (payload.iat) {
      return new Date(payload.iat * 1000);
    }
    
    return null;
  } catch (error) {
    console.error('解析JWT失败:', error);
    return null;
  }
}

// 检查是否是管理员
function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['2200691917@qq.com'];
  return adminEmails.some(adminEmail => 
    adminEmail.trim().toLowerCase() === email.toLowerCase()
  );
}

// 检查是否受保护的游戏路径
function isProtectedGamePath(path: string): boolean {
  const protectedPaths = [
    '/lobby',
    '/game',
    '/profile',
    '/themes',
    '/game-history',
  ];
  return protectedPaths.some(p => path.startsWith(p));
}

// 检查是否公开路径
function isPublicPath(path: string): boolean {
  const publicPaths = [
    '/',
    '/login',
    '/login/expired',
    '/auth/forgot-password',
    '/auth/confirm',
    '/auth/error',
    '/account-expired',
    '/renew',
    '/api/auth/signup-with-key',
    '/api/auth/renew-account',
  ];
  return publicPaths.some(p => path.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  console.log(`[中间件] 请求路径: ${currentPath}`);
  
  // 1. 创建响应对象
  const response = NextResponse.next();
  
  // 2. 创建Supabase客户端 - 修复：根据你的环境变量选择正确的key
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // 优先使用 PUBLISHABLE_KEY，如果没有则使用 ANON_KEY
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cookies: { name: string; value: string }[] = [];
          request.cookies.getAll().forEach(cookie => {
            cookies.push({ name: cookie.name, value: cookie.value });
          });
          return cookies;
        },
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. 处理管理员路径（最高优先级）
  if (currentPath.startsWith('/admin')) {
    console.log(`[中间件] 管理员路径处理: ${currentPath}`);
    
    // 管理员登录页面直接放行
    if (currentPath === '/admin' || currentPath === '/admin/login') {
      console.log(`[中间件] 放行管理员登录页面: ${currentPath}`);
      return response;
    }
    
    // 其他管理员页面需要验证
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log(`[中间件] 管理员页面未登录，重定向到/admin`);
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      
      // 检查是否是管理员
      if (!isAdminEmail(user.email)) {
        console.log(`[中间件] 非管理员访问后台: ${user.email}`);
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
      }
      
      console.log(`[中间件] 管理员验证通过: ${user.email}`);
      return response;
      
    } catch (error) {
      console.error(`[中间件] 管理员验证错误:`, error);
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  // 4. 公开路径直接放行
  if (isPublicPath(currentPath)) {
    console.log(`[中间件] 放行公开路径: ${currentPath}`);
    return response;
  }
  
  // 5. API路径处理
  if (currentPath.startsWith('/api/')) {
    // API认证逻辑（如果有的话）
    console.log(`[中间件] API路径: ${currentPath}`);
    return response;
  }
  
  // 6. 受保护的游戏路径（需要完整验证）
  if (isProtectedGamePath(currentPath)) {
    console.log(`[中间件] 游戏路径验证: ${currentPath}`);
    
    try {
      // 6.1 检查用户是否登录
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log(`[中间件] 游戏路径未登录，重定向到/login`);
        
        // 创建重定向URL - 修复：总是添加redirect参数
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', currentPath);
        
        return NextResponse.redirect(redirectUrl);
      }
      
      console.log(`[中间件] 用户已登录: ${user.email}`);
      
      // 6.2 检查是否是管理员（管理员玩游戏的场景）
      const isAdmin = isAdminEmail(user.email);
      
   if (isAdmin) {
  console.log(`[中间件] 管理员玩游戏: ${user.email}`);
  
  // 管理员玩游戏，跳过会员过期和多设备验证
  // 但如果是管理员访问管理员页面，应该继续验证
  if (currentPath.startsWith('/admin')) {
    // 已经在上面的管理员路径处理过了，这里不会执行
    return response;
  }
  
  // 管理员玩游戏，直接放行
  return response;
}
      
      // 6.3 普通用户：获取用户资料
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_expires_at, last_login_at, last_login_session')
        .eq('id', user.id)
        .single();
      
      if (!profile) {
        console.log(`[中间件] 用户资料不存在: ${user.id}`);
        return NextResponse.redirect(new URL('/login?error=profile_not_found', request.url));
      }
      
      // 6.4 检查会员有效期
      const isExpired = !profile?.account_expires_at || 
                       new Date(profile.account_expires_at) < new Date();
      
      if (isExpired && currentPath !== '/account-expired') {
        console.log(`[中间件] 用户会员已过期: ${user.email}`);
        return NextResponse.redirect(new URL('/account-expired', request.url));
      }
      
      // 6.5 多设备登录验证
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.log(`[中间件] 会话不存在: ${user.id}`);
        return NextResponse.redirect(new URL('/login?error=no_session', request.url));
      }
      
      const sessionCreatedTime = getJwtCreationTime(currentSession.access_token);
      const lastLoginTime = profile.last_login_at ? new Date(profile.last_login_at) : null;
      const tolerance = 3000; // 3秒容差
      
      if (lastLoginTime && sessionCreatedTime) {
        const timeDiff = lastLoginTime.getTime() - sessionCreatedTime.getTime();
        
        if (timeDiff > tolerance) {
          console.log(`[中间件] 检测到多设备登录: ${user.email}`);
          
          // 清除会话cookie
          response.cookies.delete('sb-access-token');
          response.cookies.delete('sb-refresh-token');
          
          // 重定向到过期页面
          const userEmail = user.email || '';
          const lastLoginTimeStr = lastLoginTime.toISOString();
          const redirectUrl = new URL('/login/expired', request.url);
          redirectUrl.searchParams.set('email', userEmail);
          redirectUrl.searchParams.set('last_login_time', lastLoginTimeStr);
          
          return NextResponse.redirect(redirectUrl);
        }
      }
      
      console.log(`[中间件] 游戏路径验证通过: ${user.email}`);
      return response;
      
    } catch (error) {
      console.error(`[中间件] 游戏路径验证错误:`, error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
  }
  
  // 7. 其他路径直接放行
  console.log(`[中间件] 放行其他路径: ${currentPath}`);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
