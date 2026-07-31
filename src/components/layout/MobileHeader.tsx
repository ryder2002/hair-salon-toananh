"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getNotifications, subscribeNotifications } from "@/lib/notification-store";

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
  const [unreadCount, setUnreadCount] = useState(initialCount ?? 0);

  useEffect(() => {
    const notifs = getNotifications();
    setUnreadCount(notifs.filter((n) => !n.isRead).length);

    const unsubscribe = subscribeNotifications((updated) => {
      setUnreadCount(updated.filter((n) => !n.isRead).length);
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showLogo && (
            <Link href="/admin" className="block flex-shrink-0">
              <img
                src="/Logo.png"
                alt="The Gentlemen Barbershop Logo"
                className="h-10 w-auto object-contain filter drop-shadow-sm hover:scale-105 transition-transform"
              />
            </Link>
          )}
        </div>

        <Link
          href="/admin/notifications"
          className="relative p-2 rounded-full hover:bg-[rgba(23,23,23,0.06)] transition-colors"
        >
          <Bell className="w-5 h-5 text-[#741F2C]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#741F2C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#F7F3EC] animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
