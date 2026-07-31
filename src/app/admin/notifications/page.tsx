"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckSquare,
  Wallet,
  UserPlus,
  AlertTriangle,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { fetchNotificationsAction, markAllNotificationsReadAction } from "@/server/actions/notifications";
import { subscribeRealtime } from "@/lib/realtime";

type AppNotification = { id: string; title: string; message: string; type: string; timestamp: string; isRead: boolean; url?: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    try {
      const dbNotifs = await fetchNotificationsAction();
      if (dbNotifs && dbNotifs.length > 0) {
        const formatted: AppNotification[] = dbNotifs.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || "revenue",
          timestamp: new Date(n.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          isRead: !!n.read_at,
          url: n.data?.url,
        }));
        setItems(formatted);
        return;
      }
    } catch (err) {
      console.warn("DB fetch notifications error:", err);
    }
    setItems([]);
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = subscribeRealtime(() => { void loadNotifications(); });
    const interval = window.setInterval(() => { void loadNotifications(); }, 30000);
    return () => { unsubscribe(); window.clearInterval(interval); };
  }, []);

  const markAllRead = async () => {
    try {
      await markAllNotificationsReadAction();
    } catch (e) {}
    loadNotifications();
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "revenue":
        return <Banknote className="w-5 h-5 text-[#171717]" />;
      case "payroll":
        return <Wallet className="w-5 h-5 text-[#171717]" />;
      case "staff":
        return <UserPlus className="w-5 h-5 text-[#171717]" />;
      default:
        return <Bell className="w-5 h-5 text-[#171717]" />;
    }
  };

  const unreadCount = items.filter((i) => !i.isRead).length;

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <MobileHeader unreadCount={unreadCount} />

      <main className="px-4 pt-3 space-y-4">
        {/* Title & Mark as read */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
            Thông báo
          </h2>
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-[#741F2C] hover:underline"
          >
            Đánh dấu đã đọc
          </button>
        </div>

        {/* Top Summary Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#741F2C] text-white flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#741F2C] text-sm">
                {unreadCount} thông báo mới
              </div>
              <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                Tổng {items.length} thông báo
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[rgba(23,23,23,0.4)]" />
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-8 text-center shadow-sm space-y-2">
              <Bell className="w-10 h-10 text-[rgba(23,23,23,0.3)] mx-auto" />
              <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                Hiện tại chưa có thông báo nào
              </p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm relative overflow-hidden flex items-start space-x-3 ${
                  !n.isRead ? "border-l-4 border-l-[#741F2C]" : "border-l-4 border-l-[rgba(23,23,23,0.2)]"
                }`}
              >
                {/* Icon Container */}
                <div className="w-10 h-10 rounded-full bg-[rgba(23,23,23,0.05)] border border-[rgba(23,23,23,0.08)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {renderIcon(n.type)}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-[#171717] text-sm truncate leading-tight">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-[rgba(23,23,23,0.5)] font-medium">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-[rgba(23,23,23,0.7)] font-medium leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {/* Unread Indicator Dot */}
                <div className="absolute right-3 top-4">
                  {!n.isRead ? (
                    <span className="w-2.5 h-2.5 bg-[#741F2C] rounded-full block animate-pulse" />
                  ) : (
                    <span className="w-2.5 h-2.5 bg-[rgba(23,23,23,0.2)] rounded-full block" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center pt-3 pb-2 text-xs text-[rgba(23,23,23,0.5)] font-medium">
          Không còn thông báo cũ hơn
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
