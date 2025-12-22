// /app/admin/dashboard/components/system-status.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Shield, AlertCircle, CheckCircle, Activity } from 'lucide-react'

interface SystemStatus {
  name: string
  status: 'normal' | 'warning' | 'error'
  description: string
}

export default function SystemStatus() {
  const [statuses, setStatuses] = useState<SystemStatus[]>([
    { name: 'API服务', status: 'normal', description: '接口响应正常' },
    { name: '数据库', status: 'normal', description: '连接稳定' },
    { name: '游戏服务器', status: 'normal', description: '运行中' },
    { name: '安全防护', status: 'normal', description: '已启用' }
  ])

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        )

        // 检查数据库连接
        const { error: dbError } = await supabase.from('profiles').select('count').limit(1)
        
        const newStatuses = [...statuses]
        
        // 更新数据库状态
        if (dbError) {
          newStatuses[1] = { 
            name: '数据库', 
            status: 'error', 
            description: '连接异常' 
          }
        }

        // 这里可以添加更多检查逻辑
        
        setStatuses(newStatuses)

      } catch (error) {
        console.error('检查系统状态失败:', error)
      }
    }

    checkSystemStatus()
    // 每60秒检查一次
    const intervalId = setInterval(checkSystemStatus, 60000)
    
    return () => clearInterval(intervalId)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertCircle className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
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
        {statuses.map((status, index) => (
          <div key={index} className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{status.name}</span>
              <div className={`${getStatusColor(status.status)}`}>
                {getStatusIcon(status.status)}
              </div>
            </div>
            <p className={`text-lg font-semibold mb-2 ${getStatusColor(status.status)}`}>
              {status.status === 'normal' ? '正常' : 
               status.status === 'warning' ? '警告' : '异常'}
            </p>
            <p className="text-xs text-gray-500">{status.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}