// /app/admin/keys/page.tsx - 修复版
import { validateAdminSession } from '@/lib/admin/auth'

export default async function KeysPage() {
  const { isAdmin, user } = await validateAdminSession()
  
  if (!isAdmin) {
    return null
  }

  // 页面内容...
  return (
    <div>密钥管理页面</div>
  )
}