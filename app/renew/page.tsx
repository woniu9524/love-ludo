// /app/renew/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CalendarDays, Key, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RenewPage() {
  const router = useRouter();
  const supabase = createClient();
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{
    email: string;
    account_expires_at: string | null;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 1. 获取当前用户信息和有效期
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('email, account_expires_at')
        .eq('id', session.user.id)
        .single();

      setUserProfile(data);
      setIsChecking(false);
    };
    fetchProfile();
  }, [supabase, router]);

  // 2. 处理续费提交
  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/renew-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyCode: licenseKey.trim().toUpperCase() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '续费失败');
      }

      // 续费成功
      setMessage({ type: 'success', text: result.message });
      setLicenseKey(''); // 清空输入框
      
      // 刷新用户信息
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('email, account_expires_at')
          .eq('id', session.user.id)
          .single();
        setUserProfile(data);
      }

      // 3秒后自动返回个人中心
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 计算剩余天数
  const calculateRemainingDays = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  if (isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  const isExpired = userProfile?.account_expires_at
    ? new Date(userProfile.account_expires_at) < new Date()
    : true; // 如果没有有效期，也视为过期

  return (
    <div className="container max-w-4xl mx-auto p-4 py-8 md:py-12 space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-pink to-brand-rose bg-clip-text text-transparent">
          账号续费中心
        </h1>
        <p className="text-gray-400">延长您的游戏体验时间</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：账号状态与续费表单 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 账号状态卡片 */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                当前账号状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">登录邮箱</span>
                  <span className="font-medium">{userProfile?.email || '未获取'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">当前有效期至</span>
                  <span className={`font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                    {userProfile?.account_expires_at
                      ? new Date(userProfile.account_expires_at).toLocaleDateString('zh-CN')
                      : '未设置或已过期'}
                  </span>
                </div>
                {userProfile?.account_expires_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">剩余天数</span>
                    <span className="font-medium">
                      {calculateRemainingDays(userProfile.account_expires_at)} 天
                    </span>
                  </div>
                )}
              </div>
              {isExpired && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-300 font-medium">您的账号已过期</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      续费后即可立即恢复所有游戏功能。
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 续费表单卡片 */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                输入新密钥以续费
              </CardTitle>
              <CardDescription>
                请在下方输入您新购买的密钥。续费后有效期将累加。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRenew} className="space-y-4">
                {message && (
                  <div className={`p-3 rounded-lg flex items-start gap-2 ${
                    message.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{message.text}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="licenseKey">产品密钥</Label>
                  <Input
                    id="licenseKey"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="请输入您购买的产品密钥，格式如：XY-30-ABC123"
                    required
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gradient-primary text-white"
                >
                  {isLoading ? '验证并续费中...' : '立即续费'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：购买指引 */}
        <div className="space-y-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>如何获取密钥？</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-brand-pink/20 text-brand-pink rounded-lg p-2">
                    1
                  </div>
                  <div>
                    <p className="font-medium">访问官方店铺</p>
                    <p className="text-sm text-gray-400 mt-1">
                      前往淘宝店铺《希夷书斋》选择套餐并购买。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-brand-rose/20 text-brand-rose rounded-lg p-2">
                    2
                  </div>
                  <div>
                    <p className="font-medium">获取密钥</p>
                    <p className="text-sm text-gray-400 mt-1">
                      付款后，您将收到唯一的产品密钥。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/20 text-purple-400 rounded-lg p-2">
                    3
                  </div>
                  <div>
                    <p className="font-medium">输入续费</p>
                    <p className="text-sm text-gray-400 mt-1">
                      在本页面输入密钥，有效期将立即延长。
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href="https://shop.xiyi.asia" // 请替换为你的实际店铺链接
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    前往淘宝店铺购买
                  </Link>
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  或联系微信客服: <span className="text-brand-pink">xiyi1397</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 套餐价格表 */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>套餐价格</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { days: 1, price: '¥0.99', desc: '体验卡' },
                  { days: 7, price: '¥5.99', desc: '周卡' },
                  { days: 30, price: '¥12.99', desc: '月卡' },
                  { days: 90, price: '¥35.99', desc: '季卡' },
                  { days: 180, price: '¥60.99', desc: '半年卡' },
                  { days: 365, price: '¥99.99', desc: '年卡' },
                ].map((pkg) => (
                  <div
                    key={pkg.days}
                    className="flex justify-between items-center p-2 rounded hover:bg-white/5"
                  >
                    <div>
                      <span className="font-medium">{pkg.days}天{pkg.desc}</span>
                    </div>
                    <span className="text-brand-pink font-bold">{pkg.price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
