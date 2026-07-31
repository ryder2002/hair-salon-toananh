"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Scissors } from "lucide-react";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { formatVND } from "@/lib/money";
import { getAuthSession } from "@/lib/auth";
import { getRevenueTransactions, subscribeRevenueTransactions, StoredTransaction } from "@/lib/revenue-store";
import { fetchRevenuesAction } from "@/server/actions/revenue";

export default function EmployeeRevenueHistoryPage() {
  const [session, setSession] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<bigint>(0n);

  const loadHistory = async () => {
    const activeSession = getAuthSession();
    setSession(activeSession);

    const empName = activeSession?.fullName || "";
    const empUsername = activeSession?.username || "";

    try {
      const dbList = await fetchRevenuesAction();
      if (dbList) {
        let sum = 0n;
        const formattedList: TransactionItem[] = [];

        dbList.forEach((e: any) => {
          const amt = BigInt(e.amount || 0);
          if (e.status === "recorded") {
            sum += amt;
          }

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
        setTotalAmount(sum);
      }
    } catch (err) {
      console.warn("DB employee revenue history fetch error:", err);
    }
  };

  useEffect(() => {
    loadHistory();

    const unsubscribe = subscribeRevenueTransactions(() => {
      loadHistory();
    });

    return () => unsubscribe();
  }, []);

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
            {transactions.filter((t) => t.status === "recorded").length} lượt phục vụ
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-[#171717] text-sm">GIAO DỊCH CỦA TÔI</h3>
          {transactions.length === 0 ? (
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-6 text-center shadow-sm space-y-2">
              <Scissors className="w-8 h-8 text-[rgba(23,23,23,0.3)] mx-auto" />
              <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                Chưa có lịch sử giao dịch nào được ghi nhận.
              </p>
            </div>
          ) : (
            <RecentTransactionsList transactions={transactions} showStatusBadge={true} />
          )}
        </div>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
