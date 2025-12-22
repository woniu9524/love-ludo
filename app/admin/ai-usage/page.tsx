// /app/admin/ai-usage/page.tsx - 修复版
import { validateAdminSession } from '@/lib/admin/auth'

export default async function AiUsagePage() {
  const { isAdmin, user } = await validateAdminSession()
  
  if (!isAdmin) {
    // 重定向逻辑已经在validateAdminSession中处理
    return null
  }

  // 页面内容...
  return (
    <div>AI使用统计页面</div>
  )
}