import { NextRequest, NextResponse } from "next/server";

// --- Configuration ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// 如果环境变量 OPENROUTER_URL 没有定义或为空，则使用默认值
const DEFAULT_URL = "https://api.deepseek.com/chat/completions"; // 1. 修改这里：改为 DeepSeek 的API地址
const OPENROUTER_URL = process.env.OPENROUTER_URL || DEFAULT_URL;
const MODEL_NAME = process.env.MODEL_NAME || "deepseek-chat"; // 2. 修改这里：设置 DeepSeek 的模型为默认值
// const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// const MODEL_NAME = "google/gemini-2.5-flash-lite"; // 你可以换成其他模型

// --- Type Definitions ---
interface Preferences {
  gender: "male" | "female" | "non_binary" | string;
  kinks: string[];
}

interface ApiPayload {
  title: string;
  description?: string;
  preferences?: Partial<Preferences>; // 偏好是可选的
  customRequirement?: string;
}

type ParseResult =
  | {
      ok: true;
      data: {
        title: string;
        description: string;
        customRequirement: string;
        gender: string;
        kinks: string[];
      };
    }
  | {
      ok: false;
      error: { message: string; status: number };
    };

interface Task {
  description: string;
}

/**
 * 主 API 路由处理函数
 */
export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "缺少 OPENROUTER_API_KEY 环境变量" },
      { status: 500 }
    );
  }

  try {
    // 1. 解析和验证请求体
    const result = await parseAndValidateRequest(req);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status }
      );
    }

    // 2. 构建 Prompt
    const { sysPrompt, userPrompt } = buildPrompts(result.data);

    // 3. 调用 AI
    const aiContent = await callOpenRouter(sysPrompt, userPrompt);

    // 4. 解析 AI 的响应
    const tasks = parseAIResponse(aiContent);

    // 5. 格式化并验证最终任务列表
    const formattedTasks = formatTasks(tasks);

    if (formattedTasks.length === 0) {
      return NextResponse.json(
        { error: "AI 生成失败，未返回有效任务" },
        { status: 500 }
      );
    }

    // 6. 成功返回
    return NextResponse.json({ tasks: formattedTasks });

  } catch (e: any) {
    console.error("生成任务时发生未捕获的错误:", e);
    return NextResponse.json(
      { error: e?.message || "生成任务失败" },
      { status: 500 }
    );
  }
}

/**
 * 解析并验证 NextRequest 的 JSON body
 */
async function parseAndValidateRequest(req: NextRequest): Promise<ParseResult> {
  let payload: ApiPayload;
  try {
    payload = await req.json();
  } catch {
    return { ok: false, error: { message: "请求体必须为 JSON", status: 400 } };
  }

  const title = String(payload?.title ?? "").trim();
  if (!title) {
    return { ok: false, error: { message: "缺少主题标题", status: 400 } };
  }

  const description = String(payload?.description ?? "").trim();
  const customRequirement = String(payload?.customRequirement ?? "").trim();
  
  const gender = payload?.preferences?.gender || "unspecified";
  const kinks = Array.isArray(payload?.preferences?.kinks)
    ? payload.preferences.kinks.filter(k => typeof k === 'string' && k.trim() !== '')
    : [];

  return {
    ok: true,
    data: { title, description, customRequirement, gender, kinks },
  };
}

/**
 * 根据用户数据构建 System 和 User Prompts
 */
