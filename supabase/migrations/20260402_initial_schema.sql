create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'qa', 'designer', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  pole_code text not null,
  status text not null default 'Submitted' check (status in ('Submitted', 'In QA', 'Issues Found', 'Rework', 'Approved', 'Rejected')),
  priority text not null default 'MED' check (priority in ('LOW', 'MED', 'HIGH')),
  designer_id uuid not null references public.profiles (id),
  qa_owner_id uuid not null references public.profiles (id),
  created_by uuid not null references public.profiles (id),
  current_revision integer not null default 1,
  days_in_qa numeric(6,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ticket_issues (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  title text not null,
  severity text not null default 'MED' check (severity in ('LOW', 'MED', 'HIGH')),
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Resolved')),
  category text not null,
  assigned_to uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_tickets_status_updated_at on public.tickets (status, updated_at desc);
create index if not exists idx_tickets_qa_owner_status on public.tickets (qa_owner_id, status);
create index if not exists idx_tickets_designer_status on public.tickets (designer_id, status);
create index if not exists idx_ticket_issues_ticket_status on public.ticket_issues (ticket_id, status);
create index if not exists idx_ticket_comments_ticket_created on public.ticket_comments (ticket_id, created_at);
create index if not exists idx_ticket_events_ticket_created on public.ticket_events (ticket_id, created_at);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_issues enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.ticket_events enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.can_access_ticket(target_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tickets t
    where t.id = target_ticket_id
      and (
        public.is_admin()
        or t.created_by = auth.uid()
        or t.qa_owner_id = auth.uid()
        or t.designer_id = auth.uid()
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('qa', 'viewer')
        )
      )
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.can_access_ticket(uuid) to authenticated, anon;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "tickets_select_accessible" on public.tickets;
create policy "tickets_select_accessible"
on public.tickets
for select
using (public.can_access_ticket(id));

drop policy if exists "tickets_insert_qa_or_admin" on public.tickets;
create policy "tickets_insert_qa_or_admin"
on public.tickets
for insert
with check (
  auth.uid() = created_by
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'qa'
    )
  )
);

drop policy if exists "tickets_update_qa_or_admin" on public.tickets;
create policy "tickets_update_qa_or_admin"
on public.tickets
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qa'
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qa'
  )
);

drop policy if exists "issues_select_accessible" on public.ticket_issues;
create policy "issues_select_accessible"
on public.ticket_issues
for select
using (public.can_access_ticket(ticket_id));

drop policy if exists "issues_insert_qa_or_admin" on public.ticket_issues;
create policy "issues_insert_qa_or_admin"
on public.ticket_issues
for insert
with check (
  public.can_access_ticket(ticket_id)
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'qa'
    )
  )
);

drop policy if exists "comments_select_accessible" on public.ticket_comments;
create policy "comments_select_accessible"
on public.ticket_comments
for select
using (public.can_access_ticket(ticket_id));

drop policy if exists "comments_insert_accessible" on public.ticket_comments;
create policy "comments_insert_accessible"
on public.ticket_comments
for insert
with check (
  public.can_access_ticket(ticket_id)
  and author_id = auth.uid()
);

drop policy if exists "events_select_accessible" on public.ticket_events;
create policy "events_select_accessible"
on public.ticket_events
for select
using (public.can_access_ticket(ticket_id));

drop policy if exists "events_insert_qa_or_admin" on public.ticket_events;
create policy "events_insert_qa_or_admin"
on public.ticket_events
for insert
with check (
  public.can_access_ticket(ticket_id)
  and (
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('qa', 'designer')
    )
  )
);
