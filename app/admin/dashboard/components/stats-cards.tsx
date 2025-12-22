// /app/admin/dashboard/components/stats-cards.tsx
import { DashboardStats } from '../types'
import { Users, Activity, DollarSign, Brain, Key, Gamepad2 } from 'lucide-react'

const statCards = [
  {
    label: '总用户数',
    key: 'totalUsers',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    format: (value: number) => value.toLocaleString(),
    link: '/admin/users'
  },
  {
    label: '活跃用户',
    key: 'activeUsers',
    icon: Activity,
    color: 'from-green-500 to-emerald-600',
    format: (value: number) => value.toLocaleString(),
    link: '/admin/users?filter=active'
  },
  {
    label: '会员收入',
    key: 'totalRevenue',
    icon: DollarSign,
    color: 'from-amber-500 to-orange-600',
    format: (value: number) => `¥${value.toFixed(2)}`,
    link: '/admin/revenue'
  },
  {
    label: 'AI使用量',
    key: 'aiUsageCount',
    icon: Brain,
    color: 'from-purple-500 to-pink-600',
    format: (value: number) => value.toLocaleString(),
    link: '/admin/ai-usage'
  },
  {
    label: '可用密钥',
    key: 'availableKeys',
    icon: Key,
    color: 'from-cyan-500 to-teal-600',
    format: (value: number, stats: DashboardStats) => `${value}/${stats.totalKeys}`,
    link: '/admin/keys'
  },
  {
    label: '游戏总数',
    key: 'totalGames',
    icon: Gamepad2,
    color: 'from-red-500 to-rose-600',
    format: (value: number) => value.toLocaleString(),
    link: '/admin/games'
  }
]

interface StatsCardsProps {
  stats: DashboardStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        const value = stats[stat.key as keyof DashboardStats] as number
        const formattedValue = stat.key === 'availableKeys' 
          ? stat.format(value, stats)
          : stat.format(value)
        
        return (
          <a
            key={stat.label}
            href={stat.link}
            className="group block"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 hover:bg-gray-800/70 transition-all duration-300 group-hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">{formattedValue}</p>
                    {/* 这里可以添加增长百分比 */}
                  </div>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 shadow-lg shadow-black/20`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex items-center text-xs text-gray-500">
                  <span>查看详情 →</span>
                </div>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}