"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import webpush from "web-push";

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

export async function sendWebPushNotificationToAllAction(title: string, body: string, url?: string) {
  try {
    const adminClient = createAdminClient();
    const { data: subs } = await adminClient.from("push_subscriptions").select("*");
    if (!subs || subs.length === 0) return { success: true, count: 0 };

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-m9GYv50D15bS-16m_k8w6Q01";
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "dummy_private_key";
    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@toananhhairsalon.com";

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url: url || "/admin/revenue" },
    });

    const sendPromises = subs.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        console.warn("Failed sending push to subscription:", sub.endpoint, err);
      }
    });

    await Promise.all(sendPromises);
    return { success: true, count: subs.length };
  } catch (err: any) {
    console.error("sendWebPushNotificationToAllAction error:", err);
    return { success: false, error: err.message };
  }
}
