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

async function checkMigrations() {
  console.log("Checking if RPC functions exist in Supabase...");
  
  // Test unlock_payroll
  const unlockRes = await supabase.rpc("unlock_payroll", { p_payroll_month: '2026-08-01' });
  if (unlockRes.error && unlockRes.error.message.includes('Could not find the function')) {
    console.log("❌ unlock_payroll: NOT FOUND");
  } else {
    // It might fail for other reasons (e.g. Only admins can unlock), which means it exists
    console.log("✅ unlock_payroll: EXISTS");
  }
  
  // Test get_admin_dashboard
  const adminRes = await supabase.rpc("get_admin_dashboard", { p_business_date: '2026-08-01' });
  if (adminRes.error && adminRes.error.message.includes('Could not find the function')) {
    console.log("❌ get_admin_dashboard: NOT FOUND");
  } else {
    console.log("✅ get_admin_dashboard: EXISTS");
  }

  // Test get_employee_dashboard
  const empRes = await supabase.rpc("get_employee_dashboard", { p_business_date: '2026-08-01', p_month_start: '2026-08-01' });
  if (empRes.error && empRes.error.message.includes('Could not find the function')) {
    console.log("❌ get_employee_dashboard: NOT FOUND");
  } else {
    console.log("✅ get_employee_dashboard: EXISTS");
  }
}

checkMigrations();
