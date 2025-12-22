// /app/admin/dashboard/types.ts
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  expiredUsers: number
  totalKeys: number
  usedKeys: number
  availableKeys: number
  aiUsageCount: number
  totalGames: number
  activeGames: number
  totalRevenue: number
  todayRevenue: number
  averageSessionDuration: number
}

export interface User {
  id: string
  email: string
  nickname: string | null
  last_login_at: string | null
  account_expires_at: string | null
}

export interface ChartData {
  date: string
  users: number
  games: number
  aiUsage: number
}