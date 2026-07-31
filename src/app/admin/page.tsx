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
import { getRevenueTransactions, subscribeRevenueTransactions, StoredTransaction } from "@/lib/revenue-store";
import { getVietnamBusinessDate } from "@/lib/dates";

export default function AdminDashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState<bigint>(0n);
  const [cashTotal, setCashTotal] = useState<bigint>(0n);
  const [bankTotal, setBankTotal] = useState<bigint>(0n);
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [staffRevenues, setStaffRevenues] = useState<StaffRevenueItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [businessDate, setBusinessDate] = useState<string>("");

  const loadDashboardData = () => {
    setBusinessDate(getVietnamBusinessDate());
    const rawList = getRevenueTransactions();

    const recorded = rawList.filter((t) => t.status === "recorded");

    let cash = 0n;
    let bank = 0n;
    const staffMap: Record<string, { name: string; avatarType: any; revenue: bigint }> = {};

    const formattedTxs: TransactionItem[] = recorded.map((t) => {
      const amt = BigInt(t.amount || 0);
      if (t.paymentMethod === "cash") cash += amt;
      if (t.paymentMethod === "bank_transfer") bank += amt;

      const sName = t.staffName || "Nhân viên";
      if (!staffMap[sName]) {
        staffMap[sName] = { name: sName, avatarType: t.avatarType || "scissors", revenue: 0n };
      }
      staffMap[sName].revenue += amt;

      return {
        id: t.id,
        staffName: t.staffName,
        avatarType: t.avatarType || "scissors",
        serviceName: t.serviceName,
        amount: amt,
        paymentMethod: t.paymentMethod,
        time: t.time,
        status: t.status,
      };
    });

    const total = cash + bank;
    setCashTotal(cash);
    setBankTotal(bank);
    setTotalRevenue(total);
    setTransactionCount(recorded.length);
    setRecentTransactions(formattedTxs);

    // Compute Staff Progress List
    const staffItems: StaffRevenueItem[] = Object.values(staffMap).map((s, idx) => {
      const pct = total > 0n ? Number((s.revenue * 100n) / total) : 0;
      return {
        id: `staff_rev_${idx}`,
        name: s.name,
        avatarType: s.avatarType,
        revenue: s.revenue,
        percentage: Math.min(100, Math.max(0, pct)),
      };
    });

    // Sort staff by revenue descending
    staffItems.sort((a, b) => (BigInt(b.revenue) > BigInt(a.revenue) ? 1 : -1));
    setStaffRevenues(staffItems);
  };

  useEffect(() => {
    loadDashboardData();

    const unsubscribe = subscribeRevenueTransactions(() => {
      loadDashboardData();
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      {/* Header matching Screenshot 1 */}
      <MobileHeader unreadCount={0} />

      {/* Main Container */}
      <main className="px-4 pt-3 space-y-5">
        {/* Greeting & Date Header */}
        <div>
          <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
            Chào anh, Admin
          </h2>
          <div className="flex items-center space-x-1.5 text-xs text-[rgba(23,23,23,0.6)] font-medium mt-1">
            <Calendar className="w-3.5 h-3.5 text-[#171717]" />
            <span>Thứ Năm, {businessDate || "22/05/2025"}</span>
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
              className="text-xs font-semibold text-[#741F2C] flex items-center space-x-0.5 hover:underline"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <RecentTransactionsList transactions={recentTransactions} />
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
