"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Scissors, Edit3, Trash2, X, CheckCircle2, Banknote, CreditCard } from "lucide-react";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { formatVND, parseVNDInput } from "@/lib/money";
import { loadAuthSession, type UserSession } from "@/lib/auth";
import { subscribeRealtime } from "@/lib/realtime";
import { withClientCache, invalidateClientCache } from "@/lib/cache";
import { fetchRevenuesAction, voidRevenueEntryAction, updateRevenueEntryAction } from "@/server/actions/revenue";
import { logAuditAction } from "@/server/actions/audit";

export default function EmployeeRevenueHistoryPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<bigint>(0n);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editServiceName, setEditServiceName] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const loadHistory = async () => {
    const activeSession = await loadAuthSession();
    setSession(activeSession);

    const empName = activeSession?.fullName || "";

    try {
      const dbList = await withClientCache("emp-revenue-history", () => fetchRevenuesAction(), 60000);
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
    const unsubscribe = subscribeRealtime(() => {
      invalidateClientCache("emp-revenue-history");
      void loadHistory();
    });
    const interval = window.setInterval(() => { void loadHistory(); }, 30000);
    return () => { unsubscribe(); window.clearInterval(interval); };
  }, []);

  const handleOpenTxModal = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setIsEditing(false);
    setEditAmount(String(tx.amount));
    setEditServiceName(tx.serviceName);
    setEditPaymentMethod(tx.paymentMethod);
  };

  const handleVoidTx = async () => {
    if (!selectedTx) return;
    setLoading(true);
    try {
      await voidRevenueEntryAction(selectedTx.id, "Nhân viên hủy đơn nhầm");
      await logAuditAction({
        action: "REVENUE_VOIDED",
        actorName: session?.fullName || "Nhân viên",
        actorRole: "employee",
        details: `Đã hủy đơn nhầm: ${formatVND(selectedTx.amount)} (${selectedTx.serviceName})`,
      });
      setToastMsg("Đã hủy đơn thành công!");
      setSelectedTx(null);
      await loadHistory();
    } catch (err: any) {
      alert("Lỗi hủy đơn: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTx) return;
    const numericAmt = Number(parseVNDInput(editAmount));
    if (numericAmt <= 0) return;

    setLoading(true);
    try {
      await updateRevenueEntryAction({
        id: selectedTx.id,
        amount: numericAmt,
        payment_method: editPaymentMethod,
        service_name: editServiceName || "Dịch vụ tóc",
      });
      await logAuditAction({
        action: "REVENUE_EDITED",
        actorName: session?.fullName || "Nhân viên",
        actorRole: "employee",
        details: `Đã sửa đơn nhầm thành: ${formatVND(numericAmt)} (${editServiceName})`,
      });
      setToastMsg("Đã cập nhật đơn thành công!");
      setSelectedTx(null);
      await loadHistory();
    } catch (err: any) {
      alert("Lỗi sửa đơn: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      {/* Toast message */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2 border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

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
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#171717] text-sm">GIAO DỊCH CỦA TÔI</h3>
            <span className="text-[11px] text-[rgba(23,23,23,0.5)]">Chạm vào đơn để sửa / hủy</span>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-6 text-center shadow-sm space-y-2">
              <Scissors className="w-8 h-8 text-[rgba(23,23,23,0.3)] mx-auto" />
              <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                Chưa có lịch sử giao dịch nào được ghi nhận.
              </p>
            </div>
          ) : (
            <RecentTransactionsList
              transactions={transactions}
              showStatusBadge={true}
              onSelectTransaction={handleOpenTxModal}
            />
          )}
        </div>
      </main>

      {/* Interactive Modal for Editing/Voiding Revenue Entry */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm p-5 space-y-4 shadow-2xl border border-[rgba(23,23,23,0.12)] animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#171717]">
                {isEditing ? "Chỉnh sửa đơn doanh thu" : "Chi tiết đơn hàng"}
              </h3>
              <button onClick={() => setSelectedTx(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Số tiền (VND)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatVND(parseVNDInput(editAmount)).replace(" đ", "")}
                    onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#F7F3EC]/60 border border-gray-200 rounded-[10px] px-3 py-2 text-sm font-bold text-[#741F2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tên dịch vụ</label>
                  <input
                    type="text"
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                    className="w-full bg-[#F7F3EC]/60 border border-gray-200 rounded-[10px] px-3 py-2 text-sm text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phương thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPaymentMethod("cash")}
                      className={`py-2 rounded-[8px] text-xs font-bold flex items-center justify-center space-x-1 border ${
                        editPaymentMethod === "cash" ? "bg-[#741F2C] text-white border-[#741F2C]" : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Tiền mặt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPaymentMethod("bank_transfer")}
                      className={`py-2 rounded-[8px] text-xs font-bold flex items-center justify-center space-x-1 border ${
                        editPaymentMethod === "bank_transfer" ? "bg-[#741F2C] text-white border-[#741F2C]" : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Chuyển khoản</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-1/2 py-2.5 rounded-[10px] border border-gray-300 text-xs font-bold text-gray-700"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="w-1/2 py-2.5 rounded-[10px] bg-[#741F2C] text-white text-xs font-bold shadow-sm"
                  >
                    {loading ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#F7F3EC]/50 p-3.5 rounded-[12px] space-y-1.5 border border-gray-200/60">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Dịch vụ:</span>
                    <span className="font-bold text-gray-800">{selectedTx.serviceName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Số tiền:</span>
                    <span className="font-extrabold text-[#741F2C] text-sm">{formatVND(selectedTx.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Thanh toán:</span>
                    <span className="font-semibold text-gray-700">
                      {selectedTx.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className={`font-bold ${selectedTx.status === "voided" ? "text-red-600" : "text-emerald-700"}`}>
                      {selectedTx.status === "voided" ? "Đã hủy" : "Đang ghi nhận (OK)"}
                    </span>
                  </div>
                </div>

                {selectedTx.status !== "voided" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-1/2 py-2.5 rounded-[10px] bg-amber-500 text-white text-xs font-bold flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>SỬA ĐƠN</span>
                    </button>
                    <button
                      onClick={handleVoidTx}
                      disabled={loading}
                      className="w-1/2 py-2.5 rounded-[10px] bg-red-600 text-white text-xs font-bold flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{loading ? "ĐANG HỦY..." : "HỦY/XÓA ĐƠN"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <EmployeeBottomNav />
    </div>
  );
}
