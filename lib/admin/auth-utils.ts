// /lib/admin/auth-utils.ts - 简化工具函数
export const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || ['2200691917@qq.com']
export const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'Cike@7638'

// 检查是否是管理员邮箱
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// 验证管理员密钥
export function validateAdminKey(key: string): boolean {
  return key === ADMIN_KEY
}

// 设置管理员验证Cookie
export function setAdminCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'admin_key_verified=true; path=/admin; max-age=86400; SameSite=Strict'
  }
}

// 清除管理员Cookie
export function clearAdminCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'admin_key_verified=; path=/admin; max-age=0; SameSite=Strict'
  }
}