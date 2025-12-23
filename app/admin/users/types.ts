// /app/admin/users/types.ts
export interface User {
  id: string
  email: string
  nickname: string | null
  fullName: string | null
  avatarUrl: string | null
  bio: string | null
  preferences: any
  isAdmin: boolean
  isPremium: boolean
  lastLogin: string
  lastLoginRaw: string | null
  accountExpires: string | null
  createdAt: string
  createdAtRaw: string
  accessKeyId: number | null
  activeKey: string | null
  activeKeyUsedAt: string | null
  activeKeyExpires: string | null
  isActive: boolean
}

export interface UserDetail {
  // 基本字段（数据库原始字段，使用下划线）
  id: string
  email: string
  nickname: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  preferences: any
  account_expires_at: string | null
  last_login_at: string | null
  last_login_session: string | null
  access_key_id: number | null
  created_at: string
  updated_at: string
  
  // 🔥 关联字段（使用驼峰命名，与API返回一致）
  accessKeys: Array<{
    id: number
    key_code: string
    is_active: boolean
    used_count: number
    max_uses: number
    key_expires_at: string | null
    account_valid_for_days: number
    user_id: string | null
    used_at: string | null
    created_at: string
    updated_at: string
  }>
  
  aiUsageRecords: Array<{
    id: number
    user_id: string
    feature: string
    created_at: string
    request_data: any
    response_data: any
    success: boolean
  }>
  
  gameHistory: Array<{
    id: string
    room_id: string | null
    session_id: string | null
    player1_id: string
    player2_id: string
    winner_id: string | null
    started_at: string | null
    ended_at: string | null
    task_results: any[]
  }>
}