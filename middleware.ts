// /middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 暂时不做过期检查，先让网站正常运行
  // 后续可以在这里添加过期检查逻辑
  
  // 只做简单的重定向检查
  const response = NextResponse.next();
  
  // 可以在这里添加一些基础的逻辑，但先保持简单
  return response;
}

// 配置中间件生效的路径
export const config = {
  matcher: [
    // 匹配所有页面，排除静态文件
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
