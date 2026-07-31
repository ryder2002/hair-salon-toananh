/**
 * Development/staging seed for the first administrator.
 *
 * This script uses the Supabase Auth Admin API and is intentionally not run
 * automatically during build or deployment. Never use the default password
 * in production.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const values = {};
  if (!fs.existsSync(envPath)) return values;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) values[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
  }
  return values;
}

async function main() {
  const env = { ...loadEnv(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const shopId = "11111111-1111-1111-1111-111111111111";
  const requestedEmail = "admin@barbershop.com";
  const password = "admin123";

  await supabase.from("shops").upsert({
    id: shopId,
    name: "Toàn Anh Hair Salon",
    timezone: "Asia/Ho_Chi_Minh",
    currency: "VND",
  }, { onConflict: "id" });

  const { data: existingProfile, error: profileLookupError } = await supabase.from("profiles").select("id, email").eq("username", "admin").maybeSingle();
  if (profileLookupError) throw profileLookupError;
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  let user = existingProfile ? listed.users.find((item) => item.id === existingProfile.id) : listed.users.find((item) => item.email?.toLowerCase() === requestedEmail);
  if (!user) {
    const created = await supabase.auth.admin.createUser({ email: requestedEmail, password, email_confirm: true });
    if (created.error || !created.data.user) throw created.error || new Error("Unable to create admin Auth user");
    user = created.data.user;
  } else {
    const updated = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (updated.error) throw updated.error;
  }

  const email = user.email || requestedEmail;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    shop_id: shopId,
    full_name: "Toàn Anh (Admin)",
    email,
    username: "admin",
    phone: null,
    job_title: "Chủ tiệm / Admin",
    role: "admin",
    status: "active",
    must_change_password: true,
  }, { onConflict: "id" });
  if (profileError) throw profileError;

  console.log(`Seeded admin Auth user: ${email}`);
  console.log("Temporary password: admin123 (change immediately after first login)");
}

main().catch((error) => {
  console.error("Admin seed failed:", error.message || error);
  process.exitCode = 1;
});
