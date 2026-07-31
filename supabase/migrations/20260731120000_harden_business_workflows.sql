-- Hardened business workflows. This migration is additive and intentionally does
-- not delete existing revenue, payroll, profile, or auth data.
begin;

alter table public.profiles
  add column if not exists username text;

update public.profiles p
set username = lower(split_part(p.email, '@', 1))
where p.username is null
  and p.email is not null
  and not exists (
    select 1 from public.profiles other
    where other.shop_id = p.shop_id
      and lower(other.username) = lower(split_part(p.email, '@', 1))
  );

create unique index if not exists uq_profiles_shop_username
  on public.profiles (shop_id, lower(username))
  where username is not null;

create index if not exists idx_payrolls_shop_month_status_employee
  on public.payrolls (shop_id, payroll_month, status, employee_id);

create index if not exists idx_salary_settings_shop_employee_effective
  on public.salary_settings (shop_id, employee_id, effective_from desc, effective_to);

create unique index if not exists uq_salary_settings_shop_employee_effective
  on public.salary_settings (shop_id, employee_id, effective_from);

create index if not exists idx_daily_closings_shop_date_closed
  on public.daily_closings (shop_id, business_date, is_closed);

create index if not exists idx_revenue_shop_date_status_performed
  on public.revenue_entries (shop_id, business_date, status, performed_at desc);

create index if not exists idx_notifications_recipient_unread_created
  on public.notifications (recipient_id, read_at, created_at desc);

create or replace function public.current_user_shop_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select shop_id from public.profiles where id = auth.uid() and status = 'active' limit 1;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'active' limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_day_closed(p_shop_id uuid, p_date date)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.daily_closings
    where shop_id = p_shop_id and business_date = p_date and is_closed = true
  );
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() <> old.id or not public.is_admin() then
    if new.id <> old.id or new.shop_id <> old.shop_id or new.role <> old.role or new.status <> old.status then
      raise exception 'Profile privilege fields are immutable for non-admin users';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_privilege_guard on public.profiles;
create trigger trg_profiles_privilege_guard
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop function if exists public.close_business_day(uuid, date);

create or replace function public.record_revenue(
  p_business_date date,
  p_amount bigint,
  p_payment_method public.payment_method,
  p_service_name text default null,
  p_note text default null,
  p_idempotency_key uuid default gen_random_uuid(),
  p_employee_id uuid default null
)
returns public.revenue_entries
language plpgsql security definer set search_path = public
as $$
declare
  v_shop_id uuid;
  v_actor uuid := auth.uid();
  v_employee_id uuid;
  v_row public.revenue_entries;
begin
  v_shop_id := public.current_user_shop_id();
  if v_actor is null or v_shop_id is null then
    raise exception 'Unauthorized';
  end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if p_business_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Business date cannot be in the future';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_shop_id::text || ':' || p_business_date::text, 0));
  if public.is_day_closed(v_shop_id, p_business_date) then
    raise exception 'Business day is closed';
  end if;

  if public.is_admin() and p_employee_id is not null then
    v_employee_id := p_employee_id;
  else
    v_employee_id := v_actor;
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_employee_id and shop_id = v_shop_id and role = 'employee' and status = 'active'
  ) then
    raise exception 'Invalid employee';
  end if;

  insert into public.revenue_entries (
    shop_id, employee_id, amount, payment_method, service_name, note,
    business_date, performed_at, status, idempotency_key, created_by
  ) values (
    v_shop_id, v_employee_id, p_amount, p_payment_method,
    nullif(trim(p_service_name), ''), nullif(trim(p_note), ''),
    p_business_date, now(), 'recorded', p_idempotency_key, v_actor
  )
  on conflict (shop_id, idempotency_key) do update
    set updated_at = public.revenue_entries.updated_at
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.close_business_day(p_business_date date)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_shop_id uuid := public.current_user_shop_id();
  v_actor uuid := auth.uid();
  v_cash bigint := 0;
  v_bank bigint := 0;
  v_total bigint := 0;
  v_count integer := 0;
  v_id uuid;
