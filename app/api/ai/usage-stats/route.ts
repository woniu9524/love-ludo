// /app/api/ai/usage-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // 1. 创建Supabase客户端
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        cookies: { 
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error('设置cookie失败:', error);
            }
          }
        }
      }
    );
    
    // 2. 检查用户登录状态
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 3. 获取今天开始时间（UTC）
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // 4. 获取本月开始时间（UTC）
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    // 5. 查询今日使用次数
    const { count: dailyCount, error: dailyError } = await supabase
      .from('ai_usage_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('success', true)
      .eq('feature', 'generate_tasks')
      .gte('created_at', today.toISOString());

    if (dailyError) {
      console.error('查询每日使用次数失败:', dailyError);
      return NextResponse.json(
        { error: '获取使用统计失败' },
        { status: 500 }
      );
    }

    // 6. 查询本月使用次数
    const { count: monthlyCount, error: monthlyError } = await supabase
      .from('ai_usage_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('success', true)
      .eq('feature', 'generate_tasks')
      .gte('created_at', monthStart.toISOString());

    if (monthlyError) {
      console.error('查询每月使用次数失败:', monthlyError);
      return NextResponse.json(
        { error: '获取使用统计失败' },
        { status: 500 }
      );
    }

    const dailyUsed = dailyCount || 0;
    const monthlyUsed = monthlyCount || 0;

    // 7. 返回使用统计
    return NextResponse.json({
      dailyUsed,
      monthlyUsed,
      dailyRemaining: Math.max(0, 10 - dailyUsed),
      monthlyRemaining: Math.max(0, 120 - monthlyUsed)
    });

  } catch (error: any) {
    console.error('获取AI使用统计失败:', error);
    return NextResponse.json(
      { error: error.message || '获取使用统计失败' },
      { status: 500 }
    );
  }
}
