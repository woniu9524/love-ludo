// /app/admin/dashboard/components/recent-users.tsx
import { User } from '../types'
import { Users, Calendar } from 'lucide-react'
import Link from 'next/link'

interface RecentUsersProps {
  users: User[]
}

export default function RecentUsers({ users }: RecentUsersProps) {
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '从未登录'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else {
      return `${diffDays}天前`
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-400" />
          最近活跃用户
        </h3>
        <Link 
          href="/admin/users" 
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      <div className="space-y-3">
        {users.length > 0 ? (
          users.map((user) => (
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
                  <p className="text-white font-medium text-sm truncate max-w-[180px]">
                    {user.nickname || user.email}
                  </p>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatTimeAgo(user.last_login_at)}
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
  )
}