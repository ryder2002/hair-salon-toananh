# Hướng Dẫn Triển Khai Toàn Anh Hair Salon Lên Vercel

Tài liệu hướng dẫn chi tiết các bước đưa ứng dụng PWA **Toàn Anh Hair Salon** lên hạ tầng Vercel & Supabase.

---

## 📋 Bước 1: Chuẩn Bị Mã Nguồn trên GitHub

1. Đảm bảo file `.gitignore` đã chặn các file chứa mật khẩu nhạy cảm (`.env.local`, `.env`, `node_modules`, `.next`).
2. Khởi tạo commit và đẩy mã nguồn lên GitHub:
   ```bash
   git add .
   git commit -m "Initial commit - Toàn Anh Hair Salon PWA"
   git branch -M main
   git remote add origin https://github.com/USERNAME/toan-anh-hair-salon.git
   git push -u origin main
   ```

---

## 🗄 Bước 2: Khởi Tạo Cơ Sở Dữ Liệu Supabase

1. Đăng nhập [Supabase Dashboard](https://supabase.com) và tạo một Project mới tên `toan-anh-hair-salon`.
2. Vào mục **SQL Editor** trên Supabase Dashboard.
3. Mở file [supabase/migrations/20260730000000_init_barbershop_schema.sql](file:///d:/BarberShop/supabase/migrations/20260730000000_init_barbershop_schema.sql) trong dự án, copy toàn bộ nội dung SQL và nhấn **Run** để khởi tạo 9 bảng dữ liệu + RLS policies + Stored Procedures.
4. Mở file [supabase/seed.sql](file:///d:/BarberShop/supabase/seed.sql), copy nội dung và nhấn **Run** để nạp dữ liệu tài khoản Admin `dinhcongnhat` (mật khẩu `10122002`).

---

## 🚀 Bước 3: Triển Khai Lên Vercel

1. Truy cập [Vercel Dashboard](https://vercel.com) và đăng nhập.
2. Nhấn **Add New...** -> **Project**.
3. Chọn Repository GitHub `toan-anh-hair-salon` vừa đẩy lên.
4. Tại mục **Environment Variables**, điền đầy đủ các biến môi trường sau:

| Tên biến (Key) | Giá trị (Value) mẫu |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `https://toan-anh-hair-salon.vercel.app` (URL Vercel của bạn) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<YOUR_PROJECT_REF>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `<YOUR_SUPABASE_ANON_KEY>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<YOUR_SUPABASE_SERVICE_ROLE_KEY>` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BEl62iUYgUivxIkv69yViEuiBIa-m9GYv50D15bS-16m_k8w6Q01` |
| `VAPID_PRIVATE_KEY` | `<YOUR_VAPID_PRIVATE_KEY>` |
| `VAPID_SUBJECT` | `mailto:admin@toananhhairsalon.com` |

5. Nhấn nút **Deploy**. Vercel sẽ tự động build sản phẩm trong khoảng 30 - 60 giây.

---

## 📱 Bước 4: Kiểm Tra PWA & Cài Đặt Ứng Dụng trên Production

1. Mở trang web Vercel sản phẩm trên trình duyệt (ví dụ: `https://toan-anh-hair-salon.vercel.app`).
2. Trên Laptop: Nhấn nút **"CÀI ĐẶT TOÀN ANH HAIR SALON"** trên Banner hoặc icon Cài đặt ở thanh địa chỉ trình duyệt Chrome/Edge để tải ứng dụng về máy.
3. Trên Điện thoại (iPhone / Android): Mở Safari / Chrome, chọn **Thêm vào màn hình chính (Add to Home Screen)**.
4. Đăng nhập hệ thống:
   - **Tài khoản Admin**: Username `dinhcongnhat` | Pass `10122002` -> Vào trang Quản lý Admin.
   - **Tài khoản Nhân viên**: Username `minhquan` | Pass `10122002` -> Vào trang Ghi doanh thu & Phiếu lương Nhân viên.
