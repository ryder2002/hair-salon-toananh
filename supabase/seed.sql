-- Clean and Seed Database for Barbershop Manager

-- 1. Insert Shop
insert into public.shops (id, name, timezone, currency)
values ('11111111-1111-1111-1111-111111111111', 'Toàn Anh Hair Salon', 'Asia/Ho_Chi_Minh', 'VND')
on conflict (id) do update set name = excluded.name;

-- 2. Insert Profiles
-- Admin: dinhcongnhat / 10122002
insert into public.profiles (id, shop_id, full_name, email, phone, job_title, role, status, must_change_password, avatar_url)
values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Đinh Công Nhật', 'dinhcongnhat@barbershop.com', '0901234567', 'Chủ tiệm / Admin', 'admin', 'active', false, null),
  ('e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Minh Quân', 'minhquan@barbershop.com', '0912345678', 'Quản lý', 'employee', 'active', false, null),
  ('e0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Hoàng Long', 'hoanglong@barbershop.com', '0923456789', 'Thợ cắt tóc', 'employee', 'active', false, null),
  ('e0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Đức Anh', 'ducanh@barbershop.com', '0934567890', 'Thợ cắt tóc', 'employee', 'active', false, null),
  ('e0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Bảo Nam', 'baonam@barbershop.com', '0945678901', 'Thợ cắt tóc', 'employee', 'active', false, null),
  ('e0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Tấn Phát', 'tanphat@barbershop.com', '0956789012', 'Thợ cắt tóc', 'employee', 'inactive', false, null)
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  status = excluded.status;

-- 3. Salary Settings
insert into public.salary_settings (shop_id, employee_id, base_salary, allowance, commission_rate, effective_from, created_by)
values
  ('11111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000001', 8000000, 1000000, 10.0, '2024-01-01', 'a0000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000002', 8000000, 800000, 10.0, '2024-01-01', 'a0000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000003', 6000000, 500000, 8.0, '2024-01-01', 'a0000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000004', 6000000, 500000, 8.0, '2024-01-01', 'a0000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- 4. Initial Notifications
insert into public.notifications (shop_id, recipient_id, type, title, message, read_at, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'REVENUE_RECORDED', 'Nhân viên đã ghi nhận doanh thu', 'Minh Quân đã ghi nhận doanh thu 5.250.000 đ vào 09:35', null, now() - interval '5 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'DAY_CLOSED', 'Đã hoàn tất chốt ngày', 'Chốt ngày 21/05/2025 đã được hoàn tất vào 21:10', null, now() - interval '2 hours'),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'PAYROLL_PUBLISHED', 'Đã công bố bảng lương', 'Bảng lương kỳ 2 (11/05 – 20/05) đã được công bố', null, now() - interval '3 hours')
on conflict do nothing;
