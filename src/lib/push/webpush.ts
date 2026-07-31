import { savePushSubscriptionAction } from "@/server/actions/push";

/**
 * Registers Service Worker and subscribes browser to Web Push Notifications using VAPID key
 */
export async function registerWebPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Web Push is not supported in this browser environment.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied by user.");
      return null;
    }

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) {
      // VAPID key not set in environment, return null gracefully
      return null;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as unknown as BufferSource,
        });
      } catch (subErr) {
        console.warn("Push subscription skipped (invalid key or unsupported by browser):", subErr);
        return null;
      }
    }

    if (subscription) {
      savePushSubscriptionAction(subscription.toJSON()).catch(() => {});
    }

    return subscription;
  } catch (error) {
    console.warn("Web Push registration notice:", error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
