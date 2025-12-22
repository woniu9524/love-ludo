// /app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Users, 
  Key, 
  Brain, 
  Gamepad2, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Shield,
  Activity,
  DollarSign,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  totalKeys: number;
  usedKeys: number;
  availableKeys: number;
  aiUsageCount: number;
  totalGames: number;
  activeGames: number;
  totalRevenue: number;
  todayRevenue: number;
  averageSessionDuration: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalKeys: 0,
    usedKeys: 0,
    availableKeys: 0,
    aiUsageCount: 0,
    totalGames: 0,
    activeGames: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    averageSessionDuration: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    api: 'normal',
    database: 'normal',
    gameServer: 'normal',
    security: 'normal'
  });

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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

        // 验证管理员邮箱
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || ['2200691917@qq.com'];
        if (!adminEmails.includes(user.email?.toLowerCase() || '')) {
          router.push('/admin/unauthorized');
          return;
        }

        // 并行获取所有统计数据
        const [
          { data: usersData, count: totalUsers },
          { data: activeUsersData },
          { data: expiredUsersData },
          { data: keysData, count: totalKeys },
          { data: usedKeysData },
          { data: aiUsageData, count: aiUsageCount },
          { data: gamesData, count: totalGames },
          { data: activeGamesData },
          { data: recentUsersData }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: false }),
          supabase.from('profiles').select('id').gte('last_login_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
          supabase.from('profiles').select('id').lte('account_expires_at', new Date().toISOString()),
          supabase.from('access_keys').select('*', { count: 'exact', head: false }),
          supabase.from('access_keys').select('id').eq('used', true),
          supabase.from('ai_usage_logs').select('*', { count: 'exact', head: false }),
          supabase.from('games').select('*', { count: 'exact', head: false }),
          supabase.from('games').select('id').eq('status', 'active'),
          supabase.from('profiles')
            .select('id, email, last_login_at, account_expires_at')
            .order('last_login_at', { ascending: false })
            .limit(5)
        ]);

        // 计算可用密钥
        const availableKeys = totalKeys - (usedKeysData?.length || 0);

        // 计算收入（这里需要根据您的业务逻辑调整）
        // 假设每个会员是100元，activeUsers是付费用户数
        const totalRevenue = (activeUsersData?.length || 0) * 100;
        const todayRevenue = 0; // 需要根据订单表计算

        // 计算平均会话时长（这里需要根据您的业务逻辑调整）
        const averageSessionDuration = 25; // 分钟

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsersData?.length || 0,
          expiredUsers: expiredUsersData?.length || 0,
          totalKeys: totalKeys || 0,
          usedKeys: usedKeysData?.length || 0,
          availableKeys,
          aiUsageCount: aiUsageCount || 0,
          totalGames: totalGames || 0,
          activeGames: activeGamesData?.length || 0,
          totalRevenue,
          todayRevenue,
          averageSessionDuration
        });

        setRecentUsers(recentUsersData || []);

        // 检查系统状态
        const checkSystemStatus = async () => {
          try {
            // 检查数据库连接
            const { error: dbError } = await supabase.from('profiles').select('count');
            setSystemStatus(prev => ({
              ...prev,
              database: dbError ? 'error' : 'normal'
            }));

            // 这里可以添加其他系统检查
          } catch (err) {
            console.error('系统状态检查失败:', err);
          }
        };

        await checkSystemStatus();
        setLoading(false);

      } catch (error: any) {
        console.error('获取数据失败:', error);
        setError(error.message || '获取数据失败');
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 统计卡片数据
  const statCards = [
    {
      label: '总用户数',
      value: stats.totalUsers,
      change: '+12%',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      link: '/admin/users'
    },
    {
      label: '活跃用户',
      value: stats.activeUsers,
      change: '+8%',
      icon: Activity,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      link: '/admin/users?filter=active'
    },
    {
      label: '会员收入',
      value: formatCurrency(stats.totalRevenue),
      change: '+15%',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
      link: '/admin/revenue'
    },
    {
      label: 'AI使用量',
      value: formatNumber(stats.aiUsageCount),
      change: '+23%',
      icon: Brain,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      link: '/admin/ai-usage'
    },
    {
      label: '可用密钥',
      value: `${stats.availableKeys}/${stats.totalKeys}`,
      icon: Key,
      color: 'bg-gradient-to-br from-cyan-500 to-teal-600',
      link: '/admin/keys'
    },
    {
      label: '游戏总数',
      value: stats.totalGames,
      change: '+5%',
      icon: Gamepad2,
      color: 'bg-gradient-to-br from-red-500 to-rose-600',
      link: '/admin/games'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-white font-medium">加载仪表板数据</p>
            <p className="text-gray-400 text-sm mt-1">正在获取最新统计数据...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center border border-red-500/20">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">数据加载失败</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-6">
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">管理仪表板</h1>
            <p className="text-gray-400 mt-2">实时监控系统状态与业务数据</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              刷新数据
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <a
              key={index}
              href={stat.link}
              className="group block"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 hover:bg-gray-800/70 transition-all duration-300 group-hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      {stat.change && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          {stat.change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`${stat.color} rounded-xl p-3 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center text-xs text-gray-500">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    查看详情 →
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：系统状态与最近用户 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 系统状态 */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                系统状态
              </h3>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-gray-400">实时监控</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(systemStatus).map(([key, status]) => (
                <div key={key} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400 capitalize">{key}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'normal' ? 'bg-green-500' :
                      status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                  </div>
                  <p className={`text-lg font-semibold ${
                    status === 'normal' ? 'text-green-400' :
                    status === 'warning' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {status === 'normal' ? '正常' : 
                     status === 'warning' ? '警告' : '异常'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 最近活跃用户 */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-400" />
                最近活跃用户
              </h3>
              <a 
                href="/admin/users" 
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                查看全部 →
              </a>
            </div>

            <div className="space-y-3">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg hover:bg-gray-900/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.email}</p>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {user.last_login_at ? 
                            `最后登录：${new Date(user.last_login_at).toLocaleDateString('zh-CN')}` : 
                            '从未登录'}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      user.account_expires_at && new Date(user.account_expires_at) > new Date() ?
                      'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {user.account_expires_at && new Date(user.account_expires_at) > new Date() ?
                        '会员中' : '已过期'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">暂无用户数据</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：快速操作 */}
        <div className="space-y-6">
          {/* 快速操作 */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">快速操作</h3>
            <div className="space-y-3">
              <a
                href="/admin/keys/create"
                className="flex items-center p-4 bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">生成新密钥</p>
                  <p className="text-sm text-gray-400 mt-1">创建1小时/1天/7天密钥</p>
                </div>
              </a>

              <a
                href="/admin/users/export"
                className="flex items-center p-4 bg-gradient-to-r from-green-600/20 to-emerald-700/20 border border-green-500/20 rounded-lg hover:border-green-500/40 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">导出用户数据</p>
                  <p className="text-sm text-gray-400 mt-1">导出CSV/Excel格式</p>
                </div>
              </a>

              <a
                href="/admin/ai-usage/analyze"
                className="flex items-center p-4 bg-gradient-to-r from-purple-600/20 to-pink-700/20 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">AI使用分析</p>
                  <p className="text-sm text-gray-400 mt-1">查看AI使用趋势</p>
                </div>
              </a>

              <a
                href="/admin/settings"
                className="flex items-center p-4 bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-500/20 rounded-lg hover:border-gray-500/40 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">系统设置</p>
                  <p className="text-sm text-gray-400 mt-1">配置系统参数</p>
                </div>
              </a>
            </div>
          </div>

          {/* 数据概览 */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">数据概览</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>会员用户</span>
                  <span>{stats.activeUsers}/{stats.totalUsers}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>密钥使用率</span>
                  <span>{stats.usedKeys}/{stats.totalKeys}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalKeys > 0 ? (stats.usedKeys / stats.totalKeys) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>游戏活跃度</span>
                  <span>{stats.activeGames}/{stats.totalGames}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalGames > 0 ? (stats.activeGames / stats.totalGames) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
