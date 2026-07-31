"use server";

import { getVietnamBusinessDate } from "@/lib/dates";
import { requireActiveProfile, requireAdmin } from "@/lib/supabase/authz";

export async function getCurrentBusinessDateAction() {
  return getVietnamBusinessDate();
}

export async function getBusinessDayStatusAction(businessDate?: string) {
  const { profile, supabase } = await requireActiveProfile();
  const date = businessDate || getVietnamBusinessDate();
  const { data, error } = await supabase
    .from("daily_closings")
    .select("id, business_date, cash_total, bank_transfer_total, revenue_total, transaction_count, is_closed, closed_at, reopened_at, reopen_reason")
    .eq("shop_id", profile.shop_id)
    .eq("business_date", date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { businessDate: date, isClosed: data?.is_closed === true, closing: data || null };
}

export async function isDayClosedAction(businessDate: string) {
  const status = await getBusinessDayStatusAction(businessDate);
  return status.isClosed;
}

import { sendWebPushNotificationToAllAction } from "@/server/actions/push";
import { createAdminClient } from "@/lib/supabase/admin";

// Backwards-compatible signature: totals from the browser are deliberately ignored.
export async function closeDayAction(data: { businessDate: string }) {
  const { profile, supabase } = await requireAdmin();
  const { data: result, error } = await supabase.rpc("close_business_day", { p_business_date: data.businessDate });
  if (error) return { success: false, error: error.message };

  try {
    const admin = createAdminClient();
    const { data: users } = await admin.from("profiles").select("id").eq("shop_id", profile.shop_id).eq("status", "active");
    if (users?.length) {
      const title = "Đã chốt ngày làm việc";
      const message = `Admin vừa chốt ngày làm việc (${data.businessDate}). Doanh thu ngày đã được tổng hợp.`;
      await admin.from("notifications").insert(
        users.map((u: any) => ({
          shop_id: profile.shop_id,
          recipient_id: u.id,
          type: "DAY_CLOSED",
          title,
          message,
          data: { url: "/admin/revenue", business_date: data.businessDate },
        }))
      );
      await sendWebPushNotificationToAllAction(title, message, "/admin/revenue");
    }
  } catch (pushErr) {
    console.warn("Day closed; Web Push notice:", pushErr);
  }

  return { success: true, result };
}

export async function reopenDayAction(businessDate: string, reason: string) {
  const { profile, supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("reopen_business_day", { p_business_date: businessDate, p_reason: reason });
  if (error) return { success: false, error: error.message };

  try {
    const admin = createAdminClient();
    const { data: users } = await admin.from("profiles").select("id").eq("shop_id", profile.shop_id).eq("status", "active");
    if (users?.length) {
      const title = "Đã mở lại ngày làm việc";
      const message = `Ngày ${businessDate} đã được mở lại (Lý do: ${reason}). Bạn có thể ghi nhận hoặc điều chỉnh doanh thu.`;
      await admin.from("notifications").insert(
        users.map((u: any) => ({
          shop_id: profile.shop_id,
          recipient_id: u.id,
          type: "DAY_REOPENED",
          title,
          message,
          data: { url: "/admin/revenue", business_date: businessDate },
        }))
      );
      await sendWebPushNotificationToAllAction(title, message, "/admin/revenue");
    }
  } catch (pushErr) {
    console.warn("Day reopened; Web Push notice:", pushErr);
  }

  return { success: true, data };
}

export async function fetchDayClosingHistoryAction() {
  const { profile, supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("daily_closings")
    .select("id, business_date, cash_total, bank_transfer_total, revenue_total, transaction_count, is_closed, closed_at, profiles:closed_by(full_name)")
    .eq("shop_id", profile.shop_id)
    .order("business_date", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return data || [];
}
