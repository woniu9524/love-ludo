"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Shuffle, Key } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRandom, setIsRandom] = useState(false);
  // 状态名称也稍作优化，更贴切
  const [licenseKey, setLicenseKey] = useState("");
  const router = useRouter();

  const generateRandomAccount = () => {
    const randomStr = Math.random().toString(36).substring(2, 11);
    const randomEmail = `user_${randomStr}@example.com`;
    const randomPass =
      Math.random().toString(36).substring(2, 14) +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    setEmail(randomEmail);
    setPassword(randomPass);
    setIsRandom(true);
    // *** 重要修改：此处已删除自动填充测试密钥的代码 ***
    // 仅生成随机账号，不提供密钥，用户必须自行购买。
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // 验证密钥（必填）
    if (!licenseKey.trim()) {
      setError('请输入有效的产品密钥');
      setIsLoading(false);
      return;
    }

    try {
      const signUpResponse = await fetch('/api/auth/signup-with-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          keyCode: licenseKey.trim().toUpperCase(),
        }),
      });

      // ============ 核心修复：在解析JSON前先检查状态 ============
      // 1. 检查HTTP响应状态码（404, 500等）
      if (!signUpResponse.ok) {
        // 2. 检查服务器返回的是什么类型的内容
        const contentType = signUpResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // 如果是JSON，解析它并抛出错误消息
          const errorData = await signUpResponse.json();
          throw new Error(errorData.error || `注册失败 (${signUpResponse.status})`);
        } else {
          // 如果不是JSON（比如404的HTML页面），读取文本内容
          const errorText = await signUpResponse.text();
          // 简化和净化错误文本，避免显示整个HTML
          const cleanError = errorText.includes('404') 
            ? '注册接口未找到(404)，请联系管理员检查服务状态。' 
            : `服务器错误 (${signUpResponse.status}): ${errorText.substring(0, 100)}...`;
          throw new Error(cleanError);
        }
      }
      // ============ 核心修复结束 ============

      // 3. 只有状态码是200-299时，才安全地解析JSON
      const result = await signUpResponse.json();

      // ============ 您的原有成功逻辑（完全保留） ============
      try {
        let attempts = 0;
        while (attempts < 5) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) break;
          await new Promise((r) => setTimeout(r, 250));
          attempts++;
        }
      } catch {}
      try {
        localStorage.setItem(
          "account_credentials",
          JSON.stringify({ email, password })
        );
      } catch {}
      try {
        const res = await fetch("/api/seed-default-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          console.warn("seed-default-tasks failed", await res.text());
        }
      } catch {}
      if (isRandom) {
        router.replace("/lobby");
      } else {
        router.replace("/login");
      }
    } catch (error: unknown) {
      // 这里捕获到的错误信息现在会是清晰的中文提示，而不是"Unexpected end of JSON input"
      setError(error instanceof Error ? error.message : "注册过程中发生未知错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("", className)} {...props}>
      <form onSubmit={handleSignUp} className="space-y-4">
        {/* === 修改：文字全部从"邀请码"改为"密钥" === */}
        <div>
          <Label htmlFor="licenseKey" className="block text-sm text-gray-300 mb-2">
            产品密钥 <span className="text-red-500">*</span>
          </Label>
          <div className="glass rounded-xl p-3 flex items-center space-x-2">
            <Key className="w-5 h-5 text-gray-400" />
            <Input
              id="licenseKey"
              type="text"
              placeholder="请输入您购买的产品密钥（如：XY-30-ABC123）"
              required
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {/* 提示文字也同步修改，强调购买 */}
          <p className="text-xs text-gray-500 mt-2 pl-1">
            本游戏为会员制，需购买密钥方可注册。请前往淘宝店铺《希夷书斋》购买，或联系微信客服: xiyi1397。
          </p>
        </div>

        {/* 以下原有部分保持不变 */}
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
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <Button
          type="button"
          onClick={generateRandomAccount}
          className="w-full glass py-3 rounded-xl font-medium hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
        >
          <Shuffle className="w-4 h-4" />
          <span>生成随机邮箱和密码</span>
        </Button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full gradient-primary py-3.5 rounded-xl font-semibold glow-pink transition-all hover:scale-105 active:scale-95 mt-6 text-white"
        >
          {isLoading ? "注册中，需要等待几十秒，注册完成后可尝试刷新页面..." : "注册"}
        </Button>
      </form>
    </div>
  );
}
