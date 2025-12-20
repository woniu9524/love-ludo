"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, X, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { bulkInsertTasks } from "@/app/themes/actions";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Suggestion = { description: string; type?: string; order_index?: number };

// 使用统计类型
interface UsageStats {
  dailyUsed: number;
  monthlyUsed: number;
  dailyRemaining: number;
  monthlyRemaining: number;
}

export default function GenerateTasksSection({ themeId, themeTitle, themeDescription, inline = false }: { themeId: string; themeTitle: string; themeDescription?: string | null; inline?: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [customRequirement, setCustomRequirement] = useState("");
  const [preferences, setPreferences] = useState<{ gender?: string; kinks?: string[] }>({});
  const [mounted, setMounted] = useState(false);
  
  // ============ 【新增】使用统计状态 ============
  const [usageStats, setUsageStats] = useState<UsageStats>({
    dailyUsed: 0,
    monthlyUsed: 0,
    dailyRemaining: 10,
    monthlyRemaining: 120
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.preferences) {
          setPreferences(profile.preferences as any);
        }
      }
    };
    fetchPreferences();
    setMounted(true);
  }, []);

  // ============ 【新增】获取使用统计 ============
  const fetchUsageStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/ai/usage-stats");
      if (res.ok) {
        const data = await res.json();
        setUsageStats({
          dailyUsed: data.dailyUsed || 0,
          monthlyUsed: data.monthlyUsed || 0,
          dailyRemaining: Math.max(0, 10 - (data.dailyUsed || 0)),
          monthlyRemaining: Math.max(0, 120 - (data.monthlyUsed || 0))
        });
      }
    } catch (error) {
      console.error("获取使用统计失败:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const openModal = async () => {
    setShowModal(true);
    setError(null);
    setSuggestions([]);
    setSelected({});
    
    // ============ 【新增】打开模态框时获取使用统计 ============
    await fetchUsageStats();
  };

  const closeModal = () => {
    setShowModal(false);
    setCustomRequirement("");
  };

  const generate = async () => {
    // ============ 【新增】检查剩余次数（前端预检查） ============
    if (usageStats.dailyRemaining <= 0) {
      setError("今日AI使用次数已达上限（10次/天），请明天再试");
      return;
    }
    
    if (usageStats.monthlyRemaining <= 0) {
      setError("本月AI使用次数已达上限（120次/月）");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: themeTitle,
          description: themeDescription ?? "",
          preferences,
          customRequirement,
        }),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        // ============ 【新增】处理使用次数限制错误 ============
        if (res.status === 429) {
          setError(json?.error || "使用次数已用完");
          
          // 更新使用统计
          if (json.details) {
            setUsageStats({
              dailyUsed: json.details.daily.used,
              monthlyUsed: json.details.monthly.used,
              dailyRemaining: 10 - json.details.daily.used,
              monthlyRemaining: 120 - json.details.monthly.used
            });
          }
          return;
        }
        
        throw new Error(json?.error || "生成失败");
      }
      
      setSuggestions(json.tasks || []);
      const initialSelection = Object.fromEntries((json.tasks || []).map((_: any, i: number) => [i, true]));
      setSelected(initialSelection);
      
      // ============ 【新增】更新使用统计 ============
      if (json.usage) {
        setUsageStats({
          dailyUsed: json.usage.dailyUsed,
          monthlyUsed: json.usage.monthlyUsed,
          dailyRemaining: json.usage.dailyRemaining,
          monthlyRemaining: json.usage.monthlyRemaining
        });
      }
      
    } catch (e: any) {
      setError(e?.message || "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (idx: number) => {
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const selectAll = () => {
    setSelected(Object.fromEntries(suggestions.map((_, i) => [i, true])));
  };

  const deselectAll = () => {
    setSelected({});
  };

  const saveSelected = async () => {
    const tasks = suggestions
      .map((t, i) => ({ description: t.description, type: "interaction", order_index: i }))
      .filter((_, i) => selected[i]);
    if (tasks.length === 0) {
      setError("请先选择至少一条任务");
      return;
    }
    setError(null);
    startTransition(async () => {
      const { error } = await bulkInsertTasks(themeId, tasks);
      if (error) {
        setError(error);
      } else {
        setSuggestions([]);
        setSelected({});
        closeModal();
      }
    });
  };

  const genderText = preferences.gender === "male" ? "男性" : preferences.gender === "female" ? "女性" : preferences.gender === "non_binary" ? "非二元" : "未设置";
  const kinksText = (preferences.kinks && preferences.kinks.length > 0) ? preferences.kinks.join("、") : "未设置";
  const hasGender = !!preferences.gender;
  const hasKinks = Array.isArray(preferences.kinks) && preferences.kinks.length > 0;
  const preferencesEmpty = !hasGender || !hasKinks;
  
  // ============ 【新增】计算进度条百分比 ============
  const dailyPercentage = Math.min(100, (usageStats.dailyUsed / 10) * 100);
  const monthlyPercentage = Math.min(100, (usageStats.monthlyUsed / 120) * 100);
  
  // ============ 【新增】检查是否接近限制 ============
  const isNearDailyLimit = usageStats.dailyRemaining <= 2;
  const isNearMonthlyLimit = usageStats.monthlyRemaining <= 10;
  const isOverDailyLimit = usageStats.dailyRemaining <= 0;
  const isOverMonthlyLimit = usageStats.monthlyRemaining <= 0;
  const canGenerate = !isOverDailyLimit && !isOverMonthlyLimit;

  return (
    <>
      {inline ? (
        <Button
          type="button"
          onClick={openModal}
          className="gradient-primary glow-pink text-white flex items-center space-x-2"
          disabled={!canGenerate} // 【新增】禁用按钮
        >
          <Sparkles className="w-4 h-4" />
          <span>AI 生成任务</span>
          {isNearDailyLimit && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
              仅剩{usageStats.dailyRemaining}次
            </span>
          )}
        </Button>
      ) : (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-pink" />
              <h3 className="text-lg font-bold">AI 生成任务</h3>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            基于主题和个人偏好，快速生成符合情侣互动的任务列表
          </p>
          
          {/* ============ 【新增】使用统计卡片 ============ */}
          <div className="mb-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">AI使用统计</span>
              <button
                onClick={fetchUsageStats}
                disabled={loadingStats}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3 h-3 text-gray-400 ${loadingStats ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">今日</span>
                  <span className={`text-xs font-medium ${isNearDailyLimit ? 'text-yellow-400' : 'text-green-400'}`}>
                    {usageStats.dailyRemaining}/10
                  </span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      dailyPercentage >= 100 ? 'bg-red-500' : 
                      dailyPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${dailyPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">本月</span>
                  <span className={`text-xs font-medium ${isNearMonthlyLimit ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {usageStats.monthlyRemaining}/120
                  </span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      monthlyPercentage >= 100 ? 'bg-red-500' : 
                      monthlyPercentage >= 90 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${monthlyPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            {isNearDailyLimit && (
              <div className="mt-2 text-xs text-yellow-400 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                今日剩余次数较少
              </div>
            )}
          </div>
          
          <Button
            onClick={openModal}
            className="w-full gradient-primary glow-pink flex items-center justify-center space-x-2"
            disabled={!canGenerate} // 【新增】禁用按钮
          >
            <Sparkles className="w-4 h-4" />
            <span>开始生成</span>
            {isOverDailyLimit && (
              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full ml-2">
                今日已用完
              </span>
            )}
          </Button>
        </div>
      )}

      {showModal && mounted && createPortal((
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass rounded-3xl p-6 max-w-md w-full glow-pink max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">AI 生成任务</h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ============ 【新增】模态框中的使用统计 ============ */}
            <div className="mb-4 p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">剩余次数</span>
                <button
                  onClick={fetchUsageStats}
                  disabled={loadingStats}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 text-gray-400 ${loadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isNearDailyLimit ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {usageStats.dailyRemaining}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">今日剩余</div>
                  <div className="text-xs text-gray-500 mt-1">
                    已用 {usageStats.dailyUsed}/10
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isNearMonthlyLimit ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {usageStats.monthlyRemaining}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">本月剩余</div>
                  <div className="text-xs text-gray-500 mt-1">
                    已用 {usageStats.monthlyUsed}/120
                  </div>
                </div>
              </div>
              {isNearDailyLimit && (
                <div className="mt-3 text-xs text-yellow-400 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  今日剩余次数较少，请合理安排使用
                </div>
              )}
            </div>

            {suggestions.length === 0 ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm font-medium mb-2">当前主题</p>
                    <p className="text-gray-300">{themeTitle}</p>
                    {themeDescription && (
                      <p className="text-sm text-gray-400 mt-1">{themeDescription}</p>
                    )}
                  </div>

                  <div className="glass rounded-xl p-4">
                    <p className="text-sm font-medium mb-2">个人偏好</p>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-300">性别：{genderText}</p>
                      <p className="text-gray-300">兴趣标签：{kinksText}</p>
                    </div>
                    {mounted && preferencesEmpty && (
                      <div className="mt-3">
                        <Link href="/profile" className="text-brand-pink hover:text-pink-300 underline text-xs">
                          去设置偏好以获得更精准的生成
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customRequirement" className="text-sm font-medium">
                      特别需求（可选）
                    </Label>
                    <textarea
                      id="customRequirement"
                      value={customRequirement}
                      onChange={(e) => setCustomRequirement(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm outline-none focus:border-brand-pink transition-all"
                      placeholder="例如：增加户外活动、避免需要高消费的任务、希望有更多情感交流类的内容..."
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={closeModal}
                    variant="outline"
                    className="flex-1 border-white/20 hover:bg-white/10"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={generate}
                    disabled={loading || !canGenerate}
                    className="flex-1 gradient-primary glow-pink"
                  >
                    {loading ? "生成中..." : "生成任务"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-3">
                    已生成 {suggestions.length} 条任务，选择需要保存的任务
                  </p>
                  <div className="flex space-x-2 mb-4">
                    <Button
                      onClick={selectAll}
                      size="sm"
                      variant="outline"
                      className="border-white/20 hover:bg-white/10"
                    >
                      全选
                    </Button>
                    <Button
                      onClick={deselectAll}
                      size="sm"
                      variant="outline"
                      className="border-white/20 hover:bg-white/10"
                    >
                      取消全选
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <label
                        key={idx}
                        className={`flex items-start space-x-3 rounded-xl p-3 border transition-all cursor-pointer ${
                          selected[idx]
                            ? "bg-brand-pink/10 border-brand-pink/30"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <Checkbox
                          checked={!!selected[idx]}
                          onCheckedChange={() => toggle(idx)}
                        />
                        <div className="flex-1">
                          <p className="text-sm">{s.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={closeModal}
                    variant="outline"
                    className="flex-1 border-white/20 hover:bg-white/10"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={saveSelected}
                    disabled={isPending || Object.values(selected).filter(Boolean).length === 0}
                    className="flex-1 gradient-primary glow-pink flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isPending ? "保存中..." : `保存 (${Object.values(selected).filter(Boolean).length})`}</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ), document.body)}
    </>
  );
}
