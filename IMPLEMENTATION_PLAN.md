Bạn là một Senior Full-stack Engineer và Product Designer. Hãy xây dựng hoàn chỉnh một webapp PWA mobile-first dùng để quản lý doanh thu, nhân viên và bảng lương cho một tiệm tóc nam/barbershop.

Không chỉ tạo giao diện demo. Hãy xây dựng ứng dụng hoạt động thực tế, có authentication, database, Row Level Security, migration, validation, realtime, PWA, offline queue, thông báo và tài liệu triển khai.

# 1. Mục tiêu sản phẩm

Hiện tại nhân viên tiệm tóc ghi doanh thu vào sổ, bao gồm:

* Số tiền.
* Phương thức thanh toán.
* Tiền mặt hoặc chuyển khoản.
* Ngày và giờ.
* Người thực hiện.
* Ghi chú hoặc tên dịch vụ nếu có.

Ứng dụng cần thay thế việc ghi sổ bằng một PWA tối ưu cho điện thoại.

Ứng dụng có hai vai trò:

* Admin.
* Employee.

Admin quản lý nhân viên, doanh thu, thông báo và bảng lương.

Employee nhập doanh thu và chỉ được xem dữ liệu của chính mình.

Ứng dụng sử dụng múi giờ nghiệp vụ `Asia/Ho_Chi_Minh` và định dạng tiền Việt Nam VND.

# 2. Công nghệ bắt buộc

Sử dụng các phiên bản stable mới nhất tương thích với nhau:

* Next.js App Router.
* React.
* TypeScript strict mode.
* Tailwind CSS.
* Supabase PostgreSQL.
* Supabase Auth.
* Supabase Realtime.
* PostgreSQL Row Level Security.
* Zod để validate dữ liệu.
* React Hook Form cho biểu mẫu.
* date-fns hoặc thư viện tương đương để xử lý ngày.
* IndexedDB bằng thư viện `idb` hoặc giải pháp nhẹ tương đương cho offline queue.
* Vitest cho unit test.
* Playwright cho end-to-end test.

Có thể sử dụng shadcn/ui nhưng phải tùy biến hoàn toàn theo giao diện barbershop, không giữ nguyên giao diện mặc định.

Không sử dụng thư viện đã lỗi thời hoặc không tương thích với phiên bản Next.js đang cài đặt.

# 3. Nguyên tắc thực hiện

* Không tạo mock UI rồi dừng lại.
* Không hard-code dữ liệu nghiệp vụ.
* Không dùng dữ liệu giả trong production flow.
* Tạo đầy đủ migration SQL.
* Tạo đầy đủ RLS policies.
* Tạo seed script phục vụ development.
* Tạo file `.env.example`.
* Tạo README hướng dẫn cài đặt và triển khai.
* Mọi mutation quan trọng phải được validate ở server.
* Không tin tưởng role hoặc employee_id được gửi từ client.
* Lấy user hiện tại từ authenticated session.
* `SUPABASE_SERVICE_ROLE_KEY` chỉ được sử dụng phía server.
* Không expose service role key trong browser bundle.
* Không sử dụng floating point để lưu tiền.
* Số tiền VND phải được lưu dưới dạng `bigint` hoặc `numeric` không có phần thập phân.
* Mọi ngày nghiệp vụ phải được tính theo `Asia/Ho_Chi_Minh`.
* Các thao tác sửa, hủy, mở khóa và chốt dữ liệu phải được ghi vào audit log.

# 4. Phối màu và thiết kế

Chỉ sử dụng ba màu chủ đạo:

* Burgundy/đỏ đô: `#741F2C`.
* Cream/trắng kem: `#F7F3EC`.
* Charcoal/đen than: `#171717`.

Có thể dùng các biến thể opacity hoặc gray trung tính được tạo từ ba màu trên, nhưng không bổ sung màu accent xanh, tím, cam hoặc vàng.

Yêu cầu:

* Mobile-first.
* Thiết kế theo phong cách barbershop nam tính, cổ điển, cao cấp và tối giản.
* Không dùng gradient.
* Không sử dụng quá nhiều shadow.
* Card có border mảnh.
* Border radius từ 10px đến 14px.
* Button chính màu đỏ đô.
* Button phụ dạng outline.
* Typography rõ ràng, số tiền phải nổi bật.
* Có thể sử dụng biểu tượng kéo, lược hoặc dao cạo dạng line-art.
* Không dùng hình cột barber nhiều màu.
* Khoảng cách các thành phần đủ lớn để thao tác bằng ngón tay.
* Chiều cao button tối thiểu 44px.
* Input số tiền phải mở bàn phím số trên điện thoại.
* Đảm bảo độ tương phản đạt WCAG AA.
* Không chỉ dùng màu sắc để biểu thị trạng thái; phải có text hoặc icon.
* Responsive tốt từ 320px đến desktop.