begin
  if not public.is_admin() then raise exception 'Only admins can close a business day'; end if;
  if p_business_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Cannot close a future business date';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_shop_id::text || ':' || p_business_date::text, 0));
  select coalesce(sum(case when payment_method = 'cash' then amount else 0 end), 0),
         coalesce(sum(case when payment_method = 'bank_transfer' then amount else 0 end), 0),
         coalesce(sum(amount), 0), count(*)
    into v_cash, v_bank, v_total, v_count
    from public.revenue_entries
   where shop_id = v_shop_id and business_date = p_business_date and status = 'recorded';

  insert into public.daily_closings (
    shop_id, business_date, cash_total, bank_transfer_total, revenue_total,
    transaction_count, closed_by, closed_at, is_closed, updated_at
  ) values (
    v_shop_id, p_business_date, v_cash, v_bank, v_total, v_count,
    v_actor, now(), true, now()
  ) on conflict (shop_id, business_date) do update set
    cash_total = excluded.cash_total,
    bank_transfer_total = excluded.bank_transfer_total,
    revenue_total = excluded.revenue_total,
    transaction_count = excluded.transaction_count,
    closed_by = excluded.closed_by,
    closed_at = excluded.closed_at,
    is_closed = true,
    reopened_by = null,
    reopened_at = null,
    reopen_reason = null,
    updated_at = now()
  returning id into v_id;

  insert into public.audit_logs (shop_id, actor_id, action, entity_type, entity_id, new_data)
  values (v_shop_id, v_actor, 'DAY_CLOSED', 'daily_closings', v_id,
          jsonb_build_object('business_date', p_business_date, 'revenue_total', v_total, 'transaction_count', v_count));

  return jsonb_build_object('success', true, 'cash_total', v_cash, 'bank_transfer_total', v_bank,
                            'revenue_total', v_total, 'transaction_count', v_count);
end;
$$;

