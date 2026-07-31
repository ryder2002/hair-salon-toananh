"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, CalendarCheck, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { KpiCardsRow } from "@/components/ui/KpiCardsRow";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { formatVND } from "@/lib/money";
import { addAuditLog } from "@/lib/audit-log";
import { fetchRevenuesAction, voidRevenueEntryAction } from "@/server/actions/revenue";
import { closeDayAction, reopenDayAction, getCurrentBusinessDateAction, isDayClosedAction } from "@/server/actions/day-closing";
import { logAuditAction } from "@/server/actions/audit";
import { getRevenueTransactions, subscribeRevenueTransactions, voidRevenueTransaction, StoredTransaction } from "@/lib/revenue-store";
import { getDayClosingState, setDayClosingState, subscribeDayClosing } from "@/lib/day-closing-store";

export default function RevenueManagementPage() {
  const [activeFilter, setActiveFilter] = useState("today");
  const [isClosed, setIsClosed] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [currentBusinessDate, setCurrentBusinessDate] = useState("");

  const loadLatestTransactions = async () => {
    try {
      const date = await getCurrentBusinessDateAction();
      setCurrentBusinessDate(date);

      const dbClosed = await isDayClosedAction(date);
      setIsClosed(dbClosed);

      // Fetch from Supabase DB
      const dbEntries = await fetchRevenuesAction(date);
      if (dbEntries) {
        const formatted: TransactionItem[] = dbEntries.map((e: any) => ({
          id: e.id,
          staffName: e.profiles?.full_name || "Nhân viên",
          avatarType: "scissors",
          serviceName: e.service_name || "Dịch vụ tóc",
          amount: BigInt(e.amount || 0),
          paymentMethod: e.payment_method,
          time: new Date(e.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          status: e.status,
        }));
        setTransactions(formatted);
      }
    } catch (err) {
      console.warn("DB revenue fetch error:", err);
    }
  };

  useEffect(() => {
    const current = getDayClosingState();
    setIsClosed(current.isClosed);
    const unsubscribeClosing = subscribeDayClosing((state) => {
      setIsClosed(state.isClosed);
    });

    loadLatestTransactions();
    const unsubscribeRevenue = subscribeRevenueTransactions(() => {
      loadLatestTransactions();
    });

    return () => {
      unsubscribeClosing();
      unsubscribeRevenue();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const recordedTxs = transactions.filter((t) => t.status === "recorded");
  const cashTotal = recordedTxs
    .filter((t) => t.paymentMethod === "cash")
    .reduce((acc, t) => acc + BigInt(t.amount), 0n);
  const bankTotal = recordedTxs
    .filter((t) => t.paymentMethod === "bank_transfer")
    .reduce((acc, t) => acc + BigInt(t.amount), 0n);
  const totalRevenue = cashTotal + bankTotal;

  const handleVoidTx = async () => {
    if (!selectedTx || !voidReason) return;

    // Void in DB
    try {
      await voidRevenueEntryAction(selectedTx.id, voidReason);
    } catch (err) {
      console.warn("Void DB action warning:", err);
    }

    // Void transaction in local store
    voidRevenueTransaction(selectedTx.id);

    addAuditLog({
      action: "REVENUE_VOIDED",
      actorName: "Admin Manager",
      actorRole: "admin",
      details: `Đã hủy giao dịch ${formatVND(selectedTx.amount)} của ${selectedTx.staffName} (Lý do: ${voidReason})`,
    });
    await logAuditAction({
      action: "REVENUE_VOIDED",
      actorName: "Admin Manager",
      actorRole: "admin",
      details: `Đã hủy giao dịch ${formatVND(selectedTx.amount)} của ${selectedTx.staffName} (Lý do: ${voidReason})`,
    });

    setShowVoidModal(false);
    setSelectedTx(null);
    setVoidReason("");
    triggerToast("Đã hủy giao dịch thành công!");
    loadLatestTransactions();
  };

  const handleConfirmCloseDay = async () => {
    const targetDate = currentBusinessDate || new Date().toISOString().split("T")[0];

    // Call closeDayAction in Supabase DB
    const res = await closeDayAction({
      businessDate: targetDate,
      cashTotal: Number(cashTotal),
      bankTotal: Number(bankTotal),
      revenueTotal: Number(totalRevenue),
      transactionCount: recordedTxs.length,
    });

    if (res.success) {
      setDayClosingState(true);

      // Broadcast to all open tabs (especially employee tabs) so they switch to next business day
      try {
        const bc = new BroadcastChannel("barbershop_day_closing_channel");
        bc.postMessage({ type: "DAY_CLOSED", businessDate: targetDate });
        bc.close();
      } catch (e) {}

      addAuditLog({
        action: "DAY_CLOSED",
        actorName: "Admin Manager",
        actorRole: "admin",
        details: `Đã chốt ngày ${targetDate} (Tổng: ${formatVND(totalRevenue)}, ${recordedTxs.length} giao dịch)`,
      });

      setShowCloseModal(false);
      setIsClosed(true);
      triggerToast(`Đã chốt thành công ngày ${targetDate}! Nhân viên sẽ chuyển sang ngày mới.`);
    } else {
      triggerToast("Lỗi chốt ngày: " + (res.error || ""));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      {/* Header matching Image 3 with Unified Logo & Notification Bell */}
      <MobileHeader title="Quản lý doanh thu" subtitle="The Gentlemen Barbershop" unreadCount={5} />

      <main className="px-4 pt-3 space-y-4">
        {toastMsg && (
          <div className="bg-[#741F2C] text-white p-3 rounded-[10px] text-xs font-bold text-center shadow-lg">
            {toastMsg}
          </div>
        )}

        {/* Filter Pills Row */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter("today")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === "today"
                ? "bg-[#741F2C] text-white"
                : "bg-white border border-[rgba(23,23,23,0.2)] text-[#171717]"
            }`}
          >
            Hôm nay ∨
          </button>
          <button
            onClick={() => setActiveFilter("employee")}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white border border-[rgba(23,23,23,0.2)] text-[#171717]"
          >
            Nhân viên ∨
          </button>
          <button
            onClick={() => setActiveFilter("payment")}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white border border-[rgba(23,23,23,0.2)] text-[#171717]"
          >
            Thanh toán ∨
          </button>
          <button
            onClick={() => setActiveFilter("status")}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white border border-[rgba(23,23,23,0.2)] text-[#171717]"
          >
            Trạng thái ∨
          </button>
        </div>

        {/* 4 KPI Cards */}
        <KpiCardsRow
          totalRevenue={totalRevenue}
          cashTotal={cashTotal}
          bankTotal={bankTotal}
          transactionCount={recordedTxs.length}
        />

        {/* Transactions List */}
        <div className="pt-1 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold text-[#171717]">
            <span>DANH SÁCH GIAO DỊCH HÔM NAY</span>
            <span className="text-[rgba(23,23,23,0.5)]">Nhấn vào giao dịch để quản lý</span>
          </div>

          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  if (t.status === "recorded") {
                    setSelectedTx(t);
                    setShowVoidModal(true);
                  }
                }}
                className="cursor-pointer"
              >
                <RecentTransactionsList transactions={[t]} showStatusBadge={true} />
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Chốt ngày */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (isClosed) {
                setDayClosingState(false);
                addAuditLog({
                  action: "DAY_REOPENED",
                  actorName: "Admin Manager",
                  actorRole: "admin",
                  details: "Đã mở lại ngày làm việc tại trang Quản lý doanh thu",
                });
                triggerToast("Đã mở lại ngày làm việc!");
              } else {
                setShowCloseModal(true);
              }
            }}
            className={`w-full py-3.5 rounded-[12px] font-bold text-base flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-transform ${
              isClosed ? "bg-gray-700 text-white" : "bg-[#741F2C] text-white"
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span>{isClosed ? "MỞ LẠI NGÀY DOANH THU" : "CHỐT NGÀY DOANH THU"}</span>
          </button>
        </div>
      </main>

      {/* Modal Confirmation Void Transaction */}
      {showVoidModal && selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowVoidModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#171717]">Hủy giao dịch doanh thu</h3>
            </div>

            <div className="bg-red-50 p-3 rounded-[10px] text-xs space-y-1">
              <div>Thợ thực hiện: <strong className="text-[#171717]">{selectedTx.staffName}</strong></div>
              <div>Dịch vụ: <strong className="text-[#171717]">{selectedTx.serviceName}</strong></div>
              <div>Số tiền: <strong className="text-[#741F2C] font-bold text-sm">{formatVND(selectedTx.amount)}</strong></div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                Lý do hủy giao dịch *
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Nhập lý do hủy (ví dụ: Thao tác nhầm, Khách đổi dịch vụ)..."
                rows={2}
                className="w-full bg-[#F7F3EC] border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#741F2C]"
              />
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="flex-1 btn-outline py-2.5 text-xs font-bold rounded-[10px]"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={!voidReason}
                onClick={handleVoidTx}
                className={`flex-1 py-2.5 text-xs font-bold rounded-[10px] bg-red-700 text-white ${
                  !voidReason ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Xác nhận Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Close Day */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowCloseModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#741F2C]">
              <CalendarCheck className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#171717]">Xác nhận chốt ngày</h3>
            </div>

            <div className="bg-[#F7F3EC] p-3 rounded-[10px] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Số giao dịch hợp lệ:</span>
                <strong className="font-bold text-[#171717]">{recordedTxs.length} giao dịch</strong>
              </div>
              <div className="flex justify-between">
                <span>Tiền mặt:</span>
                <strong className="font-bold text-[#171717]">{formatVND(cashTotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Chuyển khoản:</span>
                <strong className="font-bold text-[#171717]">{formatVND(bankTotal)}</strong>
              </div>
              <div className="flex justify-between border-t border-[rgba(23,23,23,0.1)] pt-1.5 font-bold text-sm text-[#741F2C]">
                <span>TỔNG DOANH THU:</span>
                <span>{formatVND(totalRevenue)}</span>
              </div>
            </div>

            <p className="text-[11px] text-[rgba(23,23,23,0.5)]">
              Sau khi chốt ngày, nhân viên sẽ không thể tự chỉnh sửa hoặc thêm giao dịch thuộc ngày này.
            </p>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="flex-1 btn-outline py-2.5 text-xs font-bold rounded-[10px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseDay}
                className="flex-1 btn-primary py-2.5 text-xs font-bold rounded-[10px]"
              >
                Xác nhận Chốt ngày
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}
