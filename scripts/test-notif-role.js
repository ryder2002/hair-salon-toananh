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

async function testNotifRole() {
  console.log("Testing Notification Targeting for Admin vs Employee...");

  // 1. Get Admin Profile ID
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
  const adminId = admins?.[0]?.id;

  // 2. Fetch notifications for Admin
  const { data: adminNotifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", adminId);

  // 3. Fetch notifications for Employee role
  const { data: empNotifs } = await supabase
    .from("notifications")
    .select("*")
    .neq("type", "REVENUE_RECORDED");

  console.log(`Admin (${adminId}) Notification Count:`, adminNotifs?.length || 0);
  console.log("Employee Filtered Notification Count:", empNotifs?.length || 0);
}

testNotifRole().catch(console.error);