Tạo CSS variables:

```css
:root {
  --background: #f7f3ec;
  --foreground: #171717;
  --primary: #741f2c;
  --primary-foreground: #ffffff;
  --card: #ffffff;
  --border: rgba(23, 23, 23, 0.14);
  --muted: rgba(23, 23, 23, 0.06);
}
```

# 5. Cấu trúc phân quyền

## 5.1. Admin

Admin được phép:

* Xem dashboard toàn bộ tiệm.
* Xem mọi khoản doanh thu.
* Lọc doanh thu theo ngày, tháng, nhân viên và phương thức thanh toán.
* Tạo tài khoản nhân viên.
* Chỉnh sửa thông tin nhân viên.
* Khóa hoặc mở tài khoản nhân viên.
* Reset mật khẩu nhân viên bằng flow an toàn.
* Xem, chỉnh sửa và hủy giao dịch doanh thu.
* Chốt hoặc mở lại doanh thu theo ngày.
* Thiết lập lương.
* Tạo và chốt bảng lương.
* Công bố bảng lương cho nhân viên.
* Đánh dấu bảng lương đã thanh toán.
* Nhận thông báo realtime.
* Xem audit log.

## 5.2. Employee

Employee được phép:

* Đăng nhập bằng tài khoản Admin cấp.
* Đổi mật khẩu.
* Xem hồ sơ của chính mình.
* Nhập doanh thu cho chính mình.
* Xem các khoản doanh thu do chính mình tạo.
* Xem tổng doanh thu hôm nay của chính mình.
* Xem tổng doanh thu tháng này của chính mình.
* Sửa giao dịch của mình nếu ngày chưa chốt.
* Không được đổi `employee_id` của giao dịch.
* Không được xóa giao dịch.
* Không được sửa giao dịch đã bị hủy.
* Không được sửa dữ liệu thuộc ngày đã chốt.
* Xem bảng lương của mình khi trạng thái là `published` hoặc `paid`.
* Không được xem doanh thu, lương hoặc hồ sơ riêng tư của nhân viên khác.

Employee không được tự đăng ký. Chỉ Admin mới có thể tạo tài khoản Employee.

# 6. Database schema

Tạo extension cần thiết như `pgcrypto`.

Tạo enum hoặc check constraint phù hợp cho:

```text
user_role:
- admin
- employee

profile_status:
- active
- inactive

payment_method:
- cash
- bank_transfer

revenue_status:
- recorded
- voided

payroll_status:
- draft
- locked
- published
- paid
```

## 6.1. Bảng shops

Các trường:

```text
id uuid primary key
name text not null
timezone text not null default 'Asia/Ho_Chi_Minh'
currency text not null default 'VND'
created_at timestamptz not null
updated_at timestamptz not null
```

Ứng dụng MVP chỉ có một tiệm, nhưng vẫn dùng `shop_id` để có thể mở rộng sau này.

## 6.2. Bảng profiles

```text
id uuid primary key references auth.users(id)
shop_id uuid not null references shops(id)
full_name text not null
email text
phone text
job_title text
role user_role not null
status profile_status not null default 'active'
must_change_password boolean not null default true
avatar_url text
created_at timestamptz not null
updated_at timestamptz not null
```

Tạo index cho:

```text
shop_id
role
status
```

## 6.3. Bảng revenue_entries

```text
id uuid primary key
shop_id uuid not null references shops(id)
employee_id uuid not null references profiles(id)
amount bigint not null
payment_method payment_method not null
service_name text
note text
business_date date not null
performed_at timestamptz not null
status revenue_status not null default 'recorded'
idempotency_key uuid not null
created_by uuid not null references profiles(id)
created_at timestamptz not null
updated_at timestamptz not null
voided_at timestamptz
voided_by uuid references profiles(id)
void_reason text
```

Constraints:

* `amount > 0`.
* `business_date` không được nằm trong tương lai theo `Asia/Ho_Chi_Minh`.
* `idempotency_key` phải unique theo shop.
* Employee chỉ được tạo giao dịch có `employee_id` bằng chính user hiện tại.
* Nếu Admin nhập thay nhân viên thì lưu Admin trong `created_by`.
* Khi status là `voided`, bắt buộc có `voided_at`, `voided_by` và `void_reason`.
* Không hard delete doanh thu.

Tạo index:

```text
(shop_id, business_date)
(shop_id, employee_id, business_date)
(shop_id, payment_method, business_date)
(shop_id, created_at desc)
```

## 6.4. Bảng daily_closings

