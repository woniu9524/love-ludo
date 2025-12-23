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
  access_key?: any // 当前使用的密钥
}

// 游戏历史记录类型
export interface GameHistory {
  id: string
  room_id: string | null
  session_id: string | null
  player1_id: string
  player2_id: string
  winner_id: string | null
  started_at: string | null
  ended_at: string | null
  task_results: any[]
  created_at: string
  
  // 增强字段
  opponent: {
    email: string
    nickname: string | null
  }
  theme: {
    title: string
  }
  duration: number | null
  result: '胜利' | '失败' | '平局' | '未知'
  user_role: '玩家1' | '玩家2'
  completed_tasks: number
  total_tasks: number
}

export interface UserDetail {
  // profiles 表字段
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
  
  // 🔥 关键修复：使用复数形式，返回所有密钥
  access_keys: Array<{
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
  
  ai_usage_records: Array<{
    id: number
    user_id: string
    feature: string
    created_at: string
    request_data: any
    response_data: any
    success: boolean
  }>
  
  // 🔥 使用增强的游戏记录类型
  game_history: GameHistory[]
}