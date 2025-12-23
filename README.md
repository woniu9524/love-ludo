# Love Game · 情侣飞行棋

一个基于 Next.js + Supabase 的情侣互动游戏：两人各自选择主题题库，在 7×7 螺旋棋盘上掷骰前进。落到「幸运星/陷阱/撞机」会触发互动任务，由执行者确认、观察者判定，完成后推进回合，先到终点者获胜。支持自定义题库与 AI 生成任务。

## 在线体验

- 访问地址：https://v2.cpfly.top/
- 如遇登录或题库问题，请按照下文「快速开始」初始化数据库与环境变量后本地运行进行对比排查。

## 问题反馈

- QQ 群：`1070223428`（欢迎加入交流与反馈）


## 功能亮点

- 双人实时对战：房间创建/加入、掷骰、回合推进、胜负判定
- 主题题库：每位玩家选择各自主题，星/陷阱/撞机触发任务
- AI 生成任务：基于个人偏好与主题调用 OpenRouter 生成批量任务
- 偏好设置：性别与兴趣标签（Kinks），影响 AI 生成的任务风格
- 账户便捷：支持随机账户注册，提供一键复制账号与密码
- 历史归档：对局结束自动入库摘要，任务完成情况可追溯
- 现代 UI：Tailwind + Radix + lucide-react，移动端友好

## 技术栈

- Next.js（最新）+ React 19，开发使用 Turbopack（`next dev --turbopack`）
- Supabase（Auth、Postgres、RLS、Realtime）
- Tailwind CSS + tailwind-merge + Radix UI + lucide-react
- OpenRouter（可选，用于 AI 任务生成）

## 零成本部署（人人可用）

本项目基于 Next.js + Supabase 设计，前端静态托管 + 后端完全使用 Supabase 的免费层即可运行，个人或情侣使用几乎零成本：

- 托管：使用 Vercel（免费）部署 Next.js 应用，无需自建服务器
- 数据库与鉴权：使用 Supabase Free（Postgres + Auth + Realtime）
- AI（可选）：OpenRouter 需 API Key，按量计费；不启用也可完整游玩

### 部署步骤（简版）：
- 在 Supabase 新建项目 → 执行 `docs/db/001_schema.sql` 与 `docs/db/002_rls.sql`
- 复制 `Project URL` 与 `Anon (publishable) key` 填入环境变量
- 在 Vercel 导入本仓库 → 设置 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（如启用 AI，再设置 `OPENROUTER_API_KEY`）→ 一键部署

<details>
 <summary>部署步骤（详细）</summary>

### 部署步骤（详细）：
- 数据库初始化
在 [Supabase](https://supabase.com/) 新建项目（每个账户的免费额度为两个）
![img.png](docs/img/新建项目.png)
选择地区：可选择里你部署平台地址比较近的地区，减少延迟
![img.png](docs/img/选择地区.png)
执行SQL脚本
1. [001_schema.sql](docs/db/001_schema.sql)
2. [002_rls.sql](docs/db/002_rls.sql)
![img.png](docs/img/SQL脚本执行1.png)
将sql复制到控制台中，全选，执行
![img.png](docs/img/SQL脚本执行2.png)
开启 rooms/game_sessions/game_moves 三张表的 realtime权限
![img.png](docs/img/表realtime开启1.png)
![img.png](docs/img/表realtime开启2.png) 


- 获取Supabase key 
Project URL
![img.png](docs/img/ProjectURL.png)
Publishable Key
![img.png](docs/img/publishableKey.png)


- [Vervel](https://vercel.com/) 部署，自行注册并绑定自己的GitHub这里不再赘述
![img.png](docs/img/Vercel新建Project1.png)
选择你fork的仓库，进行 `Import` 
![img.png](docs/img/Vercel新建Project2.png)
**设置环境变量**
![img.png](docs/img/设置环境变量.png)

| KEY                                  | VALUE                   |
|--------------------------------------|-------------------------|
| NEXT_PUBLIC_SUPABASE_URL             | https://xxx.supabase.co | 
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | sb_publishable_xxxx     | 

执行部署
![img.png](docs/img/Vercel部署.png)
- 部署完成之后可以通过Vercel提供的域名直接访问
![img.png](docs/img/Vercel项目地址.png)
- 自定义域名 （CNAME方式）
![img.png](docs/img/自定义域名.png)
</details>

## 快速开始

参考视频教程：https://www.bilibili.com/video/BV1NnkZBVE8W

1) 克隆与安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

2) 配置环境变量（复制 `.env.example` 为 `.env.local` 并填写）

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的 Supabase Publishable/Anon Key
OPENROUTER_API_KEY=你的 OpenRouter API Key（启用 AI 生成时必填）
```

获取方式：登录 Supabase 控制台 → Project Settings → API → 复制 `Project URL` 与 `Anon (publishable) key`。

3) 初始化数据库（在 Supabase SQL Editor 执行）

- 运行 `docs/db/001_schema.sql` 建表（profiles/themes/tasks/rooms/game_sessions/game_moves/game_history）
- 运行 `docs/db/002_rls.sql` 启用并配置行级安全（RLS）策略
- 确保 Realtime 已开启（rooms/game_sessions/game_moves），并对相关表启用变更广播

4) 关闭 email 验证（Project Settings → Authentication → Email）

<details>
 <summary> 关闭 email 验证</summary>

  ![关闭邮箱验证.png](docs/img/%E5%85%B3%E9%97%AD%E9%82%AE%E7%AE%B1%E9%AA%8C%E8%AF%81.png)

</details>


5) 启动开发环境

```bash
# 开发
pnpm dev
# 或
npm run dev

