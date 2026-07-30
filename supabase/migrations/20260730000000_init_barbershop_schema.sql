-- Enable required extensions
create extension if not exists "pgcrypto";

-- Types & Enums
create type user_role as enum ('admin', 'employee');
create type profile_status as enum ('active', 'inactive');
create type payment_method as enum ('cash', 'bank_transfer');
create type revenue_status as enum ('recorded', 'voided');
create type payroll_status as enum ('draft', 'locked', 'published', 'paid');

-- 1. Table: shops
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  currency text not null default 'VND',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Table: profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  role user_role not null default 'employee',
  status profile_status not null default 'active',
  must_change_password boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_shop_role_status on public.profiles(shop_id, role, status);

-- 3. Table: revenue_entries
create table public.revenue_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  amount bigint not null check (amount > 0),
  payment_method payment_method not null,
  service_name text,
  note text,
  business_date date not null,
  performed_at timestamptz not null default now(),
  status revenue_status not null default 'recorded',
  idempotency_key uuid not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  constraint uq_shop_idempotency unique (shop_id, idempotency_key)
);

create index idx_revenue_shop_date on public.revenue_entries(shop_id, business_date);
create index idx_revenue_shop_employee_date on public.revenue_entries(shop_id, employee_id, business_date);
create index idx_revenue_shop_method_date on public.revenue_entries(shop_id, payment_method, business_date);
create index idx_revenue_created_desc on public.revenue_entries(shop_id, created_at desc);

-- 4. Table: daily_closings
create table public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  business_date date not null,
  cash_total bigint not null default 0,
  bank_transfer_total bigint not null default 0,
  revenue_total bigint not null default 0,
  transaction_count integer not null default 0,
  closed_by uuid not null references public.profiles(id),
  closed_at timestamptz not null default now(),
  reopened_by uuid references public.profiles(id),
  reopened_at timestamptz,
  reopen_reason text,
  is_closed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_shop_business_date unique (shop_id, business_date)
);

-- 5. Table: salary_settings
create table public.salary_settings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  base_salary bigint not null default 0 check (base_salary >= 0),
  allowance bigint not null default 0 check (allowance >= 0),
  commission_rate numeric(5,2) not null default 0 check (commission_rate >= 0 and commission_rate <= 100),
  effective_from date not null,
  effective_to date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Table: payrolls
create table public.payrolls (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  payroll_month date not null,
  base_salary bigint not null default 0,
  allowance bigint not null default 0,
  eligible_revenue bigint not null default 0,
  commission_rate numeric(5,2) not null default 0,
  commission_amount bigint not null default 0,
  bonus bigint not null default 0,
  deduction bigint not null default 0,
  total_salary bigint not null default 0,
  note text,
  status payroll_status not null default 'draft',
  generated_by uuid not null references public.profiles(id),
  generated_at timestamptz not null default now(),
  locked_by uuid references public.profiles(id),
  locked_at timestamptz,
  published_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_shop_employee_month unique (shop_id, employee_id, payroll_month)
);

-- 7. Table: notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on public.notifications(recipient_id, read_at, created_at desc);

-- 8. Table: push_subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Table: audit_logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS Security Helpers
create or replace function public.current_user_shop_id()
returns uuid language sql stable security definer set search_path = public as $$
  select shop_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_day_closed(p_shop_id uuid, p_date date)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.daily_closings
    where shop_id = p_shop_id and business_date = p_date and is_closed = true
  );
$$;

-- Enable RLS on all tables
alter table public.shops enable row level security;
alter table public.profiles enable row level security;
alter table public.revenue_entries enable row level security;
alter table public.daily_closings enable row level security;
alter table public.salary_settings enable row level security;
alter table public.payrolls enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.audit_logs enable row level security;

-- RLS Policies: shops
create policy "Shops viewable by members" on public.shops
  for select using (id = public.current_user_shop_id());

create policy "Shops editable by admin" on public.shops
  for update using (id = public.current_user_shop_id() and public.is_admin());

-- RLS Policies: profiles
create policy "Profiles viewable by admin or self" on public.profiles
  for select using (
    shop_id = public.current_user_shop_id() and (public.is_admin() or id = auth.uid())
  );

create policy "Profiles insertable by admin" on public.profiles
  for insert with check (
    shop_id = public.current_user_shop_id() and public.is_admin()
  );

create policy "Profiles updatable by admin or self" on public.profiles
  for update using (
    shop_id = public.current_user_shop_id() and (public.is_admin() or id = auth.uid())
  );

-- RLS Policies: revenue_entries
create policy "Revenue viewable by admin or creator" on public.revenue_entries
  for select using (
    shop_id = public.current_user_shop_id() and (public.is_admin() or employee_id = auth.uid())
  );

create policy "Revenue insertable by admin or self" on public.revenue_entries
  for insert with check (
    shop_id = public.current_user_shop_id() 
    and (public.is_admin() or (employee_id = auth.uid() and created_by = auth.uid()))
    and not public.is_day_closed(shop_id, business_date)
  );

create policy "Revenue updatable by admin or self before close" on public.revenue_entries
  for update using (
    shop_id = public.current_user_shop_id()
    and (public.is_admin() or (employee_id = auth.uid() and status = 'recorded'))
    and not public.is_day_closed(shop_id, business_date)
  );

-- RLS Policies: daily_closings
create policy "Daily closings viewable by shop members" on public.daily_closings
  for select using (shop_id = public.current_user_shop_id());

