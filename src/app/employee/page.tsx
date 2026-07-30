"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Calendar, Banknote, CreditCard } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { formatVND } from "@/lib/money";

export default function EmployeeDashboardPage() {
  const transactions: TransactionItem[] = [
    {
      id: "e1",
      staffName: "Minh Quân",
      avatarType: "pole",
      serviceName: "Cắt tóc + Gội đầu",
      amount: 250000n,
      paymentMethod: "cash",
      time: "09:35",
      status: "recorded",
    },
    {
      id: "e2",
      staffName: "Minh Quân",
      avatarType: "pole",
      serviceName: "Cạo mặt",
      amount: 150000n,
      paymentMethod: "bank_transfer",
      time: "08:15",
      status: "recorded",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="Barbershop Manager" subtitle="Chào anh, Minh Quân" unreadCount={2} />

      <main className="px-4 pt-3 space-y-4">
        {/* Quick Action Button */}
        <Link
          href="/employee/revenue/new"
          className="w-full bg-[#741F2C] text-white py-4 rounded-[14px] font-bold text-lg flex items-center justify-center space-x-2.5 shadow-md active:scale-98 transition-transform"
        >
          <PlusCircle className="w-6 h-6" />
          <span>GHI DOANH THU MỚI</span>
        </Link>

        {/* Employee Today KPI Card */}
        <div className="bg-[#741F2C] text-white p-4 rounded-[14px] shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-medium text-white/80">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Doanh thu hôm nay của tôi</span>
            </span>
            <span>22/05/2025</span>
          </div>

          <div className="text-2xl font-bold tracking-tight">
            {formatVND(400000n)}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-white/15">
            <div className="flex items-center space-x-1.5 text-white/90">
              <Banknote className="w-4 h-4" />
              <span>Tiền mặt: <strong>250.000 đ</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 text-white/90">
              <CreditCard className="w-4 h-4" />
              <span>Chuyển khoản: <strong>150.000 đ</strong></span>
            </div>
          </div>
        </div>

        {/* Employee Month Stats Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3.5 rounded-[14px] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Doanh thu tháng này</div>
            <div className="text-lg font-bold text-[#741F2C] mt-0.5">{formatVND(5250000n)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Số lượt cắt</div>
            <div className="text-lg font-bold text-[#171717] mt-0.5">24 lượt</div>
          </div>
        </div>

        {/* Section: Giao dịch của tôi */}
        <section className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#171717] text-base">
              Lịch sử của tôi hôm nay
            </h3>
            <Link
              href="/employee/revenue"
              className="text-xs font-semibold text-[#741F2C] hover:underline"
            >
              Xem tất cả &gt;
            </Link>
          </div>
          <RecentTransactionsList transactions={transactions} />
        </section>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
