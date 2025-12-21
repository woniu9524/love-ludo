// /middleware.ts - 修复版本
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 辅助函数：从JWT中解析创建时间（Edge Runtime兼容版本）
function getJwtCreationTime(jwt: string): Date | null {
  try {
    const payloadBase64 = jwt.split('.')[1];
    if (!payloadBase64) return null;
    
    // 处理Base64 URL编码
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    
    // Edge Runtime中没有Buffer，使用atob
    const payloadJson = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(payloadJson);
    
    // iat是签发时间（秒），需要转换为毫秒
    if (payload.iat) {
      return new Date(payload.iat * 1000);
    }
    
    return null;
  } catch (error) {
    console.error('解析JWT失败:', error);
    return null;
  }
}

// 辅助函数：检查是否为管理员邮箱
function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.some(adminEmail => 
    adminEmail.trim().toLowerCase() === email.toLowerCase()
  );
}

export async function middleware(request: NextRequest) {
  // 创建响应对象
  let response = NextResponse.next();
  
  // 1. 创建对中间件友好的Supabase客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          // 从请求中获取cookie
          const cookies: { name: string; value: string }[] = [];
          request.cookies.getAll().forEach(cookie => {
            cookies.push({ name: cookie.name, value: cookie.value });
          });
          return cookies;
        },
        setAll: (cookiesToSet) => {
          // 设置到响应中
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const currentPath = request.nextUrl.pathname;
  console.log(`[中间件] 请求路径: ${currentPath}`);
  
  // 2. 定义路径规则
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
  
  const protectedPaths = [
    '/lobby',
    '/game',
    '/profile',
    '/themes',
    '/game-history',
  ];
  
  // 3. 判断当前请求路径
  const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
  const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
  const isApiPath = currentPath.startsWith('/api/');
  const isAdminPath = currentPath.startsWith('/admin');
  
  // 4. 公开路径直接放行
  if (isPublicPath && !isApiPath) {
    return response;
  }
  
  // 5. 管理员路径特殊处理（不进行多设备和会员过期验证）
  if (isAdminPath) {
    console.log(`[中间件] 处理管理员路径: ${currentPath}`);
    
    try {
      // 5.1 检查用户是否登录
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log(`[中间件] 管理员路径未登录，允许访问登录页: ${currentPath}`);
        
        // 如果已经是/admin，直接放行显示登录页
        if (currentPath === '/admin' || currentPath === '/admin/') {
          return response;
        }
        
        // 如果是/admin/login，重定向到/admin
        if (currentPath === '/admin/login') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        
        // 其他管理员路径未登录，重定向到管理员登录页
        console.log(`[中间件] 访问管理员页面未登录，重定向到/admin: ${currentPath}`);
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      
      // 5.2 检查是否是管理员
      const admin = isAdminEmail(user.email);
      
      if (!admin) {
        console.log(`[中间件] 非管理员尝试访问后台: ${user.email}`);
        
        // 如果是非管理员访问/admin，显示无权限页面
        if (currentPath === '/admin' || currentPath === '/admin/') {
          return response; // 允许访问/admin，会显示无权限页
        }
        
        // 其他管理员路径，重定向到无权限页
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
      }
      
      // 5.3 管理员验证通过
      console.log(`[中间件] 管理员验证通过: ${user.email}`);
      
      // 如果是访问/admin，重定向到仪表板
      if (currentPath === '/admin' || currentPath === '/admin/') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      
      // 其他管理员页面，直接放行
      // 管理员跳过会员过期和多设备验证
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');
      response.headers.set('x-user-role', 'admin');
      
      return response;
      
    } catch (error) {
      console.error('[中间件] 管理员验证过程中发生错误:', error);
      // 发生错误时，允许访问/admin显示错误页
      return response;
    }
  }
  
  // 6. 对于受保护路径和受保护API，进行完整验证
  if (isProtectedPath || (isApiPath && !currentPath.includes('/auth/'))) {
    try {
      console.log(`[中间件] 处理游戏路径: ${currentPath}`);
      
      // 6.1 检查用户是否登录
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log(`[中间件] 用户未登录，重定向到登录页: ${currentPath}`);
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectedFrom', currentPath);
        return NextResponse.redirect(redirectUrl);
      }
      
      console.log(`[中间件] 用户已登录: ${user.email}`);
      
      // 6.2 检查是否是管理员用户（管理员玩游戏的场景）
      const admin = isAdminEmail(user.email);
      
      if (admin) {
        console.log(`[中间件] 管理员玩游戏，跳过部分验证: ${user.email}`);
        
        // 管理员玩游戏，只检查会员过期，跳过多设备验证
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_expires_at, last_login_at, last_login_session')
          .eq('id', user.id)
          .single();
        
        if (!profile) {
          console.log(`[中间件] 管理员资料不存在: ${user.id}`);
          return NextResponse.redirect(new URL('/login?error=profile_not_found', request.url));
        }
        
        // 检查会员有效期（管理员也需要检查）
        const isExpired = !profile?.account_expires_at || 
                         new Date(profile.account_expires_at) < new Date();
        
        if (isExpired && currentPath !== '/account-expired') {
          console.log(`[中间件] 管理员 ${user.email} 会员已过期，重定向`);
          return NextResponse.redirect(new URL('/account-expired', request.url));
        }
        
        // 管理员跳过 5.4 的多设备验证
        
        // 验证通过
        response.headers.set('x-user-id', user.id);
        response.headers.set('x-user-email', user.email || '');
        response.headers.set('x-user-role', 'admin-playing');
        
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
        console.log(`[中间件] 用户 ${user.email} 会员已过期，重定向`);
        return NextResponse.redirect(new URL('/account-expired', request.url));
      }
      
      // 6.5 多设备登录验证（普通用户）
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
          console.log(`  - JWT时间: ${sessionCreatedTime.toISOString()}`);
          console.log(`  - 最后登录: ${lastLoginTime.toISOString()}`);
          console.log(`  - 时间差: ${timeDiff}ms`);
          
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
      
      // 6.6 验证通过，继续请求
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email || '');
      response.headers.set('x-user-role', 'user');
      
      return response;
      
    } catch (error) {
      console.error('[中间件] 验证过程中发生错误:', error);
      // 发生错误时，保守起见重定向到登录页
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
  }
  
  // 7. 其他路径（如公开API、静态资源等）直接放行
  return response;
}

// 8. 配置中间件生效的路径
export const config = {
  matcher: [
    // 匹配所有路径，排除_next等内部路径
    // 注意：admin路径也在匹配范围内，因为我们有特殊处理
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
