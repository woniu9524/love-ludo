// /lib/auth/middleware-user.ts
'use server';

import { headers } from 'next/headers';

export async function getMiddlewareUser() {
  try {
    const headersList = await headers();
    
    const userId = headersList.get('x-verified-user-id');
    const userEmail = headersList.get('x-verified-user-email');
    const userName = headersList.get('x-verified-user-name');
    const verifiedByMiddleware = headersList.get('x-user-verified-by-middleware');
    
    if (!userId) {
      return null;
    }
    
    return {
      id: userId,
      email: userEmail,
      name: userName,
      isVerifiedByMiddleware: verifiedByMiddleware === 'true'
    };
  } catch (error) {
    console.error('获取中间件用户失败:', error);
    return null;
  }
}
