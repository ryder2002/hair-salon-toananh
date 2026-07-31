"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Calendar, Banknote, CreditCard, Scissors } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { formatVND } from "@/lib/money";
import { getAuthSession } from "@/lib/auth";
import { getRevenueTransactions, subscribeRevenueTransactions, StoredTransaction } from "@/lib/revenue-store";
import { getVietnamBusinessDate } from "@/lib/dates";

import { getCurrentBusinessDateAction } from "@/server/actions/day-closing";
import { fetchRevenuesAction } from "@/server/actions/revenue";

export default function EmployeeDashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [todayTotal, setTodayTotal] = useState<bigint>(0n);
  const [todayCash, setTodayCash] = useState<bigint>(0n);
  const [todayTransfer, setTodayTransfer] = useState<bigint>(0n);
  const [monthTotal, setMonthTotal] = useState<bigint>(0n);
  const [cutCount, setCutCount] = useState<number>(0);
  const [businessDate, setBusinessDate] = useState<string>("");

  const loadEmployeeData = async () => {
    const activeSession = getAuthSession();
    setSession(activeSession);

    // Fetch dynamic business date from DB (advances automatically when Admin closes day)
    let currentDate = getVietnamBusinessDate();
    try {
      currentDate = await getCurrentBusinessDateAction();
    } catch (e) {}
    setBusinessDate(currentDate);

    const empName = activeSession?.fullName || "";
    const empUsername = activeSession?.username || "";

    // 1. Fetch DB revenues
    try {
      const dbEntries = await fetchRevenuesAction(currentDate);
      if (dbEntries) {
        let cCash = 0n;
        let cTransfer = 0n;
        let cMonth = 0n;
        let count = 0;

        const formattedList: TransactionItem[] = [];
        dbEntries.forEach((e: any) => {
          if (e.status === "voided") return;
          const amt = BigInt(e.amount || 0);
          cMonth += amt;
          if (e.payment_method === "cash") cCash += amt;
          if (e.payment_method === "bank_transfer") cTransfer += amt;
          count += 1;

          formattedList.push({
            id: e.id,
            staffName: e.profiles?.full_name || empName,
            avatarType: "scissors",
            serviceName: e.service_name || "Dịch vụ tóc",
            amount: amt,
            paymentMethod: e.payment_method,
            time: new Date(e.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            status: e.status,
          });
        });

        setTransactions(formattedList);
        setTodayCash(cCash);
        setTodayTransfer(cTransfer);
        setTodayTotal(cCash + cTransfer);
        setMonthTotal(cMonth);
        setCutCount(count);
      }
    } catch (err) {
      console.warn("DB employee revenue fetch error:", err);
    }
  };

  useEffect(() => {
    loadEmployeeData();
    const unsubscribe = subscribeRevenueTransactions(() => {
      loadEmployeeData();
    });

    // Listen to BroadcastChannel for real-time Day Closing updates
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("barbershop_day_closing_channel");
      bc.onmessage = () => {
        loadEmployeeData();
      };
    } catch (e) {}

    return () => {
      unsubscribe();
      if (bc) bc.close();
    };
  }, []);

  const empDisplayName = session?.fullName ? session.fullName.split(" ").slice(-2).join(" ") : "bạn";

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="Barbershop Manager" subtitle={`Chào anh, ${empDisplayName}`} unreadCount={0} />

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
            <span>{businessDate || "Hôm nay"}</span>
          </div>

          <div className="text-2xl font-bold tracking-tight">
            {formatVND(todayTotal)}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-white/15">
            <div className="flex items-center space-x-1.5 text-white/90">
              <Banknote className="w-4 h-4 flex-shrink-0" />
              <span>Tiền mặt: <strong>{formatVND(todayCash)}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 text-white/90">
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              <span>Chuyển khoản: <strong>{formatVND(todayTransfer)}</strong></span>
            </div>
          </div>
        </div>

        {/* Employee Month Stats Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3.5 rounded-[14px] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Doanh thu tháng này</div>
            <div className="text-lg font-bold text-[#741F2C] mt-0.5">{formatVND(monthTotal)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Số lượt phục vụ</div>
            <div className="text-lg font-bold text-[#171717] mt-0.5">{cutCount} lượt</div>
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

          {transactions.length === 0 ? (
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-6 text-center shadow-sm space-y-2">
              <Scissors className="w-8 h-8 text-[rgba(23,23,23,0.3)] mx-auto" />
              <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                Chưa có lượt cắt nào trong ngày hôm nay.
              </p>
            </div>
          ) : (
            <RecentTransactionsList transactions={transactions} />
          )}
        </section>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
