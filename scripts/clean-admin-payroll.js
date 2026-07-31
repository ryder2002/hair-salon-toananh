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

async function cleanAdminPayroll() {
  console.log("🧹 Deleting admin payroll entries from DB...");

  // Find admin profile IDs
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (adminProfiles && adminProfiles.length > 0) {
    const adminIds = adminProfiles.map((a) => a.id);
    const { error } = await supabase
      .from("payrolls")
      .delete()
      .in("employee_id", adminIds);

    console.log("Result:", error ? error.message : `Deleted payroll entries for admin users (${adminIds.length})`);
  } else {
    console.log("No admin profiles found.");
  }
}

cleanAdminPayroll().catch(console.error);
