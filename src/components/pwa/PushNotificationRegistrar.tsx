"use client";

import React, { useEffect, useState } from "react";
import { BellRing, X, CheckCircle2 } from "lucide-react";
import { registerWebPushSubscription } from "@/lib/push/webpush";

export function PushNotificationRegistrar() {
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [activatedToast, setActivatedToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionState("unsupported");
      return;
    }

    const currentPermission = Notification.permission;
    setPermissionState(currentPermission);

    if (currentPermission === "default") {
      setShowPromptBanner(true);
    } else if (currentPermission === "granted") {
      registerWebPushSubscription();
    }

    // BroadcastChannel listener for real-time cross-tab Web Push Notifications
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("barbershop_webpush_channel");
      bc.onmessage = (event) => {
        const { title, message, url } = event.data || {};
        if (title && Notification.permission === "granted") {
          const options = {
            body: message,
            icon: "/Logo.png",
            badge: "/Logo.png",
            data: { url: url || "/admin/revenue" },
          };
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
          } else {
            try { new Notification(title, options); } catch (e) {}
          }
        }
      };
    } catch (e) {}

    return () => {
      if (bc) bc.close();
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      setShowPromptBanner(false);

      if (permission === "granted") {
        const subscription = await registerWebPushSubscription();
        if (!subscription) {
          setShowPromptBanner(true);
          return;
        }
        setActivatedToast(true);

        // Display test notification
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification("Toàn Anh Hair Salon - Web Push", {
            body: "Đã bật hệ thống thông báo thành công! Bạn sẽ nhận thông báo doanh thu & chốt ngày tại đây.",
            icon: "/Logo.png",
            badge: "/Logo.png",
          });
        }

        setTimeout(() => setActivatedToast(false), 4000);
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  return (
    <>
      {/* Toast confirmation when push notifications activated */}
      {activatedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-emerald-800 text-white p-3 rounded-[12px] shadow-2xl flex items-center space-x-2.5 border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <div className="text-xs font-bold">
            Đã kích hoạt Web Push Notification thành công!
          </div>
        </div>
      )}

      {/* Banner prompting user to allow Web Push Notification */}
      {showPromptBanner && permissionState === "default" && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[92%] bg-[#741F2C] text-white p-3.5 rounded-[14px] shadow-2xl flex items-center justify-between border border-white/20">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold leading-tight truncate">
                Bật Thông báo Web Push
              </div>
              <div className="text-[10px] text-white/80 font-medium truncate">
                Nhận thông báo doanh thu mới & chốt ngày
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0 pl-2">
            <button
              onClick={requestNotificationPermission}
              className="bg-white text-[#741F2C] text-xs font-extrabold px-3 py-1.5 rounded-[8px] shadow-sm hover:bg-cream transition-colors"
            >
              BẬT NGAY
            </button>
            <button
              onClick={() => setShowPromptBanner(false)}
              className="text-white/70 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
