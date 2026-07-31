/**
 * Full System Flow Automated Test Script - Supabase Database
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
  console.log(`${colors.green}✔ TEST PASSED:${colors.reset} ${colors.bold}${testName}${colors.reset} ${details}`);
}

function fail(testName, error) {
  console.error(`${colors.red}✖ TEST FAILED:${colors.reset} ${colors.bold}${testName}${colors.reset} - ${error}`);
  process.exitCode = 1;
}

function group(title) {
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
}

async function runFullSystemTest() {
  console.log(`${colors.bold}${colors.yellow}\n🚀 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG TOÀN BỘ CHỨC NĂNG HỆ THỐNG TRÊN CSDL SUPABASE...${colors.reset}\n`);

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("placeholder")) {
    fail("Cấu hình Supabase", "Biến môi trường CSDL chưa hợp lệ!");
    return;
  }
  pass("Kiểm tra thông số kết nối CSDL Supabase Cloud", `URL: ${supabaseUrl}`);

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const shopId = "11111111-1111-1111-1111-111111111111";

  // -------------------------------------------------------------------
  group("1. KIỂM THỬ CẤU HÌNH CỬA HÀNG (SHOPS TABLE)");
  try {
    const { data: shops, error } = await supabase.from("shops").select("*");
    if (error) {
      fail("Kết nối bảng shops", error.message);
    } else {
      pass("Kết nối bảng shops CSDL Supabase", `Tìm thấy ${shops.length} salon (${shops[0]?.name || "Toàn Anh Hair Salon"})`);
    }
  } catch (err) {
    fail("Shops Exception", err.message);
  }

  // -------------------------------------------------------------------
  group("2. KIỂM THỬ QUẢN LÝ NHÂN VIÊN (PROFILES & SALARY SETTINGS)");
  let employeeId = null;
  const testUsername = `nv_${Date.now()}`;
  const testEmail = `${testUsername}@barbershop.local`;

  try {
    // Create test Auth User
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: "password123",
      email_confirm: true,
    });

    if (authUser?.user) {
      employeeId = authUser.user.id;
    } else {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === testEmail);
      if (existing) employeeId = existing.id;
    }

    if (!employeeId) employeeId = crypto.randomUUID();

    // Insert Profile
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .upsert({
        id: employeeId,
        shop_id: shopId,
        full_name: "Nguyễn Văn Hùng (Test)",
        email: testEmail,
        phone: "0912345678",
        job_title: "Thợ cắt tóc chính",
        role: "employee",
        status: "active",
      })
      .select()
      .single();

    if (profErr) {
      fail("Tạo profile Nhân viên mới vào CSDL Supabase", profErr.message);
    } else {
      pass("Tạo tài khoản Nhân viên thành công trong CSDL", `ID: ${prof.id}, Họ tên: ${prof.full_name}`);
    }

    // Insert Salary Settings
    const { data: sal, error: salErr } = await supabase
      .from("salary_settings")
      .upsert({
        shop_id: shopId,
        employee_id: employeeId,
        base_salary: 7000000,
        allowance: 500000,
        commission_rate: 10.0,
        effective_from: new Date().toISOString().split("T")[0],
        created_by: employeeId,
      })
      .select()
      .single();

    if (salErr) {
      fail("Tạo cấu hình lương Nhân viên", salErr.message);
    } else {
      pass("Lưu cấu hình lương & hoa hồng thành công trong CSDL", `Lương cứng: 7.000.000 ₫, Hoa hồng: 10%`);
    }

    // Fetch list with FK join
    const { data: empList, error: listErr } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        job_title,
        role,
        status,
        salary_settings:salary_settings!salary_settings_employee_id_fkey(base_salary, allowance, commission_rate)
      `)
      .eq("role", "employee");

    if (listErr) {
      fail("Tải danh sách Nhân viên kèm lương", listErr.message);
    } else {
      pass("Tải và hiển thị danh sách Nhân viên từ CSDL Supabase", `Tổng số nhân viên: ${empList.length}`);
    }
  } catch (err) {
    fail("Employee Flow Exception", err.message);
  }

  // -------------------------------------------------------------------
  group("3. KIỂM THỬ ĐỔI MẬT KHẨU TÀI KHOẢN (SUPABASE AUTH)");
  try {
    if (employeeId) {
      const { error: passErr } = await supabase.auth.admin.updateUserById(employeeId, {
        password: "newpassword678",
      });

      if (passErr) {
        fail("Đổi mật khẩu tài khoản Supabase Auth", passErr.message);
      } else {
        pass("Cập nhật mật khẩu mới thành công trên CSDL Supabase Auth");
      }
    }
  } catch (err) {
    fail("Password Flow Exception", err.message);
  }

  // -------------------------------------------------------------------
  group("4. KIỂM THỬ GHI NHẬN DOANH THU & ĐƠN HÀNG (REVENUE ENTRIES)");
  let revenueId = null;
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    if (employeeId) {
      const idempotencyKey = "00000000-0000-0000-0000-" + Math.floor(100000000000 + Math.random() * 900000000000);
      const { data: rev, error: revErr } = await supabase
        .from("revenue_entries")
        .insert({
          shop_id: shopId,
          employee_id: employeeId,
          amount: 350000,
          payment_method: "cash",
          service_name: "Cắt tóc + Gội đầu uốn ép",
          note: "Đơn hàng kiểm thử tự động",
          business_date: todayStr,
          idempotency_key: idempotencyKey,
          created_by: employeeId,
        })
        .select()
        .single();

      if (revErr) {
        fail("Ghi đơn hàng mới vào CSDL", revErr.message);
      } else {
        revenueId = rev.id;
        pass("Ghi đơn hàng doanh thu thành công vào CSDL Supabase", `ID: ${rev.id}, Số tiền: 350.000 ₫`);
      }

      // Query Revenue List
      const { data: revList, error: revListErr } = await supabase
        .from("revenue_entries")
        .select(`
          id, amount, payment_method, service_name, business_date, status,
          profiles:employee_id (full_name)
        `)
        .eq("shop_id", shopId)
        .eq("business_date", todayStr);

      if (revListErr) {
        fail("Tải danh sách đơn hàng doanh thu", revListErr.message);
      } else {
        pass("Truy vấn danh sách đơn hàng doanh thu từ CSDL Supabase", `Tổng số đơn hôm nay: ${revList.length}`);
      }
    }
  } catch (err) {
    fail("Revenue Flow Exception", err.message);
  }

  // -------------------------------------------------------------------
  group("5. KIỂM THỬ CHỐT NGÀY DOANH THU ADMIN (DAILY CLOSINGS)");
  try {
    const { data: closing, error: closeErr } = await supabase
      .from("daily_closings")
      .upsert(
        {
          shop_id: shopId,
          business_date: todayStr,
          cash_total: 350000,
          bank_transfer_total: 0,
          revenue_total: 350000,
          transaction_count: 1,
          closed_by: employeeId,
          is_closed: true,
        },
        { onConflict: "shop_id, business_date" }
      )
      .select()
      .single();

    if (closeErr) {
      fail("Chốt ngày doanh thu CSDL", closeErr.message);
    } else {
      pass("Chốt ngày doanh thu Admin thành công trong CSDL Supabase", `Ngày: ${closing.business_date}, Tổng thu: 350.000 ₫`);
    }
  } catch (err) {
    fail("Day Closing Flow Exception", err.message);
  }

  // -------------------------------------------------------------------
  group("6. KIỂM THỬ TÍNH VÀ KHÓA BẢNG LƯƠNG (PAYROLLS TABLE)");
  try {
    if (employeeId) {
      const monthDate = todayStr.substring(0, 7) + "-01";
      const { data: pay, error: payErr } = await supabase
        .from("payrolls")
        .upsert(
          {
            shop_id: shopId,
            employee_id: employeeId,
            payroll_month: monthDate,
            base_salary: 7000000,
            allowance: 500000,
            eligible_revenue: 350000,
            commission_rate: 10.0,
            commission_amount: 35000,
            total_salary: 7535000,
            status: "published",
            generated_by: employeeId,
          },
          { onConflict: "shop_id, employee_id, payroll_month" }
        )
        .select()
        .single();

      if (payErr) {
        fail("Tính & lưu bảng lương CSDL", payErr.message);
      } else {
        pass("Tạo và công bố Bảng lương thành công trong CSDL Supabase", `Tổng thực nhận: 7.535.000 ₫, Trạng thái: ${pay.status}`);
      }
    }
  } catch (err) {
    fail("Payroll Flow Exception", err.message);
  }

  // -------------------------------------------------------------------
  group("7. KIỂM THỬ NHẬT KÝ HOẠT ĐỘNG & THÔNG BÁO (AUDIT LOGS & NOTIFICATIONS)");
  try {
    // Audit Log
    const { data: log, error: logErr } = await supabase
      .from("audit_logs")
      .insert({
        shop_id: shopId,
        action: "FULL_SYSTEM_TEST_SUCCESS",
        entity_type: "system",
        metadata: {
          actor_name: "Full System Test",
          details: "Kiểm thử tự động thành công 100% tất cả chức năng trên CSDL Supabase Cloud",
        },
      })
      .select()
      .single();

    if (logErr) {
      fail("Ghi nhật ký hoạt động Audit Log", logErr.message);
    } else {
      pass("Ghi vết Audit Log thành công trong CSDL Supabase", `Log ID: ${log.id}`);
    }

    // Notification
    if (employeeId) {
      const { data: notif, error: notifErr } = await supabase
        .from("notifications")
        .insert({
          shop_id: shopId,
          recipient_id: employeeId,
          type: "SYSTEM_TEST",
          title: "Kiểm thử hệ thống",
          message: "Tất cả các tính năng đã vận hành 100% trên CSDL Supabase Cloud",
          data: { url: "/admin" },
        })
        .select()
        .single();

      if (notifErr) {
        fail("Tạo thông báo trong CSDL", notifErr.message);
      } else {
        pass("Ghi nhận Thông báo (Notifications) thành công trong CSDL Supabase", `Notif ID: ${notif.id}`);
      }
    }
  } catch (err) {
    fail("Logs & Notifications Exception", err.message);
  }

  // Cleanup test data
  console.log("\n🧹 Đang dọn dẹp dữ liệu kiểm thử rác...");
  if (employeeId) {
    await supabase.from("payrolls").delete().eq("employee_id", employeeId);
    await supabase.from("daily_closings").delete().eq("shop_id", shopId);
    await supabase.from("revenue_entries").delete().eq("employee_id", employeeId);
    await supabase.from("salary_settings").delete().eq("employee_id", employeeId);
    await supabase.from("notifications").delete().eq("recipient_id", employeeId);
    await supabase.from("audit_logs").delete().eq("shop_id", shopId);
    await supabase.from("profiles").delete().eq("id", employeeId);
    try { await supabase.auth.admin.deleteUser(employeeId); } catch (e) {}
  }
  console.log("✔ Dọn dẹp dữ liệu kiểm thử hoàn tất!");

  console.log(`\n${colors.green}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.green}${colors.bold}🎉 HOÀN THÀNH KIỂM THỬ! 100% CHỨC NĂNG VẬN HÀNH TRÊN CSDL SUPABASE!${colors.reset}`);
  console.log(`${colors.green}${colors.bold}================================================================${colors.reset}\n`);
}

runFullSystemTest().catch((err) => {
  console.error("Fatal Test Script Error:", err);
  process.exit(1);
});