```text
id uuid primary key
shop_id uuid not null references shops(id)
business_date date not null
cash_total bigint not null
bank_transfer_total bigint not null
revenue_total bigint not null
transaction_count integer not null
closed_by uuid not null references profiles(id)
closed_at timestamptz not null
reopened_by uuid references profiles(id)
reopened_at timestamptz
reopen_reason text
is_closed boolean not null default true
created_at timestamptz not null
updated_at timestamptz not null
```

Unique constraint:

```text
(shop_id, business_date)
```

Không tin tưởng các giá trị tổng từ client. Khi chốt ngày, server hoặc database function phải tự tính lại tổng từ `revenue_entries`.

## 6.5. Bảng salary_settings

```text
id uuid primary key
shop_id uuid not null references shops(id)
employee_id uuid not null references profiles(id)
base_salary bigint not null default 0
allowance bigint not null default 0
commission_rate numeric(5,2) not null default 0
effective_from date not null
effective_to date
created_by uuid not null references profiles(id)
created_at timestamptz not null
updated_at timestamptz not null
```

Constraints:

* `base_salary >= 0`.
* `allowance >= 0`.
* `commission_rate >= 0`.
* `commission_rate <= 100`.
* Không cho phép khoảng thời gian thiết lập lương bị chồng lấn đối với cùng nhân viên.

## 6.6. Bảng payrolls

```text
id uuid primary key
shop_id uuid not null references shops(id)
employee_id uuid not null references profiles(id)
payroll_month date not null
base_salary bigint not null
allowance bigint not null
eligible_revenue bigint not null
commission_rate numeric(5,2) not null
commission_amount bigint not null
bonus bigint not null default 0
deduction bigint not null default 0
total_salary bigint not null
note text
status payroll_status not null default 'draft'
generated_by uuid not null references profiles(id)
generated_at timestamptz not null
locked_by uuid references profiles(id)
locked_at timestamptz
published_at timestamptz
paid_at timestamptz
created_at timestamptz not null
updated_at timestamptz not null
```

Unique constraint:

```text
(shop_id, employee_id, payroll_month)
```

`payroll_month` phải là ngày đầu tiên của tháng, ví dụ `2026-07-01`.

Công thức:

```text
commission_amount
= round(eligible_revenue * commission_rate / 100)

total_salary
= base_salary
+ allowance
+ commission_amount
+ bonus
- deduction
```

Không nhận `eligible_revenue`, `commission_amount` hoặc `total_salary` trực tiếp từ client.

Server phải tự tính các giá trị này.

Chỉ tính các giao dịch:

* Thuộc đúng nhân viên.
* Thuộc đúng tháng theo `business_date`.
* Có status `recorded`.
* Không bị void.

Khi payroll ở trạng thái `locked`, `published` hoặc `paid`, không tự động thay đổi số liệu snapshot.

Nếu doanh thu quá khứ bị thay đổi sau khi bảng lương đã khóa, tạo cảnh báo cho Admin thay vì tự sửa bảng lương.

## 6.7. Bảng notifications

```text
id uuid primary key
shop_id uuid not null references shops(id)
recipient_id uuid not null references profiles(id)
type text not null
title text not null
message text not null
data jsonb not null default '{}'
read_at timestamptz
created_at timestamptz not null
```

Tạo index:

```text
(recipient_id, read_at, created_at desc)
```

## 6.8. Bảng push_subscriptions

```text
id uuid primary key
user_id uuid not null references profiles(id)
endpoint text not null
p256dh text not null
auth text not null
user_agent text
created_at timestamptz not null
updated_at timestamptz not null
```

Endpoint phải unique.

Cho phép user tự đăng ký và xóa push subscription của chính mình.

## 6.9. Bảng audit_logs

```text
id uuid primary key
shop_id uuid not null references shops(id)
actor_id uuid references profiles(id)
action text not null
entity_type text not null
entity_id uuid
old_data jsonb
new_data jsonb
metadata jsonb not null default '{}'
created_at timestamptz not null
```

Audit log phải được tạo cho:

* Tạo nhân viên.
* Sửa nhân viên.
* Khóa nhân viên.
* Tạo doanh thu.
* Sửa doanh thu.
* Hủy doanh thu.
* Chốt ngày.
* Mở lại ngày.
* Thay đổi thiết lập lương.
* Tạo bảng lương.
* Khóa bảng lương.
* Công bố bảng lương.
* Đánh dấu đã thanh toán.

Không cho client tự insert audit log tùy ý.

# 7. Authentication

Sử dụng Supabase Auth email/password.

Admin tạo nhân viên thông qua server action hoặc route handler server-only.

Flow tạo nhân viên:

1. Xác minh user hiện tại là Admin.
2. Validate dữ liệu bằng Zod.
3. Dùng Supabase Admin API phía server để tạo auth user.
4. Tạo profile có role `employee`.
5. Gán cùng `shop_id` với Admin.
6. Đặt `must_change_password = true`.
7. Trả về kết quả an toàn, không trả service key.
8. Ghi audit log.

Không cho phép public sign-up.

Tạo middleware bảo vệ route:

```text
/auth/*
/admin/*
/employee/*
```

Sau khi đăng nhập:

* Admin chuyển tới `/admin`.
* Employee chuyển tới `/employee`.
* User inactive bị từ chối truy cập.
* User có `must_change_password = true` chuyển tới màn hình đổi mật khẩu.

# 8. RLS policies

Bật RLS cho toàn bộ bảng public.

Tạo helper function an toàn để lấy:

* Current user role.
* Current user shop ID.
* Kiểm tra current user có phải Admin không.
* Kiểm tra một ngày đã bị chốt hay chưa.

Không lấy quyền từ `raw_user_metadata` do người dùng có thể tự sửa metadata. Role chính thức phải nằm trong bảng `profiles` hoặc app metadata chỉ server có quyền thay đổi.

RLS cần đảm bảo:

## shops

* Admin và Employee chỉ đọc được shop của mình.
* Chỉ Admin được sửa shop.

## profiles

* Admin được đọc toàn bộ profiles trong shop.
* Admin được sửa employee trong shop.
* Employee chỉ được đọc hồ sơ của chính mình.
* Employee chỉ được cập nhật các trường cá nhân được cho phép.
* Employee không được tự đổi role, shop_id hoặc status.

## revenue_entries

Admin:

* Được select toàn bộ trong shop.
* Được insert thay nhân viên trong cùng shop.
* Được update hoặc void giao dịch.
* Không hard delete.

Employee:

* Chỉ select giao dịch có `employee_id = auth.uid()`.
* Chỉ insert giao dịch có `employee_id = auth.uid()`.
* `created_by` phải bằng `auth.uid()`.
* Không được insert cho shop khác.
* Chỉ update giao dịch của mình.
* Chỉ update khi ngày chưa chốt.
* Không được đổi employee_id, shop_id, created_by, status hoặc amount sang giá trị không hợp lệ.
* Không được void.
* Không được delete.

## daily_closings

* Admin được đọc, tạo và thay đổi.
* Employee chỉ được đọc trạng thái đóng/mở của ngày thuộc shop mình.

## salary_settings

* Admin được toàn quyền trong shop.
* Employee không được đọc cấu hình lương của người khác.
* Employee không cần được đọc trực tiếp bảng này.

## payrolls

* Admin được đọc và quản lý toàn bộ payroll trong shop.
* Employee chỉ được đọc payroll của mình khi status là `published` hoặc `paid`.
* Employee không được insert, update hoặc delete.

## notifications

* User chỉ đọc và đánh dấu đã đọc notification của chính mình.
* Notification hệ thống phải được tạo phía server hoặc database function.

## push_subscriptions

* User chỉ quản lý subscription của chính mình.

## audit_logs

* Chỉ Admin được đọc audit log trong shop.
* Không cho phép client tự sửa hoặc xóa audit log.

Viết test xác minh RLS. Không chỉ viết policy mà không kiểm tra.

# 9. Database functions và transaction

Tạo các PostgreSQL function hoặc server-side transaction cho các nghiệp vụ:

## close_business_day

Input:

```text
shop_id
business_date
```

Thực hiện:

1. Kiểm tra user là Admin.
2. Khóa nghiệp vụ cần thiết để tránh race condition.
3. Tính tổng các giao dịch status `recorded`.
4. Tính cash total.
5. Tính bank transfer total.
6. Tính transaction count.
7. Upsert daily closing.
8. Ghi audit log.
9. Trả về kết quả đã tính.

## reopen_business_day

Input:

```text
business_date
reason
```

Chỉ Admin được gọi.

Bắt buộc nhập lý do.

## generate_monthly_payroll

Input:

```text
payroll_month
employee_id optional
```

Thực hiện:

1. Kiểm tra Admin.
2. Lấy salary setting có hiệu lực.
3. Tính eligible revenue.
4. Tính commission.
5. Tính total salary.
6. Upsert payroll nếu status hiện tại là `draft`.
7. Không ghi đè payroll đã locked/published/paid.
8. Ghi audit log.
9. Trả về danh sách payroll.

## lock_payroll

Chuyển từ `draft` sang `locked`.

## publish_payroll

Chỉ cho phép từ `locked` sang `published`.

Tạo notification cho nhân viên khi bảng lương được công bố.

## mark_payroll_paid

Chỉ Admin được thực hiện.

