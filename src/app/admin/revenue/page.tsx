"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, CalendarCheck, X, AlertTriangle, CheckCircle2, User, CreditCard, Clock, RotateCcw, Edit3, Trash2 } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { KpiCardsRow } from "@/components/ui/KpiCardsRow";
import { RecentTransactionsList, TransactionItem } from "@/components/ui/RecentTransactionsList";
import { formatVND, parseVNDInput } from "@/lib/money";
import { getRevenuePageDataAction, voidRevenueEntryAction, updateRevenueEntryAction } from "@/server/actions/revenue";
import { closeDayAction, reopenDayAction } from "@/server/actions/day-closing";
import { logAuditAction } from "@/server/actions/audit";
import { getVietnamBusinessDate } from "@/lib/dates";

import { subscribeRealtime } from "@/lib/realtime";
import { withClientCache, invalidateClientCache } from "@/lib/cache";

export default function RevenueManagementPage() {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">("today");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "bank_transfer">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "recorded" | "voided">("all");

  const [isClosed, setIsClosed] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [allDbEntries, setAllDbEntries] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [currentBusinessDate, setCurrentBusinessDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const loadData = async () => {
    setDataReady(false);
    try {
      const data = await withClientCache("admin-revenue", () => getRevenuePageDataAction(), 60000);
      setCurrentBusinessDate(data.businessDate);
      setIsClosed(data.isClosed);
      setAllDbEntries(data.revenues);
      setEmployeesList(data.employees);
      setDataReady(true);
    } catch (err) {
      console.warn("DB revenue fetch error:", err);
      setDataReady(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeRealtime(() => {
      invalidateClientCache("admin-revenue");
      void loadData();
    });
    const interval = window.setInterval(() => { void loadData(); }, 30000);
    return () => { unsub(); window.clearInterval(interval); };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Filter transactions dynamically based on selected criteria
  const todayStr = currentBusinessDate || getVietnamBusinessDate();
  const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"

  // Compute 7 days ago for week filter
  const todayObj = new Date(todayStr);
  const weekStartObj = new Date(todayObj);
  weekStartObj.setDate(weekStartObj.getDate() - 7);
  const weekStartStr = weekStartObj.toISOString().split("T")[0];

  const filteredRawEntries = allDbEntries.filter((e) => {
    const bDate = e.business_date || (e.performed_at ? e.performed_at.split("T")[0] : "");

    // 1. Time Filter
    if (timeFilter === "today" && bDate !== todayStr) return false;
    if (timeFilter === "week" && (bDate < weekStartStr || bDate > todayStr)) return false;
    if (timeFilter === "month" && !bDate.startsWith(currentMonthStr)) return false;

    // 2. Employee Filter
    if (employeeFilter !== "all" && e.employee_id !== employeeFilter) return false;

    // 3. Payment Filter
    if (paymentFilter !== "all" && e.payment_method !== paymentFilter) return false;

    // 4. Status Filter
    if (statusFilter !== "all" && e.status !== statusFilter) return false;

    return true;
  });

  // Convert to TransactionItem UI format
  const formattedTransactions: TransactionItem[] = filteredRawEntries.map((e) => ({
    id: e.id,
    staffName: e.profiles?.full_name || "Nhân viên",
    avatarType: "scissors",
    serviceName: e.service_name || "Dịch vụ tóc",
    amount: BigInt(e.amount || 0),
    paymentMethod: e.payment_method,
    time: new Date(e.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    status: e.status,
  }));

  // Compute KPI totals based on filtered records
  const recordedTxs = formattedTransactions.filter((t) => t.status === "recorded");
  const cashTotal = recordedTxs
    .filter((t) => t.paymentMethod === "cash")
    .reduce((acc, t) => acc + BigInt(t.amount), 0n);
  const bankTotal = recordedTxs
    .filter((t) => t.paymentMethod === "bank_transfer")
    .reduce((acc, t) => acc + BigInt(t.amount), 0n);
  const totalRevenue = cashTotal + bankTotal;

  const handleVoidTx = async () => {
    if (!selectedTx || !voidReason) return;
    setLoading(true);

    try {
      await voidRevenueEntryAction(selectedTx.id, voidReason);
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
      await loadData();
    } catch (err: any) {
      console.error("Void DB action error:", err);
      triggerToast("Lỗi hủy giao dịch: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCloseDay = async () => {
    const targetDate = todayStr;

    const res = await closeDayAction({ businessDate: targetDate });

    if (res.success) {
      setShowCloseModal(false);
      setIsClosed(true);
      triggerToast(`Đã chốt thành công ngày ${targetDate}!`);
      await loadData();
    } else {
      triggerToast("Lỗi chốt ngày: " + (res.error || ""));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      {/* Header matching App Design */}
      <MobileHeader title="Quản lý doanh thu" subtitle="Toàn Anh Hair Salon" />

      <main className="px-4 pt-3 space-y-4">
        {toastMsg && (
          <div className="bg-[#741F2C] text-white p-3 rounded-[10px] text-xs font-bold text-center shadow-lg animate-bounce">
            {toastMsg}
          </div>
        )}

        {/* 4 Interactive Dropdown Filter Controls */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#741F2C] uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> BỘ LỌC DOANH THU MULTI-CRITERIA
            </span>
            {(timeFilter !== "today" || employeeFilter !== "all" || paymentFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setTimeFilter("today");
                  setEmployeeFilter("all");
                  setPaymentFilter("all");
                  setStatusFilter("all");
                }}
                className="text-[11px] font-bold text-red-700 hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. Time Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Thời gian</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full bg-[#F7F3EC]/60 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#741F2C]"
              >
                <option value="today">Hôm nay ({todayStr})</option>
                <option value="week">7 ngày qua (Tuần này)</option>
                <option value="month">Tháng này ({currentMonthStr})</option>
                <option value="all">Tất cả thời gian</option>
              </select>
            </div>

            {/* 2. Employee Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhân viên</label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full bg-[#F7F3EC]/60 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#741F2C]"
              >
                <option value="all">Tất cả nhân viên</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Payment Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Thanh toán</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full bg-[#F7F3EC]/60 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#741F2C]"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="cash">Tiền mặt</option>
                <option value="bank_transfer">Chuyển khoản</option>
              </select>
            </div>

            {/* 4. Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-[#F7F3EC]/60 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#741F2C]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="recorded">Đang ghi nhận (OK)</option>
                <option value="voided">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Cards based on filter */}
        <KpiCardsRow
          totalRevenue={totalRevenue}
          cashTotal={cashTotal}
          bankTotal={bankTotal}
          transactionCount={recordedTxs.length}
        />

        {/* Filtered Transactions List */}
        <div className="pt-1 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold text-[#171717]">
            <span>DANH SÁCH GIAO DỊCH ({formattedTransactions.length} ĐƠN)</span>
            <span className="text-[rgba(23,23,23,0.5)]">Chạm vào đơn để quản lý</span>
          </div>

          <div className="space-y-2">
            <RecentTransactionsList
              transactions={formattedTransactions}
              showStatusBadge={true}
              onSelectTransaction={(t) => {
                setSelectedTx(t);
                setShowVoidModal(true);
              }}
            />
          </div>
        </div>

        {/* Action Button: Chốt ngày */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (isClosed) {
                const reason = window.prompt("Nhập lý do mở lại ngày")?.trim();
                if (!reason) return;
                void reopenDayAction(todayStr, reason).then((result) => {
                  if (result.success) { setIsClosed(false); triggerToast("Đã mở lại ngày làm việc!"); }
                  else triggerToast(result.error || "Không thể mở lại ngày");
                });
                void logAuditAction({
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

      {/* Modal Confirmation / Management for Revenue Transaction */}
      {showVoidModal && selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl border border-[rgba(23,23,23,0.12)]">
            <button
              onClick={() => setShowVoidModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#741F2C]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#171717]">Quản lý / Hủy đơn doanh thu</h3>
            </div>

            <div className="bg-[#F7F3EC]/70 p-3 rounded-[10px] text-xs space-y-1.5 border border-gray-200">
              <div>Thợ thực hiện: <strong className="text-[#171717]">{selectedTx.staffName}</strong></div>
              <div>Dịch vụ: <strong className="text-[#171717]">{selectedTx.serviceName}</strong></div>
              <div>Số tiền: <strong className="text-[#741F2C] font-bold text-sm">{formatVND(selectedTx.amount)}</strong></div>
              <div>Thanh toán: <strong className="text-[#171717]">{selectedTx.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}</strong></div>
            </div>

            {selectedTx.status === "recorded" && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Lý do hủy đơn *
                </label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Nhập lý do hủy giao dịch..."
                  rows={2}
                  className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] p-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#741F2C]"
                />
              </div>
            )}

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="flex-1 border border-[rgba(23,23,23,0.2)] py-2.5 text-xs font-bold rounded-[10px] text-[#171717]"
              >
                Đóng
              </button>
              {selectedTx.status === "recorded" && (
                <button
                  type="button"
            disabled={loading || !dataReady}
                  onClick={handleVoidTx}
                  className="flex-1 py-2.5 text-xs font-bold rounded-[10px] bg-red-600 text-white shadow-md hover:bg-red-700"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận HỦY ĐƠN"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chốt ngày */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowCloseModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#741F2C]">
              <CalendarCheck className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#171717]">Xác nhận CHỐT NGÀY DOANH THU</h3>
            </div>

            <p className="text-xs text-[rgba(23,23,23,0.7)] leading-relaxed">
              Bạn có chắc chắn muốn chốt doanh thu ngày <strong className="text-[#741F2C]">{todayStr}</strong>?
            </p>

            <div className="bg-[#F7F3EC] p-3 rounded-[10px] text-xs space-y-1 font-medium">
              <div className="flex justify-between">
                <span>Tổng doanh thu:</span>
                <strong className="text-[#741F2C]">{formatVND(totalRevenue)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tiền mặt:</span>
                <span>{formatVND(cashTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Chuyển khoản:</span>
                <span>{formatVND(bankTotal)}</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="flex-1 border border-[rgba(23,23,23,0.2)] py-2.5 text-xs font-bold rounded-[10px] text-[#171717]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseDay}
                className="flex-1 py-2.5 text-xs font-bold rounded-[10px] bg-[#741F2C] text-white shadow-md"
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
