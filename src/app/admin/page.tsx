"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { KpiCardsRow } from "@/components/ui/KpiCardsRow";
import { StaffRevenueProgressList, StaffRevenueItem } from "@/components/ui/StaffRevenueProgressList";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { DayClosingCard } from "@/components/ui/DayClosingCard";
import { getAdminDashboardDataAction } from "@/server/actions/revenue";
import { formatBusinessDateDisplay } from "@/lib/dates";
import { subscribeRealtime } from "@/lib/realtime";
import { withClientCache, invalidateClientCache } from "@/lib/cache";

export default function AdminDashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState<bigint>(0n);
  const [cashTotal, setCashTotal] = useState<bigint>(0n);
  const [bankTotal, setBankTotal] = useState<bigint>(0n);
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [staffRevenues, setStaffRevenues] = useState<StaffRevenueItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [businessDate, setBusinessDate] = useState<string>("");
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadDashboardData = async () => {
    try {
      const data = await withClientCache("admin-dashboard", () => getAdminDashboardDataAction(), 60000);
      setBusinessDate(data.businessDate);
      setTotalRevenue(BigInt(data.totalRevenue || "0"));
      setCashTotal(BigInt(data.cashTotal || "0"));
      setBankTotal(BigInt(data.bankTotal || "0"));
      setTransactionCount(data.transactionCount);
      setIsClosed(data.isClosed);
      setUnreadCount(data.unreadNotificationCount);

      setStaffRevenues(
        data.staffRevenues.map((s) => ({
          ...s,
          revenue: BigInt(s.revenue || "0"),
        }))
      );

      setRecentTransactions(
        data.recentTransactions.map((t) => ({
          ...t,
          amount: BigInt(t.amount || "0"),
        }))
      );
    } catch (err) {
      console.warn("DB dashboard fetch error:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const unsubscribe = subscribeRealtime(() => {
      invalidateClientCache("admin-dashboard");
      void loadDashboardData();
    });
    const interval = window.setInterval(() => { void loadDashboardData(); }, 30000);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      {/* Header with unreadCount */}
      <MobileHeader unreadCount={unreadCount} />

      {/* Main Container */}
      <main className="px-4 pt-3 space-y-5">
        {/* Greeting & Date Header */}
        <div>
          <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
            Chào anh, Admin
          </h2>
          <div className="flex items-center space-x-1.5 text-xs text-[rgba(23,23,23,0.6)] font-medium mt-1">
            <Calendar className="w-3.5 h-3.5 text-[#171717]" />
            <span>
              {businessDate ? formatBusinessDateDisplay(businessDate) : "Đang tải..."}
            </span>
          </div>
        </div>

        {/* 4 KPI Cards Row */}
        <KpiCardsRow
          totalRevenue={totalRevenue}
          cashTotal={cashTotal}
          bankTotal={bankTotal}
          transactionCount={transactionCount}
          revenueGrowthPercent={0}
        />

        {/* Section: Doanh thu theo nhân viên */}
        <section className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#171717] text-base">
              Doanh thu theo nhân viên
            </h3>
            <Link
              href="/admin/employees"
              prefetch={false}
              className="text-xs font-semibold text-[#741F2C] flex items-center space-x-0.5 hover:underline"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <StaffRevenueProgressList items={staffRevenues} />
        </section>

        {/* Section: Giao dịch mới nhất */}
        <section className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#171717] text-base">
              Giao dịch mới nhất
            </h3>
            <Link
              href="/admin/revenue"
              prefetch={false}
              className="text-xs font-semibold text-[#741F2C] flex items-center space-x-0.5 hover:underline"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <RecentTransactionsList transactions={recentTransactions} />
        </section>

        {/* Day Closing Card using initial props to avoid duplicate fetches */}
        <section>
          <DayClosingCard
            initialBusinessDate={businessDate}
            initialClosed={isClosed}
            onCloseDay={loadDashboardData}
          />
        </section>
      </main>

      {/* Admin Bottom Navigation Bar */}
      <AdminBottomNav />
    </div>
  );
}