Chuyển từ `published` sang `paid`.

Mọi hàm phải kiểm tra quyền ở server/database, không chỉ kiểm tra giao diện.

# 10. Luồng nhập doanh thu

Tạo form tối ưu cho mobile.

Các trường:

```text
amount
payment_method
business_date
performed_at
service_name optional
note optional
```

UX:

* Amount nằm đầu tiên.
* Input có `inputMode="numeric"`.
* Format tiền khi nhập.
* Không làm thay đổi giá trị số thực tế.
* Hai lựa chọn phương thức thanh toán dạng segmented control:

  * Tiền mặt.
  * Chuyển khoản.
* Ngày mặc định là hôm nay.
* Giờ mặc định là hiện tại.
* Có nút Lưu doanh thu cố định gần cuối màn hình.
* Sau khi lưu thành công hiển thị toast rõ ràng.
* Không cho double-submit.
* Tạo `idempotency_key` phía client trước khi submit.
* Server dùng idempotency key để tránh tạo giao dịch trùng.

Validate:

* Amount bắt buộc và lớn hơn 0.
* Không cho số âm.
* Không cho ngày trong tương lai.
* Payment method bắt buộc.
* Note có giới hạn ký tự.
* Service name có giới hạn ký tự.

Sau khi lưu:

1. Tạo revenue entry.
2. Tạo notification cho toàn bộ Admin đang active trong shop.
3. Broadcast sự kiện realtime.
4. Admin dashboard cập nhật mà không cần reload.
5. Hiển thị giao dịch trong lịch sử Employee.

Nội dung notification:

```text
{employee_name} vừa ghi nhận {formatted_amount} · {payment_method} · {time}
```

Click notification mở trang chi tiết giao dịch.

# 11. Realtime và thông báo

Sử dụng private Realtime channel có authorization.

Admin dashboard cần nhận các sự kiện:

```text
revenue.created
revenue.updated
revenue.voided
day.closed
day.reopened
payroll.generated
payroll.published
```

Khi nhận sự kiện doanh thu:

* Hiển thị toast.
* Thêm notification vào notification center.
* Invalidate hoặc refetch dashboard query.
* Không cộng tổng thủ công một cách dễ gây sai lệch.
* Tổng cuối cùng phải lấy lại từ server.

Tạo notification center:

* Icon chuông.
* Badge số chưa đọc.
* Danh sách notification mới nhất.
* Đánh dấu một notification đã đọc.
* Đánh dấu tất cả đã đọc.
* Click notification mở đúng bản ghi.

# 12. Web Push Notification

Tạo Push Notification cho tài khoản Admin.

Flow:

1. Admin mở phần Cài đặt thông báo.
2. Ứng dụng giải thích mục đích.
3. Admin chủ động nhấn Bật thông báo.
4. Sau đó mới gọi browser permission API.
5. Đăng ký service worker.
6. Tạo push subscription với public VAPID key.
7. Lưu subscription vào `push_subscriptions`.
8. Khi có doanh thu mới, server gửi Web Push đến các subscription active của Admin.
9. Nếu endpoint trả về gone/expired, xóa subscription khỏi database.
10. Khi click notification, mở URL chi tiết giao dịch.

Biến môi trường:

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

Không bắt buộc Push Notification để sử dụng ứng dụng. Nếu browser không hỗ trợ hoặc user từ chối, notification trong ứng dụng vẫn phải hoạt động.

# 13. Offline PWA

Ứng dụng phải cài đặt được trên điện thoại.

Tạo:

* `app/manifest.ts` hoặc manifest tương đương.
* Icon 192x192.
* Icon 512x512.
* Maskable icon.
* Apple touch icon.
* Theme color `#741F2C`.
* Background color `#F7F3EC`.
* `display: standalone`.
* Service worker.
* Offline fallback page.
* Install prompt tùy chỉnh khi browser hỗ trợ.

Manifest:

```text
name: Barbershop Manager
short_name: Barbershop
start_url: /
display: standalone
theme_color: #741F2C
background_color: #F7F3EC
```

Không cache bừa các response chứa dữ liệu nhạy cảm.

Chiến lược:

* Cache-first cho icon, font và static assets có hash.
* Network-first cho navigation.
* Không cache lâu các API response chứa doanh thu và bảng lương.
* Khi offline vẫn mở được app shell và màn hình ghi doanh thu.
* Dùng IndexedDB lưu các giao dịch chưa đồng bộ.

Offline queue flow:

1. Employee nhập doanh thu khi offline.
2. Tạo local UUID và idempotency key.
3. Lưu payload vào IndexedDB.
4. Hiển thị trạng thái `Chờ đồng bộ`.
5. Khi có mạng, đồng bộ lần lượt.
6. Server chống trùng bằng idempotency key.
7. Thành công thì xóa khỏi queue.
8. Thất bại validation thì giữ lại và hiển thị lý do.
9. Chỉ gửi notification cho Admin sau khi server insert thành công.
10. Hiển thị rõ trạng thái:

    * Đã lưu.
    * Chờ đồng bộ.
    * Đồng bộ thất bại.

Không hiển thị dữ liệu offline chưa đồng bộ như thể đã được Admin nhận.

# 14. Trang và route

## Public/Auth

```text
/login
/forgot-password
/change-password
/offline
```

Không có trang public sign-up.

## Admin

```text
/admin
/admin/revenue
/admin/revenue/[id]
/admin/employees
/admin/employees/new
/admin/employees/[id]
/admin/payroll
/admin/payroll/[month]
/admin/notifications
/admin/audit-log
/admin/settings
```

## Employee

```text
/employee
/employee/revenue/new
/employee/revenue
/employee/revenue/[id]
/employee/payroll
/employee/profile
```

# 15. Dashboard Admin

Tạo dashboard cho ngày hiện tại.

Phần đầu:

* Lời chào Admin.
* Ngày hiện tại.
* Icon notification.
* Nút chọn ngày.

Các KPI card:

* Tổng doanh thu hôm nay.
* Tiền mặt.
* Chuyển khoản.
* Số giao dịch.

Các phần tiếp theo:

* Doanh thu từng nhân viên.
* Giao dịch mới nhất.
* Trạng thái ngày: Đang mở hoặc Đã chốt.
* Nút Chốt ngày.
* So sánh doanh thu với ngày trước bằng số và phần trăm.
* Không cần biểu đồ nhiều màu.

Biểu đồ nếu có chỉ dùng:

* Đỏ đô.
* Đen/gray.
* Nền trắng kem.

Không tạo dashboard quá dày đặc.

# 16. Dashboard Employee

Hiển thị:

* Lời chào và tên nhân viên.
* Tổng doanh thu hôm nay.
* Tổng doanh thu tháng này.
* Số giao dịch hôm nay.
* Tổng tiền mặt hôm nay.
* Tổng chuyển khoản hôm nay.
* Nút lớn `Ghi doanh thu`.
* Danh sách năm giao dịch gần nhất.
* Số giao dịch đang chờ đồng bộ nếu có.

Không hiển thị doanh thu của người khác.

# 17. Quản lý doanh thu

Admin có bộ lọc:

* Ngày.
* Khoảng ngày.
* Tháng.
* Nhân viên.
* Tiền mặt.
* Chuyển khoản.
* Trạng thái.
* Tìm kiếm theo tên nhân viên hoặc ghi chú.

Hiển thị phần tổng hợp:

* Tổng doanh thu.
* Tổng tiền mặt.
* Tổng chuyển khoản.
* Số giao dịch.

Danh sách mobile dùng card.

Desktop có thể dùng table.

Mỗi giao dịch hiển thị:

* Số tiền.
* Nhân viên.
* Phương thức.
* Ngày giờ.
* Dịch vụ.
* Trạng thái.
* Người tạo.

Admin có thể:

* Xem chi tiết.
* Chỉnh sửa.
* Hủy giao dịch.

Hủy giao dịch:

* Không hard delete.
* Bắt buộc nhập lý do.
* Hiển thị dialog xác nhận.
* Ghi audit log.
* Tính lại các phần tổng hợp.

Employee chỉ sửa giao dịch của mình khi ngày chưa chốt.

# 18. Quản lý nhân viên

Trang danh sách hiển thị:

* Họ tên.
* Chức vụ.
* Email hoặc số điện thoại.
* Trạng thái.
* Doanh thu tháng hiện tại.
* Ngày tạo tài khoản.

Form nhân viên:

```text
full_name
email
phone
job_title
temporary_password
status
```

Validate email, số điện thoại và mật khẩu.

Không hiển thị mật khẩu sau khi tạo.

Tạo chức năng:

* Thêm nhân viên.
* Sửa thông tin.
* Khóa tài khoản.
* Mở tài khoản.
* Reset mật khẩu.
* Xem doanh thu nhân viên.
* Xem lịch sử bảng lương.

Không hard delete nhân viên đã có dữ liệu doanh thu.

# 19. Quản lý lương

Trang bảng lương có selector tháng.

Hiển thị mỗi nhân viên:

* Tên.
* Lương cứng.
* Phụ cấp.
* Doanh thu hợp lệ.
* Phần trăm hưởng.
* Tiền hoa hồng.
* Thưởng.
* Khấu trừ.
* Tổng lương.
* Trạng thái.

Admin có thể:

