"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { formatVND } from "@/lib/money";

export default function EmployeeRevenueHistoryPage() {
  const [filter, setFilter] = useState("all");

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
    {
      id: "e3",
      staffName: "Minh Quân",
      avatarType: "pole",
      serviceName: "Uốn tóc nam",
      amount: 350000n,
      paymentMethod: "bank_transfer",
      time: "Hôm qua 17:40",
      status: "recorded",
    },
  ];

  const totalAmount = transactions.reduce((acc, t) => acc + BigInt(t.amount), 0n);

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/employee"
            className="p-1 rounded-full text-[#741F2C] hover:bg-[rgba(23,23,23,0.05)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-[#171717] tracking-tight">
            Lịch sử ghi doanh thu
          </h1>
          <Link href="/employee/revenue/new" className="text-[#741F2C]">
            <PlusCircle className="w-6 h-6" />
          </Link>
        </div>
      </header>

      <main className="px-4 pt-3 space-y-4">
        {/* Total Header Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Tổng doanh thu lịch sử</div>
            <div className="text-xl font-extrabold text-[#741F2C] mt-0.5">{formatVND(totalAmount)}</div>
          </div>
          <div className="text-right text-xs font-bold text-[#171717]">
            {transactions.length} lượt phục vụ
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-[#171717] text-sm">GIAO DỊCH CỦA TÔI</h3>
          <RecentTransactionsList transactions={transactions} showStatusBadge={true} />
        </div>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
