-- Migration: Clear all data keeping only seed shop & admin profile

truncate table public.revenue_entries cascade;
truncate table public.daily_closings cascade;
truncate table public.payrolls cascade;
truncate table public.salary_settings cascade;
truncate table public.notifications cascade;
truncate table public.push_subscriptions cascade;
truncate table public.audit_logs cascade;

-- Remove non-admin profiles
delete from public.profiles where role != 'admin';

-- Ensure shop exists
insert into public.shops (id, name, timezone, currency)
values ('11111111-1111-1111-1111-111111111111', 'Toàn Anh Hair Salon', 'Asia/Ho_Chi_Minh', 'VND')
on conflict (id) do update set name = excluded.name;

-- Ensure admin profile exists
insert into public.profiles (id, shop_id, full_name, email, phone, job_title, role, status, must_change_password)
values ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Đinh Công Nhật (Admin)', 'admin@barbershop.com', '0901234567', 'Chủ tiệm / Admin', 'admin', 'active', false)
on conflict (id) do update set full_name = excluded.full_name, role = 'admin', status = 'active';
