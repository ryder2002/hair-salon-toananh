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

async function checkRevenue() {
  console.log("Checking revenue_entries table...");
  const { data, error } = await supabase.from("revenue_entries").select("amount, status");
  
  if (error) {
    console.error("Error fetching revenues:", error);
    return;
  }
  
  console.log(`Found ${data.length} total revenue entries.`);
  
  let totalRevenue = 0n;
  let recordedRevenue = 0n;
  
  for (const entry of data) {
    const amt = BigInt(entry.amount || 0);
    totalRevenue += amt;
    if (entry.status === 'recorded') {
      recordedRevenue += amt;
    }
  }
  
  console.log(`Total Revenue (all): ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(totalRevenue))}`);
  console.log(`Recorded Revenue (valid): ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(recordedRevenue))}`);
}

checkRevenue();
