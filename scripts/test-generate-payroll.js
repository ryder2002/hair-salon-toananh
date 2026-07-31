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

async function testPayroll() {
  console.log("Testing Automatic Payroll Generation in Supabase DB...");
  const shopId = "11111111-1111-1111-1111-111111111111";
  const dbDate = "2026-07-01";

  // Fetch active employee profiles
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, role").eq("status", "active");
  console.log("Active Profiles found:", profiles);

  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      const { data: pay, error: payErr } = await supabase
        .from("payrolls")
        .upsert({
          shop_id: shopId,
          employee_id: p.id,
          payroll_month: dbDate,
          base_salary: 6000000,
          allowance: 500000,
          eligible_revenue: 150000,
          commission_rate: 8.0,
          commission_amount: 12000,
          total_salary: 6512000,
          status: "published",
          generated_by: p.id,
        }, { onConflict: "shop_id, employee_id, payroll_month" })
        .select()
        .single();

      console.log(`Payroll created for ${p.full_name}:`, payErr ? payErr.message : pay.id);
    }
  }

  // Fetch generated payrolls
  const { data: list } = await supabase.from("payrolls").select("id, total_salary, status, profiles:employee_id(full_name)");
  console.log("Generated Payrolls in DB:", list);
}

testPayroll().catch(console.error);
