// /lib/admin/auth.ts - 完整版本
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// 获取管理员用户（不抛出错误）
export async function getAdminUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // 检查是否为管理员
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    const userEmail = user.email?.toLowerCase()
    
    if (userEmail && adminEmails.includes(userEmail)) {
      return user
    }
    
    return null
  } catch (error) {
    console.error('获取管理员用户失败:', error)
    return null
  }
}

// 验证管理员会话（返回isAdmin和user）
export async function validateAdminSession() {
  try {
    const user = await getAdminUser()
    
    if (!user) {
      return { isAdmin: false, user: null }
    }
    
    return { isAdmin: true, user }
  } catch (error) {
    console.error('验证管理员会话失败:', error)
    return { isAdmin: false, user: null }
  }
}

// 要求管理员权限（如果不是管理员则重定向）
export async function requireAdmin() {
  const { isAdmin, user } = await validateAdminSession()
  
  if (!isAdmin) {
    if (user) {
      // 已登录但不是管理员
      redirect('/admin/unauthorized')
    } else {
      // 未登录
      redirect('/admin')
    }
  }
  
  return { user }
}

// 检查是否是管理员路径
export function isAdminPath(path: string): boolean {
  return path.startsWith('/admin') && !pathname.includes('/admin/login')
}

// 获取重定向路径
export function getAdminRedirectPath(pathname: string): string {
  if (pathname.startsWith('/admin')) {
    return `/admin?redirect=${encodeURIComponent(pathname)}`
  }
  return '/admin'
}