// /app/debug/page.tsx - 临时调试页面
import { createClient } from '@/lib/supabase/server';

export default async function DebugPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = user ? adminEmails.includes(user.email || '') : false;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 调试信息 - Love Ludo</h1>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>📊 用户状态</h3>
        <pre>
          登录状态: {user ? '✅ 已登录' : '❌ 未登录'}
          用户邮箱: {user?.email || '无'}
          用户ID: {user?.id || '无'}
          错误信息: {error?.message || '无'}
        </pre>
        
        <h3>⚙️ 环境变量</h3>
        <pre>
          ADMIN_EMAILS: {process.env.ADMIN_EMAILS || '未设置'}
          是否管理员: {isAdmin ? '✅ 是' : '❌ 否'}
        </pre>
        
        <h3>🔗 测试链接</h3>
        <ul>
          <li><a href="/admin">测试访问后台</a></li>
          <li><a href="/login">登录页面</a></li>
          <li><a href="/lobby">游戏大厅（需登录）</a></li>
        </ul>
      </div>
    </div>
  );
}
