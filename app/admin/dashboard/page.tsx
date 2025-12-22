// /app/admin/dashboard/page.tsx - 基础版
'use client'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="p-8">加载中...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">管理仪表板</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 统计卡片占位符 */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-6">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  )
}