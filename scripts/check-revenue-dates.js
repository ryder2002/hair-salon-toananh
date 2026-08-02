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

async function checkRevenueByDate() {
  console.log("Đang kiểm tra doanh thu từ Database...");
  
  // Get today and yesterday dates in YYYY-MM-DD
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  console.log(`Lấy dữ liệu từ ${yesterdayStr} đến ${todayStr}`);

  const { data, error } = await supabase
    .from("revenue_entries")
    .select("amount, status, business_date, profiles:employee_id(full_name)")
    .gte("business_date", yesterdayStr)
    .lte("business_date", todayStr)
    .order("business_date", { ascending: false });
  
  if (error) {
    console.error("Error fetching revenues:", error);
    return;
  }
  
  const summaryByDate = {};
  
  for (const entry of data) {
    if (entry.status !== 'recorded') continue;
    
    const date = entry.business_date;
    const amt = BigInt(entry.amount || 0);
    
    if (!summaryByDate[date]) {
      summaryByDate[date] = { total: 0n, count: 0, details: [] };
    }
    
    summaryByDate[date].total += amt;
    summaryByDate[date].count += 1;
    summaryByDate[date].details.push({
      amount: amt,
      staff: entry.profiles?.full_name || 'Nhân viên',
    });
  }
  
  for (const date of Object.keys(summaryByDate).sort((a, b) => b.localeCompare(a))) {
    const info = summaryByDate[date];
    const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(info.total));
    console.log(`\n--- Ngày ${date} ---`);
    console.log(`Tổng doanh thu: ${formattedTotal} (${info.count} giao dịch)`);
    console.log(`Chi tiết:`);
    info.details.forEach(d => {
       console.log(`  - ${d.staff}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(d.amount))}`);
    });
  }
}

checkRevenueByDate();
