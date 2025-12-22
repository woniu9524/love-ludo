// /app/admin/dashboard/components/data-overview.tsx
import { DashboardStats } from '../types'

interface DataOverviewProps {
  stats: DashboardStats
}

export default function DataOverview({ stats }: DataOverviewProps) {
  const overviewItems = [
    {
      label: '会员用户',
      value: stats.premiumUsers,
      total: stats.totalUsers,
      color: 'from-blue-500 to-blue-600',
      percentage: stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0
    },
    {
      label: '密钥使用率',
      value: stats.usedKeys,
      total: stats.totalKeys,
      color: 'from-green-500 to-emerald-600',
      percentage: stats.totalKeys > 0 ? (stats.usedKeys / stats.totalKeys) * 100 : 0
    },
    {
      label: '游戏活跃度',
      value: stats.activeGames,
      total: stats.totalGames,
      color: 'from-orange-500 to-red-600',
      percentage: stats.totalGames > 0 ? (stats.activeGames / stats.totalGames) * 100 : 0
    }
  ]

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">数据概览</h3>
      <div className="space-y-6">
        {overviewItems.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{item.label}</span>
              <span>{item.value}/{item.total}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{item.percentage.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}