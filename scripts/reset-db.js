/**
 * Database Reset & Seed Script
 * Clears all revenue entries, closings, payrolls, logs, notifications
 * Keeps ONLY the Seed Admin and 1 Employee for Admin.
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      envVars[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  });
}

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars["SUPABASE_SERVICE_ROLE_KEY"] || process.env.SUPABASE_SERVICE_ROLE_KEY;

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function resetAndSeed() {
  console.log("🧹 BẮT ĐẦU XÓA SẠCH DỮ LIỆU CSDL CLOUD VÀ GIỮ LẠI ADMIN...");

  const shopId = "11111111-1111-1111-1111-111111111111";

  // 1. Delete all transactional tables
  console.log("1. Xóa sạch bảng giao dịch, chốt ngày, lương, thông báo, nhật ký...");
  await supabase.from("revenue_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("daily_closings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("payrolls").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("salary_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 2. Ensure Shop exists
  console.log("2. Đảm bảo Cửa hàng mặc định tồn tại...");
  await supabase.from("shops").upsert({
    id: shopId,
    name: "Toàn Anh Hair Salon",
    timezone: "Asia/Ho_Chi_Minh",
    currency: "VND",
  });

  // 3. Ensure Seed Admin exists
  console.log("3. Khởi tạo tài khoản Admin (admin / admin123)...");
  let adminId = null;
  try {
    const { data: adminAuth } = await supabase.auth.admin.createUser({
      email: "admin@barbershop.local",
      password: "admin123",
      email_confirm: true,
    });
    if (adminAuth?.user) adminId = adminAuth.user.id;
  } catch (e) {}

  if (!adminId) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const found = users?.users?.find((u) => u.email === "admin@barbershop.local");
    if (found) adminId = found.id;
  }

  if (adminId) {
    await supabase.from("profiles").upsert({
      id: adminId,
      shop_id: shopId,
      full_name: "Đinh Công Nhật (Admin)",
      email: "admin@barbershop.local",
      phone: "0901234567",
      job_title: "Chủ tiệm / Admin",
      role: "admin",
      status: "active",
      must_change_password: false,
    });
  }

  // 4. Ensure 1 Employee exists for Admin
  console.log("4. Tạo 1 tài khoản Nhân viên chuẩn cho Admin (nhatdc / 123456)...");
  let empId = null;
  try {
    const { data: empAuth } = await supabase.auth.admin.createUser({
      email: "nhatdc@barbershop.local",
      password: "123456",
      email_confirm: true,
    });
    if (empAuth?.user) empId = empAuth.user.id;
  } catch (e) {}

  if (!empId) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const found = users?.users?.find((u) => u.email === "nhatdc@barbershop.local");
    if (found) empId = found.id;
  }

  if (empId) {
    await supabase.from("profiles").upsert({
      id: empId,
      shop_id: shopId,
      full_name: "Đinh Công Nhất",
      email: "nhatdc@barbershop.local",
      phone: "0383576308",
      job_title: "Thợ cắt tóc",
      role: "employee",
      status: "active",
      must_change_password: true,
    });

    await supabase.from("salary_settings").upsert({
      shop_id: shopId,
      employee_id: empId,
      base_salary: 6000000,
      allowance: 500000,
      commission_rate: 8.0,
      effective_from: new Date().toISOString().split("T")[0],
      created_by: adminId || empId,
    });
  }

  // Delete any other profiles
  const { data: allProfiles } = await supabase.from("profiles").select("id, role, email");
  if (allProfiles) {
    for (const p of allProfiles) {
      if (p.id !== adminId && p.id !== empId) {
        await supabase.from("profiles").delete().eq("id", p.id);
        try { await supabase.auth.admin.deleteUser(p.id); } catch (e) {}
      }
    }
  }

  console.log("\n✅ HOÀN THÀNH XÓA SẠCH DATABASE VÀ BẢO TỒN TÀI KHOẢN ADMIN & 1 NHÂN VIÊN!");
}

resetAndSeed().catch(console.error);
