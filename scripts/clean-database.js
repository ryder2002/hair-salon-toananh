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

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const serviceRoleKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanDatabase() {
  console.log("🧹 BẮT ĐẦU DỌN DẸP SẠCH CSDL SUPABASE CLOUD (GIỮ LẠI TÀI KHOẢN ADMIN)...\n");

  // 1. Delete all revenue_entries
  const { error: revErr } = await supabase.from("revenue_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✔ Dọn dẹp doanh thu (revenue_entries):", revErr ? revErr.message : "Thành công");

  // 2. Delete all payrolls
  const { error: payErr } = await supabase.from("payrolls").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✔ Dọn dẹp bảng lương (payrolls):", payErr ? payErr.message : "Thành công");

  // 3. Delete all daily_closings
  const { error: closeErr } = await supabase.from("daily_closings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✔ Dọn dẹp chốt ngày (daily_closings):", closeErr ? closeErr.message : "Thành công");

  // 4. Delete all notifications
  const { error: notifErr } = await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✔ Dọn dẹp thông báo (notifications):", notifErr ? notifErr.message : "Thành công");

  // 5. Delete all push_subscriptions
  const { error: pushErr } = await supabase.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✔ Dọn dẹp đăng ký push (push_subscriptions):", pushErr ? pushErr.message : "Thành công");

  // 6. Delete all audit_logs
  const { error: auditErr } = await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✔ Dọn dẹp nhật ký (audit_logs):", auditErr ? auditErr.message : "Thành công");

  // 7. Delete salary_settings for non-admin employees
  const { data: nonAdminProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .neq("role", "admin");

  if (nonAdminProfiles && nonAdminProfiles.length > 0) {
    for (const p of nonAdminProfiles) {
      await supabase.from("salary_settings").delete().eq("employee_id", p.id);
      await supabase.from("profiles").delete().eq("id", p.id);
    }
    console.log(`✔ Dọn dẹp ${nonAdminProfiles.length} tài khoản nhân viên thử nghiệm: Thành công`);
  } else {
    console.log("✔ Không có nhân viên phụ nào cần xóa.");
  }

  // Delete non-admin auth users from Supabase Auth
  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    if (authUsers && authUsers.users) {
      for (const u of authUsers.users) {
        if (u.email !== "admin@barbershop.local") {
          await supabase.auth.admin.deleteUser(u.id);
        }
      }
    }
    console.log("✔ Dọn dẹp người dùng trong Supabase Auth (chỉ giữ admin): Thành công");
  } catch (e) {
    console.warn("Auth delete warning:", e.message);
  }

  // Verify remaining Admin account
  const { data: adminProfiles } = await supabase.from("profiles").select("id, full_name, email, role").eq("role", "admin");
  console.log("\n👑 Tài khoản Admin duy nhất được giữ lại:");
  console.log(adminProfiles);

  console.log("\n==================================================================");
  console.log("🎉 CSDL DÃ ĐƯỢC CLEAR SẠCH SẼ - HỆ THỐNG SẴN SÀNG LÀM VÀI TỪ ĐẦU!");
  console.log("==================================================================");
}

cleanDatabase().catch(console.error);
