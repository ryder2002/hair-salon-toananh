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
  title = "Toàn Anh Hair Salon",
  subtitle,
  unreadCount = 5,
  showLogo = true,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showLogo && (
            <Link href="/admin" className="block flex-shrink-0">
              <img
                src="/Logo.png"
                alt="The Gentlemen Barbershop Logo"
                className="w-12 h-12 object-contain filter drop-shadow-sm hover:scale-105 transition-transform"
              />
            </Link>
          )}
          <div>
            <h1 className="text-lg font-extrabold text-[#171717] tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/admin/notifications"
          className="relative p-2.5 rounded-full hover:bg-[rgba(23,23,23,0.06)] transition-colors"
        >
          <Bell className="w-6 h-6 text-[#741F2C]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#741F2C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#F7F3EC]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
