// /app/themes/page.tsx - 优化版本
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from "next/link";
import { listMyThemes } from "./actions";
import { Plus, Layers, Edit, Calendar, Hash, Clock, ChevronRight, Sparkles } from "lucide-react";
import DeleteThemeButton from '@/app/components/themes/delete-theme-button';

// 辅助函数：从JWT中解析创建时间（安全版本）
function getJwtCreationTime(jwt: string): Date | null {
  try {
    const payloadBase64 = jwt.split('.')[1];
    if (!payloadBase64) return null;
    
    let payloadJson: string;
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    
    if (typeof Buffer !== 'undefined') {
      payloadJson = Buffer.from(paddedBase64, 'base64').toString();
    } else {
      payloadJson = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }
    
    const payload = JSON.parse(payloadJson);
    if (payload.iat) {
      return new Date(payload.iat * 1000);
    }
    
    return null;
  } catch (error) {
    console.error('解析JWT失败:', error);
    return null;
  }
}

export default async function ThemesPage() {
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
    redirect('/login');
  }
  
  // 3. 获取当前会话
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (!currentSession) {
    await supabase.auth.signOut();
    redirect('/login?error=no_session');
  }
  
  // 4. 获取用户资料（包括会话信息和有效期）
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_expires_at, last_login_at, last_login_session')
    .eq('id', user.id)
    .single();
  
  if (!profile) {
    redirect('/login?error=profile_not_found');
  }
  
  // 5. 检查会员有效期
  const isExpired = !profile?.account_expires_at || new Date(profile.account_expires_at) < new Date();
  if (isExpired) {
    redirect('/account-expired');
  }
  
  // ============ 【严格的多设备登录验证】 ============
  // 从JWT中解析会话创建时间
  const sessionCreatedTime = getJwtCreationTime(currentSession.access_token);
  const lastLoginTime = profile.last_login_at ? new Date(profile.last_login_at) : null;
  
  // 添加3秒容差，避免由于时间同步或处理延迟导致的误判
  const tolerance = 3000; // 3秒
  
  if (lastLoginTime && sessionCreatedTime) {
    // 计算时间差（毫秒）
    const timeDiff = lastLoginTime.getTime() - sessionCreatedTime.getTime();
    
    // 如果最后登录时间比会话创建时间晚（超过容差），说明有新登录
    if (timeDiff > tolerance) {
      console.log(`[主题页面] 检测到新登录，强制退出用户: ${user.email}`);
      console.log(`  - JWT会话创建时间: ${sessionCreatedTime.toISOString()}`);
      console.log(`  - 最后登录时间: ${lastLoginTime.toISOString()}`);
      console.log(`  - 时间差: ${timeDiff}ms`);
      
      // 强制退出当前会话
      await supabase.auth.signOut();
      
      // 重定向到专门的过期提示页面
      const userEmail = user.email || '';
      const lastLoginTimeStr = lastLoginTime.toISOString();
      
      redirect(`/login/expired?email=${encodeURIComponent(userEmail)}&last_login_time=${encodeURIComponent(lastLoginTimeStr)}`);
    }
  }
  
  // 6. 可选的：记录当前登录到日志（用于调试）
  console.log(`[主题页面] 用户 ${user.email} 会话验证通过`);
  console.log(`  - JWT会话创建时间: ${sessionCreatedTime ? sessionCreatedTime.toISOString() : '无法解析'}`);
  console.log(`  - 最后登录时间: ${lastLoginTime ? lastLoginTime.toISOString() : '无记录'}`);
  console.log(`  - 会话标识: ${profile.last_login_session || '无标识'}`);
  // ============ 会话验证结束 ============
  
  // 7. 原有的业务逻辑 - 获取主题数据
  const { data: themes } = await listMyThemes();

  // 计算会员剩余天数
  const calculateRemainingDays = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const remainingDays = profile?.account_expires_at ? 
    calculateRemainingDays(profile.account_expires_at) : 0;

  return (
    <>
      <div className="max-w-md mx-auto min-h-svh flex flex-col pb-24">
        {/* 顶部标题区域 - 优化设计 */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">主题库</h2>
              <p className="text-gray-400 text-sm">创建和管理游戏主题</p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink/20 to-brand-rose/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-pink" />
              </div>
            </div>
          </div>
          
          {/* 会员状态卡片 - 优化设计 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-lg border border-gray-700/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">会员有效期</p>
                  <p className="text-lg font-semibold text-white">
                    {profile?.account_expires_at ? 
                      new Date(profile.account_expires_at).toLocaleDateString('zh-CN') : 
                      '未设置'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full ${remainingDays > 7 ? 'bg-green-500/20 text-green-400' : remainingDays > 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  <span className="text-sm font-medium">
                    {remainingDays > 0 ? `剩余${remainingDays}天` : '已过期'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 创建主题按钮 - 优化设计 */}
          <Link
            href="/themes/new"
            className="group relative flex items-center justify-center space-x-2 w-full h-14 bg-gradient-to-r from-brand-pink via-brand-rose to-brand-pink rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] no-underline mb-8 overflow-hidden"
          >
            {/* 背景动画 */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-pink/0 via-white/10 to-brand-pink/0 group-hover:translate-x-full transition-transform duration-700"></div>
            
            <div className="relative flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold text-base">创建新主题</span>
            </div>
          </Link>

          {/* 主题列表标题 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">我的主题</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 px-2 py-1 bg-white/5 rounded-lg">
                共 {themes.length} 个主题
              </span>
            </div>
          </div>

          {/* 主题列表 */}
          <div className="space-y-4">
            {themes.length === 0 && (
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 text-center overflow-hidden">
                {/* 装饰元素 */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-brand-pink/5 to-brand-rose/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-rose/5 to-brand-pink/5 rounded-full translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl flex items-center justify-center">
                    <Layers className="w-10 h-10 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">还没有主题</h4>
                  <p className="text-gray-400 mb-6">创建一个主题，开始设计游戏任务吧</p>
                  <Link
                    href="/themes/new"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-brand-pink to-brand-rose text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    <span>立即创建</span>
                  </Link>
                </div>
              </div>
            )}

            {themes.map((t) => (
              <div 
                key={t.id} 
                className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600/50 transition-all duration-300 group hover:shadow-xl hover:scale-[1.02]"
              >
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/5 via-transparent to-brand-rose/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                
                {/* 操作按钮 - 优化设计 */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex items-center gap-2">
                  <Link
                    href={`/themes/${t.id}`}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                    aria-label="编辑主题"
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </Link>
                  
                  {/* 删除按钮 */}
                  <DeleteThemeButton themeId={t.id} themeTitle={t.title} />
                </div>
                
                {/* 主题内容 */}
                <Link 
                  href={`/themes/${t.id}`}
                  className="block no-underline relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-12">
                      <h4 className="text-lg font-bold text-white mb-1 truncate group-hover:text-brand-pink transition-colors">{t.title}</h4>
                      {t.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mt-2">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* 统计信息 */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t.task_count ?? 0} 个任务</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">
                          {new Date(t.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    
                    {/* 查看详情按钮 */}
                    <div className="flex items-center space-x-1 text-brand-pink">
                      <span className="text-sm font-medium">查看详情</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          {/* 底部提示信息 */}
          {themes.length > 0 && (
            <div className="mt-8">
              <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">使用提示</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• 鼠标悬停在主题卡片上可以显示操作按钮</li>
                      <li>• 点击"查看详情"可以编辑主题和任务</li>
                      <li>• 删除主题会同时删除该主题下的所有任务</li>
                      <li>• 每个主题最多可添加20个任务</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
