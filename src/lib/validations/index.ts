import { z } from "zod";

export const RevenueEntrySchema = z.object({
  amount: z.number().int().positive("Số tiền phải lớn hơn 0"),
  payment_method: z.enum(["cash", "bank_transfer"], {
    required_error: "Vui lòng chọn phương thức thanh toán",
  }),
  service_name: z.string().max(100, "Tên dịch vụ tối đa 100 ký tự").optional(),
  note: z.string().max(255, "Ghi chú tối đa 255 ký tự").optional(),
  business_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  performed_at: z.string().optional(),
  idempotency_key: z.string().uuid("Key không hợp lệ"),
});

export const EmployeeCreateSchema = z.object({
  full_name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại tối thiểu 10 số").max(11),
  job_title: z.string().min(2, "Chức vụ không được để trống"),
  temporary_password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const SalarySettingSchema = z.object({
  employee_id: z.string().uuid(),
  base_salary: z.number().min(0, "Lương cứng không được âm"),
  allowance: z.number().min(0, "Phụ cấp không được âm"),
  commission_rate: z.number().min(0).max(100, "Tỷ lệ hoa hồng từ 0% - 100%"),
  effective_from: z.string(),
});
