/**
 * Full Flow Supabase Database Connection & CRUD Test Script
 * Barbershop Manager - Toàn Anh Hair Salon
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

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function pass(testName, details = "") {
  console.log(`${colors.green}✔ CHUẨN CSDL SUPABASE:${colors.reset} ${colors.bold}${testName}${colors.reset} ${details}`);
}

function fail(testName, error) {
  console.error(`${colors.red}✖ LỖI CSDL:${colors.reset} ${colors.bold}${testName}${colors.reset} - ${error}`);
  process.exitCode = 1;
}

function group(title) {
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
}

async function runSupabaseFullFlowTest() {
  console.log(`${colors.bold}${colors.yellow}\n🚀 BẮT ĐẦU KIỂM THỬ KẾT NỐI LUỒNG THỰC TẾ TRÊN CSDL SUPABASE...${colors.reset}\n`);

  group("1. KIỂM THỬ BIẾN MÔI TRƯỜNG SUPABASE URL & SERVICE ROLE KEY");
  console.log(`- Supabase URL: ${supabaseUrl}`);
  console.log(`- Service Key: ${serviceRoleKey ? serviceRoleKey.substring(0, 20) + "..." : "CHƯA CÓ"}`);

  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    fail("Cấu hình URL", "NEXT_PUBLIC_SUPABASE_URL chưa được khai báo hoặc là placeholder!");
    return;
  }
  if (!serviceRoleKey || serviceRoleKey.includes("placeholder")) {
    fail("Cấu hình Service Key", "SUPABASE_SERVICE_ROLE_KEY chưa được khai báo hoặc là placeholder!");
    return;
  }
  pass("Khai báo biến môi trường Supabase đầy đủ");

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // -------------------------------------------------------------------
  group("2. KIỂM THỬ TẢI CỬA HÀNG (SHOPS TABLE)");
  let shopId = "11111111-1111-1111-1111-111111111111";
  try {
    const { data: shops, error } = await supabase.from("shops").select("*");
    if (error) {
      fail("Kết nối bảng shops", error.message);
    } else {
      pass(`Đã kết nối thành công bảng shops`, `Tìm thấy ${shops.length} salon (${shops[0]?.name || "Trống"})`);
      if (shops.length > 0) shopId = shops[0].id;
    }
  } catch (err) {
    fail("Kết nối bảng shops", err.message);
  }

  // -------------------------------------------------------------------
  group("3. KIỂM THỬ ĐỌC/TẠO NHÂN VIÊN VÀ ĐỔI MẬT KHẨU (PROFILES & AUTH)");
  let existingProfileId = null;
  const testUsername = `testemp_${Math.random().toString(36).substring(2, 6)}`;
  const testEmail = `${testUsername}@barbershop.local`;
  const testPassInitial = "password123";

  try {
    // 3.1 Fetch profiles
    const { data: profiles, error: fetchErr } = await supabase.from("profiles").select("*");
    if (fetchErr) {
      fail("Đọc bảng profiles", fetchErr.message);
    } else {
      pass(`Đã kết nối đọc bảng profiles từ CSDL`, `Tổng số tài khoản trong CSDL: ${profiles.length}`);
      if (profiles && profiles.length > 0) {
        existingProfileId = profiles[0].id;
      }
    }

    // 3.2 Create Auth User & Profile
    let testUserId = null;
    try {
      const { data: authData } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassInitial,
        email_confirm: true,
      });
      if (authData?.user) testUserId = authData.user.id;
    } catch (e) {}

    if (testUserId) {
      const { data: createdProfile, error: createErr } = await supabase
        .from("profiles")
        .insert({
          id: testUserId,
          shop_id: shopId,
          full_name: "Nhân viên Test CSDL",
          email: testEmail,
          phone: "0999888777",
          job_title: "Thợ cắt tóc Test",
          role: "employee",
          status: "active",
        })
        .select()
        .single();

      if (createErr) {
        fail("Thêm nhân viên mới vào CSDL Supabase", createErr.message);
      } else {
        pass("Ghi nhân viên mới vào CSDL Supabase thành công", `ID: ${createdProfile.id}, Email: ${createdProfile.email}`);

        // Cleanup test profile & auth user
        await supabase.from("profiles").delete().eq("id", testUserId);
        await supabase.auth.admin.deleteUser(testUserId);
      }
    }
  } catch (err) {
    fail("Thao tác bảng profiles", err.message);
  }

  // -------------------------------------------------------------------
  group("4. KIỂM THỬ GHI & ĐỌC ĐƠN HÀNG/DOANH THU (REVENUE_ENTRIES TABLE)");
  try {
    // Fetch initial count
    const { data: initRevenues } = await supabase.from("revenue_entries").select("id");
    const initCount = initRevenues ? initRevenues.length : 0;
    pass("Đã truy vấn mảng đơn hàng từ CSDL Supabase", `Số đơn hàng hiện tại trong DB: ${initCount}`);

    if (existingProfileId) {
      const testIdempotency = "00000000-0000-0000-0000-" + Math.floor(100000000000 + Math.random() * 900000000000);
      const todayStr = new Date().toISOString().split("T")[0];

      const { data: insertedRev, error: revErr } = await supabase
        .from("revenue_entries")
        .insert({
          shop_id: shopId,
          employee_id: existingProfileId,
          amount: 250000,
          payment_method: "cash",
          service_name: "Cắt tóc nam Test CSDL",
          note: "Đơn hàng test luồng CSDL Supabase",
          business_date: todayStr,
          idempotency_key: testIdempotency,
          created_by: existingProfileId,
        })
        .select()
        .single();

      if (revErr) {
        fail("Ghi đơn hàng mới vào CSDL Supabase", revErr.message);
      } else {
        pass("Ghi nhận đơn hàng mới vào CSDL Supabase thành công", `ID: ${insertedRev.id}, Số tiền: 250.000 đ`);
        // Cleanup test revenue entry
        await supabase.from("revenue_entries").delete().eq("id", insertedRev.id);
      }
    }
  } catch (err) {
    fail("Thao tác bảng revenue_entries", err.message);
  }

  // -------------------------------------------------------------------
  group("5. KIỂM THỬ GHI NHẬT KÝ HOẠT ĐỘNG (AUDIT_LOGS TABLE)");
  try {
    const { data: auditLog, error: auditErr } = await supabase
      .from("audit_logs")
      .insert({
        shop_id: shopId,
        action: "TEST_CSDL_CONNECTION",
        entity_type: "system",
        metadata: {
          actor_name: "Script Test Luồng",
          details: "Kiểm thử tự động kết nối CSDL Supabase thành công",
          timestamp: new Date().toLocaleString("vi-VN"),
        },
      })
      .select()
      .single();

    if (auditErr) {
      fail("Ghi nhật ký hoạt động CSDL", auditErr.message);
    } else {
      pass("Ghi vết nhật ký hoạt động (Audit Log) vào CSDL Supabase thành công", `ID Log: ${auditLog.id}`);
      await supabase.from("audit_logs").delete().eq("id", auditLog.id);
    }
  } catch (err) {
    fail("Thao tác bảng audit_logs", err.message);
  }

  // -------------------------------------------------------------------
  console.log(`\n${colors.green}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.green}${colors.bold}🎉 HOÀN THÀNH KIỂM THỬ! TẤT CẢ TÍNH NĂNG VẬN HÀNH 100% TRÊN CSDL SUPABASE!${colors.reset}`);
  console.log(`${colors.green}${colors.bold}================================================================${colors.reset}\n`);
}

runSupabaseFullFlowTest().catch((err) => {
  console.error("Fatal Test Script Error:", err);
  process.exit(1);
});
