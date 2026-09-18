create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text not null unique,
    is_admin boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.diaries (
    id uuid primary key default gen_random_uuid(),
    writer_id uuid not null references public.profiles(id) on delete cascade,
    writer text not null,
    title text not null,
    content text not null,
    image text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    user_name text not null,
    title text not null,
    content text not null,
    created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, username, is_admin)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
        false
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and is_admin = true
    );
$$;

alter table public.profiles enable row level security;
alter table public.diaries enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
    for select to authenticated
    using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
    for insert to authenticated
    with check (id = auth.uid() and is_admin = false);

drop policy if exists "diaries read authenticated" on public.diaries;
create policy "diaries read authenticated" on public.diaries
    for select to authenticated using (true);

drop policy if exists "diaries insert own" on public.diaries;
create policy "diaries insert own" on public.diaries
    for insert to authenticated
    with check (writer_id = auth.uid());

drop policy if exists "diaries update own" on public.diaries;
create policy "diaries update own" on public.diaries
    for update to authenticated
    using (writer_id = auth.uid())
    with check (writer_id = auth.uid());

drop policy if exists "diaries delete own" on public.diaries;
create policy "diaries delete own" on public.diaries
    for delete to authenticated using (writer_id = auth.uid());

drop policy if exists "inquiries insert own" on public.inquiries;
create policy "inquiries insert own" on public.inquiries
    for insert to authenticated
    with check (user_id = auth.uid());

drop policy if exists "inquiries read admin" on public.inquiries;
create policy "inquiries read admin" on public.inquiries
    for select to authenticated using (public.is_admin());

drop policy if exists "inquiries delete admin" on public.inquiries;
create policy "inquiries delete admin" on public.inquiries
    for delete to authenticated using (public.is_admin());

do $$
begin
    begin    insert into public.profiles (id, username, is_admin)
    select id, 'rove143', false
    from auth.users
    where email = 'rove143@exchange-diary.local'
    on conflict (id) do update
    set is_admin = false;
        alter publication supabase_realtime add table public.diaries;
    exception when duplicate_object then null;
    end;
    begin
        alter publication supabase_realtime add table public.inquiries;
    exception when duplicate_object then null;
    end;
end $$;
