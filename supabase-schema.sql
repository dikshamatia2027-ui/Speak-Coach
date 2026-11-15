-- SpeakCoach database schema. Run the whole file in the Supabase SQL Editor.
-- Safe to re-run. It removes every existing policy on these tables, so the rules below are the only ones that apply.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  plan_renews_at timestamptz,
  plan_event_at timestamptz,
  dodo_customer_id text
);
alter table public.profiles add column if not exists plan_renews_at timestamptz;
alter table public.profiles add column if not exists plan_event_at timestamptz;
alter table public.profiles add column if not exists dodo_customer_id text;
create index if not exists profiles_dodo_customer_id_idx on public.profiles (dodo_customer_id);

create table if not exists public.sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  primary key (user_id, id)
);

create table if not exists public.analysis_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists analysis_log_user_created_idx on public.analysis_log (user_id, created_at);

create table if not exists public.webhook_events (
  id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_waitlist (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Policies are additive, so an old permissive policy would survive a plain "create policy". Start clean.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'sessions', 'analysis_log', 'webhook_events', 'launch_waitlist')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.analysis_log enable row level security;
alter table public.webhook_events enable row level security;
alter table public.launch_waitlist enable row level security;

revoke all on public.profiles, public.sessions, public.analysis_log, public.webhook_events, public.launch_waitlist
  from public, anon, authenticated;

-- The server uses the service role, which bypasses these policies.
grant all on public.profiles, public.sessions, public.analysis_log, public.webhook_events, public.launch_waitlist
  to service_role;

-- The plan is read-only for users. Only the payment webhook (service role) can change it.
grant select on public.profiles to authenticated;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

grant select, insert, update, delete on public.sessions to authenticated;
create policy "manage own sessions" on public.sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert on public.launch_waitlist to authenticated;
create policy "read own waitlist entry" on public.launch_waitlist
  for select to authenticated using (user_id = (select auth.uid()));
create policy "join waitlist as self" on public.launch_waitlist
  for insert to authenticated with check (user_id = (select auth.uid()));

-- analysis_log and webhook_events have no client access at all.

-- Atomically check the weekly limit and record one analysis. Returns the log row id, or null if over the limit.
-- A null limit means no cap (Pro). The per-user lock makes parallel requests wait their turn.
create or replace function public.reserve_analysis(p_user_id uuid, p_since timestamptz, p_limit integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
begin
  perform pg_advisory_xact_lock(hashtextextended('analysis:' || p_user_id::text, 0));
  if p_limit is not null and (
    select count(*) from public.analysis_log where user_id = p_user_id and created_at >= p_since
  ) >= p_limit then
    return null;
  end if;
  insert into public.analysis_log (user_id) values (p_user_id) returning id::text into v_id;
  return v_id;
end;
$$;

-- Apply a plan change unless a newer event has already been applied. Returns true if the row changed.
create or replace function public.apply_plan_event(
  p_user_id uuid,
  p_plan text,
  p_renews_at timestamptz,
  p_customer_id text,
  p_event_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.profiles as p (id, plan, plan_renews_at, dodo_customer_id, plan_event_at)
  values (p_user_id, p_plan, p_renews_at, p_customer_id, p_event_at)
  on conflict (id) do update
    set plan = excluded.plan,
        plan_renews_at = excluded.plan_renews_at,
        dodo_customer_id = coalesce(excluded.dodo_customer_id, p.dodo_customer_id),
        plan_event_at = excluded.plan_event_at
    where p.plan_event_at is null or p.plan_event_at <= excluded.plan_event_at;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.reserve_analysis(uuid, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.apply_plan_event(uuid, text, timestamptz, text, timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_analysis(uuid, timestamptz, integer) to service_role;
grant execute on function public.apply_plan_event(uuid, text, timestamptz, text, timestamptz) to service_role;
