// /app/admin/ai-usage/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Brain, Download, Filter } from 'lucide-react'

// 动态渲染配置 - 解决构建错误的关键
export const dynamic = 'force-dynamic'
// export const revalidate = 0

interface AIUsageRecord {
  id: string
  userId: string
  userEmail: string
  feature: string
  timestamp: string
  success: boolean
}

export default function AIUsagePage() {
  const [records, setRecords] = useState<AIUsageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  // 模拟数据
  useEffect(() => {
    const mockData: AIUsageRecord[] = [
      { id: '1', userId: 'user1', userEmail: 'user1@example.com', feature: '任务生成', timestamp: '2024-12-22 10:30', success: true },
      { id: '2', userId: 'user2', userEmail: 'user2@example.com', feature: '主题优化', timestamp: '2024-12-22 09:15', success: true },
      { id: '3', userId: 'user3', userEmail: 'user3@example.com', feature: '任务生成', timestamp: '2024-12-21 14:20', success: false },
      { id: '4', userId: 'user4', userEmail: 'user4@example.com', feature: '内容分析', timestamp: '2024-12-21 11:45', success: true },
      { id: '5', userId: 'user5', userEmail: 'user5@example.com', feature: '任务生成', timestamp: '2024-12-20 16:10', success: true },
    ]
    
    setTimeout(() => {
      setRecords(mockData)
      setLoading(false)
    }, 800)
  }, [])

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-400" />
              AI使用统计
            </h1>
            <p className="text-gray-400 mt-2">查看系统中AI功能的使用情况和趋势</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-lg text-sm text-white flex items-center">
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </button>
          </div>
        </div>
        
        {/* 时间范围筛选 */}
        <div className="flex items-center mt-6 space-x-2">
          {['今天', '7d', '30d', '全部'].map((range) => (
            <button
              key={range}
              className={`px-3 py-1 rounded-lg text-sm ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">总使用次数</p>
              <p className="text-2xl font-bold text-white mt-2">1,234</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">成功率</p>
              <p className="text-2xl font-bold text-white mt-2">98.5%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">活跃用户数</p>
              <p className="text-2xl font-bold text-white mt-2">89</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 使用记录表格 */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">使用记录</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">加载使用记录中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">用户</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">功能</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">时间</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                    <td className="py-3 px-6">
                      <div>
                        <p className="text-white text-sm">{record.userEmail}</p>
                        <p className="text-gray-500 text-xs">ID: {record.userId.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {record.feature}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-gray-300 text-sm">{record.timestamp}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs ${
                        record.success 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {record.success ? '成功' : '失败'}
                      </span>
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