"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SHOP_ID = "11111111-1111-1111-1111-111111111111";

/**
 * Lấy ngày làm việc hiện tại:
 * = ngày sau ngày chốt gần nhất (nếu có)
 * = hôm nay (nếu chưa chốt ngày nào)
 */
export async function getCurrentBusinessDateAction(): Promise<string> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("daily_closings")
      .select("business_date")
      .eq("shop_id", SHOP_ID)
      .eq("is_closed", true)
      .order("business_date", { ascending: false })
      .limit(1)
      .single();

    if (data?.business_date) {
      // Next day after the last closed date
      const lastClosed = new Date(data.business_date);
      lastClosed.setDate(lastClosed.getDate() + 1);
      return lastClosed.toISOString().split("T")[0];
    }
  } catch {
    // No closing found, return today
  }

  // Default: today in Vietnam timezone
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return vnTime.toISOString().split("T")[0];
}

/**
 * Kiểm tra xem một ngày cụ thể đã bị chốt chưa
 */
export async function isDayClosedAction(businessDate: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("daily_closings")
      .select("id")
      .eq("shop_id", SHOP_ID)
      .eq("business_date", businessDate)
      .eq("is_closed", true)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Admin chốt ngày doanh thu
 */
export async function closeDayAction(data: {
  businessDate: string;
  cashTotal: number;
  bankTotal: number;
  revenueTotal: number;
  transactionCount: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    let closedById = "a0000000-0000-0000-0000-000000000001"; // fallback admin seed ID
    if (userData.user) {
      closedById = userData.user.id;
    }

    const adminClient = createAdminClient();

    // Upsert to handle both create and re-close
    const { error } = await adminClient
      .from("daily_closings")
      .upsert(
        {
          shop_id: SHOP_ID,
          business_date: data.businessDate,
          cash_total: data.cashTotal,
          bank_transfer_total: data.bankTotal,
          revenue_total: data.revenueTotal,
          transaction_count: data.transactionCount,
          closed_by: closedById,
          closed_at: new Date().toISOString(),
          is_closed: true,
          reopened_by: null,
          reopened_at: null,
          reopen_reason: null,
        },
        { onConflict: "shop_id,business_date" }
      );

    if (error) {
      console.error("Error closing day:", error);
      return { success: false, error: error.message };
    }

    // Notify all admin profiles about day closing
    const { data: adminProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("shop_id", SHOP_ID)
      .eq("role", "admin");

    if (adminProfiles && adminProfiles.length > 0) {
      const notifications = adminProfiles.map((adm) => ({
        shop_id: SHOP_ID,
        recipient_id: adm.id,
        type: "DAY_CLOSED",
        title: "Đã chốt ngày doanh thu",
        message: `Ngày ${data.businessDate} đã được chốt. Tổng: ${data.revenueTotal.toLocaleString("vi-VN")} đ (${data.transactionCount} giao dịch)`,
        data: { url: "/admin/revenue" },
      }));
      await adminClient.from("notifications").insert(notifications);
    }

    // Log audit
    await adminClient.from("audit_logs").insert({
      shop_id: SHOP_ID,
      actor_id: closedById,
      action: "DAY_CLOSED",
      entity_type: "daily_closings",
      metadata: {
        business_date: data.businessDate,
        revenue_total: data.revenueTotal,
        transaction_count: data.transactionCount,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin mở lại ngày đã chốt
 */
export async function reopenDayAction(
  businessDate: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const reopenedById = userData.user?.id || "a0000000-0000-0000-0000-000000000001";

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("daily_closings")
      .update({
        is_closed: false,
        reopened_by: reopenedById,
        reopened_at: new Date().toISOString(),
        reopen_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("shop_id", SHOP_ID)
      .eq("business_date", businessDate);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Lịch sử chốt ngày (Admin view)
 */
export async function fetchDayClosingHistoryAction() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("daily_closings")
    .select(`
      id,
      business_date,
      cash_total,
      bank_transfer_total,
      revenue_total,
      transaction_count,
      is_closed,
      closed_at,
      profiles:closed_by (full_name)
    `)
    .eq("shop_id", SHOP_ID)
    .order("business_date", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching day closing history:", error);
    return [];
  }
  return data;
}
