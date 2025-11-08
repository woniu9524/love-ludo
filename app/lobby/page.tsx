import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { listAvailableThemes, createRoom, joinRoom } from "./actions";
import { Users, LogIn, Layers, ChevronDown, Hash, Github } from "lucide-react";
import PreferencesModal from "@/components/profile/preferences-modal";
import Link from "next/link";

export default async function LobbyPage({ searchParams }: { searchParams?: { error?: string } }) {
  const { data: themes } = await listAvailableThemes();
  const errorMessage = searchParams?.error ?? "";
  return (
    <>
      {/* 首次进入首页时的偏好设置弹窗（仅登录用户，且偏好未完善时提示） */}
      <PreferencesModal />
      <div className="max-w-md mx-auto min-h-svh flex flex-col p-6 pb-24">
        {/* 顶部提示小字 */}
        <p className="text-xs text-white/60 text-center mb-2">
          将网站添加到主屏幕可以获得近似app的体验哦~
        </p>
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h2 className="text-2xl font-bold">首页</h2>
            <p className="text-sm text-gray-400 mt-1">找到你的对手，开始游戏</p>
          </div>
          <Link
            href="https://github.com/woniu9524/love-ludo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center hover:bg-white/90 transition-all"
            aria-label="GitHub 仓库"
          >
            <Github className="w-5 h-5 text-black" />
          </Link>
        </div>

        <div className="space-y-6">
          {errorMessage && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur p-4 text-sm text-red-300">
              {errorMessage}
            </div>
          )}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">创建房间</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">创建一个新的游戏房间，邀请你的另一半加入</p>

            <form action={createRoom} className="space-y-4">
              <div>
                <Label className="block text-sm text-gray-300 mb-2">选择主题</Label>
                <div className="glass rounded-xl p-3 flex items-center space-x-2 relative">
                  <Layers className="w-5 h-5 text-gray-400" />
                  <select
                    id="player1_theme_id"
                    name="player1_theme_id"
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm cursor-pointer appearance-none"
                    required
                  >
                    <option value="" className="bg-gray-800">请选择游戏主题</option>
                    {themes.map((t) => (
                      <option key={t.id} value={t.id} className="bg-gray-800">
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary py-3.5 rounded-xl font-semibold glow-pink transition-all hover:scale-105 active:scale-95 text-white"
              >
                创建房间
              </Button>
            </form>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
                <LogIn className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">加入房间</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">输入房间码加入已有的游戏</p>

            <form action={joinRoom} className="space-y-4">
              <div>
                <Label className="block text-sm text-gray-300 mb-2">选择主题</Label>
                <div className="glass rounded-xl p-3 flex items-center space-x-2 relative">
                  <Layers className="w-5 h-5 text-gray-400" />
                  <select
                    id="player2_theme_id"
                    name="player2_theme_id"
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm cursor-pointer appearance-none"
                    required
                  >
                    <option value="" className="bg-gray-800">请选择游戏主题</option>
                    {themes.map((t) => (
                      <option key={t.id} value={t.id} className="bg-gray-800">
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label className="block text-sm text-gray-300 mb-2">房间码</Label>
                <div className="glass rounded-xl p-3 flex items-center space-x-2">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <Input
                    id="room_code"
                    name="room_code"
                    type="text"
                    placeholder="请输入6位房间码"
                    maxLength={6}
                    required
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full glass py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-all active:scale-95"
              >
                加入房间
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}