create policy "Daily closings managed by admin" on public.daily_closings
  for all using (shop_id = public.current_user_shop_id() and public.is_admin());

-- RLS Policies: salary_settings
create policy "Salary settings managed by admin" on public.salary_settings
  for all using (shop_id = public.current_user_shop_id() and public.is_admin());

-- RLS Policies: payrolls
create policy "Payrolls viewable by admin or self if published" on public.payrolls
  for select using (
    shop_id = public.current_user_shop_id() and (
      public.is_admin() or (employee_id = auth.uid() and status in ('published', 'paid'))
    )
  );

create policy "Payrolls managed by admin" on public.payrolls
  for all using (shop_id = public.current_user_shop_id() and public.is_admin());

-- RLS Policies: notifications
create policy "Notifications viewable by recipient" on public.notifications
  for select using (recipient_id = auth.uid());

create policy "Notifications updatable by recipient" on public.notifications
  for update using (recipient_id = auth.uid());

-- RLS Policies: push_subscriptions
create policy "Push subscriptions managed by self" on public.push_subscriptions
  for all using (user_id = auth.uid());

-- RLS Policies: audit_logs
create policy "Audit logs viewable by admin" on public.audit_logs
  for select using (shop_id = public.current_user_shop_id() and public.is_admin());

-- Business RPC: Close business day
create or replace function public.close_business_day(p_shop_id uuid, p_business_date date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cash bigint := 0;
  v_bank bigint := 0;
  v_total bigint := 0;
  v_count integer := 0;
  v_closing_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only admins can close the business day';
  end if;

  select 
    coalesce(sum(case when payment_method = 'cash' then amount else 0 end), 0),
    coalesce(sum(case when payment_method = 'bank_transfer' then amount else 0 end), 0),
    coalesce(sum(amount), 0),
    count(*)
  into v_cash, v_bank, v_total, v_count
  from public.revenue_entries
  where shop_id = p_shop_id and business_date = p_business_date and status = 'recorded';

  insert into public.daily_closings (
    shop_id, business_date, cash_total, bank_transfer_total, revenue_total, transaction_count, closed_by, closed_at, is_closed
  ) values (
    p_shop_id, p_business_date, v_cash, v_bank, v_total, v_count, auth.uid(), now(), true
  )
  on conflict (shop_id, business_date) do update set
    cash_total = excluded.cash_total,
    bank_transfer_total = excluded.bank_transfer_total,
    revenue_total = excluded.revenue_total,
    transaction_count = excluded.transaction_count,
    closed_by = excluded.closed_by,
    closed_at = excluded.closed_at,
    is_closed = true,
    updated_at = now()
  returning id into v_closing_id;

  -- Audit Log
  insert into public.audit_logs (shop_id, actor_id, action, entity_type, entity_id, new_data)
  values (p_shop_id, auth.uid(), 'CLOSE_DAY', 'daily_closings', v_closing_id, jsonb_build_object(
    'date', p_business_date, 'revenue_total', v_total, 'count', v_count
  ));

  return jsonb_build_object(
    'success', true,
    'cash_total', v_cash,
    'bank_transfer_total', v_bank,
    'revenue_total', v_total,
    'transaction_count', v_count
  );
end;
$$;

-- Business RPC: Generate Monthly Payroll
create or replace function public.generate_monthly_payroll(p_payroll_month date)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_shop_id uuid;
  v_emp record;
  v_eligible bigint;
  v_comm_amount bigint;
  v_total bigint;
  v_generated_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only admins can generate payroll';
  end if;

  v_shop_id := public.current_user_shop_id();

  for v_emp in 
    select p.id as employee_id, ss.base_salary, ss.allowance, ss.commission_rate
    from public.profiles p
    left join public.salary_settings ss on ss.employee_id = p.id and ss.shop_id = v_shop_id
    where p.shop_id = v_shop_id and p.status = 'active'
  loop
    -- Calculate eligible revenue for the month
    select coalesce(sum(amount), 0) into v_eligible
    from public.revenue_entries
    where shop_id = v_shop_id 
      and employee_id = v_emp.employee_id
      and status = 'recorded'
      and date_trunc('month', business_date) = date_trunc('month', p_payroll_month);

    v_comm_amount := round((v_eligible * coalesce(v_emp.commission_rate, 0)) / 100.0);
    v_total := coalesce(v_emp.base_salary, 0) + coalesce(v_emp.allowance, 0) + v_comm_amount;

    insert into public.payrolls (
      shop_id, employee_id, payroll_month, base_salary, allowance, eligible_revenue,
      commission_rate, commission_amount, total_salary, status, generated_by, generated_at
    ) values (
      v_shop_id, v_emp.employee_id, date_trunc('month', p_payroll_month)::date, 
      coalesce(v_emp.base_salary, 0), coalesce(v_emp.allowance, 0), v_eligible,
      coalesce(v_emp.commission_rate, 0), v_comm_amount, v_total, 'draft', auth.uid(), now()
    )
    on conflict (shop_id, employee_id, payroll_month) do update set
      eligible_revenue = excluded.eligible_revenue,
      commission_amount = excluded.commission_amount,
      total_salary = excluded.base_salary + excluded.allowance + excluded.commission_amount + payrolls.bonus - payrolls.deduction,
      updated_at = now()
    where payrolls.status = 'draft';

    v_generated_count := v_generated_count + 1;
  end loop;

  return v_generated_count;
end;
$$;
