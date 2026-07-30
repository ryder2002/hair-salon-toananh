"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, History, User } from "lucide-react";

export function EmployeeBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/employee", label: "Trang chủ", icon: Home },
    { href: "/employee/revenue/new", label: "Ghi doanh thu", icon: PlusCircle, isPrimary: true },
    { href: "/employee/revenue", label: "Lịch sử", icon: History },
    { href: "/employee/profile", label: "Tài khoản", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[rgba(23,23,23,0.12)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/employee"
              ? pathname === "/employee"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <div className="w-10 h-10 rounded-full bg-[#741F2C] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-[#741F2C] mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-[3px] bg-[#741F2C] rounded-full" />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-[#741F2C]" : "text-[rgba(23,23,23,0.5)]"
                }`}
              />
              <span
                className={`text-[11px] font-medium mt-1 transition-colors ${
                  isActive ? "text-[#741F2C] font-semibold" : "text-[rgba(23,23,23,0.6)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
