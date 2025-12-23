// /app/admin/users/components/user-detail-modal.tsx
'use client'

import { X, Mail, User, Calendar, Key, Brain, Gamepad2, Copy, Check, Clock, Award, Users, Target, History, BarChart3 } from 'lucide-react'
import { UserDetail } from '../types'
import { useState } from 'react'

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  userDetail: UserDetail | null
  loading: boolean
}

export default function UserDetailModal({ isOpen, onClose, userDetail, loading }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'keys' | 'ai' | 'games'>('info')
  const [copied, setCopied] = useState<string | null>(null)

  if (!isOpen) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '无'
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSimpleDate = (dateString: string | null) => {
    if (!dateString) return '无'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const calculateDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 0
    const now = new Date()
    const expireDate = new Date(expiresAt)
    const diffTime = expireDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const calculateGameStats = () => {
    if (!userDetail?.game_history?.length) return null
    
    const games = userDetail.game_history
    const totalGames = games.length
    const wins = games.filter(g => g.result === '胜利').length
    const losses = games.filter(g => g.result === '失败').length
    const draws = games.filter(g => g.result === '平局').length
    
    const totalDuration = games.reduce((sum, game) => sum + (game.duration || 0), 0)
    const avgDuration = totalGames > 0 ? Math.round(totalDuration / totalGames) : 0
    
    const tasksCompleted = games.reduce((sum, game) => sum + game.completed_tasks, 0)
    const totalTasks = games.reduce((sum, game) => sum + game.total_tasks, 0)
    const taskCompletionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0
    
    return {
      totalGames,
      wins,
      losses,
      draws,
      winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
      avgDuration,
      tasksCompleted,
      totalTasks,
      taskCompletionRate
    }
  }

  const gameStats = calculateGameStats()

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-400" />
              用户详情
            </h2>
            {userDetail && (
              <p className="text-gray-400 mt-1 flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                {userDetail.email}
                <span className="mx-2">•</span>
                <span className="text-sm">ID: {userDetail.id.substring(0, 8)}...</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4">加载用户详情中...</p>
            </div>
          </div>
        ) : !userDetail ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-gray-400">无法加载用户数据</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* 标签页导航 */}
            <div className="border-b border-gray-700/50">
              <div className="flex overflow-x-auto px-6">
                {[
                  { id: 'info', label: '基本信息', icon: User },
                  { id: 'keys', label: '密钥记录', icon: Key, badge: userDetail.access_keys?.length },
                  { id: 'ai', label: 'AI使用', icon: Brain, badge: userDetail.ai_usage_records?.length },
                  { id: 'games', label: '游戏记录', icon: Gamepad2, badge: userDetail.game_history?.length }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      className={`flex items-center px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                      onClick={() => setActiveTab(tab.id as any)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full min-w-[20px] flex items-center justify-center">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 基本信息标签页 */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* 基础信息卡片 */}
                  <div className="bg-gray-900/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">基础信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">用户ID</p>
                        <div className="flex items-center mt-1">
                          <code className="text-xs bg-gray-800 px-3 py-1.5 rounded font-mono truncate flex-1">
                            {userDetail.id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(userDetail.id)}
                            className="ml-2 p-1.5 hover:bg-gray-700 rounded"
                          >
                            {copied === userDetail.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">邮箱</p>
                        <div className="flex items-center mt-1">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-white truncate">{userDetail.email}</p>
                          <button
                            onClick={() => copyToClipboard(userDetail.email)}
                            className="ml-2 p-1 hover:bg-gray-700 rounded"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">昵称</p>
                        <p className="text-white mt-1">{userDetail.nickname || '未设置'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">全名</p>
                        <p className="text-white mt-1">{userDetail.full_name || '未设置'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">个人简介</p>
                        <p className="text-white mt-1 text-sm">{userDetail.bio || '未设置'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">偏好设置</p>
                        <pre className="text-xs text-gray-300 mt-1 bg-gray-800 p-2 rounded overflow-x-auto max-h-20">
                          {userDetail.preferences ? JSON.stringify(userDetail.preferences, null, 2) : '{}'}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* 账号状态卡片 */}
                  <div className="bg-gray-900/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">账号状态</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <p className="text-sm text-gray-400">会员状态</p>
                        <div className="mt-2">
                          {userDetail.account_expires_at && new Date(userDetail.account_expires_at) > new Date() ? (
                            <>
                              <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm">
                                <Award className="w-3 h-3 mr-1" />
                                会员中
                              </span>
                              <p className="text-gray-400 text-xs mt-2">
                                剩余 {calculateDaysRemaining(userDetail.account_expires_at)} 天
                              </p>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                              <Users className="w-3 h-3 mr-1" />
                              免费用户
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          到期时间: {userDetail.account_expires_at ? formatSimpleDate(userDetail.account_expires_at) : '永久'}
                        </p>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <p className="text-sm text-gray-400">最后登录</p>
                        <div className="flex items-center mt-2">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-white">{formatDate(userDetail.last_login_at)}</p>
                            {userDetail.last_login_session && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                会话: {userDetail.last_login_session.substring(0, 16)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <p className="text-sm text-gray-400">注册时间</p>
                        <div className="flex items-center mt-2">
                          <History className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-white">{formatDate(userDetail.created_at)}</p>
                        </div>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <p className="text-sm text-gray-400">最后更新</p>
                        <div className="flex items-center mt-2">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-white">{formatDate(userDetail.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 当前使用的密钥 */}
                  {userDetail.access_key_id && userDetail.access_keys?.find(k => k.id === userDetail.access_key_id) && (
                    <div className="bg-gray-900/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Key className="w-5 h-5 mr-2 text-amber-400" />
                        当前使用的密钥
                      </h3>
                      {(() => {
                        const currentKey = userDetail.access_keys.find(k => k.id === userDetail.access_key_id)
                        if (!currentKey) return null
                        
                        return (
                          <div className="bg-gradient-to-r from-amber-900/20 to-amber-800/10 rounded-lg p-4 border border-amber-700/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <code className="text-lg bg-black/30 px-3 py-2 rounded font-mono">
                                  {currentKey.key_code}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(currentKey.key_code)}
                                  className="ml-3 p-2 hover:bg-amber-900/30 rounded"
                                >
                                  {copied === currentKey.key_code ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-amber-400" />
                                  )}
                                </button>
                              </div>
                              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                                正在使用
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-gray-400">有效天数</p>
                                <p className="text-white">{currentKey.account_valid_for_days}天</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">使用时间</p>
                                <p className="text-white text-sm">{formatSimpleDate(currentKey.used_at)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">过期时间</p>
                                <p className="text-white text-sm">{formatSimpleDate(currentKey.key_expires_at)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">使用次数</p>
                                <p className="text-white">{currentKey.used_count}/{currentKey.max_uses}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* 密钥记录标签页 */}
              {activeTab === 'keys' && (
                <div className="space-y-6">
                  <div className="bg-gray-900/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">所有密钥记录 ({userDetail.access_keys?.length || 0})</h3>
                    {!userDetail.access_keys || userDetail.access_keys.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">暂无密钥记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-700/50">
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">密钥代码</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">状态</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">使用情况</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">使用时间</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">过期时间</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.access_keys.map((key) => {
                              const isCurrentKey = key.id === userDetail.access_key_id
                              const isExpired = key.key_expires_at && new Date(key.key_expires_at) < new Date()
                              
                              return (
                                <tr key={key.id} className={`border-b border-gray-700/30 hover:bg-gray-800/30 ${isCurrentKey ? 'bg-amber-900/10' : ''}`}>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <code className={`text-sm px-2 py-1.5 rounded font-mono ${
                                        isCurrentKey ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-300'
                                      }`}>
                                        {key.key_code}
                                      </code>
                                      <button
                                        onClick={() => copyToClipboard(key.key_code)}
                                        className="ml-2 p-1 hover:bg-gray-700 rounded"
                                      >
                                        {copied === key.key_code ? (
                                          <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                          <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                      </button>
                                      {isCurrentKey && (
                                        <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                          当前使用
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        key.is_active
                                          ? 'bg-green-500/20 text-green-400'
                                          : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {key.is_active ? '激活' : '停用'}
                                      </span>
                                      {isExpired && (
                                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">
                                          已过期
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                      <span className="text-white">
                                        {key.used_count || 0}/{key.max_uses || 1}
                                      </span>
                                      {key.used_at && (
                                        <span className="text-gray-500 text-xs">
                                          已使用 {calculateDaysRemaining(key.used_at)} 天
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-gray-300 text-sm">
                                      {key.used_at ? formatSimpleDate(key.used_at) : '未使用'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-sm ${
                                      isExpired ? 'text-red-400' : 'text-gray-300'
                                    }`}>
                                      {key.key_expires_at ? formatSimpleDate(key.key_expires_at) : '无限制'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <button
                                      onClick={() => {
                                        if (key.user_id) {
                                          alert(`密钥 ${key.key_code} 已被用户使用`)
                                        } else {
                                          alert(`密钥 ${key.key_code} 可分配给其他用户`)
                                        }
                                      }}
                                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                                    >
                                      管理
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  {/* 密钥统计 */}
                  {userDetail.access_keys && userDetail.access_keys.length > 0 && (
                    <div className="bg-gray-900/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">密钥统计</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">总密钥数</p>
                          <p className="text-2xl font-bold text-white mt-2">
                            {userDetail.access_keys.length}
                          </p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">已使用</p>
                          <p className="text-2xl font-bold text-green-400 mt-2">
                            {userDetail.access_keys.filter(k => k.used_at).length}
                          </p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">未使用</p>
                          <p className="text-2xl font-bold text-blue-400 mt-2">
                            {userDetail.access_keys.filter(k => !k.used_at).length}
                          </p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">已过期</p>
                          <p className="text-2xl font-bold text-red-400 mt-2">
                            {userDetail.access_keys.filter(k => k.key_expires_at && new Date(k.key_expires_at) < new Date()).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI使用标签页 */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="bg-gray-900/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">AI使用记录 ({userDetail.ai_usage_records?.length || 0})</h3>
                    {!userDetail.ai_usage_records || userDetail.ai_usage_records.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">暂无AI使用记录</p>
                    ) : (
                      <div className="space-y-4">
                        {userDetail.ai_usage_records.map((record) => (
                          <div key={record.id} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Brain className="w-4 h-4 text-purple-400 mr-2" />
                                <span className="text-white font-medium">{record.feature}</span>
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  record.success
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {record.success ? '成功' : '失败'}
                                </span>
                              </div>
                              <span className="text-gray-400 text-sm">
                                {formatDate(record.created_at)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-400 mb-1">请求内容</p>
                                <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto max-h-32">
                                  {record.request_data ? JSON.stringify(record.request_data, null, 2) : '{}'}
                                </pre>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400 mb-1">响应内容</p>
                                <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto max-h-32">
                                  {record.response_data ? JSON.stringify(record.response_data, null, 2) : '{}'}
                                </pre>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(record, null, 2))}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                              >
                                复制完整记录
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 游戏记录标签页 */}
              {activeTab === 'games' && (
                <div className="space-y-6">
                  {/* 游戏统计 */}
                  {gameStats && (
                    <div className="bg-gray-900/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                        游戏统计
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">总场次</p>
                          <p className="text-2xl font-bold text-white mt-2">{gameStats.totalGames}</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">胜场</p>
                          <p className="text-2xl font-bold text-green-400 mt-2">{gameStats.wins}</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">负场</p>
                          <p className="text-2xl font-bold text-red-400 mt-2">{gameStats.losses}</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">胜率</p>
                          <p className="text-2xl font-bold text-blue-400 mt-2">{gameStats.winRate}%</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">平均时长</p>
                          <p className="text-2xl font-bold text-amber-400 mt-2">{gameStats.avgDuration}分</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4 lg:col-span-2">
                          <p className="text-sm text-gray-400">任务完成率</p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-lg font-bold text-white">{gameStats.taskCompletionRate}%</span>
                              <span className="text-sm text-gray-400">
                                {gameStats.tasksCompleted}/{gameStats.totalTasks}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                                style={{ width: `${gameStats.taskCompletionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">平局</p>
                          <p className="text-2xl font-bold text-gray-400 mt-2">{gameStats.draws}</p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4 lg:col-span-2">
                          <p className="text-sm text-gray-400">总游戏时长</p>
                          <p className="text-2xl font-bold text-cyan-400 mt-2">
                            {Math.round(gameStats.totalDuration / 60)}小时{gameStats.totalDuration % 60}分钟
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 游戏历史记录 */}
                  <div className="bg-gray-900/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">游戏历史记录（最近10场）</h3>
                    {!userDetail.game_history || userDetail.game_history.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">暂无游戏记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-700/50">
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">游戏时间</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">对手</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">主题</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">结果</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">时长</th>
                              <th className="text-left py-3 px-4 text-gray-400 font-medium">任务完成</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.game_history.map((game) => {
                              // 格式化时间
                              const gameTime = game.started_at 
                                ? new Date(game.started_at).toLocaleString('zh-CN', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '未知'
                              
                              // 对手信息
                              const opponentName = game.opponent.nickname || game.opponent.email
                              
                              return (
                                <tr key={game.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                      <span className="text-gray-300">{gameTime}</span>
                                      <span className="text-gray-500 text-xs">
                                        {game.room_id ? `房间: ${game.room_id.substring(0, 8)}...` : ''}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                      <span className="text-white text-sm truncate max-w-[150px]">{opponentName}</span>
                                      <div className="flex items-center mt-1">
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                                          game.user_role === '玩家1' 
                                            ? 'bg-blue-500/20 text-blue-400' 
                                            : 'bg-purple-500/20 text-purple-400'
                                        }`}>
                                          {game.user_role}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <span className="text-white text-sm truncate max-w-[120px]">
                                        {game.theme?.title || '未知主题'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      game.result === '胜利'
                                        ? 'bg-green-500/20 text-green-400'
                                        : game.result === '失败'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {game.result}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                                      <span className="text-gray-300">
                                        {game.duration ? `${game.duration}分钟` : '未知'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                      <span className="text-white">
                                        {game.completed_tasks}/{game.total_tasks}
                                      </span>
                                      {game.total_tasks > 0 && (
                                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                          <div 
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full"
                                            style={{ 
                                              width: `${Math.round((game.completed_tasks / game.total_tasks) * 100)}%` 
                                            }}
                                          ></div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700/50">
          <div className="text-sm text-gray-400">
            {userDetail && (
              <>
                最后更新: {formatDate(userDetail.updated_at)}
                {userDetail.last_login_at && (
                  <span className="ml-4">最后登录: {formatDate(userDetail.last_login_at)}</span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              关闭
            </button>
            {userDetail && (
              <>
                <button
                  onClick={() => {
                    const message = `用户: ${userDetail.email}\n` +
                                  `ID: ${userDetail.id}\n` +
                                  `会员状态: ${userDetail.account_expires_at && new Date(userDetail.account_expires_at) > new Date() ? '会员中' : '免费用户'}\n` +
                                  `注册时间: ${formatDate(userDetail.created_at)}`
                    copyToClipboard(message)
                    alert('用户信息已复制到剪贴板')
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                >
                  复制信息
                </button>
                <button
                  onClick={() => {
                    // TODO: 实现编辑功能
                    alert('编辑功能待实现')
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 rounded-lg text-white transition-colors"
                >
                  编辑用户
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}