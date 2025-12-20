import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: '测试API工作正常',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST方法也正常',
    timestamp: new Date().toISOString()
  });
}
