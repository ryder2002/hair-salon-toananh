"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BarberIcon } from "@/components/ui/BarberIcon";
import { formatVND } from "@/lib/money";

export interface StaffRevenueItem {
  id: string;
  name: string;
  avatarType?: "scissors" | "mustache" | "comb" | "pole";
  revenue: number | bigint;
  percentage: number;
}

interface StaffRevenueProgressListProps {
  items?: StaffRevenueItem[];
}

export function StaffRevenueProgressList({
  items = [],
}: StaffRevenueProgressListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-6 text-center shadow-sm">
        <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
          Chưa có dữ liệu doanh thu nhân viên hôm nay
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-4">
      {items.map((staff) => (
        <Link
          key={staff.id}
          href={`/admin/employees`}
          prefetch={true}
          className="flex items-center space-x-3 text-sm hover:opacity-80 transition-opacity cursor-pointer block"
        >
          {/* Circular icon badge */}
          <div className="w-10 h-10 rounded-full bg-[rgba(23,23,23,0.04)] border border-[rgba(23,23,23,0.1)] flex items-center justify-center flex-shrink-0 text-[#171717]">
            <BarberIcon type={staff.avatarType || "scissors"} className="w-5 h-5" />
          </div>

          {/* Middle: Name & Progress bar */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-[#171717] truncate">
                {staff.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2.5 bg-[rgba(23,23,23,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#741F2C] rounded-full transition-all duration-500"
                  style={{ width: `${staff.percentage}%` }}
                />
              </div>
              <span className="text-xs text-[rgba(23,23,23,0.6)] font-medium min-w-[32px] text-right">
                {staff.percentage}%
              </span>
            </div>
          </div>

          {/* Right: Revenue amount & chevron */}
          <div className="flex items-center space-x-1.5 pl-2 flex-shrink-0">
            <span className="font-bold text-[#171717]">
              {formatVND(staff.revenue)}
            </span>
            <ChevronRight className="w-4 h-4 text-[rgba(23,23,23,0.4)]" />
          </div>
        </Link>
      ))}
    </div>
  );
}