# 访问 http://localhost:3000
```


## 游戏流程

- 登录/注册：支持随机账号注册；注册成功后会尝试导入默认题库（`/api/seed-default-tasks`），大厅页也有兜底导入逻辑
- 选择主题：在「主题库」创建或编辑主题与任务，可使用「AI 生成任务」快速批量添加
- 创建/加入房间：房主创建房间获得 6 位房间码，对方输入房间码加入；双方各自选择主题
- 开始游戏：随机决定先手；棋盘为 7×7 螺旋路径，终点为第 49 格
- 掷骰推进：
  - 普通格：直接前进并切换回合
  - 幸运星（star）：由当前掷骰者从自己的主题给对方一个任务（对方执行、你判定）
  - 陷阱（trap）：由对方从对方的主题给你一个任务（你执行、对方判定）
  - 撞机（collision）：两子重合触发任务；执行者为被撞者，观察者为撞击者
- 执行与判定：执行者先点「完成任务」，观察者再判定「已执行/未执行」
  - 未执行惩罚：执行者随机后退 0–3 格；撞机场景有特殊退回规则
- 终点与归档：任一玩家到达终点立即胜利；对局被归档到 `game_history`，并清理临时 `game_moves/game_sessions`

## 环境变量说明

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL（公开）
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`：Supabase 的 Publishable/Anon Key（公开）
- `OPENROUTER_API_KEY`：OpenRouter 的 API Key（启用 AI 生成功能时必填）

提示：本项目使用 SSR + 中间件进行鉴权（`lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`），未登录用户会被重定向到 `/login`（首页与 `/auth/*` 除外）。

## 目录结构（摘）

```
app/                # 路由与页面（首页/登录/大厅/游戏/主题/我的/帮助）
  lobby/            # 创建/加入房间与开始游戏
  game/             # 对局页面与服务端动作
  themes/           # 主题库与任务管理、AI 生成
  profile/          # 昵称、偏好、历史、退出登录
  api/              # 任务生成与默认题库导入 API
components/         # UI 与交互组件（掷骰、偏好、主题、表单等）
docs/db/            # 数据库 schema 与 RLS 策略 SQL
lib/                # Supabase 客户端、工具、默认题库 `tasks.json`
supabase/functions/ # 预留 Edge Functions（如清理过期对局）
```

## 常见问题

- 如何复制账号与密码？
  - 「我的」页昵称右侧有复制按钮；也会读取注册时在浏览器本地保存的随机账户凭据
- AI 生成任务无法使用？
  - 请确保已设置 `OPENROUTER_API_KEY`，并在「我的」完善性别与兴趣标签，以获得更贴合的生成结果
- 没有题库怎么办？
  - 新注册用户会自动尝试导入默认题库；大厅页也有一次性兜底导入逻辑；也可以在「主题库」手动新建与编辑
- Realtime 没有推送？
  - 检查 Supabase 项目是否开启 Realtime，并为业务表启用变更广播；本项目通过 `postgres_changes` 订阅 `game_sessions` 与 `game_moves`



## 脚本

- `pnpm dev` / `npm run dev`：开发模式（Turbopack）
- `pnpm build` / `npm run build`：生产构建
- `pnpm start` / `npm run start`：启动生产服务
- `pnpm lint` / `npm run lint`：Lint 检查

## 许可与免责声明

- 内容说明：本项目包含成人向互动任务，适合成年人使用。部署与使用请遵守所在地区的法律法规与平台政策，并注意隐私与数据安全。

## 致谢

- Supabase 团队与文档
- OpenRouter 社区
- Next.js、Tailwind CSS、Radix UI、lucide-react 生态
