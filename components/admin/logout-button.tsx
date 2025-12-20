// /components/admin/logout-button.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // 使用动态导入避免服务器组件问题
      const { createBrowserClient } = await import('@supabase/ssr');
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
    >
      退出登录
    </button>
  );
}
