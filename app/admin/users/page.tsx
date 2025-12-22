// /app/admin/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Calendar, Shield, MoreVertical, Search } from 'lucide-react'

// 动态渲染配置 - 解决构建错误的关键
export const dynamic = 'force-dynamic'
// export const revalidate = 0

interface User {
  id: string
  email: string
  nickname: string | null
  isAdmin: boolean
  isPremium: boolean
  lastLogin: string
  accountExpires: string | null
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  // 模拟数据
  useEffect(() => {
    const mockUsers: User[] = [
      { id: '1', email: 'admin@example.com', nickname: '管理员', isAdmin: true, isPremium: true, lastLogin: '2024-12-22 10:30', accountExpires: '2025-12-22', createdAt: '2024-11-01' },
      { id: '2', email: 'user1@example.com', nickname: '玩家小明', isAdmin: false, isPremium: true, lastLogin: '2024-12-22 09:15', accountExpires: '2025-01-15', createdAt: '2024-12-01' },
      { id: '3', email: 'user2@example.com', nickname: null, isAdmin: false, isPremium: false, lastLogin: '2024-12-21 14:20', accountExpires: null, createdAt: '2024-12-20' },
      { id: '4', email: 'user3@example.com', nickname: '游戏爱好者', isAdmin: false, isPremium: true, lastLogin: '2024-12-21 11:45', accountExpires: '2025-03-01', createdAt: '2024-12-05' },
      { id: '5', email: 'user4@example.com', nickname: '测试用户', isAdmin: false, isPremium: false, lastLogin: '2024-12-20 16:10', accountExpires: null, createdAt: '2024-12-15' },
      { id: '6', email: 'user5@example.com', nickname: 'VIP会员', isAdmin: false, isPremium: true, lastLogin: '2024-12-20 08:30', accountExpires: '2025-06-30', createdAt: '2024-11-20' },
    ]
    
    setTimeout(() => {
      setUsers(mockUsers)
      setLoading(false)
    }, 800)
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'premium' && user.isPremium) ||
      (filter === 'free' && !user.isPremium) ||
      (filter === 'admin' && user.isAdmin)
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-400" />
              用户管理
            </h1>
            <p className="text-gray-400 mt-2">管理系统中的所有用户账户</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300">
              批量操作
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 rounded-lg text-sm text-white">
              导出用户
            </button>
          </div>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex items-center mt-6 space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索用户邮箱或昵称..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">全部用户</option>
            <option value="premium">会员用户</option>
            <option value="free">免费用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
      </div>

      {/* 用户统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-400">总用户数</p>
              <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-green-400 mr-3" />
            <div>
              <p className="text-sm text-gray-400">会员用户</p>
              <p className="text-2xl font-bold text-white mt-1">{users.filter(u => u.isPremium).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-400 mr-3" />
            <div>
              <p className="text-sm text-gray-400">今日活跃</p>
              <p className="text-2xl font-bold text-white mt-1">12</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-amber-400 mr-3" />
            <div>
              <p className="text-sm text-gray-400">新增今日</p>
              <p className="text-2xl font-bold text-white mt-1">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">用户列表 ({filteredUsers.length})</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">加载用户列表中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">用户信息</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">会员状态</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">最后登录</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">注册时间</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">角色</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                    <td className="py-3 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-semibold">
                            {user.nickname?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.nickname || '未设置昵称'}</p>
                          <p className="text-gray-500 text-sm flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isPremium 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {user.isPremium ? '会员中' : '免费用户'}
                      </span>
                      {user.accountExpires && (
                        <p className="text-gray-500 text-xs mt-1">到期: {user.accountExpires}</p>
                      )}
                    </td>
                    <td className="py-3 px-6 text-gray-300 text-sm">{user.lastLogin}</td>
                    <td className="py-3 px-6 text-gray-300 text-sm">{user.createdAt}</td>
                    <td className="py-3 px-6">
                      {user.isAdmin ? (
                        <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded text-xs flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          管理员
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                          普通用户
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}