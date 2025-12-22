// /app/admin/users/page.tsx - 修复版
import { validateAdminSession } from '@/lib/admin/auth'

export default async function UsersPage() {
  const { isAdmin, user } = await validateAdminSession()
  
  if (!isAdmin) {
    return null
  }

  // 页面内容...
  return (
    <div>用户管理页面</div>
  )
}