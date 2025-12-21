// /app/admin/page.tsx - 最终修复版本
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Key, Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

// 创建内部组件，用于在Suspense中使用useSearchParams
function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin/dashboard';

  // 调试：检查环境变量
  useEffect(() => {
    console.log('🔍 管理员登录页面加载');
    console.log('NEXT_PUBLIC_ADMIN_KEY:', process.env.NEXT_PUBLIC_ADMIN_KEY ? '***已设置***' : '未设置');
    
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo(
        `密钥配置: ${process.env.NEXT_PUBLIC_ADMIN_KEY ? '✅' : '❌'}, ` +
        `重定向目标: ${redirectTo}`
      );
    }
    
    // 强制隐藏底部导航栏
    const hideBottomNav = () => {
      // 方法1：通过类名选择器
      const bottomNavs = document.querySelectorAll('[class*="bottom-nav"], [class*="BottomNav"], [class*="nav"]');
      bottomNavs.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      
      // 方法2：通过包含特定文字的类名
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const className = el.className;
        if (typeof className === 'string' && 
            (className.includes('nav') || className.includes('Nav') || className.includes('bottom'))) {
          (el as HTMLElement).style.display = 'none';
        }
      });
      
      // 方法3：隐藏任何固定在底部的元素
      const fixedBottomElements = document.querySelectorAll('[style*="bottom"], [class*="fixed"], [class*="bottom"]');
      fixedBottomElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    };
    
    // 立即执行一次
    hideBottomNav();
    
    // 延迟再次执行，确保DOM完全加载
    setTimeout(hideBottomNav, 100);
    setTimeout(hideBottomNav, 500);
    setTimeout(hideBottomNav, 1000);
    
    // 监听DOM变化
    const observer = new MutationObserver(hideBottomNav);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 开始管理员登录验证...');
      
      // 1. 验证管理员密钥
      const requiredAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
      
      if (!requiredAdminKey) {
        throw new Error('系统配置错误：管理员密钥未设置');
      }
      
      if (adminKey !== requiredAdminKey) {
        throw new Error('管理员密钥错误');
      }

      console.log('✅ 管理员密钥验证通过');

      // 2. 验证管理员邮箱
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['2200691917@qq.com'];
      const emailLower = email.trim().toLowerCase();
      const isAdmin = adminEmails.some(adminEmail => 
        adminEmail.trim().toLowerCase() === emailLower
      );
      
      if (!isAdmin) {
        throw new Error('非管理员邮箱');
      }
      
      console.log('✅ 管理员邮箱验证通过');

      // 3. 登录 Supabase
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      console.log('✅ Supabase登录成功');

      // ⭐ 关键：设置管理员密钥验证标记cookie
      document.cookie = 'admin_key_verified=true; path=/admin; max-age=86400; SameSite=Strict';
      
      // 等待cookie设置完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('✅ 管理员登录成功，跳转到仪表板');
      router.push(redirectTo);
      router.refresh();

    } catch (err: any) {
      console.error('❌ 管理员登录失败:', err);
      setError(err.message || '登录失败，请检查凭据');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        /* 全局样式：隐藏所有导航栏和底部元素 */
        nav, footer, [role="navigation"], [class*="nav"], [class*="Nav"] {
          display: none !important;
        }
        
        /* 确保页面充满整个屏幕，没有边距 */
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          overflow: auto !important;
        }
        
        /* 强制设置背景 */
        body {
          background: linear-gradient(180deg, #0a0a12 0%, #12101a 50%, #1a0f1f 100%) !important;
          background-attachment: fixed !important;
          min-height: 100vh !important;
        }
        
        /* 隐藏任何可能出现的固定底部元素 */
        .fixed, .sticky, [class*="bottom"], [class*="Bottom"] {
          display: none !important;
        }
      `}</style>
      
      <div className="w-full max-w-md mx-auto">
        {/* 调试信息（仅开发环境显示） */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="mb-3 p-2 bg-slate-800/80 rounded-lg border border-slate-700/50 text-center">
            <p className="text-xs text-slate-400">🔍 {debugInfo}</p>
          </div>
        )}

        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-brand-pink to-brand-rose rounded-2xl md:rounded-3xl mb-3 md:mb-4 shadow-lg">
            <Shield className="w-7 h-7 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-brand-pink via-brand-rose to-brand-pink bg-clip-text text-transparent">
            系统管理员登录
          </h1>
          <p className="text-sm md:text-base text-gray-400">仅限授权管理员访问后台系统</p>
        </div>

        <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6">
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm text-gray-300 mb-1 md:mb-2">
                管理员邮箱
              </label>
              <div className="glass rounded-lg md:rounded-xl p-3 flex items-center space-x-2">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入管理员邮箱"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 text-sm md:text-base"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm text-gray-300 mb-1 md:mb-2">
                密码
              </label>
              <div className="glass rounded-lg md:rounded-xl p-3 flex items-center space-x-2">
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 text-sm md:text-base"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 p-1"
                >
                  {/* 修正：默认不显示密码时用闭眼（有斜杠），显示密码时用睁眼（无斜杠） */}
                  {showPassword ? (
                    <Eye className="w-4 h-4 md:w-5 md:h-5" /> // 显示密码：睁眼（无斜杠）
                  ) : (
                    <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> // 隐藏密码：闭眼（有斜杠）
                  )}
                </button>
              </div>
            </div>

            {/* 管理员密钥输入 */}
            <div>
              <label className="block text-sm text-gray-300 mb-1 md:mb-2">
                管理员密钥
                <span className="text-xs text-gray-500 ml-1">（必须输入正确的密钥）</span>
              </label>
              <div className="glass rounded-lg md:rounded-xl p-3 flex items-center space-x-2">
                <Key className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type={showAdminKey ? "text" : "password"}
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="输入管理员密钥"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 text-sm md:text-base"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey(!showAdminKey)}
                  disabled={loading}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 p-1"
                >
                  {/* 修正：默认不显示密钥时用闭眼（有斜杠），显示密钥时用睁眼（无斜杠） */}
                  {showAdminKey ? (
                    <Eye className="w-4 h-4 md:w-5 md:h-5" /> // 显示密钥：睁眼（无斜杠）
                  ) : (
                    <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> // 隐藏密钥：闭眼（有斜杠）
                  )}
                </button>
              </div>
              <div className="mt-1 md:mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs text-gray-500">
                  联系系统管理员获取密钥
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded self-start sm:self-auto ${
                  process.env.NEXT_PUBLIC_ADMIN_KEY 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {process.env.NEXT_PUBLIC_ADMIN_KEY ? '密钥已配置' : '密钥未配置'}
                </span>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg md:rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur p-3 md:p-4">
                <div className="flex items-start md:items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5 md:mt-0" />
                  <span className="text-sm leading-tight">{error}</span>
                </div>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary py-3 md:py-3.5 rounded-lg md:rounded-xl font-semibold glow-pink transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-white flex items-center justify-center text-sm md:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
                  验证中...
                </>
              ) : (
                '进入后台管理系统'
              )}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10">
            <div className="text-center">
              <Link 
                href="/login" 
                className="text-xs md:text-sm text-brand-pink hover:text-brand-rose transition-colors hover:underline"
              >
                返回普通用户登录
              </Link>
            </div>
          </div>
        </div>

        {/* 版本信息 */}
        <div className="mt-4 md:mt-6 text-center">
          <p className="text-xs text-gray-500">
            Love Ludo 后台管理系统 v1.0 · 希夷游戏
          </p>
        </div>
      </div>
    </>
  );
}

// 加载中组件
function LoadingSpinner() {
  return (
    <>
      <style jsx global>{`
        /* 加载状态时也隐藏导航栏 */
        nav, footer, [role="navigation"], [class*="nav"], [class*="Nav"] {
          display: none !important;
        }
        
        body {
          background: linear-gradient(180deg, #0a0a12 0%, #12101a 50%, #1a0f1f 100%) !important;
          background-attachment: fixed !important;
        }
      `}</style>
      
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-brand-pink to-brand-rose rounded-2xl md:rounded-3xl mb-3 md:mb-4 shadow-lg">
            <Shield className="w-7 h-7 md:w-10 md:h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-brand-pink via-brand-rose to-brand-pink bg-clip-text text-transparent">
            系统管理员登录
          </h1>
          <p className="text-sm md:text-base text-gray-400">加载中...</p>
        </div>
        
        <div className="glass rounded-xl md:rounded-2xl p-6 flex items-center justify-center h-48 md:h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-brand-pink animate-spin mb-3 md:mb-4" />
            <p className="text-sm md:text-base text-gray-400">正在加载登录表单...</p>
          </div>
        </div>
      </div>
    </>
  );
}

// 主组件 - 使用与普通登录页面完全相同的结构
export default function AdminLoginPage() {
  return (
    // 完全使用普通登录页面的外层样式
    <div className="flex min-h-screen w-full items-center justify-center p-3 md:p-4 lg:p-6">
      <style jsx global>{`
        /* 确保整个页面没有导航栏 */
        body {
          overflow: auto !important;
        }
        
        /* 隐藏所有导航相关元素 */
        nav, .nav, .Nav, [class*="bottom"], [class*="Bottom"], footer {
          display: none !important;
        }
        
        /* 确保内容居中 */
        .flex.min-h-screen {
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
      
      <Suspense fallback={<LoadingSpinner />}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
