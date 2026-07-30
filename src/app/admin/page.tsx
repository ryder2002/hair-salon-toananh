"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { KpiCardsRow } from "@/components/ui/KpiCardsRow";
import { StaffRevenueProgressList } from "@/components/ui/StaffRevenueProgressList";
import { RecentTransactionsList } from "@/components/ui/RecentTransactionsList";
import { DayClosingCard } from "@/components/ui/DayClosingCard";

export default function AdminDashboardPage() {
  const [isClosed, setIsClosed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      {/* Header matching Screenshot 1 */}
      <MobileHeader unreadCount={5} />

      {/* Main Container */}
      <main className="px-4 pt-3 space-y-5">
        {/* Greeting & Date Header */}
        <div>
          <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
            Chào anh, Admin
          </h2>
          <div className="flex items-center space-x-1.5 text-xs text-[rgba(23,23,23,0.6)] font-medium mt-1">
            <Calendar className="w-3.5 h-3.5 text-[#171717]" />
            <span>Thứ Năm, 22/05/2025</span>
          </div>
        </div>

        {/* 4 KPI Cards Row */}
        <KpiCardsRow
          totalRevenue={12560000n}
          cashTotal={4350000n}
          bankTotal={8210000n}
          transactionCount={48}
          revenueGrowthPercent={18.6}
        />

        {/* Section: Doanh thu theo nhân viên */}
        <section className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#171717] text-base">
              Doanh thu theo nhân viên
            </h3>
            <Link
              href="/admin/employees"
              className="text-xs font-semibold text-[#741F2C] flex items-center space-x-0.5 hover:underline"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <StaffRevenueProgressList />
        </section>

        {/* Section: Giao dịch mới nhất */}
        <section className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#171717] text-base">
              Giao dịch mới nhất
            </h3>
            <Link
              href="/admin/revenue"
              className="text-xs font-semibold text-[#741F2C] flex items-center space-x-0.5 hover:underline"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <RecentTransactionsList />
        </section>

        {/* Day Closing Card */}
        <section>
          <DayClosingCard />
        </section>
      </main>

      {/* Admin Bottom Navigation Bar */}
      <AdminBottomNav />
    </div>
  );
}
