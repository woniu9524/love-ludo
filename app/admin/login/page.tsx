// /app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, AlertTriangle, Key, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 验证管理员密钥（可以存储在环境变量中）
      const validAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'ADMIN@2024';
      if (adminKey !== validAdminKey) {
        setError('管理员密钥错误');
        setLoading(false);
        return;
      }

      // 使用 Supabase 登录
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        throw signInError;
      }

      // 检查是否是管理员邮箱
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      if (!adminEmails.includes(email.trim())) {
        // 登出非管理员用户
        await supabase.auth.signOut();
        setError('非管理员邮箱，无权访问后台');
        setLoading(false);
        return;
      }

      // 登录成功，重定向到后台
      console.log('✅ 管理员登录成功:', email);
      router.push(redirectTo);
      router.refresh();

    } catch (err: any) {
      console.error('管理员登录失败:', err);
      setError(err.message || '登录失败');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* 头部 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            Love Ludo 后台管理
          </h1>
          <p className="text-gray-400 text-sm mt-2 text-center">
            仅限系统管理员访问
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* 邮箱输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              管理员邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入管理员邮箱"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* 密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              密码
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* 管理员密钥 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              管理员密钥
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="输入管理员密钥"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              请联系系统管理员获取密钥
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center text-red-400">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                登录中...
              </>
            ) : (
              '进入后台管理'
            )}
          </button>
        </form>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <div className="border-t border-gray-700 pt-6">
            <p className="text-sm text-gray-400">
              普通用户请访问{' '}
              <a href="/login" className="text-blue-400 hover:text-blue-300">
                普通登录页面
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © {new Date().getFullYear()} Love Ludo · 希夷游戏
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
