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

async function testFetch() {
  console.log("Querying profiles without join...");
  const { data: profs, error: err1 } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, job_title, role, status")
    .eq("role", "employee");
  console.log("Profiles without join Error:", err1);
  console.log("Profiles without join Result:", profs);

  console.log("\nQuerying profiles with explicit FK join...");
  const { data: listFk, error: err2 } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      job_title,
      role,
      status,
      avatar_url,
      salary_settings:salary_settings!salary_settings_employee_id_fkey(base_salary, allowance, commission_rate)
    `)
    .eq("role", "employee");

  console.log("Profiles with explicit FK join Error:", err2);
  console.log("Profiles with explicit FK join Result:", JSON.stringify(listFk, null, 2));
}

testFetch().catch(console.error);
