// /app/admin/page.tsx - 修复版本（移除useSearchParams）
import { Suspense } from 'react';
import AdminLoginWrapper from '@/components/admin/login-wrapper';

export default async function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Love Ludo 管理后台</h1>
          <p className="text-gray-600 mt-2">系统管理员专用登录通道</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 使用Suspense包装客户端组件 */}
          <Suspense fallback={<div className="text-center py-4">加载登录表单...</div>}>
            <AdminLoginWrapper />
          </Suspense>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                普通用户请前往{' '}
                <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                  游戏大厅
                </a>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                © {new Date().getFullYear()} 希夷游戏 · Love Ludo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
