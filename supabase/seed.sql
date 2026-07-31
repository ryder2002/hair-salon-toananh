-- Clean and Seed Database for Barbershop Manager (Seed Admin Only)

-- 1. Insert Shop
insert into public.shops (id, name, timezone, currency)
values ('11111111-1111-1111-1111-111111111111', 'Toàn Anh Hair Salon', 'Asia/Ho_Chi_Minh', 'VND')
on conflict (id) do update set name = excluded.name;

-- 2. Insert Admin Profiles Only (admin / admin123 & dinhcongnhat / 10122002)
insert into public.profiles (id, shop_id, full_name, email, phone, job_title, role, status, must_change_password, avatar_url)
values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Đinh Công Nhật (Admin)', 'dinhcongnhat@barbershop.com', '0901234567', 'Chủ tiệm / Admin', 'admin', 'active', false, null)
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  status = excluded.status;

