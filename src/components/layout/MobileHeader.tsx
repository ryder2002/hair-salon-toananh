"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, X, CheckCircle, BellOff } from "lucide-react";
import { fetchNotificationsAction, fetchUnreadNotificationCountAction, markAllNotificationsReadAction } from "@/server/actions/notifications";
import { loadAuthSession } from "@/lib/auth";
type AppNotification = { id: string; title: string; message: string; type: string; isRead: boolean; timestamp: string; url?: string };

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  unreadCount?: number;
  showLogo?: boolean;
}

export function MobileHeader({
  unreadCount: initialCount,
  showLogo = true,
}: MobileHeaderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(initialCount ?? 0);
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [showEmpNotifModal, setShowEmpNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (initialCount !== undefined) {
      setUnreadCount(initialCount);
    }
  }, [initialCount]);

  useEffect(() => {
    async function load() {
      try {
        const session = await loadAuthSession();
        if (session?.role) setRole(session.role);

        if (initialCount === undefined) {
          const count = await fetchUnreadNotificationCountAction();
          setUnreadCount(count);
        }
      } catch (e) {
        console.warn("DB notifications header error:", e);
      }
    }
    load();
  }, [initialCount]);

  const loadNotificationsForEmployee = async () => {
    try {
      const data = await fetchNotificationsAction();
      if (data) {
        setNotifications(
          data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type || "system",
            isRead: !!n.read_at,
            timestamp: new Date(n.created_at).toLocaleString("vi-VN"),
            url: n.data?.url || "/admin/revenue",
          }))
        );
      }
    } catch (e) {
      console.warn("DB notifications list fetch error:", e);
    }
  };

  const homeHref = role === "admin" ? "/admin" : "/employee";

  const handleBellClick = async (e: React.MouseEvent) => {
    try {
      await markAllNotificationsReadAction();
      setUnreadCount(0);
    } catch (e) {}

    if (role === "employee") {
      e.preventDefault();
      await loadNotificationsForEmployee();
      setShowEmpNotifModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {showLogo && (
              <Link href={homeHref} prefetch={false} className="block flex-shrink-0">
                <img
                  src="/Logo.png"
                  alt="The Gentlemen Barbershop Logo"
                  className="h-10 w-auto object-contain filter drop-shadow-sm hover:scale-105 transition-transform"
                />
              </Link>
            )}
          </div>

          {role === "admin" ? (
            <Link
              href="/admin/notifications"
              prefetch={false}
              className="relative p-2 rounded-full hover:bg-[rgba(23,23,23,0.06)] transition-colors"
            >
              <Bell className="w-5 h-5 text-[#741F2C]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#741F2C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#F7F3EC] animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBellClick}
              className="relative p-2 rounded-full hover:bg-[rgba(23,23,23,0.06)] transition-colors"
            >
              <Bell className="w-5 h-5 text-[#741F2C]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#741F2C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#F7F3EC] animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Employee Notification Drawer Modal */}
      {showEmpNotifModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[20px] sm:rounded-[16px] max-w-md w-full p-5 space-y-4 relative shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b border-[rgba(23,23,23,0.1)] pb-3">
              <div className="flex items-center space-x-2 text-[#741F2C]">
                <Bell className="w-5 h-5" />
                <h3 className="font-bold text-base text-[#171717]">Thông báo của tôi</h3>
              </div>
              <button
                onClick={() => setShowEmpNotifModal(false)}
                className="text-[rgba(23,23,23,0.4)] hover:text-[#171717] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pt-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <BellOff className="w-8 h-8 text-[rgba(23,23,23,0.3)] mx-auto" />
                  <p className="text-xs text-[rgba(23,23,23,0.5)] font-medium">
                    Bạn chưa có thông báo mới nào.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-[#F7F3EC] p-3 rounded-[12px] border border-[rgba(23,23,23,0.08)] space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-[#171717]">{n.title}</h4>
                      <span className="text-[10px] text-[rgba(23,23,23,0.4)]">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-[rgba(23,23,23,0.7)] leading-snug">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowEmpNotifModal(false)}
              className="w-full bg-[#741F2C] text-white py-3 rounded-[12px] text-xs font-bold active:scale-98 transition-transform"
            >
              Đóng thông báo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
