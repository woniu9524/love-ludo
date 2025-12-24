// /app/admin/users/types.ts - 修复版本
export interface User {
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
  
  // 计算字段
  isActive?: boolean
  isPremium?: boolean
  daysRemaining?: number
  lastLogin?: string
  accountExpires?: string
  activeKey?: string | null
}

export interface UserDetail {
  // 基本字段（驼峰命名）
  id: string
  email: string
  nickname: string | null
  fullName: string | null
  avatarUrl: string | null
  bio: string | null
  preferences: any
  accountExpiresAt: string | null
  lastLoginAt: string | null
  lastLoginSession: string | null
  accessKeyId: number | null
  createdAt: string
  updatedAt: string
  
  // 关联字段
  accessKeys: AccessKey[]
  aiUsageRecords: AiUsageRecord[]
  gameHistory: GameHistory[]
}

export interface AccessKey {
  id: number
  keyCode: string
  isActive: boolean
  usedCount: number
  maxUses: number
  keyExpiresAt: string | null
  accountValidForDays: number
  userId: string | null
  usedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AiUsageRecord {
  id: number
  userId: string
  feature: string
  createdAt: string
  requestData: any
  responseData: any
  success: boolean
}

export interface GameHistory {
  id: string
  roomId: string | null
  sessionId: string | null
  player1Id: string
  player2Id: string
  winnerId: string | null
  startedAt: string | null
  endedAt: string | null
  taskResults: any[]
}

// 🔥 关键修复：简化的归一化函数
export function normalizeUserDetail(data: any): UserDetail {
  if (!data) return {} as UserDetail
  
  // 🔍 调试日志：查看原始数据
  console.log('🔄 归一化输入数据:', {
    原始字段: Object.keys(data),
    accessKeys存在: 'accessKeys' in data,
    accessKeys长度: data.accessKeys?.length || 0,
    aiUsageRecords存在: 'aiUsageRecords' in data,
    aiUsageRecords长度: data.aiUsageRecords?.length || 0
  })
  
  // 🎯 核心修复：API已经返回驼峰命名，我们直接使用，不再进行转换
  const result: UserDetail = {
    // 基本字段直接映射
    id: data.id || '',
    email: data.email || '',
    nickname: data.nickname || null,
    fullName: data.fullName || data.full_name || null,
    avatarUrl: data.avatarUrl || data.avatar_url || null,
    bio: data.bio || null,
    preferences: data.preferences || {},
    accountExpiresAt: data.accountExpiresAt || data.account_expires_at || null,
    lastLoginAt: data.lastLoginAt || data.last_login_at || null,
    lastLoginSession: data.lastLoginSession || data.last_login_session || null,
    accessKeyId: data.accessKeyId || data.access_key_id || null,
    createdAt: data.createdAt || data.created_at || '',
    updatedAt: data.updatedAt || data.updated_at || '',
    
    // 🔥 关键修复：直接使用API返回的数组，不进行二次转换
    accessKeys: normalizeAccessKeys(data.accessKeys || []),
    aiUsageRecords: normalizeAiUsageRecords(data.aiUsageRecords || []),
    gameHistory: normalizeGameHistory(data.gameHistory || [])
  }
  
  console.log('✅ 归一化结果:', {
    accessKeys长度: result.accessKeys.length,
    aiUsageRecords长度: result.aiUsageRecords.length,
    gameHistory长度: result.gameHistory.length
  })
  
  return result
}

// 🔥 简化归一化函数：API已经返回正确的格式
export function normalizeAccessKeys(keys: any[]): AccessKey[] {
  if (!Array.isArray(keys)) {
    console.warn('❌ accessKeys不是数组:', keys)
    return []
  }
  
  return keys.map(key => {
    // API返回的已经是驼峰格式，直接使用
    return {
      id: key.id || 0,
      keyCode: key.keyCode || key.key_code || '',
      isActive: key.isActive !== undefined ? key.isActive : 
               (key.is_active !== undefined ? key.is_active : true),
      usedCount: key.usedCount || key.used_count || 0,
      maxUses: key.maxUses || key.max_uses || 1,
      keyExpiresAt: key.keyExpiresAt || key.key_expires_at || null,
      accountValidForDays: key.accountValidForDays || key.account_valid_for_days || 30,
      userId: key.userId || key.user_id || null,
      usedAt: key.usedAt || key.used_at || null,
      createdAt: key.createdAt || key.created_at || '',
      updatedAt: key.updatedAt || key.updated_at || ''
    }
  })
}

export function normalizeAiUsageRecords(records: any[]): AiUsageRecord[] {
  if (!Array.isArray(records)) {
    console.warn('❌ aiUsageRecords不是数组:', records)
    return []
  }
  
  return records.map(record => ({
    id: record.id || 0,
    userId: record.userId || record.user_id || '',
    feature: record.feature || 'unknown',
    createdAt: record.createdAt || record.created_at || '',
    requestData: record.requestData || record.request_data || {},
    responseData: record.responseData || record.response_data || {},
    success: record.success !== undefined ? record.success : true
  }))
}

export function normalizeGameHistory(games: any[]): GameHistory[] {
  if (!Array.isArray(games)) {
    console.warn('❌ gameHistory不是数组:', games)
    return []
  }
  
  return games.map(game => ({
    id: game.id || '',
    roomId: game.roomId || game.room_id || null,
    sessionId: game.sessionId || game.session_id || null,
    player1Id: game.player1Id || game.player1_id || '',
    player2Id: game.player2Id || game.player2_id || '',
    winnerId: game.winnerId || game.winner_id || null,
    startedAt: game.startedAt || game.started_at || null,
    endedAt: game.endedAt || game.ended_at || null,
    taskResults: game.taskResults || game.task_results || []
  }))
}
