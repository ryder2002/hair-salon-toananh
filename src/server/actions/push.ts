"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile, requireAdmin } from "@/lib/supabase/authz";
import webpush from "web-push";

export async function savePushSubscriptionAction(subscriptionJSON: any) {
  const { profile } = await requireActiveProfile();
  if (!subscriptionJSON?.endpoint || !subscriptionJSON.keys?.p256dh || !subscriptionJSON.keys?.auth) return { success: false, error: "Invalid subscription data" };
  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert({ user_id: profile.id, endpoint: subscriptionJSON.endpoint, p256dh: subscriptionJSON.keys.p256dh, auth: subscriptionJSON.keys.auth, user_agent: subscriptionJSON.userAgent || null, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function sendWebPushNotificationToAllAction(title: string, body: string, url?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: subscriptions } = await admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth");
  return sendToSubscriptions(admin, subscriptions || [], title, body, url);
}

export async function sendWebPushNotificationToUsersAction(userIds: string[], title: string, body: string, url?: string) {
  await requireActiveProfile();
  const admin = createAdminClient();
  const { data: subscriptions } = await admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").in("user_id", userIds);
  return sendToSubscriptions(admin, subscriptions || [], title, body, url);
}

async function sendToSubscriptions(admin: ReturnType<typeof createAdminClient>, subscriptions: Array<{ id: string; user_id?: string; endpoint: string; p256dh: string; auth: string }>, title: string, body: string, url?: string) {
  if (!subscriptions?.length) return { success: true, count: 0 };
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return { success: false, error: "VAPID environment variables are missing" };
  webpush.setVapidDetails(subject, publicKey, privateKey);
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify({ title, body, message: body, icon: "/Logo.png", badge: "/Logo.png", data: { url: url || "/admin" } })
      );
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", subscription.id);
    }
  }
  return { success: true, count: sent };
}
