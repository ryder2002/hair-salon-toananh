"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function savePushSubscriptionAction(subscriptionJSON: any, profileId?: string) {
  try {
    const adminClient = createAdminClient();
    const shopId = "11111111-1111-1111-1111-111111111111";

    if (!subscriptionJSON || !subscriptionJSON.endpoint) {
      return { success: false, error: "Invalid subscription data" };
    }

    let targetProfileId = profileId;
    if (!targetProfileId) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id")
        .eq("shop_id", shopId)
        .limit(1);
      targetProfileId = profiles?.[0]?.id || "a0000000-0000-0000-0000-000000000001";
    }

    const { error } = await adminClient
      .from("push_subscriptions")
      .upsert(
        {
          shop_id: shopId,
          profile_id: targetProfileId,
          endpoint: subscriptionJSON.endpoint,
          p256dh: subscriptionJSON.keys?.p256dh || "default_p256dh",
          auth: subscriptionJSON.keys?.auth || "default_auth",
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Push subscription DB error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Save push subscription exception:", err);
    return { success: false, error: err.message };
  }
}
