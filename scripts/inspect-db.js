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

async function inspect() {
  console.log("Checking profiles table...");
  const { data, error } = await supabase.from("profiles").select("*");
  console.log("Profiles select error:", error);
  console.log("Profiles data:", data);

  console.log("\nChecking revenue_entries table...");
  const { data: rev, error: revErr } = await supabase.from("revenue_entries").select("*");
  console.log("Revenues select error:", revErr);
  console.log("Revenues data count:", rev?.length);
}

inspect();
