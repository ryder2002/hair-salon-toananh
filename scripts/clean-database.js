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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanDatabaseAndSeedAdmin() {
  console.log("==================================================================");
  console.log("🧹 DỌN DẸP SẠCH DỮ LIỆU CSDL & KHỞI TẠO TÀI KHOẢN ADMIN TRỦ LẠI");
  console.log("==================================================================\n");

  const SHOP_ID = "a0000000-0000-0000-0000-000000000001";
  const ADMIN_EMAIL = "admin@barbershop.local";
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin123";

  // 1. Delete operational data
  console.log("1. Đang dọn dẹp các bảng dữ liệu nghiệp vụ...");
  await supabase.from("revenue_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("payrolls").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("daily_closings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("salary_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✔ Đã dọn dẹp sạch toàn bộ giao dịch, bảng lương, chốt ngày, thông báo, nhật ký.");

  // 2. Ensure default shop exists
  console.log("\n2. Kiểm tra thông tin Shop...");
  const { data: existingShop } = await supabase.from("shops").select("id").eq("id", SHOP_ID).maybeSingle();
  if (!existingShop) {
    await supabase.from("shops").insert({
      id: SHOP_ID,
      name: "Toàn Anh Hair Salon",
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
    });
    console.log("✔ Đã khởi tạo Cửa hàng: Toàn Anh Hair Salon");
  } else {
    console.log("✔ Cửa hàng Toàn Anh Hair Salon đã tồn tại.");
  }

  // 3. Setup / Reset Admin Auth User
  console.log("\n3. Khởi tạo / Cập nhật tài khoản Admin trong Supabase Auth...");
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  let adminAuthUser = authUsers?.users?.find(
    (u) => u.email === ADMIN_EMAIL || u.id === "a0000000-0000-0000-0000-000000000001"
  );

  // Delete non-admin auth users
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (u.email !== ADMIN_EMAIL && u.id !== "a0000000-0000-0000-0000-000000000001") {
        await supabase.from("profiles").delete().eq("id", u.id);
        await supabase.auth.admin.deleteUser(u.id);
      }
    }
  }
  await supabase.from("profiles").delete().neq("email", ADMIN_EMAIL).neq("username", ADMIN_USERNAME);

  let adminId;
  if (!adminAuthUser) {
    const { data: newAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Đinh Công Nhất", role: "admin" },
    });
    if (createAuthErr || !newAuth.user) {
      throw new Error(`Không thể tạo Auth user cho Admin: ${createAuthErr?.message}`);
    }
    adminAuthUser = newAuth.user;
    adminId = newAuth.user.id;
    console.log(`✔ Đã tạo mới tài khoản Admin trong Supabase Auth (ID: ${adminId})`);
  } else {
    adminId = adminAuthUser.id;
    const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(adminId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (updateAuthErr) {
      throw new Error(`Không thể cập nhật mật khẩu Admin: ${updateAuthErr.message}`);
    }
    console.log(`✔ Đã cập nhật mật khẩu Admin thành '${ADMIN_PASSWORD}' cho tài khoản Supabase Auth (ID: ${adminId})`);
  }

  // 4. Upsert Admin Profile
  console.log("\n4. Khởi tạo / Cập nhật Hồ sơ Admin trong bảng `profiles`...");
  const { data: existingProfile } = await supabase.from("profiles").select("id, role, status").eq("id", adminId).maybeSingle();

  let profileErr = null;
  if (existingProfile) {
    const { error } = await supabase.from("profiles").update({
      full_name: "Đinh Công Nhất",
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      phone: "0900000000",
      job_title: "Quản lý tiệm",
      must_change_password: false,
      updated_at: new Date().toISOString(),
    }).eq("id", adminId);
    profileErr = error;
  } else {
    const { error } = await supabase.from("profiles").insert({
      id: adminId,
      shop_id: SHOP_ID,
      full_name: "Đinh Công Nhất",
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      phone: "0900000000",
      job_title: "Quản lý tiệm",
      role: "admin",
      status: "active",
      must_change_password: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    profileErr = error;
  }

  if (profileErr) {
    throw new Error(`Không thể lưu profile Admin: ${profileErr.message}`);
  }

  console.log("✔ Đã lưu hồ sơ Admin thành công vào bảng `profiles`.");

  console.log("\n==================================================================");
  console.log("🎉 XONG! CSDL ĐÃ ĐƯỢC DỌN SẠCH & KHỞI TẠO SEED THÀNH CÔNG");
  console.log("==================================================================");
  console.log("🔑 THÔNG TIN ĐĂNG NHẬP ADMIN:");
  console.log(`   - Tên đăng nhập (Username) : ${ADMIN_USERNAME}`);
  console.log(`   - Email                    : ${ADMIN_EMAIL}`);
  console.log(`   - Mật khẩu (Password)      : ${ADMIN_PASSWORD}`);
  console.log("==================================================================\n");
}

cleanDatabaseAndSeedAdmin().catch((err) => {
  console.error("❌ Lỗi dọn dẹp và seed CSDL:", err);
  process.exit(1);
});
