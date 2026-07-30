"use client";

import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  unreadCount?: number;
  showLogo?: boolean;
}

export function MobileHeader({
  unreadCount = 5,
  showLogo = true,
}: MobileHeaderProps) {
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
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#741F2C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#F7F3EC]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
