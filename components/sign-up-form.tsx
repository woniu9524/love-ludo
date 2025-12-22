"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Shuffle, Key } from "lucide-react";

// 🔥 简单的延迟函数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  const [licenseKey, setLicenseKey] = useState("");

  const generateRandomAccount = () => {
    const randomStr = Math.random().toString(36).substring(2, 11);
    const randomEmail = `user_${randomStr}@example.com`;
    const randomPass =
      Math.random().toString(36).substring(2, 14) +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    setEmail(randomEmail);
    setPassword(randomPass);
    setIsRandom(true);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

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
        credentials: 'include', // 🔥 重要：包含Cookie
      });

      if (!signUpResponse.ok) {
        const contentType = signUpResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await signUpResponse.json();
          throw new Error(errorData.error || `注册失败 (${signUpResponse.status})`);
        } else {
          const errorText = await signUpResponse.text();
          const cleanError = errorText.includes('404') 
            ? '注册接口未找到(404)，请联系管理员检查服务状态。' 
            : `服务器错误 (${signUpResponse.status}): ${errorText.substring(0, 100)}...`;
          throw new Error(cleanError);
        }
      }

      const result = await signUpResponse.json();

      // 🔥 简化的自动登录处理逻辑
      setError('✅ 注册成功！正在处理登录...');
      
      // 等待2秒，让Cookie和会话完全设置
      await sleep(2000);
      
      try {
        // 首先尝试使用getUser验证是否已经登录
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.log('getUser失败，尝试signInWithPassword:', userError);
          throw userError;
        }
        
        if (user) {
          // 已经自动登录成功
          setError('✅ 登录成功！正在跳转到游戏大厅...');
          setIsLoading(false);
          
          setTimeout(() => {
            window.location.href = '/lobby';
          }, 1000);
        } else {
          // 没有自动登录，尝试手动登录
          throw new Error('需要手动登录');
        }
      } catch (loginError) {
        console.log('自动登录失败，尝试手动登录:', loginError);
        
        // 尝试手动登录
        const { data: loginData, error: manualLoginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        
        if (manualLoginError) {
          console.error('手动登录失败:', manualLoginError);
          
          // 所有登录尝试都失败，跳转到登录页预填邮箱
          setError('✅ 注册成功！请使用刚才的邮箱和密码登录');
          setIsLoading(false);
          
          setTimeout(() => {
            window.location.href = `/login?email=${encodeURIComponent(email.trim())}&from=signup`;
          }, 1500);
        } else {
          // 手动登录成功
          setError('✅ 登录成功！正在跳转到游戏大厅...');
          setIsLoading(false);
          
          setTimeout(() => {
            window.location.href = '/lobby';
          }, 1000);
        }
      }
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "注册过程中发生未知错误");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("", className)} {...props}>
      <form onSubmit={handleSignUp} className="space-y-4">
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
          <p className="text-xs text-gray-500 mt-2 pl-1">
            本游戏为会员制，需购买密钥方可注册。请前往淘宝店铺《希夷书斋》购买，或联系微信客服: xiyi1397。
          </p>
        </div>

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
