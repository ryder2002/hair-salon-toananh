begin;

create or replace function public.get_employee_dashboard(p_business_date date, p_month_start date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_shop_id uuid := public.current_user_shop_id();
  v_employee_id uuid := auth.uid();
  v_today_entries jsonb;
  v_month_total bigint;
  v_unread_count integer;
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'amount', amount,
      'payment_method', payment_method,
      'service_name', service_name,
      'note', note,
      'business_date', business_date,
      'performed_at', performed_at,
      'status', status
    ) order by performed_at desc
  ), '[]'::jsonb)
  into v_today_entries
  from public.revenue_entries
  where shop_id = v_shop_id and employee_id = v_employee_id and business_date = p_business_date;

  select coalesce(sum(amount), 0)
  into v_month_total
  from public.revenue_entries
  where shop_id = v_shop_id and employee_id = v_employee_id and status = 'recorded'
    and business_date >= p_month_start and business_date <= p_business_date;

  select count(*)
  into v_unread_count
  from public.notifications
  where recipient_id = v_employee_id and read_at is null;

  return jsonb_build_object(
    'today_entries', v_today_entries,
    'month_total', v_month_total,
    'unread_count', v_unread_count
  );
end; $$;

create or replace function public.get_admin_dashboard(p_business_date date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_shop_id uuid := public.current_user_shop_id();
  v_admin_id uuid := auth.uid();
  v_today_entries jsonb;
  v_employees jsonb;
  v_closing jsonb;
  v_unread_count integer;
begin
  if not public.is_admin() then raise exception 'Only admins can view admin dashboard'; end if;

  select coalesce(
    (select jsonb_agg(
      jsonb_build_object(
        'id', re.id,
        'amount', re.amount,
        'payment_method', re.payment_method,
        'service_name', re.service_name,
        'note', re.note,
        'business_date', re.business_date,
        'performed_at', re.performed_at,
        'status', re.status,
        'employee_id', re.employee_id,
        'created_by', re.created_by,
        'profiles', jsonb_build_object(
          'full_name', p.full_name,
          'avatar_url', p.avatar_url
        )
      ) order by re.performed_at desc
    )
    from public.revenue_entries re
    left join public.profiles p on re.employee_id = p.id
    where re.shop_id = v_shop_id and re.business_date = p_business_date)
  , '[]'::jsonb)
  into v_today_entries;

  select coalesce(
    (select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'full_name', full_name
      )
    )
    from public.profiles
    where shop_id = v_shop_id and role = 'employee' and status = 'active')
  , '[]'::jsonb)
  into v_employees;

  select to_jsonb(dc)
  into v_closing
  from public.daily_closings dc
  where shop_id = v_shop_id and business_date = p_business_date;

  select count(*)
  into v_unread_count
  from public.notifications
  where recipient_id = v_admin_id and read_at is null;

  return jsonb_build_object(
    'today_entries', v_today_entries,
    'employees', v_employees,
    'closing', v_closing,
    'unread_count', v_unread_count
  );
end; $$;

revoke all on function public.get_employee_dashboard(date, date) from public, anon;
grant execute on function public.get_employee_dashboard(date, date) to authenticated;

revoke all on function public.get_admin_dashboard(date) from public, anon;
grant execute on function public.get_admin_dashboard(date) to authenticated;

commit;
