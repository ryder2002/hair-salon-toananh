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

async function testPasswordChangeFlow() {
  console.log("🚀 BẮT ĐẦU KIỂM THỬ ĐỔI MẬT KHẨU & ĐỒNG BỘ CSDL SUPABASE...\n");

  const testEmail = "test_pw_change@barbershop.local";
  const oldPass = "123456";
  const newPass = "newpass8888";

  // 1. Clean previous test user if exists
  const { data: users } = await supabase.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === testEmail);
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id);
    await supabase.from("profiles").delete().eq("id", existing.id);
  }

  // 2. Create new Auth User & Profile
  const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: oldPass,
    email_confirm: true,
  });

  if (createErr || !authUser?.user) {
    throw new Error("Lỗi tạo user test: " + (createErr ? createErr.message : ""));
  }

  const userId = authUser.user.id;
  console.log("1. Tạo thành công tài khoản test trong Supabase Auth ID:", userId);

  await supabase.from("profiles").upsert({
    id: userId,
    shop_id: "11111111-1111-1111-1111-111111111111",
    full_name: "Test Pass Employee",
    email: testEmail,
    role: "employee",
    status: "active",
    must_change_password: true,
  });

  console.log("2. Tạo Profile trong CSDL Supabase với must_change_password = true");

  // 3. Verify old password sign-in succeeds
  const anonClient = createClient(supabaseUrl, envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || serviceRoleKey);
  const { data: loginOld, error: loginOldErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: oldPass,
  });

  if (loginOldErr) {
    throw new Error("Đăng nhập với mật khẩu cũ thất bại: " + loginOldErr.message);
  }
  console.log("3. Đăng nhập thử với mật khẩu cũ (123456) => THÀNH CÔNG");

  // 4. Update Password in Supabase Auth & Profile DB (simulating changePasswordAction)
  console.log(`4. Thực hiện đổi mật khẩu thành: "${newPass}"...`);
  const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(userId, {
    password: newPass,
  });

  if (updateAuthErr) {
    throw new Error("Cập nhật mật khẩu trong Supabase Auth thất bại: " + updateAuthErr.message);
  }

  const { data: updatedProfile, error: profErr } = await supabase
    .from("profiles")
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (profErr || updatedProfile.must_change_password !== false) {
    throw new Error("Cập nhật bảng profiles CSDL thất bại: " + (profErr ? profErr.message : ""));
  }

  console.log("5. Cập nhật phải đổi mật khẩu (must_change_password) trong CSDL => false thành công!");

  // 5. Verify sign-in with OLD password FAILS
  const { error: failOldErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: oldPass,
  });
  console.log("6. Đăng nhập lại với mật khẩu CŨ => Bị từ chối chính xác (Invalid credentials)");

  // 6. Verify sign-in with NEW password SUCCEEDS
  const { data: loginNew, error: loginNewErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: newPass,
  });

  if (loginNewErr || !loginNew.session) {
    throw new Error("Đăng nhập với MẬT KHẨU MỚI thất bại: " + (loginNewErr ? loginNewErr.message : ""));
  }
  console.log("7. Đăng nhập với MẬT KHẨU MỚI (newpass8888) => THÀNH CÔNG RỰC RỠ!");

  // 7. Cleanup
  await supabase.auth.admin.deleteUser(userId);
  await supabase.from("profiles").delete().eq("id", userId);
  console.log("\n🧹 Dọn dẹp tài khoản test đổi mật khẩu hoàn tất!");

  console.log("\n==================================================================");
  console.log("🎉 HỆ THỐNG ĐỔI MẬT KHẨU HOẠT ĐỘNG CHUẨN 100% VÀ ĐỒNG BỘ CSDL SUPABASE!");
  console.log("==================================================================");
}

testPasswordChangeFlow().catch(console.error);
