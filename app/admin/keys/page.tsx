// /app/admin/keys/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Key, Copy, Check, Trash2, Plus, Search } from 'lucide-react'

// 动态渲染配置 - 解决构建错误的关键
export const dynamic = 'force-dynamic'
// export const revalidate = 0

interface AccessKey {
  id: string
  keyCode: string
  duration: string
  isUsed: boolean
  usedBy: string | null
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

export default function KeysPage() {
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // 模拟数据
  useEffect(() => {
    const mockKeys: AccessKey[] = [
      { id: '1', keyCode: 'LK-7A83-B9C2-1D45', duration: '30天', isUsed: true, usedBy: 'user1@example.com', usedAt: '2024-12-20', expiresAt: '2025-01-19', createdAt: '2024-12-01' },
      { id: '2', keyCode: 'LK-5F21-E8B3-7C94', duration: '7天', isUsed: false, usedBy: null, usedAt: null, expiresAt: '2024-12-29', createdAt: '2024-12-22' },
      { id: '3', keyCode: 'LK-9D67-A2B4-3E81', duration: '1小时', isUsed: true, usedBy: 'user3@example.com', usedAt: '2024-12-22', expiresAt: '2024-12-22', createdAt: '2024-12-22' },
      { id: '4', keyCode: 'LK-4C89-F6D2-1B73', duration: '1年', isUsed: false, usedBy: null, usedAt: null, expiresAt: '2025-12-22', createdAt: '2024-12-22' },
      { id: '5', keyCode: 'LK-2B45-D8E9-7F36', duration: '3个月', isUsed: true, usedBy: 'user5@example.com', usedAt: '2024-12-21', expiresAt: '2025-03-21', createdAt: '2024-12-15' },
    ]
    
    setTimeout(() => {
      setKeys(mockKeys)
      setLoading(false)
    }, 800)
  }, [])

  const copyToClipboard = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode)
    setCopiedKey(keyCode)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const filteredKeys = keys.filter(key => 
    key.keyCode.toLowerCase().includes(search.toLowerCase()) ||
    key.usedBy?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Key className="w-6 h-6 mr-2 text-amber-400" />
              密钥管理
            </h1>
            <p className="text-gray-400 mt-2">创建、管理和追踪访问密钥</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 rounded-lg text-sm text-white flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            生成新密钥
          </button>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex items-center mt-6 space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索密钥或使用者..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
            <option value="all">全部状态</option>
            <option value="used">已使用</option>
            <option value="unused">未使用</option>
            <option value="expired">已过期</option>
          </select>
        </div>
      </div>

      {/* 密钥统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <p className="text-sm text-gray-400">总密钥数</p>
          <p className="text-2xl font-bold text-white mt-2">{keys.length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <p className="text-sm text-gray-400">已使用</p>
          <p className="text-2xl font-bold text-white mt-2">{keys.filter(k => k.isUsed).length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <p className="text-sm text-gray-400">未使用</p>
          <p className="text-2xl font-bold text-white mt-2">{keys.filter(k => !k.isUsed).length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <p className="text-sm text-gray-400">今日生成</p>
          <p className="text-2xl font-bold text-white mt-2">3</p>
        </div>
      </div>

      {/* 密钥列表 */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">密钥列表</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">加载密钥列表中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">密钥</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">时长</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">状态</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">使用者</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">过期时间</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-2">
                        <code className="font-mono text-sm bg-gray-900 px-2 py-1 rounded">
                          {key.keyCode}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.keyCode)}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          {copiedKey === key.keyCode ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {key.duration}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs ${
                        key.isUsed 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {key.isUsed ? '已使用' : '未使用'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-gray-300 text-sm">
                      {key.usedBy || '-'}
                    </td>
                    <td className="py-3 px-6 text-gray-300 text-sm">{key.expiresAt}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
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