// /app/login/expired/page.tsx - 改进版
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginExpiredPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const reason = searchParams.get('reason') || 'multi_device';

  useEffect(() => {
    // 清除所有可能的会话cookie
    document.cookie.split(';').forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      if (cookieName.includes('sb-') || cookieName.includes('admin_')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // 清除管理员验证标记
    document.cookie = 'admin_key_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, []);

  const handleClearAndRedirect = async () => {
    try {
      // 使用Supabase登出
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      
      await supabase.auth.signOut();
      
      // 额外清理本地存储
      localStorage.clear();
      sessionStorage.clear();
      
      // 重定向到登录页
      router.push('/login');
    } catch (error) {
      console.error('清除会话失败:', error);
      // 即使失败也重定向
      router.push('/login');
    }
  };

  const handleForceLogin = () => {
    // 强制清理后重定向
    handleClearAndRedirect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* 头部 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            登录会话已过期
          </h1>
          <p className="text-gray-400 text-sm mt-2 text-center">
            您的登录会话因以下原因已失效
          </p>
        </div>

        {/* 原因说明 */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-medium mb-2">
                {reason === 'new_device_login' 
                  ? '检测到新设备登录'
                  : '检测到多设备登录'}
              </p>
              <ul className="text-sm text-amber-400/80 space-y-1">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>同一账号只能在单个设备上登录</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>新设备登录会导致旧设备会话失效</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>您可以选择重新登录或联系客服</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        {email && (
          <div className="bg-gray-700/30 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-300">
              <span className="text-gray-400">受影响账号：</span>
              {email}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-3">
          <Button
            onClick={handleForceLogin}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重新登录
          </Button>
          
          <Button
            onClick={handleClearAndRedirect}
            variant="outline"
            className="w-full border-gray-600 hover:bg-white/5 text-gray-300 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            完全退出并返回登录页
          </Button>
        </div>

        {/* 帮助信息 */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>如果多次遇到此问题，请联系客服</p>
            <p>技术支持微信：xiyi1397</p>
          </div>
        </div>
      </div>
    </div>
  );
}
