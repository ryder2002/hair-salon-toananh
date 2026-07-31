"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile, requireAdmin } from "@/lib/supabase/authz";
import { RevenueEntrySchema } from "@/lib/validations";

import { sendWebPushNotificationToUsersAction } from "@/server/actions/push";
import { getVietnamBusinessDate } from "@/lib/dates";

export async function getAdminDashboardDataAction() {
  const tStart = performance.now();
  console.log("[PERF] dashboard-start");

  const { profile, supabase } = await requireAdmin();
  const dateStr = getVietnamBusinessDate();

  const tRevenueStart = performance.now();
  const [revRes, empRes, closingRes, notifRes] = await Promise.all([
    supabase
      .from("revenue_entries")
      .select("id, amount, payment_method, service_name, note, business_date, performed_at, status, employee_id, created_by, profiles:employee_id(full_name, avatar_url)")
      .eq("shop_id", profile.shop_id)
      .eq("business_date", dateStr)
      .order("performed_at", { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "employee")
      .eq("status", "active"),
    supabase
      .from("daily_closings")
      .select("id, business_date, cash_total, bank_transfer_total, revenue_total, transaction_count, is_closed, closed_at, reopened_at, reopen_reason")
      .eq("shop_id", profile.shop_id)
      .eq("business_date", dateStr)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", profile.id)
      .is("read_at", null),
  ]);

  const tRevenueEnd = performance.now();
  console.log(`[PERF] revenue: ${(tRevenueEnd - tRevenueStart).toFixed(2)} ms`);
  console.log(`[PERF] employees: ${(tRevenueEnd - tRevenueStart).toFixed(2)} ms`);
  console.log(`[PERF] transactions: ${(tRevenueEnd - tRevenueStart).toFixed(2)} ms`);

  if (revRes.error) throw new Error(revRes.error.message);
  if (empRes.error) throw new Error(empRes.error.message);

  const rawRevenues = revRes.data || [];
  const dbEmployees = empRes.data || [];
  const closingData = closingRes.data;
  const unreadCount = notifRes.count || 0;

  const recorded = rawRevenues.filter((t: any) => t.status === "recorded");

  let cash = 0n;
  let bank = 0n;
  const staffMap: Record<string, { name: string; avatarType: any; revenue: bigint }> = {};

  dbEmployees.forEach((e: any) => {
    if (e.full_name) {
      staffMap[e.full_name] = { name: e.full_name, avatarType: "scissors", revenue: 0n };
    }
  });

  const formattedTxs = recorded.map((t: any) => {
    const amt = BigInt(t.amount || 0);
    const pm = t.payment_method || t.paymentMethod;
    if (pm === "cash") cash += amt;
    else bank += amt;

    const sName = t.profiles?.full_name || t.staffName || "Nhân viên";
    if (!staffMap[sName]) {
      staffMap[sName] = { name: sName, avatarType: t.avatarType || "scissors", revenue: 0n };
    }
    staffMap[sName].revenue += amt;

    return {
      id: t.id,
      staffName: sName,
      avatarType: t.avatarType || "scissors",
      serviceName: t.service_name || t.serviceName || "Dịch vụ tóc",
      amount: amt.toString(),
      paymentMethod: pm,
      time: new Date(t.performed_at || Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      status: t.status,
    };
  });

  const total = cash + bank;

  const staffItems = Object.values(staffMap).map((s, idx) => {
    const pct = total > 0n ? Number((s.revenue * 100n) / total) : 0;
    return {
      id: `staff_rev_${idx}`,
      name: s.name,
      avatarType: s.avatarType,
      revenue: s.revenue.toString(),
      percentage: Math.min(100, Math.max(0, pct)),
    };
  });

  staffItems.sort((a, b) => (BigInt(b.revenue) > BigInt(a.revenue) ? 1 : -1));

  const tEnd = performance.now();
  console.log(`[PERF] dashboard-total: ${(tEnd - tStart).toFixed(2)} ms`);

  return {
    businessDate: dateStr,
    totalRevenue: total.toString(),
    cashTotal: cash.toString(),
    bankTotal: bank.toString(),
    transactionCount: formattedTxs.length,
    staffRevenues: staffItems,
    recentTransactions: formattedTxs,
    isClosed: closingData?.is_closed === true,
    dayClosingInfo: closingData || null,
    unreadNotificationCount: unreadCount,
  };
}

export async function getEmployeeDashboardDataAction() {
  const { profile, supabase } = await requireActiveProfile();
  const dateStr = getVietnamBusinessDate();
  const monthStartStr = `${dateStr.substring(0, 7)}-01`;

  const [todayRes, monthRes, notifRes] = await Promise.all([
    supabase
      .from("revenue_entries")
      .select("id, amount, payment_method, service_name, note, business_date, performed_at, status")
      .eq("shop_id", profile.shop_id)
      .eq("employee_id", profile.id)
      .eq("business_date", dateStr)
      .order("performed_at", { ascending: false }),
    supabase
      .from("revenue_entries")
      .select("amount")
      .eq("shop_id", profile.shop_id)
      .eq("employee_id", profile.id)
      .eq("status", "recorded")
      .gte("business_date", monthStartStr)
      .lte("business_date", dateStr),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", profile.id)
      .is("read_at", null),
  ]);

  if (todayRes.error) throw new Error(todayRes.error.message);
  if (monthRes.error) throw new Error(monthRes.error.message);

  const todayEntries = todayRes.data || [];
  const monthEntries = monthRes.data || [];

  let cCash = 0n;
  let cTransfer = 0n;
  let cutCount = 0;
  const formattedTxs: any[] = [];

  todayEntries.forEach((e: any) => {
    if (e.status === "voided") return;
    const amt = BigInt(e.amount || 0);
    if (e.payment_method === "cash") cCash += amt;
    if (e.payment_method === "bank_transfer") cTransfer += amt;
    cutCount += 1;

    formattedTxs.push({
      id: e.id,
      staffName: profile.full_name,
      avatarType: "scissors",
      serviceName: e.service_name || "Dịch vụ tóc",
      amount: amt.toString(),
      paymentMethod: e.payment_method,
      time: new Date(e.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      status: e.status,
    });
  });

  let cMonth = 0n;
  monthEntries.forEach((e: any) => {
    cMonth += BigInt(e.amount || 0);
  });

  return {
    businessDate: dateStr,
    todayCash: cCash.toString(),
    todayTransfer: cTransfer.toString(),
    todayTotal: (cCash + cTransfer).toString(),
    monthTotal: cMonth.toString(),
    cutCount,
    transactions: formattedTxs,
    unreadNotificationCount: notifRes.count || 0,
    employeeName: profile.full_name,
  };
}

export async function fetchRevenuesAction(date?: string) {
  const { profile, supabase } = await requireActiveProfile();
  let query = supabase
    .from("revenue_entries")
    .select("id, amount, payment_method, service_name, note, business_date, performed_at, status, employee_id, created_by, profiles:employee_id(full_name, avatar_url)")
    .eq("shop_id", profile.shop_id)
    .order("performed_at", { ascending: false })
    .limit(500);
  if (date) query = query.eq("business_date", date);
  if (profile.role !== "admin") query = query.eq("employee_id", profile.id);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createRevenueEntryAction(formData: {
  employee_id?: string;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  service_name?: string;
  note?: string;
  business_date: string;
  idempotency_key: string;
}) {
  const { profile, supabase } = await requireActiveProfile();
  const validated = RevenueEntrySchema.parse(formData);
  const { data, error } = await supabase.rpc("record_revenue", {
    p_business_date: validated.business_date,
    p_amount: validated.amount,
    p_payment_method: validated.payment_method,
    p_service_name: validated.service_name || null,
    p_note: validated.note || null,
    p_idempotency_key: validated.idempotency_key,
    p_employee_id: profile.role === "admin" ? formData.employee_id || null : null,
  });
  if (error) throw new Error(error.message);

  // Notifications are written and pushed after the authoritative insert succeeds.
  const row = data as any;
  if (profile.role !== "admin") {
    let admin;
    try {
      admin = createAdminClient();
    } catch (error) {
      console.warn("Revenue saved; notification client unavailable", error);
      return row;
    }
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("shop_id", profile.shop_id)
      .eq("role", "admin")
      .eq("status", "active");

    if (admins?.length) {
      const adminIds = admins.map((a: any) => a.id);
      const title = "Nhân viên ghi nhận doanh thu mới";
      const message = `${profile.full_name} vừa ghi nhận ${validated.amount.toLocaleString("vi-VN")} đ (${validated.service_name || "Dịch vụ tóc"})`;

      const { error: notificationError } = await admin.from("notifications").insert(
        adminIds.map((adminId: string) => ({
          shop_id: profile.shop_id,
          recipient_id: adminId,
          type: "REVENUE_RECORDED",
          title,
          message,
          data: { url: "/admin/revenue", revenue_id: row?.id || null },
        }))
      );
      if (notificationError) console.warn("Revenue saved; notification insert failed", notificationError.message);

      try {
        await sendWebPushNotificationToUsersAction(adminIds, title, message, "/admin/revenue");
      } catch (pushErr) {
        console.warn("Revenue saved; Web Push delivery notice:", pushErr);
      }
    }
  }
  return row;
}

export async function voidRevenueEntryAction(revenueId: string, voidReason?: string) {
  const { profile, supabase } = await requireAdmin();
  if (!voidReason || voidReason.trim().length < 3) throw new Error("A void reason is required");
  const { data, error } = await supabase.from("revenue_entries")
    .update({ status: "voided", voided_at: new Date().toISOString(), voided_by: profile.id, void_reason: voidReason.trim(), updated_at: new Date().toISOString() })
    .eq("id", revenueId).eq("shop_id", profile.shop_id).eq("status", "recorded")
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRevenueEntryAction(formData: {
  id: string;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  service_name?: string;
  note?: string;
}) {
  const { profile, supabase } = await requireActiveProfile();
  if (!Number.isInteger(formData.amount) || formData.amount <= 0) throw new Error("Invalid amount");
  const { data: existing, error: existingError } = await supabase.from("revenue_entries").select("business_date").eq("id", formData.id).eq("shop_id", profile.shop_id).single();
  if (existingError) throw new Error(existingError.message);
  const { data: closing } = await supabase.from("daily_closings").select("id").eq("shop_id", profile.shop_id).eq("business_date", existing.business_date).eq("is_closed", true).maybeSingle();
  if (closing) throw new Error("Business day is closed");
  const query = supabase
    .from("revenue_entries")
    .update({ amount: formData.amount, payment_method: formData.payment_method, service_name: formData.service_name || "Dịch vụ tóc", note: formData.note, updated_at: new Date().toISOString() })
    .eq("id", formData.id).eq("shop_id", profile.shop_id).eq("status", "recorded");
  const scoped = profile.role === "admin" ? query : query.eq("employee_id", profile.id);
  const { data, error } = await scoped.select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function closeBusinessDayAction(businessDate: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("close_business_day", { p_business_date: businessDate });
  if (error) throw new Error(error.message);
  return data;
}
