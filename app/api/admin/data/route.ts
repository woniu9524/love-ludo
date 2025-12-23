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
      console.warn('管理API未授权访问')
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
          
          // 2. 🔥 重要修复：查询用户的所有密钥记录
          // 根据您的数据库结构，access_keys表有两种方式关联用户：
          // 1) access_keys.user_id = 用户ID（表示该密钥被用户使用）
          // 2) access_keys.id = profiles.access_key_id（表示当前使用的密钥）
          // 我们需要同时查询这两种情况
          (async () => {
            try {
              // 首先获取用户的access_key_id
              const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('access_key_id')
                .eq('id', detailId)
                .single()
              
              let allKeys: any[] = []
              
              if (profile?.access_key_id) {
                // 查询当前使用的密钥
                const { data: currentKey } = await supabaseAdmin
                  .from('access_keys')
                  .select('*')
                  .eq('id', profile.access_key_id)
                  .single()
                
                if (currentKey) {
                  allKeys.push(currentKey)
                }
              }
              
              // 查询用户使用过的所有密钥（通过user_id）
              const { data: keysByUserId } = await supabaseAdmin
                .from('access_keys')
                .select('*')
                .eq('user_id', detailId)
                .order('created_at', { ascending: false })
              
              if (keysByUserId && keysByUserId.length > 0) {
                // 去重，避免重复添加相同的密钥
                const existingIds = new Set(allKeys.map(k => k.id))
                keysByUserId.forEach(key => {
                  if (!existingIds.has(key.id)) {
                    allKeys.push(key)
                  }
                })
              }
              
              return { data: allKeys, error: null }
            } catch (error) {
              console.error('查询密钥记录失败:', error)
              return { data: [], error }
            }
          })(),
          
          // 3. AI使用记录 - 🔥 保留完整数据，包括token_usage
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

        // 🔥 调试：检查查询结果
        console.log('查询结果:', {
          用户信息: !!profileResult.data,
          密钥记录数: allKeysResult.data?.length || 0,
          AI记录数: aiUsageResult.data?.length || 0,
          游戏记录数: gameHistoriesResult.data?.length || 0
        })

        // 返回数据，确保字段名与前端类型定义匹配
        return NextResponse.json({
          success: true,
          data: {
            // profiles 表字段
            id: profileResult.data?.id,
            email: profileResult.data?.email,
            nickname: profileResult.data?.nickname,
            full_name: profileResult.data?.full_name,
            avatar_url: profileResult.data?.avatar_url,
            bio: profileResult.data?.bio,
            preferences: profileResult.data?.preferences,
            account_expires_at: profileResult.data?.account_expires_at,
            last_login_at: profileResult.data?.last_login_at,
            last_login_session: profileResult.data?.last_login_session,
            access_key_id: profileResult.data?.access_key_id,
            created_at: profileResult.data?.created_at,
            updated_at: profileResult.data?.updated_at,
            
            // 🔥 关键：使用复数形式，返回所有密钥记录
            accessKeys: allKeysResult.data || [],
            // 🔥 关键：保留完整的AI使用记录数据，包括token_usage
            aiUsageRecords: aiUsageResult.data || [],
            gameHistory: gameHistoriesResult.data || []
          }
        })

      } catch (error: any) {
        console.error('用户详情查询失败:', error)
        return NextResponse.json(
          { 
            success: false, 
            error: '获取用户详情失败',
            details: error.message
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

        // 获取搜索和筛选参数
        const search = searchParams.get('search')
        const filter = searchParams.get('filter')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = (page - 1) * limit

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
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(searchParams.get('limit') || '20'))
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