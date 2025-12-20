import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('[API] 注册请求开始');

  // +++ 新增：在函数开头检查关键环境变量 +++
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[API] 严重错误：缺少Supabase环境变量！', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    return NextResponse.json(
      { 
        error: '服务器配置错误', 
        message: '服务配置不完整，请联系管理员。' 
      },
      { status: 500 }
    );
  }
  // +++ 检查结束 +++

  try {
    // 1. 创建客户端（现在环境变量已确认存在）
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl, // 改用已检查的变量
      supabaseAnonKey,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options); } catch {}
            });
          },
        },
      }
    );
    
    // ... 其余注册逻辑保持不变 ...
    const { email, password, keyCode } = await request.json();
    
    if (!email || !password || !keyCode) {
        return NextResponse.json({ error: '邮箱、密码和密钥均为必填' }, { status: 400 });
    }
    
    // 后续您的业务逻辑...
    // ...
    
  } catch (error: any) {
    console.error('[API] 服务器内部捕获到异常:', error);
    return NextResponse.json(
      { error: `服务器内部错误: ${error.message}` },
      { status: 500 }
    );
  }
}
