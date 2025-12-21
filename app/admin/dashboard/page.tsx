// /app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Users, Key, Brain, Gamepad2, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState([
    { label: '总用户数', value: 0, icon: Users, color: 'text-blue-600' },
    { label: '可用密钥', value: 0, icon: Key, color: 'text-green-600' },
    { label: 'AI使用量', value: 0, icon: Brain, color: 'text-purple-600' },
    { label: '游戏总数', value: 0, icon: Gamepad2, color: 'text-orange-600' },
  ]);
  const [loading, setLoading] = useState(true);

  // 验证管理员权限并获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );

        // 检查是否登录
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/admin');
          return;
        }

        // 简单检查是否是管理员
        const adminEmails = ['2200691917@qq.com'];
        if (!adminEmails.includes(user.email?.toLowerCase() || '')) {
          router.push('/admin/unauthorized');
          return;
        }

        // 这里可以添加获取统计数据的代码
        // 暂时使用占位数据
        setStats([
          { label: '总用户数', value: 125, icon: Users, color: 'text-blue-600' },
          { label: '可用密钥', value: 42, icon: Key, color: 'text-green-600' },
          { label: 'AI使用量', value: 1567, icon: Brain, color: 'text-purple-600' },
          { label: '游戏总数', value: 89, icon: Gamepad2, color: 'text-orange-600' },
        ]);

        setLoading(false);
      } catch (error) {
        console.error('获取数据失败:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理仪表板</h1>
        <p className="text-gray-600 mt-2">欢迎来到 Love Ludo 后台管理系统</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-4">系统管理</h3>
          <div className="space-y-3">
            <a
              href="/admin/keys"
              className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Key className="w-5 h-5 text-blue-600 mr-3" />
              <span>密钥管理</span>
            </a>
            <a
              href="/admin/users"
              className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5 text-green-600 mr-3" />
              <span>用户管理</span>
            </a>
            <a
              href="/admin/ai-usage"
              className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Brain className="w-5 h-5 text-purple-600 mr-3" />
              <span>AI使用统计</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-4">系统状态</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API服务</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                正常
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">数据库</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                正常
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">游戏服务器</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                正常
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">安全状态</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                正常
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
