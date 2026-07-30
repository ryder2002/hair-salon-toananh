# Toàn Anh Hair Salon - Mobile-First PWA

Ứng dụng PWA quản lý doanh thu, nhân viên và bảng lương cho **Toàn Anh Hair Salon**.

> 📖 **Xem Hướng Dẫn Triển Khai Vercel**: [DEPLOY_VERCEL.md](file:///d:/BarberShop/DEPLOY_VERCEL.md)

## 1. Công nghệ chính
- **Framework**: Next.js App Router (TypeScript strict mode)
- **Styling**: Tailwind CSS với hệ thống 3 màu chủ đạo:
  - Burgundy (Đỏ đô): `#741F2C`
  - Cream (Trắng kem): `#F7F3EC`
  - Charcoal (Đen than): `#171717`
- **Database & Auth**: Supabase PostgreSQL + Auth + Realtime + PostgreSQL RLS
- **Offline Storage**: IndexedDB (`idb`) cho offline revenue queue
- **Testing**: Vitest

## 2. Hướng dẫn chạy thử nghiệm tại Local

### Cài đặt dependencies:
```bash
npm install
```

### Khởi chạy môi trường Dev:
```bash
npm run dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

### Chạy Unit Test:
```bash
npm test
```

### Kiểm tra TypeCheck:
```bash
npm run typecheck
```

## 3. Cấu hình Supabase & Database Setup

1. Mở SQL Editor trên Supabase Dashboard hoặc Supabase CLI.
2. Chạy migration tại file `supabase/migrations/20260730000000_init_barbershop_schema.sql`.
3. Nạp dữ liệu seed thử nghiệm tại file `supabase/seed.sql`.
4. Điền các thông tin trong file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<YOUR_ANON_KEY>
   SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
   ```

## 4. Các màn hình chính (Pixel-Perfect theo thiết kế)
- **Dashboard Tổng quan Admin** (`/admin`): 4 thẻ KPI, Doanh thu nhân viên, Giao dịch mới nhất, Thẻ Chốt ngày.
- **Màn hình Thông báo** (`/admin/notifications`): Dải viền đỏ chỉ định thông báo mới, phân loại icon, đánh dấu đã đọc.
- **Quản lý doanh thu** (`/admin/revenue`): Bộ lọc status/nhân viên/phương thức thanh toán, danh sách card giao dịch kèm icon Kéo/Lược/Ria mép, badge Hoàn thành/Đã hủy, Nút chốt ngày.
- **Quản lý nhân viên** (`/admin/employees`): Danh sách thợ cắt tóc, avatar initials/ảnh, status Đang hoạt động/Tạm khóa.
- **Quản lý bảng lương** (`/admin/payroll`): Tabs Bảng lương / Cài đặt lương, Bảng tổng hợp lương thợ, Nút Xuất Excel & Tạo bảng lương, Lịch sử bảng lương.
- **Giao diện Employee/User** (`/employee` & `/employee/revenue/new`): Trang chủ cá nhân, Form ghi doanh thu tối ưu bàn phím số mobile, tự động tạo idempotency key & offline queue khi mất mạng.