* Thiết lập lương.
* Nhập bonus.
* Nhập deduction.
* Thêm ghi chú.
* Tạo lại payroll khi còn draft.
* Chốt payroll.
* Công bố payroll.
* Đánh dấu đã thanh toán.

Trước khi khóa bảng lương, hiển thị confirm dialog có tổng số nhân viên và tổng tiền lương.

Ví dụ kiểm thử:

```text
base_salary = 6,000,000
allowance = 500,000
eligible_revenue = 10,000,000
commission_rate = 10
bonus = 0
deduction = 0

commission_amount phải bằng 1,000,000
total_salary phải bằng 7,500,000
```

# 20. Navigation

## Mobile Admin bottom navigation

```text
Tổng quan
Doanh thu
Nhân viên
Bảng lương
Thêm
```

`Thêm` mở bottom sheet gồm:

* Ghi doanh thu.
* Thêm nhân viên.
* Tạo bảng lương.
* Chốt ngày.

## Mobile Employee bottom navigation

```text
Trang chủ
Ghi doanh thu
Lịch sử
Tài khoản
```

Tab Ghi doanh thu cần nổi bật nhưng vẫn chỉ dùng màu đỏ đô.

Desktop sử dụng sidebar.

# 21. Component cần tạo

Tạo các reusable component:

```text
MobileHeader
DesktopSidebar
BottomNavigation
MoneyInput
PaymentMethodSelector
DateTimeInput
RevenueCard
RevenueTable
KpiCard
EmployeeCard
PayrollCard
StatusBadge
NotificationBell
NotificationList
EmptyState
ErrorState
LoadingSkeleton
ConfirmDialog
BottomSheet
OfflineIndicator
SyncQueueIndicator
InstallPwaPrompt
PushNotificationSettings
```

Không để một page component quá lớn. Tách logic nghiệp vụ khỏi UI component.

# 22. Formatting

Tạo utility:

```text
formatVND
parseVNDInput
formatBusinessDate
formatBusinessDateTime
getVietnamBusinessDate
calculateCommission
calculateTotalSalary
```

`formatVND(150000)` phải trả về định dạng tương tự:

```text
150.000 ₫
```

Không dùng phép tính JavaScript Number không an toàn cho giá trị tiền lớn. Dùng bigint hoặc chuyển đổi an toàn tại boundary.

# 23. Error handling

Xử lý rõ các trường hợp:

* Session hết hạn.
* Tài khoản bị khóa.
* Mất mạng.
* Giao dịch trùng.
* Ngày đã chốt.
* Không đủ quyền.
* Dữ liệu không hợp lệ.
* Push notification không được hỗ trợ.
* Đồng bộ offline thất bại.
* Realtime mất kết nối.
* Salary setting chưa tồn tại.
* Payroll đã bị khóa.
* Không thể tạo auth user nhưng profile đã tạo hoặc ngược lại.

Các nghiệp vụ nhiều bước phải dùng transaction hoặc có cơ chế rollback/compensation phù hợp.

Không hiển thị raw database error cho người dùng.

# 24. Loading và empty state

Mỗi trang phải có:

* Loading skeleton.
* Empty state.
* Error state.
* Retry action phù hợp.

Ví dụ empty state doanh thu:

```text
Chưa có doanh thu nào trong ngày này.
Các khoản doanh thu nhân viên ghi nhận sẽ xuất hiện tại đây.
```

# 25. Testing

## Unit tests

Viết test cho:

* Format VND.
* Parse money input.
* Commission calculation.
* Payroll total calculation.
* Ngày theo Asia/Ho_Chi_Minh.
* Validation schema.
* Offline queue deduplication.

## Integration tests

Kiểm tra:

* Employee không đọc được doanh thu người khác.
* Employee không tạo doanh thu cho người khác.
* Employee không sửa ngày đã chốt.
* Employee không đọc payroll chưa công bố.
* Admin đọc được dữ liệu trong shop.
* User không đọc được dữ liệu shop khác.
* Inactive user bị chặn.
* Idempotency key chống insert trùng.
* Payroll không ghi đè khi đã locked.

## End-to-end tests

Tạo các kịch bản:

1. Admin đăng nhập.
2. Admin tạo tài khoản nhân viên.
3. Employee đăng nhập và đổi mật khẩu.
4. Employee ghi doanh thu tiền mặt.
5. Admin nhận notification.
6. Dashboard cập nhật doanh thu.
7. Employee ghi doanh thu chuyển khoản.
8. Admin lọc doanh thu.
9. Admin chốt ngày.
10. Employee không sửa được dữ liệu đã chốt.
11. Admin thiết lập lương.
12. Admin tạo bảng lương.
13. Hệ thống tính đúng hoa hồng.
14. Admin khóa và công bố bảng lương.
15. Employee xem được bảng lương.
16. Employee không xem được bảng lương người khác.

