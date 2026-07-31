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

// Backwards-compatible signature: totals from the browser are deliberately ignored.
export async function closeDayAction(data: { businessDate: string }) {
  const { supabase } = await requireAdmin();
  const { data: result, error } = await supabase.rpc("close_business_day", { p_business_date: data.businessDate });
  if (error) return { success: false, error: error.message };
  return { success: true, result };
}

export async function reopenDayAction(businessDate: string, reason: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("reopen_business_day", { p_business_date: businessDate, p_reason: reason });
  if (error) return { success: false, error: error.message };
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
