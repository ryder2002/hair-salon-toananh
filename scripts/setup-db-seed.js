/**
 * Database Setup & Seed Script for Supabase Cloud
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

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const serviceRoleKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupAndSeed() {
  console.log("🚀 Bắt đầu tạo dữ liệu mẫu (Seed Data) trên Supabase CSDL Cloud...\n");

  // 1. Seed Shop
  const shopId = "11111111-1111-1111-1111-111111111111";
  console.log("1. Khởi tạo Cửa hàng mặc định (shops)...");
  const { data: shopData, error: shopErr } = await supabase
    .from("shops")
    .upsert(
      {
        id: shopId,
        name: "Toàn Anh Hair Salon",
        timezone: "Asia/Ho_Chi_Minh",
        currency: "VND",
      },
      { onConflict: "id" }
    )
    .select();

  if (shopErr) {
    console.error("❌ Lỗi khởi tạo shops:", shopErr.message);
  } else {
    console.log("✔ Đã tạo/Cập nhật thành công Shop ID:", shopId);
  }

  // 2. Create Auth User for Admin
  console.log("\n2. Khởi tạo Tài khoản Auth Admin...");
  let adminId = null;
  try {
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: "admin@barbershop.local",
      password: "admin123",
      email_confirm: true,
    });

    if (authUser?.user) {
      adminId = authUser.user.id;
      console.log("✔ Đã tạo Auth User cho Admin ID:", adminId);
    } else {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === "admin@barbershop.local");
      if (existing) {
        adminId = existing.id;
        console.log("✔ Đã tìm thấy Auth User Admin có sẵn ID:", adminId);
      }
    }
  } catch (e) {
    console.warn("Auth User Warning:", e.message);
  }

  if (!adminId) {
    adminId = "a0000000-0000-0000-0000-000000000001";
  }

  // 3. Seed Admin Profile
  console.log("\n3. Khởi tạo Profile Admin trong bảng profiles...");
  const profilePayload = {
    id: adminId,
    shop_id: shopId,
    full_name: "Đinh Công Nhất (Admin)",
    email: "admin@barbershop.local",
    phone: "0901234567",
    job_title: "Chủ tiệm / Admin",
    role: "admin",
    status: "active",
    must_change_password: false,
    username: "admin",
    login_password: "admin123",
  };

  let { data: adminProfile, error: profileErr } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select();

  if (profileErr) {
    // If login_password/username column is not on cloud schema yet, strip and upsert standard profile
    delete profilePayload.username;
    delete profilePayload.login_password;
    const res = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" }).select();
    if (res.error) {
      console.error("❌ Lỗi tạo profile Admin:", res.error.message);
    } else {
      console.log("✔ Đã tạo/Cập nhật Profile Admin chuẩn thành công!");
    }
  } else {
    console.log("✔ Đã tạo/Cập nhật Profile Admin thành công!");
  }

  console.log("\n✅ HOÀN THÀNH TẠO DỮ LIỆU MẪU CSDL CLOUD!");
}

setupAndSeed().catch(console.error);
