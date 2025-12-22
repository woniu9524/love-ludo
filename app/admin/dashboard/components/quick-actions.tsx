// /app/admin/dashboard/components/quick-actions.tsx
import { Key, BarChart3, Brain, Settings, Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default function QuickActions() {
  const actions = [
    {
      title: '生成新密钥',
      description: '创建1小时/1天/7天密钥',
      icon: Key,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/keys/create'
    },
    {
      title: '导出数据',
      description: '导出CSV/Excel格式',
      icon: Download,
      color: 'from-green-500 to-emerald-600',
      href: '/admin/users/export'
    },
    {
      title: 'AI分析',
      description: '查看AI使用趋势',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      href: '/admin/ai-usage/analyze'
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      href: '/admin/settings'
    }
  ]

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">快速操作</h3>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          
          return (
            <Link
              key={index}
              href={action.href}
              className="flex items-center p-4 bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-all group"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{action.title}</p>
                <p className="text-sm text-gray-400 mt-1">{action.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}