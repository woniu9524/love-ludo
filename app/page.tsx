import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Github } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 已登录则直接进入大厅
  if (user) {
    redirect("/lobby");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 顶部提示小字 */}
      <div className="absolute top-3 left-0 right-0 flex justify-center">
        <p className="text-xs text-white/60">
          将网站添加到主屏幕可以获得近似app的体验哦~
        </p>
      </div>
      {/* 顶部右侧 GitHub 链接 */}
      <div className="absolute top-3 right-3">
        <a
          href="https://github.com/woniu9524/love-ludo"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
          aria-label="GitHub 仓库"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
      {/* 背景装饰 - 更柔和 */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-[100px] opacity-20 bg-gradient-to-br from-[#FF6B9D] to-[#8B5A8E]" />
      </div>

      <section className="w-full max-w-sm text-center space-y-8">
        {/* 徽章 - 简化样式 */}
        <div className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium bg-white/5 backdrop-blur-xl border border-white/10">
          Love Game
        </div>

        {/* 标题 - 更大留白 */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
            一起玩一盘
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF6B9D] to-[#8B5A8E]">
              甜甜的飞行棋
            </span>
          </h1>
          <p className="text-base text-white/50 font-light">
            双主题任务 · 实时对战 · AI 生成
          </p>
        </div>

        {/* 按钮 - 更圆润 */}
        <div className="pt-4">
          <Button 
            asChild 
            size="lg" 
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#8B5A8E] text-white text-base font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/login">快速开始</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
