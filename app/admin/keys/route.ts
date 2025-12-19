// /app/api/admin/keys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 生成随机密钥的函数
function generateKeyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉了容易混淆的字符
  let result = 'CPFLY-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET：获取所有密钥
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase
    .from('access_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST：创建新密钥
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  const keyCode = generateKeyCode();

  const { data, error } = await supabase
    .from('access_keys')
    .insert({
      key_code: keyCode,
      description: body.description,
      max_uses: body.maxUses,
      account_valid_for_days: body.validDays,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
