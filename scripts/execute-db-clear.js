const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rxtsyrebfrdbfupjlqse.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function clearData() {
  console.log("Cleaning database...");
  try {
    await supabase.from("revenue_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("daily_closings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("payrolls").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("salary_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("profiles").delete().neq("role", "admin");

    const shopId = "11111111-1111-1111-1111-111111111111";
    await supabase.from("shops").upsert({
      id: shopId,
      name: "Toàn Anh Hair Salon",
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
    });

    const adminId = "a0000000-0000-0000-0000-000000000001";
    await supabase.from("profiles").upsert({
      id: adminId,
      shop_id: shopId,
      full_name: "Đinh Công Nhật (Admin)",
      email: "admin@barbershop.com",
      phone: "0901234567",
      job_title: "Chủ tiệm / Admin",
      role: "admin",
      status: "active",
      must_change_password: false,
    });

    console.log("Database cleared successfully! Only seed admin retains.");
  } catch (err) {
    console.error("Error clearing database:", err);
  }
}

clearData();
