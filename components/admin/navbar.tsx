// /components/admin/navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Menu, X, LogOut, Home } from 'lucide-react';

export default function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      await supabase.auth.signOut();
      window.location.href = '/admin';
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <>
      {/* 桌面导航 */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center">
                <span className="text-xl font-bold text-blue-600">Love Ludo</span>
                <span className="ml-2 text-sm text-gray-500">后台管理</span>
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-600">
                  仪表板
                </Link>
                <Link href="/admin/keys" className="text-gray-700 hover:text-blue-600">
                  密钥管理
                </Link>
                <Link href="/admin/users" className="text-gray-700 hover:text-blue-600">
                  用户管理
                </Link>
                <Link href="/admin/ai-usage" className="text-gray-700 hover:text-blue-600">
                  AI统计
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-1" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端导航 */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50 md:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center">
              <span className="text-lg font-bold text-blue-600">管理后台</span>
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* 移动端菜单 */}
          {isMenuOpen && (
            <div className="mt-4 space-y-2 pb-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-5 h-5 mr-3" />
                仪表板
              </Link>
              <Link
                href="/admin/keys"
                className="flex items-center p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                密钥管理
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.205a21.001 21.001 0 01-13.5 4.404" />
                </svg>
                用户管理
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center w-full p-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                <LogOut className="w-5 h-5 mr-3" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
