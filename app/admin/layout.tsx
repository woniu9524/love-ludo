// /app/admin/layout.tsx - 修复版本
import { validateAdminSession } from '@/lib/admin/auth';
import AdminNavbar from '@/components/admin/navbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 验证是否是管理员
  const { isAdmin } = await validateAdminSession();
  
  // 如果不是管理员，显示无权限页面
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v-2m0 2h-2m2 0h2m-6-4h.01M12 12h.01M16 12h.01M8 12h.01M7 8h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">无权限访问</h1>
            <p className="text-gray-600 mb-6">
              您没有权限访问后台管理系统。请使用管理员账户登录。
            </p>
            <a
              href="/admin"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              前往管理员登录
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 如果是管理员，显示后台布局
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="pt-16"> {/* 给导航栏留出空间 */}
        {children}
      </div>
    </div>
  );
}
