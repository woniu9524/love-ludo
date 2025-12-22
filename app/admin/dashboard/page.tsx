// /app/admin/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import StatsCards from './components/stats-cards'
import UserGrowthChart from './components/user-growth-chart'
import SystemStatus from './components/system-status'
import RecentUsers from './components/recent-users'
import DataOverview from './components/data-overview'
import QuickActions from './components/quick-actions'
import { DashboardStats, User } from './types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      )

      // 并行获取所有数据
      const [
        totalUsersResponse,
        activeUsersResponse,
        premiumUsersResponse,
        expiredUsersResponse,
        keysResponse,
        usedKeysResponse,
        aiUsageResponse,
        gamesResponse,
        activeGamesResponse,
        recentUsersResponse,
        userGrowthResponse
      ] = await Promise.all([
        // 总用户数
        supabase.from('profiles').select('id', { count: 'exact' }),
        // 24小时内活跃用户
        supabase.from('profiles').select('id').gte('last_login_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
        // 会员用户（account_expires_at > now()）
        supabase.from('profiles').select('id').gt('account_expires_at', new Date().toISOString()),
        // 已过期用户
        supabase.from('profiles').select('id').lte('account_expires_at', new Date().toISOString()),
        // 所有密钥
        supabase.from('access_keys').select('id', { count: 'exact' }),
        // 已使用密钥
        supabase.from('access_keys').select('id').not('used_at', 'is', null),
        // AI使用记录
        supabase.from('ai_usage_records').select('id', { count: 'exact' }),
        // 所有游戏
        supabase.from('game_history').select('id', { count: 'exact' }),
        // 活跃游戏
        supabase.from('game_sessions').select('id').eq('status', 'playing'),
        // 最近活跃用户
        supabase.from('profiles')
          .select('id, email, nickname, last_login_at, account_expires_at')
          .order('last_login_at', { ascending: false })
          .limit(5),
        // 用户增长数据（最近7天）
        supabase.rpc('get_user_growth_last_7_days')
      ])

      // 处理统计数据
      const totalUsers = totalUsersResponse.count || 0
      const activeUsers = activeUsersResponse.data?.length || 0
      const premiumUsers = premiumUsersResponse.data?.length || 0
      const expiredUsers = expiredUsersResponse.data?.length || 0
      const totalKeys = keysResponse.count || 0
      const usedKeys = usedKeysResponse.data?.length || 0
      const availableKeys = totalKeys - usedKeys
      const aiUsageCount = aiUsageResponse.count || 0
      const totalGames = gamesResponse.count || 0
      const activeGames = activeGamesResponse.data?.length || 0

      // 计算收入（基于会员用户数，按最高单价69.99估算）
      const totalRevenue = premiumUsers * 69.99
      const todayRevenue = 0 // 暂时为0，需要订单表数据

      // 用户增长数据
      const userGrowthData = userGrowthResponse.data || []

      setStats({
        totalUsers,
        activeUsers,
        premiumUsers,
        expiredUsers,
        totalKeys,
        usedKeys,
        availableKeys,
        aiUsageCount,
        totalGames,
        activeGames,
        totalRevenue,
        todayRevenue,
        averageSessionDuration: 25 // 暂时固定值
      })

      setRecentUsers(recentUsersResponse.data || [])
      setLastUpdate(new Date())
      setLoading(false)
      setError(null)

    } catch (error: any) {
      console.error('获取仪表板数据失败:', error)
      setError(error.message || '获取数据失败')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // 设置30秒自动刷新（仅管理员登录时）
    const intervalId = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">加载仪表板数据...</p>
          <p className="text-gray-400 text-sm mt-1">正在获取最新统计数据</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center text-red-400 mb-4">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold">数据加载失败</h3>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          重试
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">管理仪表板</h1>
          <p className="text-gray-400 mt-1">实时监控系统状态与业务数据</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-400">
            最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
          </div>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium transition-all"
          >
            刷新数据
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：图表和状态 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 用户增长图表 */}
          <UserGrowthChart />

          {/* 系统状态 */}
          <SystemStatus />
        </div>

        {/* 右侧：用户和操作 */}
        <div className="space-y-6">
          {/* 最近活跃用户 */}
          <RecentUsers users={recentUsers} />

          {/* 快速操作 */}
          <QuickActions />
        </div>
      </div>

      {/* 数据概览 */}
      <DataOverview stats={stats} />
    </div>
  )
}