function buildPrompts(payload: {
  title: string;
  description: string;
  customRequirement: string;
  gender: string;
  kinks: string[];
}) {
  const { title, description, customRequirement, gender, kinks } = payload;

  const genderMap: Record<string, string> = {
    male: "男性",
    female: "女性",
    non_binary: "非二元性别",
  };
  const genderText = genderMap[gender] || "未指定";
  const kinksText = kinks.length > 0 ? kinks.join("、") : "未指定";

  // --- 优化后的 System Prompt ---
  const sysPrompt = `
你是一个专业、大胆且富有创意的情趣互动任务生成助手。

你的核心目标是帮助“用户”设计一系列任务，让其“伴侣”来执行。这些任务必须能“激发深度欲望”并“突破日常亲密界限”。

你的设计必须严格满足“用户”（Kinks提供方）的偏好，同时确保任务是对“伴侣”（执行方）的具体指令。

要求：
1.  **高度定制化**：必须严格围绕用户提供的「主题」和「兴趣标签（Kinks）」来设计任务。**「兴趣标签」是设计的核心，任务必须能满足用户的这些Kinks。**
2.  **视角明确：指令对象是“伴侣”**
    * 任务是**写给“用户的伴侣”去执行的指令**。
    * 设计的核心是**利用伴侣的行动**来**满足“用户”（即提供Kinks的那一方）的欲望**。
    * AI思考模型：你要站在“用户”的角度思考：**“我希望我的伴侣为我做什么（或对我做什么）？”**
3.  **具体可执行**：任务描述必须清晰、直接，包含具体动作、言语或场景，是给伴侣的明确指令。
4.  **大胆且直接**：你的任务应该富有想象力、大胆、且具有挑逗性。
5.  **格式约束**：每个任务描述在15-50字之间。

输出格式：
严格输出 JSON 格式，包含一个 tasks 数组，每个任务对象包含 description 字段。
(这些 description 是给伴侣的指令)
示例：{"tasks": [{"description": "撅起PP让对方（用户）打3下"}, {"description": "大声说出你现在多想要TA"}]}`;

  // --- 优化后的 User Prompt ---
  const userPrompt = `
我需要你为我的伴侣设计一个情侣互动任务列表，这些任务由TA来执行。

我的个人情况（任务要满足我）：
- 我的性别：${genderText}
- 我的兴趣标签 (Kinks)：${kinksText}

我们的互动主题：
- 主题：「${title}」
${description ? `- 补充描述：${description}` : ""}

${customRequirement ? `我的特别要求：${customRequirement}` : ""}

请严格根据我的「兴趣标签」和「主题」，为我**的伴侣**生成 20~30 条大胆、具体且可执行的互动任务。严格按照 JSON 格式输出。`;

  return { sysPrompt, userPrompt };
}

/**
 * 调用 OpenRouter API
 */
async function callOpenRouter(sysPrompt: string, userPrompt: string): Promise<string> {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, // 请求 JSON 输出
      temperature: 1,
      max_tokens: 8000,
    }),
  });

  if (!resp.ok) {
    const errorBody = await resp.text();
    console.error("OpenRouter API 错误:", errorBody);
    throw new Error(`AI API 请求失败，状态码: ${resp.status}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("AI 返回了空或无效的内容");
  }

  return content;
}

/**
 * 解析 AI 返回的（可能是 JSON 或纯文本）内容
 */
function parseAIResponse(content: string): Partial<Task>[] {
  // 1. 尝试按 JSON 解析 (首选)
  try {
    const parsed = JSON.parse(content);
    
    // 检查常见的数组键
    if (Array.isArray(parsed?.tasks)) {
      return parsed.tasks;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed?.task_list)) {
      return parsed.task_list;
    }
    console.warn("AI 返回了 JSON，但结构未知", parsed);

  } catch (e) {
    console.warn("AI 未返回标准 JSON，降级到纯文本列表解析");
  }

  // 2. 降级：按行解析纯文本列表
  return content
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean)
    .map((l: string) => {
      // 去除列表标记 (如 1., -, *)
      const cleaned = l.replace(/^[-*\d]+[.、:：)]\s*/, "");
      return { description: cleaned };
    });
}

/**
 * 过滤、清理并格式化最终的任务数组
 */
function formatTasks(tasks: Partial<Task>[]): Task[] {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks
    .filter((t): t is Task => // 类型守卫，确保 t 和 t.description 都是有效的
      typeof t?.description === "string" && t.description.trim().length > 0
    )
    .map((t: Task) => ({
      description: t.description.trim(),
    }))
    .slice(0, 12); // 限制最多12个任务
}
