// /app/components/themes/delete-theme-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteTheme } from '@/app/themes/actions';
import { useRouter } from 'next/navigation';
import Portal from '@/components/ui/portal';

interface DeleteThemeButtonProps {
  themeId: string;
  themeTitle: string;
  onDelete?: () => void;
}

export default function DeleteThemeButton({ themeId, themeTitle, onDelete }: DeleteThemeButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ESC键关闭弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDialog) {
        setShowDialog(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showDialog]);

  // 阻止背景滚动
  useEffect(() => {
    if (showDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showDialog]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setShowDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('id', themeId);
      await deleteTheme(formData);
      
      setShowDialog(false);
      
      if (onDelete) {
        onDelete();
      }
      
      router.refresh();
      
    } catch (error: any) {
      setError(error.message || '删除失败，请重试');
      console.error('删除主题失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setError(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <>
      {/* 删除按钮 - 阻止事件冒泡 */}
      <Button
        onClick={handleDeleteClick}
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        aria-label="删除主题"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* 使用 Portal 渲染弹窗到 body 层级 */}
      {showDialog && (
        <Portal>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={handleOverlayClick}
            style={{
              zIndex: 9999,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {/* 弹窗内容 */}
            <div 
              className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                zIndex: 10000,
                maxHeight: '90vh',
                overflowY: 'auto',
                margin: 'auto',
                animation: 'fadeIn 0.2s ease-out forwards',
              }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors z-10"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>

              {/* 弹窗头部 */}
              <div className="p-6 pb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">确认删除</h3>
                    <p className="text-gray-300 text-sm">
                      确定要删除主题 <span className="text-red-300 font-semibold">"{themeTitle}"</span> 吗？
                    </p>
                  </div>
                </div>
              </div>

              {/* 警告信息 */}
              <div className="px-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-red-300 font-medium mb-1">此操作不可撤销！</p>
                      <ul className="text-xs text-red-400/80 space-y-1">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>将删除该主题下的所有任务</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>删除后无法恢复</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>如有重要内容，请先备份</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center text-red-400">
                    <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* 弹窗底部 - 操作按钮 */}
              <div className="p-6 pt-4 border-t border-gray-700/50 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-gray-600 hover:bg-white/5 text-gray-300 hover:text-white"
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      删除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      确认删除
                    </>
                  )}
                </Button>
              </div>

              {/* 键盘快捷键提示 */}
              <div className="px-6 pb-4">
                <div className="text-center text-xs text-gray-500">
                  <p>按 <kbd className="px-2 py-1 bg-gray-800 rounded-md text-gray-300">ESC</kbd> 取消</p>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 动画样式 */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
