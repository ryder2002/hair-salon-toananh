"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RevenueEntrySchema } from "@/lib/validations";

export async function fetchRevenuesAction(date?: string) {
  const adminClient = createAdminClient();
  
  let query = adminClient
    .from("revenue_entries")
    .select(`
      id,
      amount,
      payment_method,
      service_name,
      note,
      business_date,
      performed_at,
      status,
      employee_id,
      profiles:employee_id (full_name, avatar_url)
    `)
    .order("performed_at", { ascending: false });

  if (date) {
    query = query.eq("business_date", date);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching revenues:", error);
    return [];
  }
  return data;
}

export async function createRevenueEntryAction(formData: {
  amount: number;
  payment_method: "cash" | "bank_transfer";
  service_name?: string;
  note?: string;
  business_date: string;
  idempotency_key: string;
}) {
  const validated = RevenueEntrySchema.parse(formData);
  const adminClient = createAdminClient();
  const shopId = "11111111-1111-1111-1111-111111111111";

  // Fetch first active profile or admin profile
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .eq("shop_id", shopId)
    .limit(1);

  const empId = profiles?.[0]?.id || "a0000000-0000-0000-0000-000000000001";
  const empName = profiles?.[0]?.full_name || "Nhân viên";

  const { data, error } = await adminClient
    .from("revenue_entries")
    .insert({
      shop_id: shopId,
      employee_id: empId,
      amount: validated.amount,
      payment_method: validated.payment_method,
      service_name: validated.service_name,
      note: validated.note,
      business_date: validated.business_date,
      performed_at: new Date().toISOString(),
      idempotency_key: validated.idempotency_key,
      created_by: empId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting revenue entry:", error);
    throw new Error(error.message);
  }

  // Find all Admin profiles for this shop to send notification
  const { data: adminProfiles } = await adminClient
    .from("profiles")
    .select("id")
    .eq("shop_id", shopId)
    .eq("role", "admin");

  const notifMessage = `${empName} vừa tạo đơn "${validated.service_name || "Dịch vụ tóc"}" (${validated.amount.toLocaleString("vi-VN")} đ - ${validated.payment_method === "cash" ? "Tiền mặt" : "Chuyển khoản"})`;

  if (adminProfiles && adminProfiles.length > 0) {
    const notifications = adminProfiles.map((adm) => ({
      shop_id: shopId,
      recipient_id: adm.id,
      type: "REVENUE_RECORDED",
      title: "Nhân viên ghi nhận doanh thu mới",
      message: notifMessage,
      data: { url: "/admin/revenue" },
    }));
    await adminClient.from("notifications").insert(notifications);
  }

  return data;
}

export async function voidRevenueEntryAction(revenueId: string, voidReason: string) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("revenue_entries")
    .update({
      status: "voided",
      voided_at: new Date().toISOString(),
      voided_by: userData.user.id,
      void_reason: voidReason,
    })
    .eq("id", revenueId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function closeBusinessDayAction(shopId: string, businessDate: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("close_business_day", {
    p_shop_id: shopId,
    p_business_date: businessDate,
  });

  if (error) throw new Error(error.message);
  return data;
}
