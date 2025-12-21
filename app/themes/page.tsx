// /app/themes/page.tsx - 移动端优化版本
'use client'; // 改为客户端组件，支持交互逻辑

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Plus, Layers, Edit, Calendar, Hash, Clock, ChevronRight, Sparkles, MoreVertical } from "lucide-react";
import DeleteThemeButton from '@/app/components/themes/delete-theme-button';

// 模拟获取数据 - 你需要根据实际情况调整
export default function ThemesPage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 检测是否移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // 模拟加载数据
    const loadData = async () => {
      // 这里应该是实际的API调用
      // const { data } = await listMyThemes();
      // setThemes(data || []);
      
      // 临时模拟数据
      setTimeout(() => {
        setThemes([
          { id: '1', title: '情侣默契挑战', description: '测试你们之间的默契程度', task_count: 5, created_at: new Date().toISOString() },
          { id: '2', title: '情感升温任务', description: '让感情更加甜蜜的小任务', task_count: 3, created_at: new Date().toISOString() },
        ]);
        setLoading(false);
      }, 500);
    };
    
    loadData();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (longPressTimer) clearTimeout(longPressTimer);
    };
  }, []);

  // 处理主题点击
  const handleThemeClick = (themeId: string, e: React.MouseEvent) => {
    // 如果在桌面端，直接进入详情
    if (!isMobile) {
      router.push(`/themes/${themeId}`);
      return;
    }
    
    // 移动端：第一次点击显示操作按钮，第二次点击进入详情
    if (activeThemeId === themeId) {
      // 第二次点击：进入详情
      router.push(`/themes/${themeId}`);
      setActiveThemeId(null);
    } else {
      // 第一次点击：显示操作按钮
      setActiveThemeId(themeId);
    }
  };

  // 处理长按（移动端）
  const handleLongPressStart = (themeId: string) => {
    if (!isMobile) return;
    
    const timer = setTimeout(() => {
      setActiveThemeId(themeId);
    }, 800); // 800ms长按触发
    
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 处理编辑点击
  const handleEditClick = (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/themes/${themeId}`);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-svh flex flex-col pb-24">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* 移动端优化样式 */
        @media (max-width: 768px) {
          .theme-card {
            transition: all 0.3s ease;
          }
          
          .theme-card.active {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          }
          
          .theme-actions {
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
          }
          
          .theme-card.active .theme-actions {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* 桌面端悬停效果 */
        @media (min-width: 769px) {
          .theme-card:hover .theme-actions {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div className="max-w-md mx-auto min-h-svh flex flex-col pb-24">
        {/* 顶部标题区域 - 移动端优化 */}
        <div className="px-4 pt-6 pb-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">主题库</h2>
            <p className="text-gray-400 text-sm">创建和管理游戏主题</p>
          </div>
          
          {/* 会员状态 - 简化显示 */}
          <div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">会员有效期</span>
              </div>
              <span className="text-sm text-green-400">2024-12-31</span>
            </div>
          </div>
          
          {/* 创建主题按钮 - 移动端优化 */}
          <Link
            href="/themes/new"
            className="flex items-center justify-center space-x-2 w-full h-12 bg-gradient-to-r from-brand-pink to-brand-rose rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all no-underline mb-6"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">创建新主题</span>
          </Link>

          {/* 主题列表 */}
          <div className="space-y-3">
            {themes.length === 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-white/5 rounded-2xl flex items-center justify-center">
                  <Layers className="w-7 h-7 text-white/30" />
                </div>
                <p className="text-white/70 font-medium mb-1">暂无主题</p>
                <p className="text-sm text-white/40 mb-4">点击上方按钮创建你的第一个主题</p>
              </div>
            )}

            {themes.map((t) => (
              <div 
                key={t.id} 
                className={`theme-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 ${
                  activeThemeId === t.id ? 'active bg-white/10 border-white/20' : ''
                }`}
                onClick={(e) => handleThemeClick(t.id, e)}
                onTouchStart={() => handleLongPressStart(t.id)}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={() => isMobile && handleLongPressStart(t.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base text-white mb-1 truncate">{t.title}</h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Hash className="w-3 h-3" />
                        <span>{t.task_count ?? 0} 个任务</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(t.created_at).toLocaleDateString('zh-CN', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 桌面端显示操作按钮 */}
                  {!isMobile && (
                    <div className="theme-actions opacity-0 flex items-center gap-1 ml-2">
                      <Link
                        href={`/themes/${t.id}`}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="编辑主题"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit className="w-3.5 h-3.5 text-white" />
                      </Link>
                      
                      <DeleteThemeButton themeId={t.id} themeTitle={t.title} />
                    </div>
                  )}
                  
                  {/* 移动端始终显示菜单图标 */}
                  {isMobile && !activeThemeId && (
                    <div className="p-1.5 rounded-lg bg-white/5" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {t.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 mt-2">
                    {t.description}
                  </p>
                )}
                
                {/* 移动端操作按钮区域 - 点击卡片后显示 */}
                {isMobile && activeThemeId === t.id && (
                  <div className="theme-actions mt-4 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                      onClick={(e) => handleEditClick(t.id, e)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                      编辑
                    </button>
                    
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeleteThemeButton themeId={t.id} themeTitle={t.title} />
                    </div>
                    
                    <button
                      onClick={() => router.push(`/themes/${t.id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-rose text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      进入详情
                    </button>
                  </div>
                )}
                
                {/* 移动端长按提示 */}
                {isMobile && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {activeThemeId === t.id ? (
                      '点击按钮操作，或点击空白处取消'
                    ) : (
                      '轻点查看详情，长按显示操作'
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 操作说明 */}
          <div className="mt-8 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-brand-pink flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-white mb-2">操作说明</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                    <span>点击主题卡片查看详情</span>
                  </li>
                  {isMobile ? (
                    <>
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                        <span>长按主题卡片显示操作按钮</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                        <span>已激活的卡片可点击按钮操作</span>
                      </li>
                    </>
                  ) : (
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                      <span>鼠标悬停在卡片上显示操作按钮</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
