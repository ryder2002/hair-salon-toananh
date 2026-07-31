"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function clearAllDatabaseDataAction() {
  const adminClient = createAdminClient();

  try {
    // 1. Delete all revenue_entries
    await adminClient.from("revenue_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Delete all daily_closings
    await adminClient.from("daily_closings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 3. Delete all payrolls
    await adminClient.from("payrolls").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 4. Delete all salary_settings
    await adminClient.from("salary_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 5. Delete all notifications
    await adminClient.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 6. Delete all push_subscriptions
    await adminClient.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 7. Delete all audit_logs
    await adminClient.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 8. Delete non-admin profiles
    await adminClient.from("profiles").delete().neq("role", "admin");

    // 9. Ensure shop exists
    const shopId = "11111111-1111-1111-1111-111111111111";
    await adminClient.from("shops").upsert({
      id: shopId,
      name: "Toàn Anh Hair Salon",
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
    });

    // 10. Ensure Admin profile exists
    const adminId = "a0000000-0000-0000-0000-000000000001";
    await adminClient.from("profiles").upsert({
      id: adminId,
      shop_id: shopId,
      full_name: "Đinh Công Nhất (Admin)",
      email: "admin@barbershop.com",
      phone: "0901234567",
      job_title: "Chủ tiệm / Admin",
      role: "admin",
      status: "active",
      must_change_password: false,
    });

    return { success: true, message: "Đã xoá sạch dữ liệu database, chỉ giữ lại tài khoản Admin (admin/admin123 & dinhcongnhat/10122002)." };
  } catch (err: any) {
    console.error("Error resetting database:", err);
    return { success: false, error: err.message };
  }
}
