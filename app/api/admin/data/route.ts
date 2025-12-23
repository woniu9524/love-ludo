// /app/api/admin/data/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 1. 验证管理员身份
    const adminKeyVerified = request.cookies.get('admin_key_verified')
    const referer = request.headers.get('referer')
    const isFromAdminPage = referer?.includes('/admin/')
    
    if (!adminKeyVerified && !isFromAdminPage) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    // 2. 检查环境变量
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY 环境变量未设置')
      return NextResponse.json(
        { success: false, error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 3. 创建管理员客户端
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false }
      }
    )

    // 4. 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const table = searchParams.get('table')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const search = searchParams.get('search')
    const filter = searchParams.get('filter')
    const detailId = searchParams.get('detailId')

    console.log(`[API] 查询: ${table}, detailId: ${detailId}`)

    // 5. 处理用户详情查询
    if (table === 'profiles' && detailId) {
      console.log(`查询用户详情: ${detailId}`)
      
      try {
        // 并行查询所有相关数据
        const [
          profileResult,
          allKeysResult,
          aiUsageResult,
          gameHistoriesResult
        ] = await Promise.all([
          // 1. 用户基本信息
          supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', detailId)
            .single(),
          
          // 2. 用户的所有密钥记录
          supabaseAdmin
            .from('access_keys')
            .select('*')
            .eq('user_id', detailId)
            .order('created_at', { ascending: false }),
          
          // 3. AI使用记录
          supabaseAdmin
            .from('ai_usage_records')
            .select('*')
            .eq('user_id', detailId)
            .order('created_at', { ascending: false })
            .limit(10),
          
          // 4. 游戏历史记录
          supabaseAdmin
            .from('game_history')
            .select('*')
            .or(`player1_id.eq.${detailId},player2_id.eq.${detailId}`)
            .order('started_at', { ascending: false })
            .limit(10)
        ])

        // 检查错误
        if (profileResult.error) {
          console.error('查询用户详情失败:', profileResult.error)
          return NextResponse.json(
            { success: false, error: '获取用户详情失败' },
            { status: 404 }
          )
        }

        // 准备游戏记录增强数据
        let enrichedGameHistories: any[] = []
        if (gameHistoriesResult.data && gameHistoriesResult.data.length > 0) {
          // 收集ID
          const opponentIds: string[] = []
          const roomIds: string[] = []
          
          gameHistoriesResult.data.forEach(game => {
            const opponentId = game.player1_id === detailId ? game.player2_id : game.player1_id
            if (opponentId) opponentIds.push(opponentId)
            if (game.room_id) roomIds.push(game.room_id)
          })

          // 批量查询相关数据
          const [
            opponentsResult,
            roomsResult
          ] = await Promise.all([
            opponentIds.length > 0
              ? supabaseAdmin
                  .from('profiles')
                  .select('id, email, nickname')
                  .in('id', [...new Set(opponentIds)])
              : { data: [] },
            
            roomIds.length > 0
              ? supabaseAdmin
                  .from('rooms')
                  .select('id, player1_theme_id, player2_theme_id')
                  .in('id', [...new Set(roomIds)])
              : { data: [] }
          ])

          // 收集主题ID
          const themeIds: string[] = []
          roomsResult.data?.forEach(room => {
            if (room.player1_theme_id) themeIds.push(room.player1_theme_id)
            if (room.player2_theme_id) themeIds.push(room.player2_theme_id)
          })

          // 查询主题信息
          let themesResult = { data: [] as any[] }
          if (themeIds.length > 0) {
            themesResult = await supabaseAdmin
              .from('themes')
              .select('id, title')
              .in('id', [...new Set(themeIds)])
          }

          // 创建映射
          const opponentMap = new Map(opponentsResult.data?.map(o => [o.id, o]))
          const roomMap = new Map(roomsResult.data?.map(r => [r.id, r]))
          const themeMap = new Map(themesResult.data?.map(t => [t.id, t]))

          // 增强游戏记录
          enrichedGameHistories = gameHistoriesResult.data.map(game => {
            const isPlayer1 = game.player1_id === detailId
            const opponentId = isPlayer1 ? game.player2_id : game.player1_id
            const opponent = opponentId ? opponentMap.get(opponentId) : null
            
            const room = game.room_id ? roomMap.get(game.room_id) : null
            const themeId = isPlayer1 ? room?.player1_theme_id : room?.player2_theme_id
            const theme = themeId ? themeMap.get(themeId) : null
            
            // 计算游戏时长
            let duration = null
            if (game.started_at && game.ended_at) {
              const start = new Date(game.started_at)
              const end = new Date(game.ended_at)
              const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
              duration = minutes
            }

            // 判断胜负
            let result: '胜利' | '失败' | '平局' | '未知' = '未知'
            if (game.winner_id === detailId) {
              result = '胜利'
            } else if (game.winner_id && game.winner_id !== detailId) {
              result = '失败'
            } else if (!game.winner_id) {
              result = '平局'
            }

            // 获取当前用户的任务完成情况
            const userTaskResults = Array.isArray(game.task_results) 
              ? game.task_results.filter((task: any) => 
                  task.player_id === detailId
                )
              : []
            const completedTasks = userTaskResults.filter((task: any) => task.completed).length
            const totalTasks = userTaskResults.length

            return {
              id: game.id,
              room_id: game.room_id,
              session_id: game.session_id,
              player1_id: game.player1_id,
              player2_id: game.player2_id,
              winner_id: game.winner_id,
              started_at: game.started_at,
              ended_at: game.ended_at,
              task_results: game.task_results,
              created_at: game.created_at,
              opponent: opponent || { email: '未知用户', nickname: null },
              theme: theme || { title: '未知主题' },
              duration,
              result,
              user_role: isPlayer1 ? '玩家1' : '玩家2',
              completed_tasks: completedTasks,
              total_tasks: totalTasks
            }
          })
        }

        // 返回完整数据
        return NextResponse.json({
          success: true,
          data: {
            ...profileResult.data,
            // 🔥 关键：将 access_keys 改为复数形式
            access_keys: allKeysResult.data || [],
            ai_usage_records: aiUsageResult.data || [],
            game_history: enrichedGameHistories
          }
        })

      } catch (error: any) {
        console.error('用户详情查询失败:', error)
        return NextResponse.json(
          { 
            success: false, 
            error: '获取用户详情失败',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        )
      }
    }

    // 6. 处理普通列表查询
    if (!table) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：table' },
        { status: 400 }
      )
    }

    let data: any
    let count: number | null

    switch (table) {
      case 'profiles':
        // 构建用户列表查询
        let profilesQuery = supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact' })

        // 应用搜索条件
        if (search && search.trim()) {
          const searchTerm = `%${search.trim()}%`
          profilesQuery = profilesQuery.or(
            `email.ilike.${searchTerm},nickname.ilike.${searchTerm},full_name.ilike.${searchTerm}`
          )
        }

        // 应用筛选条件
        const now = new Date().toISOString()
        if (filter) {
          switch (filter) {
            case 'premium':
              profilesQuery = profilesQuery.gt('account_expires_at', now)
              break
            case 'free':
              profilesQuery = profilesQuery.or(
                `account_expires_at.lte.${now},account_expires_at.is.null`
              )
              break
            case 'active24h':
              const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              profilesQuery = profilesQuery.gt('last_login_at', yesterday)
              break
            case 'expired':
              profilesQuery = profilesQuery.lt('account_expires_at', now)
              break
          }
        }

        // 执行查询
        const { data: profilesData, error: profilesError, count: profilesCount } = await profilesQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (profilesError) throw profilesError
        
        data = profilesData || []
        count = profilesCount
        
        // 手动查询关联的密钥信息
        if (data.length > 0) {
          const accessKeyIds = data
            .filter((profile: any) => profile.access_key_id)
            .map((profile: any) => profile.access_key_id)
          
          if (accessKeyIds.length > 0) {
            const { data: accessKeysData } = await supabaseAdmin
              .from('access_keys')
              .select('id, key_code, account_valid_for_days, used_at, key_expires_at')
              .in('id', accessKeyIds)
            
            if (accessKeysData) {
              const accessKeyMap = new Map(accessKeysData.map((key: any) => [key.id, key]))
              data = data.map((profile: any) => ({
                ...profile,
                access_key: profile.access_key_id ? accessKeyMap.get(profile.access_key_id) : null
              }))
            }
          }
        }
        break

      case 'access_keys':
        // 密钥列表查询
        let keysQuery = supabaseAdmin
          .from('access_keys')
          .select('*', { count: 'exact' })

        if (search && search.trim()) {
          const searchTerm = `%${search.trim()}%`
          keysQuery = keysQuery.or(`key_code.ilike.${searchTerm}`)
        }

        if (filter) {
          switch (filter) {
            case 'used':
              keysQuery = keysQuery.not('used_at', 'is', null)
              break
            case 'unused':
              keysQuery = keysQuery.is('used_at', null)
              break
            case 'expired':
              keysQuery = keysQuery.lt('key_expires_at', now)
              break
          }
        }

        const { data: keysData, error: keysError, count: keysCount } = await keysQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (keysError) throw keysError
        data = keysData
        count = keysCount
        break

      case 'ai_usage_records':
        // AI使用记录查询
        let aiQuery = supabaseAdmin
          .from('ai_usage_records')
          .select('*', { count: 'exact' })

        if (filter) {
          const nowDate = new Date()
          let startDate: Date
          
          switch (filter) {
            case 'today':
              startDate = new Date(nowDate.setHours(0, 0, 0, 0))
              break
            case '7d':
              startDate = new Date(nowDate.setDate(nowDate.getDate() - 7))
              break
            case '30d':
              startDate = new Date(nowDate.setDate(nowDate.getDate() - 30))
              break
            default:
              startDate = new Date(0)
          }
          
          if (startDate.getTime() > 0) {
            aiQuery = aiQuery.gte('created_at', startDate.toISOString())
          }
        }

        const { data: aiData, error: aiError, count: aiCount } = await aiQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (aiError) throw aiError
        data = aiData
        count = aiCount
        break

      default:
        return NextResponse.json(
          { success: false, error: `不支持的表名: ${table}` },
          { status: 400 }
        )
    }

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('管理员数据API错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '服务器内部错误'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '暂不支持POST方法' },
    { status: 405 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '暂不支持PUT方法' },
    { status: 405 }
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '暂不支持DELETE方法' },
    { status: 405 }
  )
}