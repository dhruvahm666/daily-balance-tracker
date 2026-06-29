
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  units text not null default 'metric',
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile delete" on public.profiles for delete to authenticated using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- THREADS
create table public.check_in_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Daily check-in',
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.check_in_threads to authenticated;
grant all on public.check_in_threads to service_role;
alter table public.check_in_threads enable row level security;
create policy "own threads all" on public.check_in_threads for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index check_in_threads_user_date on public.check_in_threads(user_id, entry_date desc);
create trigger threads_touch before update on public.check_in_threads for each row execute function public.touch_updated_at();

-- MESSAGES (AI SDK UIMessage parts)
create table public.check_in_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.check_in_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.check_in_messages to authenticated;
grant all on public.check_in_messages to service_role;
alter table public.check_in_messages enable row level security;
create policy "own messages all" on public.check_in_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index check_in_messages_thread on public.check_in_messages(thread_id, created_at);

-- DAILY ENTRIES (structured metrics per day, one row per user/date)
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  wake_time time,
  sleep_time time,
  sleep_hours numeric(4,2),
  water_liters numeric(4,2),
  steps integer,
  workout_minutes integer,
  workout_type text,
  cardio_minutes integer,
  calories integer,
  weight_kg numeric(5,2),
  mood integer check (mood between 1 and 10),
  energy integer check (energy between 1 and 10),
  productivity integer check (productivity between 1 and 10),
  screen_time_minutes integer,
  study_work_hours numeric(4,2),
  breakfast text,
  lunch text,
  dinner text,
  snacks text,
  notes text,
  health_score integer,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
grant select, insert, update, delete on public.daily_entries to authenticated;
grant all on public.daily_entries to service_role;
alter table public.daily_entries enable row level security;
create policy "own entries all" on public.daily_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index daily_entries_user_date on public.daily_entries(user_id, entry_date desc);
create trigger entries_touch before update on public.daily_entries for each row execute function public.touch_updated_at();

-- INSIGHTS
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('daily','weekly','monthly')),
  period_start date not null,
  period_end date not null,
  summary text not null,
  strengths text,
  weaknesses text,
  suggestions text,
  motivation text,
  score integer,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.insights to authenticated;
grant all on public.insights to service_role;
alter table public.insights enable row level security;
create policy "own insights all" on public.insights for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index insights_user_scope on public.insights(user_id, scope, period_start desc);
