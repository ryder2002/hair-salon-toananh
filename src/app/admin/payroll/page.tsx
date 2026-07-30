"use client";

import React, { useState } from "react";
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
  CheckCircle2,
  Lock,
  Send,
  CreditCard,
} from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { formatVND, calculateCommission, calculateTotalSalary } from "@/lib/money";

interface PayrollRow {
  id: string;
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
}

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<"payroll" | "settings">("payroll");
  const [selectedMonth, setSelectedMonth] = useState("Tháng 5/2024");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [rows, setRows] = useState<PayrollRow[]>([
    {
      id: "p1",
      name: "Minh Tùng",
      isManager: true,
      roleTitle: "Thợ chính",
      baseSalary: 8000000n,
      allowance: 1000000n,
      commPercent: 10,
      eligibleRevenue: 10490000n,
      commAmount: 1049000n,
      bonus: 0n,
      deduction: 0n,
      totalSalary: 10049000n,
      status: "published",
    },
    {
      id: "p2",
      name: "Hoàng Nam",
      roleTitle: "Thợ chính",
      baseSalary: 8000000n,
      allowance: 800000n,
      commPercent: 10,
      eligibleRevenue: 8730000n,
      commAmount: 873000n,
      bonus: 0n,
      deduction: 0n,
      totalSalary: 9673000n,
      status: "published",
    },
    {
      id: "p3",
      name: "Quang Huy",
      roleTitle: "Thợ phụ",
      baseSalary: 6000000n,
      allowance: 500000n,
      commPercent: 8,
      eligibleRevenue: 6290000n,
      commAmount: 503200n,
      bonus: 0n,
      deduction: 0n,
      totalSalary: 7003200n,
      status: "published",
    },
    {
      id: "p4",
      name: "Đức Anh",
      roleTitle: "Thợ phụ",
      baseSalary: 6000000n,
      allowance: 500000n,
      commPercent: 8,
      eligibleRevenue: 5340000n,
      commAmount: 427200n,
      bonus: 0n,
      deduction: 0n,
      totalSalary: 6927200n,
      status: "published",
    },
    {
      id: "p5",
      name: "Tuấn Kiệt",
      roleTitle: "Thực tập",
      baseSalary: 4000000n,
      allowance: 300000n,
      commPercent: 5,
      eligibleRevenue: 4050000n,
      commAmount: 202500n,
      bonus: 0n,
      deduction: 0n,
      totalSalary: 4502500n,
      status: "published",
    },
  ]);

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

  const handleGeneratePayroll = () => {
    // Generate fresh payroll for selected month
    const updated = rows.map((r) => {
      const comm = calculateCommission(r.eligibleRevenue, r.commPercent);
      const total = calculateTotalSalary(r.baseSalary, r.allowance, comm, r.bonus, r.deduction);
      return {
        ...r,
        commAmount: comm,
        totalSalary: total,
        status: "draft" as const,
      };
    });
    setRows(updated);
    setShowCreateModal(false);
    triggerToast(`Đã tạo bảng lương nháp cho ${selectedMonth}!`);
  };

  const handleStatusChange = (newStatus: "locked" | "published" | "paid") => {
    setRows((prev) => prev.map((r) => ({ ...r, status: newStatus })));
    const statusText =
      newStatus === "locked"
        ? "Khóa bảng lương"
        : newStatus === "published"
        ? "Công bố bảng lương cho nhân viên"
        : "Đánh dấu đã thanh toán";
    triggerToast(`Đã ${statusText} thành công!`);
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

  const currentStatus = rows[0]?.status || "published";

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
          </div>
          <button
            onClick={() => {
              const months = ["Tháng 5/2024", "Tháng 6/2024", "Tháng 7/2024"];
              const nextIndex = (months.indexOf(selectedMonth) + 1) % months.length;
              setSelectedMonth(months[nextIndex]);
            }}
            className="bg-white border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3.5 py-2 text-xs font-semibold text-[#171717] flex items-center space-x-1.5 active:scale-95"
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
                  <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium">TB % doanh thu</div>
                  <div className="text-sm font-bold text-[#171717]">9.2%</div>
                </div>
              </div>
            </div>

            {/* Action Bar for Status & Creation */}
            <div className="flex flex-wrap gap-2 justify-between items-center bg-white p-2.5 rounded-[12px] border border-[rgba(23,23,23,0.12)]">
              <div className="flex items-center space-x-1">
                {currentStatus === "draft" && (
                  <button
                    onClick={() => handleStatusChange("locked")}
                    className="btn-outline text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1 border-amber-600 text-amber-700"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Khóa bảng lương</span>
                  </button>
                )}
                {currentStatus === "locked" && (
                  <button
                    onClick={() => handleStatusChange("published")}
                    className="btn-primary text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Công bố cho nhân viên</span>
                  </button>
                )}
                {currentStatus === "published" && (
                  <button
                    onClick={() => handleStatusChange("paid")}
                    className="btn-outline text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1 border-blue-600 text-blue-700"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Đánh dấu đã thanh toán</span>
                  </button>
                )}
                {currentStatus === "paid" && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    ✓ ĐÃ THANH TOÁN
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
                  className="btn-primary text-[11px] px-2.5 py-1.5 h-8 font-semibold rounded-[8px] flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo bảng lương</span>
                </button>
              </div>
            </div>

            {/* Section: BẢNG LƯƠNG NHÂN VIÊN */}
            <div className="space-y-2.5">
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
                            {r.status === "published" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                                Đã công bố
                              </span>
                            )}
                            {r.status === "paid" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">
                                Đã thanh toán
                              </span>
                            )}
                            {r.status === "locked" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 whitespace-nowrap">
                                Đã khóa
                              </span>
                            )}
                            {r.status === "draft" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 whitespace-nowrap">
                                Bản nháp
                              </span>
                            )}
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
                LỊCH SỬ BẢNG LƯƠNG
              </h3>

              <div className="space-y-2">
                <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[12px] p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-[#741F2C]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#171717] text-sm">Tháng 5/2024</div>
                      <div className="text-[11px] text-[rgba(23,23,23,0.5)]">Tạo lúc 08:30 20/05/2024 bởi Admin</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-right">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 block mb-0.5">
                        Đã công bố
                      </span>
                      <div className="font-bold text-sm text-[#171717]">{formatVND(52450000n)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[rgba(23,23,23,0.4)]" />
                  </div>
                </div>

                <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[12px] p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-800">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#171717] text-sm">Tháng 4/2024</div>
                      <div className="text-[11px] text-[rgba(23,23,23,0.5)]">Đã thanh toán lúc 09:15 05/05/2024</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-right">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 block mb-0.5">
                        Đã thanh toán
                      </span>
                      <div className="font-bold text-sm text-[#171717]">{formatVND(48320000n)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[rgba(23,23,23,0.4)]" />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: CÀI ĐẶT LƯƠNG */
          <div className="space-y-3">
            <h3 className="font-bold text-[#741F2C] text-xs tracking-wider uppercase">
              CẤU HÌNH LƯƠNG & HOA HỒNG NHÂN VIÊN
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
                        className="w-full bg-[#F7F3EC] border border-[rgba(23,23,23,0.14)] rounded-[8px] px-2.5 py-1.5 font-bold"
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
                        className="w-full bg-[#F7F3EC] border border-[rgba(23,23,23,0.14)] rounded-[8px] px-2.5 py-1.5 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => triggerToast("Đã lưu cấu hình lương thành công!")}
                className="w-full bg-[#741F2C] text-white py-3 rounded-[10px] font-bold text-sm shadow-sm"
              >
                LƯU TOÀN BỘ CẤU HÌNH LƯƠNG
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
              <h3 className="font-bold text-lg text-[#171717]">Tạo bảng lương mới</h3>
            </div>

            <p className="text-xs text-[rgba(23,23,23,0.6)]">
              Hệ thống sẽ tự động tổng hợp doanh thu của từng thợ trong <strong>{selectedMonth}</strong> và tính hoa hồng theo tỷ lệ cài đặt.
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
                className="flex-1 btn-primary py-2.5 text-xs font-bold rounded-[10px]"
              >
                Xác nhận tạo
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}