# 26. Seed data

Tạo development seed gồm:

* Một shop tên `The Gentlemen Barbershop`.
* Một Admin.
* Ba Employee.
* Doanh thu mẫu trong tháng hiện tại.
* Cả tiền mặt và chuyển khoản.
* Salary settings cho từng Employee.
* Một số notification mẫu.

Không chạy seed production tự động.

Ghi rõ tài khoản development trong README, không đặt credential thật vào repository.

# 27. Environment variables

Tạo `.env.example`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
```

Kiểm tra environment variables khi ứng dụng khởi động và báo lỗi dễ hiểu nếu thiếu.

# 28. Project structure

Sắp xếp gần giống:

```text
app/
  (auth)/
  admin/
  employee/
  api/
components/
  ui/
  layout/
  revenue/
  employees/
  payroll/
  notifications/
lib/
  auth/
  database/
  validations/
  money/
  dates/
  permissions/
  realtime/
  push/
  offline/
  supabase/
server/
  actions/
  services/
  repositories/
supabase/
  migrations/
  seed.sql
public/
  icons/
tests/
  unit/
  integration/
  e2e/
```

Có thể điều chỉnh cấu trúc nếu có lý do kỹ thuật rõ ràng.

# 29. README

README phải bao gồm:

* Mô tả ứng dụng.
* Kiến trúc.
* Yêu cầu môi trường.
* Cách cài dependency.
* Cách tạo Supabase project.
* Cách chạy migration.
* Cách seed dữ liệu.
* Cách tạo Admin đầu tiên.
* Cách cấu hình Realtime.
* Cách tạo VAPID keys.
* Cách chạy local.
* Cách chạy test.
* Cách build production.
* Cách deploy Vercel.
* Các lưu ý bảo mật.
* Hướng dẫn cài PWA trên Android và iPhone.
* Những giới hạn của Web Push trên từng trình duyệt.
* Cách reset dữ liệu development.

# 30. Definition of Done

Chỉ coi là hoàn thành khi:

* Dự án build thành công.
* TypeScript không có lỗi.
* ESLint không có lỗi nghiêm trọng.
* Migration chạy thành công trên database mới.
* Seed chạy thành công.
* Authentication hoạt động.
* Admin tạo được Employee.
* Employee ghi được doanh thu.
* Admin nhận được notification trong ứng dụng.
* Dashboard cập nhật realtime.
* Tổng doanh thu đúng.
* Tiền mặt và chuyển khoản được tổng hợp riêng.
* Chốt ngày hoạt động.
* RLS ngăn truy cập trái phép.
* Bảng lương tính đúng.
* Payroll snapshot không bị thay đổi ngoài ý muốn.
* PWA cài được.
* Offline queue hoạt động.
* Không tạo giao dịch trùng sau khi đồng bộ.
* Giao diện đúng ba màu đã quy định.
* Mobile layout sử dụng tốt ở màn hình 320px.
* Các test quan trọng chạy thành công.
* README đủ để một developer khác cài dự án từ đầu.

# 31. Trình tự triển khai

Thực hiện theo thứ tự:

1. Phân tích repository hiện tại.
2. Viết kế hoạch ngắn trong `IMPLEMENTATION_PLAN.md`.
3. Khởi tạo cấu trúc dự án.
4. Tạo database migration.
5. Tạo RLS và database functions.
6. Tạo authentication.
7. Tạo layout và design system.
8. Tạo Employee revenue flow.
9. Tạo Admin revenue management.
10. Tạo realtime notification.
11. Tạo employee management.
12. Tạo salary settings và payroll.
13. Tạo daily closing.
14. Tạo PWA.
15. Tạo offline queue.
16. Tạo Web Push.
17. Viết test.
18. Viết README.
19. Chạy typecheck, lint, tests và production build.
20. Sửa toàn bộ lỗi phát hiện được.

Sau mỗi nhóm chức năng:

* Chạy typecheck.
* Chạy test liên quan.
* Kiểm tra quyền truy cập.
* Không để TODO quan trọng chưa xử lý.
* Không thay thế nghiệp vụ thật bằng placeholder.

Khi cần đưa ra quyết định nhỏ chưa được mô tả, hãy ưu tiên:

* Đơn giản.
* Bảo mật.
* Mobile-first.
* Dễ bảo trì.
* Không thêm chức năng ngoài phạm vi nếu không cần thiết.

Bắt đầu bằng cách kiểm tra repository và tạo `IMPLEMENTATION_PLAN.md`, sau đó triển khai đầy đủ ứng dụng.
