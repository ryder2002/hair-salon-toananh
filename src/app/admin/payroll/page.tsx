"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  FileSpreadsheet,
  Plus,
  Crown,
  Calculator,
  ChevronRight,
  CircleDollarSign,
  Users,
  BarChart3,
  Percent,
  X,
  Lock,
  Send,
  CreditCard,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { formatVND, calculateTotalSalary } from "@/lib/money";
import { logAuditAction } from "@/server/actions/audit";

import { PayrollMonthPickerModal } from "@/components/ui/PayrollMonthPickerModal";
import { getCurrentVietnamMonthStr } from "@/lib/dates";
import {
  fetchPayrollsAction,
  generatePayrollAction,
  updatePayrollStatusAction,
  updateSinglePayrollPaidAction,
  updateSalarySettingsAction,
  fetchPayrollHistoryAction,
  PayrollMonthSummary,
} from "@/server/actions/payroll";

interface PayrollRow {
  id: string;
  employee_id: string;
  name: string;
  isManager?: boolean;
  roleTitle: string;
  baseSalary: bigint;
  allowance: bigint;
  commPercent: number;
  eligibleRevenue: bigint;
  commAmount: bigint;
  bonus: bigint;
  deduction: bigint;
  totalSalary: bigint;
  status: "draft" | "locked" | "published" | "paid";
  isPaid?: boolean;
}

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<"payroll" | "settings">("payroll");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentVietnamMonthStr());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [globalStatus, setGlobalStatus] = useState<"draft" | "locked" | "published" | "paid">("draft");
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [historyList, setHistoryList] = useState<PayrollMonthSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayrollFromDatabase = async (monthStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetchPayrollsAction(monthStr);
      setGlobalStatus(res.globalStatus as "draft" | "locked" | "published" | "paid");

      const mappedRows: PayrollRow[] = res.rows.map((r) => ({
        id: r.id,
        employee_id: r.employee_id,
        name: r.employee_name,
        isManager: r.is_manager,
        roleTitle: r.job_title,
        baseSalary: BigInt(r.base_salary),
        allowance: BigInt(r.allowance),
        commPercent: r.commission_rate,
        eligibleRevenue: BigInt(r.eligible_revenue),
        commAmount: BigInt(r.commission_amount),
        bonus: BigInt(r.bonus),
        deduction: BigInt(r.deduction),
        totalSalary: BigInt(r.total_salary),
        status: r.status,
        isPaid: r.is_paid,
      }));

      setRows(mappedRows);
    } catch (err) {
      console.error("Lỗi tải bảng lương từ database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryFromDatabase = async () => {
    try {
      const history = await fetchPayrollHistoryAction();
      setHistoryList(history);
    } catch (err) {
      console.error("Lỗi tải lịch sử bảng lương:", err);
    }
  };

  useEffect(() => {
    loadPayrollFromDatabase(selectedMonth);
    loadHistoryFromDatabase();
  }, [selectedMonth]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Helper calculation totals
  const totalBase = rows.reduce((acc, r) => acc + r.baseSalary, 0n);
  const totalAllowance = rows.reduce((acc, r) => acc + r.allowance, 0n);
  const totalCommission = rows.reduce((acc, r) => acc + r.commAmount, 0n);
  const totalPayrollPool = rows.reduce((acc, r) => acc + r.totalSalary, 0n);
  const totalShopRevenue = rows.reduce((acc, r) => acc + r.eligibleRevenue, 0n);

  const avgCommPercentDisplay =
    totalShopRevenue > 0n
      ? ((Number(totalCommission) / Number(totalShopRevenue)) * 100).toFixed(1) + "%"
      : "0%";

  const handleGeneratePayroll = async () => {
    setIsLoading(true);
    try {
      await generatePayrollAction(selectedMonth);
      await loadPayrollFromDatabase(selectedMonth);
      await loadHistoryFromDatabase();
      setShowCreateModal(false);

      await logAuditAction({
        action: "PAYROLL_CREATED",
        actorName: "Admin Manager",
        actorRole: "admin",
        details: `Đã khởi tạo/tổng hợp bảng lương mới từ Database cho ${selectedMonth}`,
      });
      triggerToast(`Đã tính và lưu bảng lương ${selectedMonth} vào Database!`);
    } catch (err: any) {
      triggerToast(`Lỗi tạo bảng lương: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "locked" | "published" | "paid") => {
    setIsLoading(true);
    try {
      await updatePayrollStatusAction(selectedMonth, newStatus);
      await loadPayrollFromDatabase(selectedMonth);
      await loadHistoryFromDatabase();

      const statusText =
        newStatus === "locked"
          ? "Khóa bảng lương"
          : newStatus === "published"
          ? "Công bố bảng lương cho nhân viên"
          : "Đánh dấu đã thanh toán toàn bộ";

      if (newStatus === "published") {
        void Promise.resolve({
          title: "Công bố bảng lương mới",
          message: `Bảng lương ${selectedMonth} đã được công bố! Tất cả nhân viên có thể vào tab Bảng lương để kiểm tra.`,
          type: "payroll",
          url: "/employee/payroll",
        });

        if (typeof window !== "undefined" && "serviceWorker" in navigator && Notification.permission === "granted") {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(`Toàn Anh Hair Salon - ${selectedMonth}`, {
              body: `Bảng lương ${selectedMonth} đã chính thức được công bố! Hãy vào ứng dụng để xem chi tiết.`,
              icon: "/Logo.png",
              badge: "/Logo.png",
            });
          });
        }
      }

      await logAuditAction({
        action: newStatus === "paid" ? "PAYROLL_PAID" : newStatus === "published" ? "PAYROLL_PUBLISHED" : "PAYROLL_LOCKED",
        actorName: "Admin Manager",
        actorRole: "admin",
        details: `Đã thực hiện: ${statusText} cho ${selectedMonth} trong Database`,
      });
      triggerToast(`Đã ${statusText} thành công trong Database!`);
    } catch (err: any) {
      triggerToast(`Lỗi cập nhật trạng thái: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSingleEmployeePaid = async (emp: PayrollRow) => {
    setIsLoading(true);
    try {
      const nextPaid = !emp.isPaid;
      await updateSinglePayrollPaidAction(selectedMonth, emp.employee_id, nextPaid);
      await loadPayrollFromDatabase(selectedMonth);
      await loadHistoryFromDatabase();

      triggerToast(`Đã cập nhật trạng thái thanh toán cho ${emp.name} trong Database!`);
    } catch (err: any) {
      triggerToast(`Lỗi cập nhật thanh toán: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSalarySettings = async () => {
    setIsLoading(true);
    try {
      const payload = rows.map((r) => ({
        employee_id: r.employee_id,
        base_salary: Number(r.baseSalary),
        allowance: Number(r.allowance),
        commission_rate: r.commPercent,
      }));

      await updateSalarySettingsAction(payload);
      await loadPayrollFromDatabase(selectedMonth);

      await logAuditAction({
        action: "SALARY_SETTINGS_UPDATED",
        actorName: "Admin Manager",
        actorRole: "admin",
        details: `Đã cập nhật toàn bộ cấu hình lương nhân viên trong Database`,
      });
      triggerToast("Đã lưu toàn bộ cấu hình lương vào Database thành công!");
    } catch (err: any) {
      triggerToast(`Lỗi lưu cấu hình lương: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const csvRows = [
      ["Nhan vien", "Luong cung", "Phu cap", "% Hoa hong", "Hoa hong", "Tong luong", "Trang thai"],
      ...rows.map((r) => [
        r.name,
        r.baseSalary.toString(),
        r.allowance.toString(),
        `${r.commPercent}%`,
        r.commAmount.toString(),
        r.totalSalary.toString(),
        r.status,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bang_Luong_${selectedMonth.replace(/\s+|\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Đã xuất file bảng lương CSV!");
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="LƯƠNG" subtitle="Quản lý bảng lương nhân viên" unreadCount={3} />

      <main className="px-4 pt-3 space-y-4">
        {toastMessage && (
          <div className="bg-[#741F2C] text-white p-3 rounded-[10px] text-xs font-bold text-center shadow-lg animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Top Tabs: BẢNG LƯƠNG | CÀI ĐẶT LƯƠNG */}
        <div className="flex border-b border-[rgba(23,23,23,0.15)] bg-white rounded-t-[12px] p-1">
          <button
            onClick={() => setActiveTab("payroll")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-[8px] transition-colors ${
              activeTab === "payroll"
                ? "bg-[#741F2C] text-white shadow-sm"
                : "text-[rgba(23,23,23,0.6)]"
            }`}
          >
            📋 BẢNG LƯƠNG
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-[8px] transition-colors ${
              activeTab === "settings"
                ? "bg-[#741F2C] text-white shadow-sm"
                : "text-[rgba(23,23,23,0.6)]"
            }`}
          >
            ⚙ CÀI ĐẶT LƯƠNG
          </button>
        </div>

        {/* Filter Month Selector Row */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-white border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3 py-2 text-xs font-semibold text-[#171717] flex justify-between items-center">
            <span>Kỳ lương: <strong className="text-[#741F2C]">{selectedMonth}</strong></span>
            {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#741F2C] animate-spin" />}
          </div>
          <button
            onClick={() => setShowMonthPickerModal(true)}
            className="bg-white border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3.5 py-2 text-xs font-semibold text-[#171717] flex items-center space-x-1.5 active:scale-95 shadow-sm hover:border-[#741F2C]"
          >
            <Calendar className="w-4 h-4 text-[#741F2C]" />
            <span>Đổi kỳ</span>
          </button>
        </div>

        {activeTab === "payroll" ? (
          <>
            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3 rounded-[12px] flex items-center space-x-2.5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-red-50 text-[#741F2C] flex items-center justify-center flex-shrink-0">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium">Tổng quỹ lương</div>
                  <div className="text-sm font-bold text-[#741F2C]">{formatVND(totalPayrollPool)}</div>
                </div>
              </div>

              <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3 rounded-[12px] flex items-center space-x-2.5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-red-50 text-[#741F2C] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium">Tổng nhân viên</div>
                  <div className="text-sm font-bold text-[#171717]">{rows.length}</div>
                </div>
              </div>

              <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3 rounded-[12px] flex items-center space-x-2.5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-red-50 text-[#741F2C] flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium">Tổng doanh thu</div>
                  <div className="text-sm font-bold text-[#171717]">{formatVND(totalShopRevenue)}</div>
                </div>
              </div>

              <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3 rounded-[12px] flex items-center space-x-2.5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-red-50 text-[#741F2C] flex items-center justify-center flex-shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium">TB % hoa hồng</div>
                  <div className="text-sm font-bold text-[#171717]">{avgCommPercentDisplay}</div>
                </div>
              </div>
            </div>

            {/* Action Bar for Status & Creation */}
            <div className="flex flex-wrap gap-2 justify-between items-center bg-white p-2.5 rounded-[12px] border border-[rgba(23,23,23,0.12)]">
              <div className="flex items-center space-x-1">
                {globalStatus === "draft" && (
                  <button
                    onClick={() => handleStatusChange("locked")}
                    disabled={isLoading}
                    className="btn-outline text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1 border-amber-600 text-amber-700 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Khóa bảng lương</span>
                  </button>
                )}
                {globalStatus === "locked" && (
                  <button
                    onClick={() => handleStatusChange("published")}
                    disabled={isLoading}
                    className="btn-primary text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Công bố cho nhân viên</span>
                  </button>
                )}
                {globalStatus === "published" && (
                  <button
                    onClick={() => handleStatusChange("paid")}
                    disabled={isLoading}
                    className="btn-outline text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1 border-blue-600 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Thanh toán tất cả</span>
                  </button>
                )}
                {globalStatus === "paid" && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-700" />
                    <span>TẤT CẢ ĐÃ THANH TOÁN</span>
                  </span>
                )}
              </div>

              <div className="flex space-x-1.5">
                <button
                  onClick={handleExportExcel}
                  className="btn-outline text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={isLoading}
                  className="btn-primary text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo mới</span>
                </button>
              </div>
            </div>

            {/* Mobile View: Cards list for individual employee salary details */}
            <div className="space-y-3 block sm:hidden">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm space-y-2"
                >
                  <div className="flex justify-between items-center border-b border-[rgba(23,23,23,0.06)] pb-2">
                    <div>
                      <div className="font-bold text-[#171717] text-sm flex items-center space-x-1">
                        <span>{r.name}</span>
                        {r.isManager && <Crown className="w-3.5 h-3.5 text-[#741F2C] fill-[#741F2C]" />}
                      </div>
                      <div className="text-[11px] text-[rgba(23,23,23,0.5)] font-medium">{r.roleTitle}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSingleEmployeePaid(r)}
                      disabled={isLoading}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 transition-colors ${
                        r.isPaid
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-emerald-50 hover:text-emerald-800"
                      }`}
                    >
                      {r.isPaid ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-blue-700" />
                          <span>Đã thanh toán</span>
                        </>
                      ) : (
                        <span>Đánh dấu đã TT</span>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[rgba(23,23,23,0.5)] block">Lương cứng</span>
                      <span className="font-semibold text-[#171717]">{formatVND(r.baseSalary)}</span>
                    </div>
                    <div>
                      <span className="text-[rgba(23,23,23,0.5)] block">Phụ cấp</span>
                      <span className="font-semibold text-[#171717]">{formatVND(r.allowance)}</span>
                    </div>
                    <div>
                      <span className="text-[rgba(23,23,23,0.5)] block">Hoa hồng ({r.commPercent}%)</span>
                      <span className="font-semibold text-[#171717]">{formatVND(r.commAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[rgba(23,23,23,0.5)] block">Tổng thu nhập</span>
                      <span className="font-extrabold text-[#741F2C] text-sm">{formatVND(r.totalSalary)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet View: Table */}
            <div className="space-y-2.5 hidden sm:block">
              <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[520px]">
                    <thead>
                      <tr className="border-b border-[rgba(23,23,23,0.1)] bg-[rgba(23,23,23,0.02)] text-[11px] font-semibold text-[rgba(23,23,23,0.6)]">
                        <th className="py-2.5 px-3">Nhân viên</th>
                        <th className="py-2.5 px-2 text-right">Lương cứng</th>
                        <th className="py-2.5 px-2 text-right">Phụ cấp</th>
                        <th className="py-2.5 px-2 text-center">% DT</th>
                        <th className="py-2.5 px-2 text-right">Hoa hồng</th>
                        <th className="py-2.5 px-3 text-right">Tổng lương</th>
                        <th className="py-2.5 px-2 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(23,23,23,0.08)] text-xs">
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-[rgba(23,23,23,0.02)]">
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#171717] flex items-center space-x-1">
                              <span>{r.name}</span>
                              {r.isManager && <Crown className="w-3 h-3 text-[#741F2C] fill-[#741F2C]" />}
                            </div>
                            <div className="text-[10px] text-[rgba(23,23,23,0.5)]">{r.roleTitle}</div>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{formatVND(r.baseSalary)}</td>
                          <td className="py-3 px-2 text-right font-medium">{formatVND(r.allowance)}</td>
                          <td className="py-3 px-2 text-center text-[10px] text-[rgba(23,23,23,0.6)]">
                            {r.commPercent}% <br />
                            <span className="text-[9px]">({formatVND(r.eligibleRevenue)})</span>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{formatVND(r.commAmount)}</td>
                          <td className="py-3 px-3 text-right font-bold text-[#741F2C]">
                            {formatVND(r.totalSalary)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSingleEmployeePaid(r)}
                              disabled={isLoading}
                              className="cursor-pointer focus:outline-none disabled:opacity-50"
                            >
                              {r.isPaid ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 whitespace-nowrap inline-flex items-center space-x-1">
                                  <span>✓ Đã thanh toán</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 whitespace-nowrap hover:bg-emerald-100 hover:text-emerald-800">
                                  Chờ thanh toán
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Total Summary Row */}
                <div className="bg-red-50/50 border-t border-[rgba(23,23,23,0.1)] p-3 text-xs flex flex-wrap items-center justify-between font-bold text-[#171717]">
                  <div className="flex items-center space-x-1.5">
                    <Calculator className="w-4 h-4 text-[#741F2C]" />
                    <span>Tổng cộng {rows.length} nhân viên</span>
                  </div>
                  <div className="flex space-x-3 text-right">
                    <div>
                      <span className="text-[10px] text-[rgba(23,23,23,0.5)] block">Lương cứng</span>
                      {formatVND(totalBase)}
                    </div>
                    <div>
                      <span className="text-[10px] text-[rgba(23,23,23,0.5)] block">Phụ cấp</span>
                      {formatVND(totalAllowance)}
                    </div>
                    <div>
                      <span className="text-[10px] text-[rgba(23,23,23,0.5)] block">Hoa hồng</span>
                      {formatVND(totalCommission)}
                    </div>
                    <div>
                      <span className="text-[10px] text-[rgba(23,23,23,0.5)] block">Tổng quỹ lương</span>
                      <span className="text-[#741F2C]">{formatVND(totalPayrollPool)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: LỊCH SỬ BẢNG LƯƠNG */}
            <div className="space-y-2.5 pt-1">
              <h3 className="font-bold text-[#741F2C] text-xs tracking-wider uppercase">
                LỊCH SỬ BẢNG LƯƠNG (DATABASE)
              </h3>

              <div className="space-y-2">
                {historyList.length === 0 ? (
                  <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[12px] p-4 text-center text-xs text-[rgba(23,23,23,0.5)]">
                    Chưa có lịch sử bảng lương nào trong Database.
                  </div>
                ) : (
                  historyList.map((h) => (
                    <button
                      key={h.payrollMonthDate}
                      onClick={() => setSelectedMonth(h.monthStr)}
                      className={`w-full bg-white border rounded-[12px] p-3 shadow-sm flex items-center justify-between transition-colors text-left ${
                        selectedMonth === h.monthStr ? "border-[#741F2C] bg-red-50/20" : "border-[rgba(23,23,23,0.12)] hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-[#741F2C]">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-[#171717] text-sm">{h.monthStr}</div>
                          <div className="text-[11px] text-[rgba(23,23,23,0.5)]">
                            {h.employeeCount} nhân viên • {h.updatedAt ? new Date(h.updatedAt).toLocaleDateString("vi-VN") : "Database"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-right">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold block mb-0.5 ${
                              h.globalStatus === "paid"
                                ? "bg-blue-100 text-blue-800"
                                : h.globalStatus === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : h.globalStatus === "locked"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {h.globalStatus === "paid"
                              ? "Đã thanh toán"
                              : h.globalStatus === "published"
                              ? "Đã công bố"
                              : h.globalStatus === "locked"
                              ? "Đã khóa"
                              : "Bản nháp"}
                          </span>
                          <div className="font-bold text-sm text-[#171717]">{formatVND(BigInt(h.totalPayroll))}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[rgba(23,23,23,0.4)]" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: CÀI ĐẶT LƯƠNG */
          <div className="space-y-3">
            <h3 className="font-bold text-[#741F2C] text-xs tracking-wider uppercase">
              CẤU HÌNH LƯƠNG & HOA HỒNG NHÂN VIÊN (DATABASE)
            </h3>

            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-4">
              {rows.map((r, index) => (
                <div key={r.id} className="p-3 border border-[rgba(23,23,23,0.1)] rounded-[10px] space-y-2">
                  <div className="flex justify-between items-center font-bold text-sm text-[#171717]">
                    <span>{r.name} ({r.roleTitle})</span>
                    <span className="text-[#741F2C] text-xs font-semibold">{r.commPercent}% Hoa hồng</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium">Lương cứng (VND)</label>
                      <input
                        type="text"
                        value={formatVND(r.baseSalary).replace(" đ", "")}
                        onChange={(e) => {
                          const val = BigInt(e.target.value.replace(/\D/g, "") || 0);
                          const updated = [...rows];
                          updated[index].baseSalary = val;
                          updated[index].totalSalary = calculateTotalSalary(val, r.allowance, r.commAmount);
                          setRows(updated);
                        }}
                        className="w-full bg-[#F7F3EC] border border-[rgba(23,23,23,0.14)] rounded-[8px] px-2.5 py-1.5 font-bold text-[#171717]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium">Phụ cấp (VND)</label>
                      <input
                        type="text"
                        value={formatVND(r.allowance).replace(" đ", "")}
                        onChange={(e) => {
                          const val = BigInt(e.target.value.replace(/\D/g, "") || 0);
                          const updated = [...rows];
                          updated[index].allowance = val;
                          updated[index].totalSalary = calculateTotalSalary(r.baseSalary, val, r.commAmount);
                          setRows(updated);
                        }}
                        className="w-full bg-[#F7F3EC] border border-[rgba(23,23,23,0.14)] rounded-[8px] px-2.5 py-1.5 font-bold text-[#171717]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleSaveSalarySettings}
                disabled={isLoading}
                className="w-full bg-[#741F2C] text-white py-3 rounded-[10px] font-bold text-sm shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>LƯU TOÀN BỘ CẤU HÌNH LƯƠNG VÀO DATABASE</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Create Payroll */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#741F2C]">
              <Calculator className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#171717]">Tạo bảng lương từ Database</h3>
            </div>

            <p className="text-xs text-[rgba(23,23,23,0.6)]">
              Hệ thống sẽ tự động tổng hợp doanh thu trong Database của từng thợ trong <strong>{selectedMonth}</strong> và tính hoa hồng theo cấu hình.
            </p>

            <div className="space-y-2 text-xs bg-[#F7F3EC] p-3 rounded-[10px]">
              <div className="flex justify-between">
                <span>Số nhân viên:</span>
                <strong className="font-bold text-[#171717]">{rows.length} người</strong>
              </div>
              <div className="flex justify-between">
                <span>Tổng doanh thu tiệm:</span>
                <strong className="font-bold text-[#741F2C]">{formatVND(totalShopRevenue)}</strong>
              </div>
              <div className="flex justify-between border-t border-[rgba(23,23,23,0.1)] pt-1.5">
                <span>Dự toán quỹ lương:</span>
                <strong className="font-bold text-[#741F2C]">{formatVND(totalPayrollPool)}</strong>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn-outline py-2.5 text-xs font-bold rounded-[10px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleGeneratePayroll}
                disabled={isLoading}
                className="flex-1 btn-primary py-2.5 text-xs font-bold rounded-[10px] flex items-center justify-center space-x-1"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận tạo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month Picker Calendar Modal */}
      {showMonthPickerModal && (
        <PayrollMonthPickerModal
          currentMonthStr={selectedMonth}
          onClose={() => setShowMonthPickerModal(false)}
          onSelectMonth={(m) => {
            setSelectedMonth(m);
            triggerToast(`Đã chuyển kỳ lương sang ${m}`);
          }}
        />
      )}

      <AdminBottomNav />
    </div>
  );
}
