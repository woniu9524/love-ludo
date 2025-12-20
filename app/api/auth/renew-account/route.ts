import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('续费API被调用');
  return NextResponse.json({ 
    success: true, 
    message: 'API工作正常（测试版）',
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'API已就绪，请使用POST方法',
    timestamp: new Date().toISOString()
  });
}
