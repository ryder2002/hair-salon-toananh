const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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

async function testEmployeeRevenue() {
  console.log("Testing Revenue Entry for Employee Đinh Công Nhất with valid UUID...");
  
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "employee");

  if (profiles && profiles.length > 0) {
    const emp = profiles[0];
    const todayStr = new Date().toISOString().split("T")[0];
    const validUuidKey = crypto.randomUUID();

    // Insert revenue entry with valid UUID
    const { data: rev, error: revErr } = await supabase
      .from("revenue_entries")
      .insert({
        shop_id: "11111111-1111-1111-1111-111111111111",
        employee_id: emp.id,
        amount: 150000,
        payment_method: "cash",
        service_name: "Cắt tóc nam",
        business_date: todayStr,
        idempotency_key: validUuidKey,
        created_by: emp.id,
      })
      .select()
      .single();

    console.log("Revenue Entry Error:", revErr);
    console.log("Revenue Entry Inserted:", rev);
  }
}

testEmployeeRevenue().catch(console.error);
