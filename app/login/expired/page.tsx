// /app/login/expired/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Smartphone, Laptop } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const message = searchParams.get('message') || '您的账号已在其他设备登录';
  const email = searchParams.get('email') || '未知用户';
  const lastLoginTime = searchParams.get('last_login_time') || '';
  
  return (
    <div className="max-w-md mx-auto min-h-svh flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* 图标 */}
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        {/* 标题 */}
        <h1 className="text-2xl font-bold text-center mb-2">登录会话已过期</h1>
        
        {/* 消息 */}
        <div className="glass rounded-2xl p-6 w-full mb-6">
          <p className="text-gray-300 mb-3">{message}</p>
          
          {lastLoginTime && (
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
              <Smartphone className="w-4 h-4" />
              <span>最后登录时间: {new Date(lastLoginTime).toLocaleString('zh-CN')}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Laptop className="w-4 h-4" />
            <span>当前设备: {navigator.userAgent.includes('Mobile') ? '移动设备' : '电脑'}</span>
          </div>
        </div>
        
        {/* 解释说明 */}
        <div className="text-sm text-gray-400 mb-8 text-center">
          <p>这是为了保护您的账户安全，避免他人未经授权访问您的账户。</p>
          <p className="mt-1">如果您没有在其他设备登录，请立即修改密码。</p>
        </div>
        
        {/* 操作按钮 */}
        <div className="w-full space-y-3">
          <Button
            onClick={() => router.push('/login')}
            className="w-full gradient-primary py-3.5 rounded-xl font-semibold glow-pink transition-all hover:scale-105 active:scale-95"
          >
            重新登录
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/forgot-password')}
            className="w-full py-3.5 rounded-xl"
          >
            忘记密码？
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-svh">
        <div className="text-gray-400">加载中...</div>
      </div>
    }>
      <SessionExpiredContent />
    </Suspense>
  );
}
