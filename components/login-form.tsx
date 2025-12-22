// /components/login-form.tsx (安全版本)
// 确保会话更新完成再重定向
"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('redirect') || "/lobby";
  const emailFromUrl = searchParams.get("email");
  const fromSignup = searchParams.get("from") === "signup";

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();

      console.log("[LoginForm] 尝试登录:", email.trim());

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        console.error("[LoginForm] 登录失败:", authError.message);
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('邮箱或密码错误');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('邮箱未验证，请检查收件箱');
        } else {
          throw new Error(`登录失败: ${authError.message}`);
        }
      }

      console.log("[LoginForm] 登录成功，更新会话标识");

      // 🔥 关键修复：同步更新会话标识
      if (data?.user && data?.session) {
        try {
          const sessionFingerprint = `sess_${data.user.id}_${data.session.access_token.substring(0, 12)}`;

          console.log("[LoginForm] 设置会话标识:", sessionFingerprint);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              last_login_session: sessionFingerprint,
              last_login_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('[登录] 更新会话记录失败:', updateError);
          } else {
            console.log('[登录] 会话标识更新完成');
          }
        } catch (sessionErr) {
          console.error('[登录] 处理会话时异常:', sessionErr);
        }
      }

      // 显示成功消息
      setSuccessMessage("✅ 登录成功！");

      // 🔥 确保有足够时间让数据库更新传播
      setTimeout(() => {
        console.log('✅ 重定向到:', redirectTo);
        window.location.href = redirectTo;
      }, 500); // 500ms延迟确保状态同步

    } catch (error: unknown) {
      console.error("[LoginForm] 登录异常:", error);
      setError(error instanceof Error ? error.message : "登录失败，请重试");
      setIsLoading(false);
    }
  };

  // ... UI部分保持不变
  return (
    <div className={cn("", className)} {...props}>
      <form onSubmit={handleLogin} className="space-y-4">
        {/* 注册成功提示 */}
        {fromSignup && !successMessage && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur p-4">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">注册成功！</span>
            </div>
            <p className="text-sm text-green-400/80 mt-1">
              请使用您设置的密码登录
            </p>
          </div>
        )}

        {/* 登录成功提示 */}
        {successMessage && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur p-4">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <p className="text-sm text-green-400/80 mt-1">
              正在跳转到游戏大厅...
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="email" className="block text-sm text-gray-300 mb-2">
            邮箱
          </Label>
          <div className="glass rounded-xl p-3 flex items-center space-x-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!successMessage}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="block text-sm text-gray-300 mb-2">
            密码
          </Label>
          <div className="glass rounded-xl p-3 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="请输入密码"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || !!successMessage}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || !!successMessage}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && !successMessage && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur p-4">
            <div className="flex items-center text-red-300">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !!successMessage}
          className="w-full gradient-primary py-3.5 rounded-xl font-semibold glow-pink transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 text-white"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              登录中...
            </span>
          ) : successMessage ? (
            <span className="flex items-center justify-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              登录成功
            </span>
          ) : (
            "登录"
          )}
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            忘记密码？{" "}
            <Link
              href="#"
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={(e) => {
                e.preventDefault();
                setError("请联系客服 xiyi1397 重置密码");
              }}
            >
              联系客服
            </Link> {/* 这里改为 </Link> */}
          </p>
        </div>
      </form>
    </div>
  );
}
