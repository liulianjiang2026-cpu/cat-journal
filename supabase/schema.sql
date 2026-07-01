-- ============================================================
-- 猫咪手账 · Supabase 初始化脚本
-- 在 Supabase 控制台 → SQL Editor 里整段粘贴运行一次即可。
-- ============================================================

-- 1) 数据表：每行 = 一张照片 + 一段文字
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  photo_path  text not null,
  caption     text not null default '',
  sort_order  double precision not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists entries_sort_idx on public.entries (sort_order);

-- 购物记录：仅管理员可读写，用于记录历史购买支出
create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default '其他',
  spec        text not null default '',
  note        text not null default '',
  amount      numeric(10,2) not null default 0,
  date        date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists purchases_date_idx on public.purchases (date desc, created_at desc);

-- 2) 开启行级安全（RLS）
alter table public.entries enable row level security;
alter table public.purchases enable row level security;

-- 读：所有人可读（访客答题门在前端控制浏览入口）
drop policy if exists "entries_read_all" on public.entries;
create policy "entries_read_all"
  on public.entries for select
  using (true);

-- 写：仅登录用户（= 管理员本人）可增删改
drop policy if exists "entries_write_admin" on public.entries;
create policy "entries_write_admin"
  on public.entries for all
  to authenticated
  using (true)
  with check (true);

-- 购物记录：只有管理员登录后可读写，访客完全不可见
drop policy if exists "purchases_admin_all" on public.purchases;
create policy "purchases_admin_all"
  on public.purchases for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- 3) Storage 存储桶（存照片文件）
-- ============================================================
-- 在 控制台 → Storage 新建一个名为 cat-photos 的 bucket，并勾选 "Public"
-- （公开桶让访客能加载图片；写入仍受下面策略限制）。
-- 然后运行以下策略：

-- 读：公开读取 cat-photos
drop policy if exists "cat_photos_read" on storage.objects;
create policy "cat_photos_read"
  on storage.objects for select
  using ( bucket_id = 'cat-photos' );

-- 写/删：仅登录用户（管理员）
drop policy if exists "cat_photos_write" on storage.objects;
create policy "cat_photos_write"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'cat-photos' );

drop policy if exists "cat_photos_update" on storage.objects;
create policy "cat_photos_update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'cat-photos' );

drop policy if exists "cat_photos_delete" on storage.objects;
create policy "cat_photos_delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'cat-photos' );

-- ============================================================
-- 4) 创建管理员账号
-- ============================================================
-- 在 控制台 → Authentication → Users → "Add user" 手动添加一个用户
-- （填你的邮箱+密码，勾选 Auto Confirm）。这个账号就是你登录后台的身份。
-- 提示：可在 Authentication → Providers 关闭 "Allow new sign ups"，
-- 防止别人自助注册成为管理员。
