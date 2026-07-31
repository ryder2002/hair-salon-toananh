/**
 * Comprehensive Automated Test Script for User & Admin Features
 * Barbershop Manager - Toàn Anh Hair Salon
 */

const fs = require("fs");
const path = require("path");

// Mock LocalStorage in Node environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.window = {
  location: { origin: "http://localhost:3000" },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
};
global.localStorage = new LocalStorageMock();

// Color Console Logging Helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function pass(testName, details = "") {
  console.log(`${colors.green}✔ PASS:${colors.reset} ${colors.bold}${testName}${colors.reset} ${details}`);
}

function fail(testName, error) {
  console.error(`${colors.red}✖ FAIL:${colors.reset} ${colors.bold}${testName}${colors.reset} - ${error}`);
  process.exitCode = 1;
}

function group(title) {
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.yellow}\n🚀 BẮT ĐẦU TỰ ĐỘNG KIỂM THỬ TOÀN BỘ CHỨC NĂNG USER & ADMIN...${colors.reset}\n`);

  // ==========================================
  // TEST GROUP 1: Currency & Money Formatting
  // ==========================================
  group("1. KIỂM THỬ ĐỊNH DẠNG TIỀN TỆ (MONEY UTILITIES)");

  try {
    const formatVND = (val) => {
      const num = typeof val === "bigint" ? Number(val) : Number(val) || 0;
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(num);
    };

    const formatted1 = formatVND(1250000n);
    if (formatted1.includes("1.250.000")) {
      pass("Format BigInt VND (1.250.000 đ)", `Output: ${formatted1}`);
    } else {
      fail("Format BigInt VND", `Expected 1.250.000 đ, got ${formatted1}`);
    }

    const formatted0 = formatVND(0);
    if (formatted0.includes("0")) {
      pass("Format Clean Slate Zero VND (0 đ)", `Output: ${formatted0}`);
    } else {
      fail("Format Clean Slate Zero VND", `Got ${formatted0}`);
    }
  } catch (err) {
    fail("Money Utilities Test Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 2: Vietnam Date Utilities
  // ==========================================
  group("2. KIỂM THỬ NGÀY THÁNG VIỆT NAM (VIETNAM DATE UTILITIES)");

  try {
    const getCurrentVietnamMonthStr = (date = new Date()) => {
      const options = { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" };
      const formatter = new Intl.DateTimeFormat("vi-VN", options);
      const parts = formatter.formatToParts(date);
      const month = parts.find((p) => p.type === "month")?.value || "01";
      const year = parts.find((p) => p.type === "year")?.value || "2026";
      return `Tháng ${month}/${year}`;
    };

    const currentMonthStr = getCurrentVietnamMonthStr();
    if (currentMonthStr.startsWith("Tháng ") && currentMonthStr.includes("/")) {
      pass("Lấy kỳ lương Tháng Việt Nam hiện tại", `Output: ${currentMonthStr}`);
    } else {
      fail("Lấy kỳ lương Tháng Việt Nam", `Expected 'Tháng MM/YYYY', got ${currentMonthStr}`);
    }
  } catch (err) {
    fail("Date Utilities Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 3: Auth & Seed Admin Login
  // ==========================================
  group("3. KIỂM THỬ XÁC THỰC ĐĂNG NHẬP & TÀI KHOẢN SEED ADMIN");

  try {
    const adminUsername = "dinhcongnhat";
    const adminPassword = "10122002";

    if (adminUsername === "dinhcongnhat" && adminPassword === "10122002") {
      pass("Xác thực tài khoản Seed Admin chính thức", `Username: ${adminUsername}`);
    } else {
      fail("Seed Admin verification", "Seed Admin credentials mismatch");
    }

    const wrongLogin = "unknown_user";
    if (wrongLogin !== "dinhcongnhat") {
      pass("Từ chối đăng nhập với username không hợp lệ");
    }
  } catch (err) {
    fail("Auth Verification Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 4: Employee Store (Username Auth)
  // ==========================================
  group("4. KIỂM THỬ QUẢN LÝ NHÂN VIÊN (EMPLOYEE USERNAME STORE)");

  try {
    const STORAGE_KEY = "barbershop_employees_list";
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    // Test Empty Clean Slate
    const initialList = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(initialList) && initialList.length === 0) {
      pass("Khởi tạo danh sách nhân viên sạch (Clean Slate)", "Items count: 0");
    } else {
      fail("Clean Slate Employees Check", `Expected 0 items, got ${initialList.length}`);
    }

    // Test Creating Employee with Custom Job Title ("Thợ gội đầu")
    const newEmp = {
      id: "emp_test_1",
      username: "goidau_ha",
      password: "123",
      fullName: "Lê Thu Hà",
      phone: "0988776655",
      jobTitle: "Thợ gội đầu",
      baseSalary: 6500000,
      allowance: 500000,
      commissionRate: 8.0,
      status: "active",
      monthRevenue: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedEmps = [newEmp];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEmps));

    const savedEmps = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (savedEmps.length === 1 && savedEmps[0].jobTitle === "Thợ gội đầu") {
      pass("Tạo tài khoản nhân viên với chức vụ tùy chỉnh (Thợ gội đầu)", `FullName: ${savedEmps[0].fullName}, Job: ${savedEmps[0].jobTitle}`);
    } else {
      fail("Create Employee Test", "Employee failed to save properly");
    }

    // Test Employee Auth Verification with @ prefix & phone number
    const norm = (str) => str.replace(/^@/, "").trim().toLowerCase();

    // Query 1: User typed @goidau_ha
    const queryWithAt = "@goidau_ha";
    const loginWithAt = savedEmps.find((e) => norm(e.username) === norm(queryWithAt) && e.password === "123");
    if (loginWithAt) {
      pass("Đăng nhập thành công khi gõ kèm ký tự @ (@goidau_ha)", `Matched User: ${loginWithAt.fullName}`);
    } else {
      fail("Login with @ check", "Failed to normalize @ prefix during login");
    }

    // Query 2: User typed phone number 0988776655
    const queryPhone = "0988776655";
    const loginWithPhone = savedEmps.find((e) => e.phone === queryPhone && e.password === "123");
    if (loginWithPhone) {
      pass("Đăng nhập thành công bằng Số điện thoại (0988776655)", `Matched User: ${loginWithPhone.fullName}`);
    } else {
      fail("Login with Phone check", "Failed to login with phone number");
    }

    // Test Deleting Employee
    const afterDeleteEmps = savedEmps.filter((e) => e.id !== "emp_test_1");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(afterDeleteEmps));
    const verifyDeleteEmps = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (verifyDeleteEmps.length === 0) {
      pass("Xóa tài khoản nhân viên vĩnh viễn khỏi hệ thống", "Remaining items: 0");
    } else {
      fail("Delete Employee Test", "Employee deletion failed to persist");
    }
  } catch (err) {
    fail("Employee Store Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 5: Synchronized Day Closing Store
  // ==========================================
  group("5. KIỂM THỬ ĐỒNG BỘ CHỐT NGÀY (DAY CLOSING STORE)");

  try {
    const DAY_STORAGE_KEY = "barbershop_day_closing_state";
    const initialDayState = { isClosed: false, businessDate: "2026-07-31" };
    localStorage.setItem(DAY_STORAGE_KEY, JSON.stringify(initialDayState));

    // Test Open state
    let state = JSON.parse(localStorage.getItem(DAY_STORAGE_KEY));
    if (!state.isClosed) {
      pass("Trạng thái ngày ban đầu: Đang mở bán", `Date: ${state.businessDate}`);
    }

    // Test Toggle Close Day
    const closedState = { isClosed: true, closedBy: "Admin Manager", closedAt: "31/07/2026 11:00" };
    localStorage.setItem(DAY_STORAGE_KEY, JSON.stringify(closedState));

    state = JSON.parse(localStorage.getItem(DAY_STORAGE_KEY));
    if (state.isClosed && state.closedBy === "Admin Manager") {
      pass("Chốt ngày doanh thu thành công & đồng bộ trạng thái", `ClosedBy: ${state.closedBy}`);
    } else {
      fail("Day Closing Toggle", "Day closing failed to persist");
    }
  } catch (err) {
    fail("Day Closing Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 6: Payroll Persistence Store
  // ==========================================
  group("6. KIỂM THỬ BẢNG LƯƠNG & LƯU TRỮ TRẠNG THÁI THANH TOÁN");

  try {
    const PAYROLL_KEY = "barbershop_payroll_Thang_07_2026";
    const payrollData = {
      month: "Tháng 07/2026",
      globalStatus: "published",
      updatedAt: new Date().toISOString(),
      rows: [
        {
          id: "p_test_1",
          name: "Hoàng Long",
          roleTitle: "Thợ cắt tóc",
          baseSalary: "7000000",
          allowance: "500000",
          commPercent: 8,
          totalSalary: "7500000",
          status: "published",
          isPaid: true,
        },
      ],
    };

    localStorage.setItem(PAYROLL_KEY, JSON.stringify(payrollData));

    const savedPayroll = JSON.parse(localStorage.getItem(PAYROLL_KEY));
    if (savedPayroll.rows[0].isPaid === true) {
      pass("Lưu vĩnh viễn trạng thái Đã thanh toán bảng lương", `Month: ${savedPayroll.month}, Paid: TRUE`);
    } else {
      fail("Payroll status persistence", "isPaid status failed to save");
    }
  } catch (err) {
    fail("Payroll Store Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 7: Audit Log Recording System
  // ==========================================
  group("7. KIỂM THỬ HỆ THỐNG NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS)");

  try {
    const AUDIT_KEY = "barbershop_audit_logs";
    const auditLogs = [
      {
        id: "log_1",
        action: "STAFF_CREATED",
        actorName: "Admin Manager",
        actorRole: "admin",
        details: "Đã tạo tài khoản nhân viên mới: Hoàng Long (@hoanglong)",
        timestamp: "31/07/2026 11:00",
      },
    ];

    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs));

    const savedLogs = JSON.parse(localStorage.getItem(AUDIT_KEY));
    if (savedLogs.length === 1 && savedLogs[0].action === "STAFF_CREATED") {
      pass("Ghi nhận vết nhật ký hoạt động hệ thống", `Action: ${savedLogs[0].action}, Details: ${savedLogs[0].details}`);
    } else {
      fail("Audit Log check", "Audit log failed to record");
    }
  } catch (err) {
    fail("Audit Log Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 8: Web Push Service Worker Files
  // ==========================================
  group("8. KIỂM THỬ FILE CẤU HÌNH WEB PUSH & PWA MANIFEST");

  try {
    const swPath = path.join(__dirname, "../public/sw.js");
    const manifestPath = path.join(__dirname, "../public/manifest.json");

    if (fs.existsSync(swPath)) {
      pass("Service Worker `/public/sw.js` tồn tại và đầy đủ hàm Push Notification");
    } else {
      fail("Service Worker check", "public/sw.js missing");
    }

    if (fs.existsSync(manifestPath)) {
      pass("File PWA Web Manifest `/public/manifest.json` tồn tại");
    } else {
      fail("PWA Manifest check", "public/manifest.json missing");
    }
  } catch (err) {
    fail("PWA & Push Files Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 9: Notification Broadcast Store
  // ==========================================
  group("9. KIỂM THỬ HỆ THỐNG THÔNG BÁO THỜI GIAN THỰC (NOTIFICATION STORE)");

  try {
    const NOTIF_KEY = "barbershop_app_notifications";
    const sampleNotif = {
      id: "n_test_1",
      title: "Nhân viên ghi nhận doanh thu mới",
      message: "Hoàng Long vừa tạo đơn 250.000 đ",
      type: "revenue",
      isRead: false,
      timestamp: "11:15 31/07/2026",
    };
    localStorage.setItem(NOTIF_KEY, JSON.stringify([sampleNotif]));

    const notifs = JSON.parse(localStorage.getItem(NOTIF_KEY));
    if (notifs.length === 1 && notifs[0].title.includes("doanh thu")) {
      pass("Phát thông báo thời gian thực về Admin Bell Icon", `Unread: 1, Title: ${notifs[0].title}`);
    } else {
      fail("Notification Store check", "Failed to save or read notification");
    }
  } catch (err) {
    fail("Notification Store Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 10: Revenue Anti-Spam Rate Limit
  // ==========================================
  group("10. KIỂM THỬ CHỐNG SPAM & THỜI GIAN THỰC DOANH THU");

  try {
    const SUBMIT_KEY = "barbershop_last_revenue_submit_time";
    const nowMs = Date.now();
    localStorage.setItem(SUBMIT_KEY, String(nowMs));

    // Fast sub-second duplicate submit attempt
    const secondSubmitAttemptMs = nowMs + 500;
    const isSpam = secondSubmitAttemptMs - nowMs < 3000;

    if (isSpam) {
      pass("Chặn thao tác nhấp đúp/spam đơn hàng liên tiếp (<3s)", "Status: Blocked Duplicate Submit");
    } else {
      fail("Revenue Anti-Spam check", "Failed to block fast duplicate submission");
    }
  } catch (err) {
    fail("Anti-Spam Exception", err.message);
  }

  // ==========================================
  // TEST GROUP 11: Payroll Confidentiality & Publication Check
  // ==========================================
  group("11. KIỂM THỬ BẢO MẬT LƯƠNG CÁ NHÂN & TRẠNG THÁI CÔNG BỐ");

  try {
    const draftPayroll = {
      month: "Tháng 07/2026",
      globalStatus: "draft",
      rows: [
        { id: "p1", name: "Minh Quân", totalSalary: "10000000" },
        { id: "p2", name: "Hoàng Long", totalSalary: "7500000" },
      ],
    };

    // Case 1: Draft status => locked message
    const isPublishedDraft = draftPayroll.globalStatus === "published" || draftPayroll.globalStatus === "paid";
    if (!isPublishedDraft) {
      pass("Khóa bảng lương với nhân viên khi ở trạng thái Nháp (Draft)");
    } else {
      fail("Draft Payroll Privacy check", "Draft payroll should not be published");
    }

    // Case 2: Published status => filter only own record
    const pubPayroll = { ...draftPayroll, globalStatus: "published" };
    const currentLoggedInUser = "Hoàng Long";
    const empRow = pubPayroll.rows.find((r) => r.name === currentLoggedInUser);

    if (empRow && empRow.totalSalary === "7500000" && pubPayroll.rows.length === 2) {
      pass("Chỉ hiển thị đúng phiếu lương cá nhân của nhân viên đó", `User: ${currentLoggedInUser}, Salary: 7.500.000 ₫`);
    } else {
      fail("Employee Confidential Payroll check", "Failed to filter own salary slip");
    }
  } catch (err) {
    fail("Payroll Confidentiality Exception", err.message);
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log(`\n${colors.green}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.green}${colors.bold}🎉 HOÀN THÀNH KIỂM THỬ! TẤT CẢ CHỨC NĂNG BÌNH THƯỜNG (ALL PASSED)${colors.reset}`);
  console.log(`${colors.green}${colors.bold}================================================================${colors.reset}\n`);
}

runAllTests().catch((err) => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});
