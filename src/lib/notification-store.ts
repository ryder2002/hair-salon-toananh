export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "revenue" | "payroll" | "system" | "staff";
  isRead: boolean;
  timestamp: string;
  url?: string;
}

const STORAGE_KEY = "barbershop_app_notifications";
const EVENT_NAME = "barbershop_notification_updated";

export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read notifications:", err);
    return [];
  }
}

export function addNotification(data: {
  title: string;
  message: string;
  type?: "revenue" | "payroll" | "system" | "staff";
  url?: string;
}): AppNotification {
  const current = getNotifications();
  const now = new Date();
  const formattedTime = `${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${now.toLocaleDateString("vi-VN")}`;

  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: data.title,
    message: data.message,
    type: data.type || "system",
    isRead: false,
    timestamp: formattedTime,
    url: data.url || "/admin/revenue",
  };

  const updated = [newNotif, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));

      // 1. Multi-tab Web Push Broadcast
      try {
        const bc = new BroadcastChannel("barbershop_webpush_channel");
        bc.postMessage({
          title: data.title,
          message: data.message,
          url: data.url || "/admin/revenue",
        });
        bc.close();
      } catch (e) {}

      // 2. Trigger instant OS Web Push Notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        const options = {
          body: data.message,
          icon: "/Logo.png",
          badge: "/Logo.png",
          data: { url: data.url || "/admin/revenue" },
        };

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => {
              reg.showNotification(data.title, options);
            })
            .catch(() => {
              try { new Notification(data.title, options); } catch (e) {}
            });
        } else {
          try { new Notification(data.title, options); } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Failed to save notification:", err);
    }
  }

  return newNotif;
}

export function markAllNotificationsAsRead(): void {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  }
}

export function subscribeNotifications(callback: (notifications: AppNotification[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvt = event as CustomEvent<AppNotification[]>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    } else {
      callback(getNotifications());
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
