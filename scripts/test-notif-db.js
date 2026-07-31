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

async function testNotifs() {
  console.log("Testing Notification API against Supabase DB...");
  const shopId = "11111111-1111-1111-1111-111111111111";

  // 1. Insert a sample test notification
  const { data: notif, error: notifErr } = await supabase
    .from("notifications")
    .insert({
      shop_id: shopId,
      recipient_id: "56272061-83fe-4173-9961-4b1029cf66d0",
      type: "REVENUE_RECORDED",
      title: "Nhân viên vừa ghi nhận doanh thu mới",
      message: "Đinh Công Nhất vừa tạo đơn Cắt tóc nam (150.000 đ)",
      data: { url: "/admin/revenue" },
    })
    .select()
    .single();

  console.log("Inserted Notif Error:", notifErr);
  console.log("Inserted Notif:", notif);

  // 2. Query unread count
  const { count, error: countErr } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  console.log("Unread Count from DB:", count);

  // 3. Query all notifications
  const { data: allNotifs } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("All Notifications from DB:", allNotifs);
}

testNotifs().catch(console.error);