create or replace function public.reopen_business_day(p_business_date date, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_shop_id uuid := public.current_user_shop_id();
  v_actor uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'Only admins can reopen a business day'; end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'A reopen reason is required'; end if;

  update public.daily_closings
     set is_closed = false, reopened_by = v_actor, reopened_at = now(),
         reopen_reason = trim(p_reason), updated_at = now()
   where shop_id = v_shop_id and business_date = p_business_date;
  if not found then raise exception 'Business closing not found'; end if;

  insert into public.audit_logs (shop_id, actor_id, action, entity_type, new_data)
  values (v_shop_id, v_actor, 'DAY_REOPENED', 'daily_closings',
          jsonb_build_object('business_date', p_business_date, 'reason', trim(p_reason)));
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.generate_monthly_payroll(p_payroll_month date)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_shop_id uuid := public.current_user_shop_id();
  v_actor uuid := auth.uid();
  v_emp record;
  v_start date := date_trunc('month', p_payroll_month)::date;
  v_end date := (date_trunc('month', p_payroll_month) + interval '1 month')::date;
  v_revenue bigint;
  v_commission bigint;
  v_count integer := 0;
begin
  if not public.is_admin() then raise exception 'Only admins can generate payroll'; end if;
  for v_emp in
    select p.id as employee_id,
           coalesce(ss.base_salary, 0) as base_salary,
           coalesce(ss.allowance, 0) as allowance,
           coalesce(ss.commission_rate, 0) as commission_rate
      from public.profiles p
      left join lateral (
        select s.base_salary, s.allowance, s.commission_rate
          from public.salary_settings s
         where s.shop_id = v_shop_id and s.employee_id = p.id
           and s.effective_from <= v_end
           and (s.effective_to is null or s.effective_to >= v_start)
         order by s.effective_from desc, s.created_at desc
         limit 1
      ) ss on true
     where p.shop_id = v_shop_id and p.role = 'employee' and p.status = 'active'
  loop
    select coalesce(sum(amount), 0) into v_revenue
      from public.revenue_entries
     where shop_id = v_shop_id and employee_id = v_emp.employee_id
       and business_date >= v_start and business_date < v_end and status = 'recorded';
    v_commission := round((v_revenue * v_emp.commission_rate) / 100.0);

    insert into public.payrolls (
      shop_id, employee_id, payroll_month, base_salary, allowance, eligible_revenue,
      commission_rate, commission_amount, total_salary, status, generated_by, generated_at
    ) values (
      v_shop_id, v_emp.employee_id, v_start, v_emp.base_salary, v_emp.allowance,
      v_revenue, v_emp.commission_rate, v_commission,
      v_emp.base_salary + v_emp.allowance + v_commission, 'draft', v_actor, now()
    ) on conflict (shop_id, employee_id, payroll_month) do update set
      base_salary = excluded.base_salary,
      allowance = excluded.allowance,
      eligible_revenue = excluded.eligible_revenue,
      commission_rate = excluded.commission_rate,
      commission_amount = excluded.commission_amount,
      total_salary = excluded.total_salary,
      generated_by = v_actor,
      generated_at = now(),
      updated_at = now()
      where public.payrolls.status = 'draft';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.lock_payroll(p_payroll_month date)
returns integer language plpgsql security definer set search_path = public as $$
declare v_shop_id uuid := public.current_user_shop_id(); v_actor uuid := auth.uid(); v_count integer;
begin
  if not public.is_admin() then raise exception 'Only admins can lock payroll'; end if;
  update public.payrolls set status = 'locked', locked_by = v_actor, locked_at = now(), updated_at = now()
   where shop_id = v_shop_id and payroll_month = date_trunc('month', p_payroll_month)::date and status = 'draft';
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'No draft payroll rows to lock'; end if;
  insert into public.audit_logs (shop_id, actor_id, action, entity_type, new_data)
  values (v_shop_id, v_actor, 'PAYROLL_LOCKED', 'payrolls', jsonb_build_object('payroll_month', date_trunc('month', p_payroll_month)::date));
  return v_count;
end; $$;

create or replace function public.publish_payroll(p_payroll_month date)
returns integer language plpgsql security definer set search_path = public as $$
declare v_shop_id uuid := public.current_user_shop_id(); v_actor uuid := auth.uid(); v_count integer;
begin
  if not public.is_admin() then raise exception 'Only admins can publish payroll'; end if;
  update public.payrolls set status = 'published', published_at = now(), updated_at = now()
   where shop_id = v_shop_id and payroll_month = date_trunc('month', p_payroll_month)::date and status = 'locked';
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'Payroll must be locked before publishing'; end if;
  insert into public.notifications (shop_id, recipient_id, type, title, message, data)
  select v_shop_id, p.employee_id, 'PAYROLL_PUBLISHED', 'Bảng lương đã được công bố',
         'Bảng lương của bạn đã được công bố trên hệ thống.',
         jsonb_build_object('url', '/employee/payroll', 'payroll_month', date_trunc('month', p_payroll_month)::date)
    from public.payrolls p
   where p.shop_id = v_shop_id and p.payroll_month = date_trunc('month', p_payroll_month)::date and p.status = 'published';
  insert into public.audit_logs (shop_id, actor_id, action, entity_type, new_data)
  values (v_shop_id, v_actor, 'PAYROLL_PUBLISHED', 'payrolls', jsonb_build_object('payroll_month', date_trunc('month', p_payroll_month)::date));
  return v_count;
end; $$;

create or replace function public.mark_payroll_paid(p_payroll_month date, p_employee_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_shop_id uuid := public.current_user_shop_id(); v_actor uuid := auth.uid(); v_count integer;
begin
  if not public.is_admin() then raise exception 'Only admins can mark payroll paid'; end if;
  update public.payrolls set status = 'paid', paid_at = now(), updated_at = now()
   where shop_id = v_shop_id and payroll_month = date_trunc('month', p_payroll_month)::date
     and (p_employee_id is null or employee_id = p_employee_id) and status = 'published';
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'Only published payroll can be marked paid'; end if;
  insert into public.audit_logs (shop_id, actor_id, action, entity_type, new_data)
  values (v_shop_id, v_actor, 'PAYROLL_PAID', 'payrolls', jsonb_build_object('payroll_month', date_trunc('month', p_payroll_month)::date, 'employee_id', p_employee_id));
  return v_count;
end; $$;

-- Replace permissive policies with explicit authenticated policies.
drop policy if exists "Profiles viewable by admin or self" on public.profiles;
create policy "Profiles viewable by admin or self" on public.profiles
  for select to authenticated
  using (shop_id = public.current_user_shop_id() and (public.is_admin() or id = auth.uid()));

drop policy if exists "Profiles updatable by admin or self" on public.profiles;
create policy "Profiles updatable by admin or self" on public.profiles
  for update to authenticated
  using (shop_id = public.current_user_shop_id() and (public.is_admin() or id = auth.uid()))
  with check (shop_id = public.current_user_shop_id() and (public.is_admin() or id = auth.uid()));

drop policy if exists "Revenue insertable by admin or self" on public.revenue_entries;
create policy "Revenue insertable by admin or self" on public.revenue_entries
  for insert to authenticated
  with check (
    shop_id = public.current_user_shop_id()
    and (public.is_admin() or (employee_id = auth.uid() and created_by = auth.uid()))
    and not public.is_day_closed(shop_id, business_date)
  );

drop policy if exists "Revenue updatable by admin or self before close" on public.revenue_entries;
create policy "Revenue updatable by admin or self before close" on public.revenue_entries
  for update to authenticated
  using (shop_id = public.current_user_shop_id() and not public.is_day_closed(shop_id, business_date)
         and (public.is_admin() or (employee_id = auth.uid() and status = 'recorded')))
  with check (shop_id = public.current_user_shop_id() and not public.is_day_closed(shop_id, business_date));

drop policy if exists "Notifications updatable by recipient" on public.notifications;
create policy "Notifications updatable by recipient" on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists "Salary settings managed by admin" on public.salary_settings;
create policy "Salary settings managed by admin" on public.salary_settings
  for all to authenticated
  using (shop_id = public.current_user_shop_id() and public.is_admin())
  with check (shop_id = public.current_user_shop_id() and public.is_admin());

drop policy if exists "Payrolls managed by admin" on public.payrolls;
create policy "Payrolls managed by admin" on public.payrolls
  for all to authenticated
  using (shop_id = public.current_user_shop_id() and public.is_admin())
  with check (shop_id = public.current_user_shop_id() and public.is_admin());

revoke all on function public.record_revenue(date, bigint, public.payment_method, text, text, uuid, uuid) from public, anon;
revoke all on function public.current_user_shop_id() from public, anon;
revoke all on function public.current_user_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_day_closed(uuid, date) from public, anon;
revoke all on function public.close_business_day(date) from public, anon;
revoke all on function public.reopen_business_day(date, text) from public, anon;
revoke all on function public.lock_payroll(date) from public, anon;
revoke all on function public.publish_payroll(date) from public, anon;
revoke all on function public.mark_payroll_paid(date, uuid) from public, anon;
grant execute on function public.record_revenue(date, bigint, public.payment_method, text, text, uuid, uuid) to authenticated;
grant execute on function public.current_user_shop_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_day_closed(uuid, date) to authenticated;
grant execute on function public.close_business_day(date) to authenticated;
grant execute on function public.reopen_business_day(date, text) to authenticated;
grant execute on function public.generate_monthly_payroll(date) to authenticated;
grant execute on function public.lock_payroll(date) to authenticated;
grant execute on function public.publish_payroll(date) to authenticated;
grant execute on function public.mark_payroll_paid(date, uuid) to authenticated;

commit;
