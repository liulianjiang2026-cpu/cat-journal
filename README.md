# 🐾 猫咪手账 Cat Journal

给小猫做的照片记录册：存照片、给每张写文字，照片可上传 / 删除 / 拖动排序，文字可编辑 / 删除。手账杂志风界面，手机电脑都能用。

- **访客**：答对暗号才能进入浏览（类似 QQ 加群），只能看不能改。
- **管理员（你本人）**：登录后才能添加、删除、编辑、排序。写权限由服务端强制。

## 两种运行模式（自动切换）

| 模式 | 触发条件 | 数据存哪 | 多端同步 |
|---|---|---|---|
| 📁 本地模式 | 没配 Supabase 密钥 | 本机浏览器（IndexedDB） | 否 |
| ☁️ 云端模式 | 配了 Supabase 密钥 | Supabase | 是 |

先用本地模式就能完整体验所有功能；准备好云端后填密钥即可升级，代码不用改。

---

## 一、本地先跑起来

```bash
npm install
npm run dev
```

打开终端给出的地址。默认暗号是 **喵**，本地管理员密码是 **meow-admin**。
想改：复制 `.env.example` 为 `.env.local` 修改 `VITE_GATE_QA` / `VITE_ADMIN_PASSWORD`。

---

## 二、升级成云端同步（手机+电脑共享一份数据）

### 1. 建 Supabase 项目
1. 注册 https://supabase.com → New project（免费）。
2. 左侧 **SQL Editor** → 把 `supabase/schema.sql` 整段粘贴运行（建表 + 权限）。
3. 左侧 **Storage** → New bucket，名字填 `cat-photos`，勾选 **Public**。
   （`schema.sql` 里已含该桶的读写策略，建好桶后那段策略会生效。）
4. 左侧 **Authentication → Users → Add user**：填你的邮箱+密码，勾 Auto Confirm。
   这就是你登录后台的账号。建议在 Providers 里关掉 "Allow new sign ups"。
5. 左侧 **Settings → API**：复制 `Project URL` 和 `anon public` key。

### 2. 填密钥
复制 `.env.example` 为 `.env.local`，填入：

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

重启 `npm run dev`，底部会显示「☁️ 云端同步中」。用第 4 步的邮箱密码登录即可管理。

### 3. 部署到 Vercel（拿到公开网址）
1. 把项目推到 GitHub。
2. https://vercel.com 用 GitHub 登录 → Import 这个仓库。
3. 在 Vercel 项目 **Settings → Environment Variables** 里，把 `.env.local` 里的
   所有 `VITE_*` 变量都加一遍。
4. Deploy。Vercel 会给一个 `https://xxx.vercel.app` 网址，手机电脑都能打开。

> Vite 项目 Vercel 零配置：Build `npm run build`，输出目录 `dist`（自动识别）。

---

## 自定义

所有可调项在 `src/lib/config.ts`，均可用 `.env.local` 覆盖：
暗号题目/答案、站点标题、猫咪名字、本地管理员密码、Supabase 配置。

## 目录结构
```
src/
  lib/        数据层（本地 & 云端双后端、压缩、配置）
  context/    登录/访客状态
  components/ Gate 答题门 / AdminLogin / Gallery 相册 / EntryCard 卡片 / UploadDialog
supabase/schema.sql   云端建表与权限脚本
```
