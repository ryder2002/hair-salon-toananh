begin;

create or replace function public.unlock_payroll(p_payroll_month date)
returns integer language plpgsql security definer set search_path = public as $$
declare 
  v_shop_id uuid := public.current_user_shop_id(); 
  v_actor uuid := auth.uid(); 
  v_count integer;
begin
  if not public.is_admin() then raise exception 'Only admins can unlock payroll'; end if;
  
  -- We allow unlocking from 'locked' or 'published'. 
  -- We do not allow unlocking from 'paid' unless specified, to avoid accounting mess.
  update public.payrolls 
  set status = 'draft', locked_by = null, locked_at = null, published_at = null, updated_at = now()
  where shop_id = v_shop_id 
    and payroll_month = date_trunc('month', p_payroll_month)::date 
    and status in ('locked', 'published');
    
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'No locked or published payroll rows to unlock'; end if;
  
  insert into public.audit_logs (shop_id, actor_id, action, entity_type, new_data)
  values (v_shop_id, v_actor, 'PAYROLL_UNLOCKED', 'payrolls', jsonb_build_object('payroll_month', date_trunc('month', p_payroll_month)::date));
  
  return v_count;
end; $$;

revoke all on function public.unlock_payroll(date) from public, anon;
grant execute on function public.unlock_payroll(date) to authenticated;

commit;
