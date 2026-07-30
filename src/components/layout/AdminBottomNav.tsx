"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BarChart3, Users, Wallet, MoreHorizontal } from "lucide-react";

export function AdminBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Tổng quan", icon: LayoutGrid },
    { href: "/admin/revenue", label: "Doanh thu", icon: BarChart3 },
    { href: "/admin/employees", label: "Nhân viên", icon: Users },
    { href: "/admin/payroll", label: "Lương", icon: Wallet },
    { href: "/admin/settings", label: "Thêm", icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[rgba(23,23,23,0.12)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {/* Active top line indicator matching design screenshots */}
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
