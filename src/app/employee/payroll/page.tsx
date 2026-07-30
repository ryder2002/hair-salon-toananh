"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Calendar, CheckCircle2 } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { formatVND } from "@/lib/money";
import { PayrollMonthPickerModal } from "@/components/ui/PayrollMonthPickerModal";
import { getCurrentVietnamMonthStr } from "@/lib/dates";
import { getMonthPayroll, StoredPayrollRow } from "@/lib/payroll-store";

export default function EmployeePayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentVietnamMonthStr());
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [totalSalary, setTotalSalary] = useState(10549000n);

  useEffect(() => {
    const data = getMonthPayroll(selectedMonth);
    const empRow = data.rows.find((r: StoredPayrollRow) => r.name.includes("Minh") || r.id === "p1") || data.rows[0];
    if (empRow) {
      setIsPaid(empRow.isPaid || data.globalStatus === "paid");
      setTotalSalary(BigInt(empRow.totalSalary || "10549000"));
    }
  }, [selectedMonth]);

  const payrollSlip = {
    month: selectedMonth,
    status: isPaid ? "paid" : "published",
    employeeName: "Minh Quân",
    jobTitle: "Quản lý tiệm",
    baseSalary: 8000000n,
    allowance: 1000000n,
    eligibleRevenue: 10490000n,
    commissionRate: 10.0,
    commissionAmount: 1049000n,
    bonus: 500000n,
    deduction: 0n,
    totalSalary: totalSalary,
    publishedAt: "20/05/2024 08:30",
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="Bảng lương của tôi" subtitle="The Gentlemen Barbershop" unreadCount={1} />

      <main className="px-4 pt-3 space-y-4">
        {/* Month Selector */}
        <div className="bg-white border border-[rgba(23,23,23,0.14)] rounded-[12px] p-3 flex justify-between items-center text-xs font-bold text-[#171717]">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#741F2C]" />
            <span>Kỳ lương: <strong className="text-[#741F2C]">{payrollSlip.month}</strong></span>
          </div>
          <button
            onClick={() => setShowMonthPickerModal(true)}
            className="px-2.5 py-1 rounded-md bg-[#741F2C] text-white text-[10px] font-bold active:scale-95 transition-transform"
          >
            Đổi kỳ
          </button>
        </div>

        {/* Total Highlight Card */}
        <div className="bg-[#741F2C] text-white p-5 rounded-[16px] shadow-md space-y-2 text-center">
          <div className="text-xs text-white/80 font-medium uppercase tracking-wider">
            TỔNG LƯƠNG THỰC NHẬN
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {formatVND(payrollSlip.totalSalary)}
          </div>
          <div className="text-[11px] text-white/70">
            Công bố lúc: {payrollSlip.publishedAt}
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-[#741F2C] text-xs uppercase tracking-wider border-b border-[rgba(23,23,23,0.1)] pb-2">
            CHI TIẾT THU NHẬP
          </h3>

          <div className="flex justify-between items-center py-1">
            <span className="text-[rgba(23,23,23,0.7)] font-medium">Lương cứng cố định:</span>
            <strong className="font-bold text-[#171717]">{formatVND(payrollSlip.baseSalary)}</strong>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-[rgba(23,23,23,0.7)] font-medium">Phụ cấp công việc:</span>
            <strong className="font-bold text-[#171717]">{formatVND(payrollSlip.allowance)}</strong>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-[rgba(23,23,23,0.7)] font-medium">Doanh thu cá nhân trong tháng:</span>
            <strong className="font-bold text-[#171717]">{formatVND(payrollSlip.eligibleRevenue)}</strong>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-[rgba(23,23,23,0.7)] font-medium">Hoa hồng ({payrollSlip.commissionRate}%):</span>
            <strong className="font-bold text-[#741F2C]">{formatVND(payrollSlip.commissionAmount)}</strong>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-[rgba(23,23,23,0.7)] font-medium">Tiền thưởng khác (+):</span>
            <strong className="font-bold text-emerald-700">{formatVND(payrollSlip.bonus)}</strong>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-[rgba(23,23,23,0.7)] font-medium">Khấu trừ (-):</span>
            <strong className="font-bold text-red-600">{formatVND(payrollSlip.deduction)}</strong>
          </div>

          <div className="border-t border-[rgba(23,23,23,0.12)] pt-2.5 flex justify-between items-center text-sm font-extrabold text-[#741F2C]">
            <span>TỔNG CỘNG:</span>
            <span>{formatVND(payrollSlip.totalSalary)}</span>
          </div>
        </div>
      </main>

      {/* Month Picker Calendar Modal */}
      {showMonthPickerModal && (
        <PayrollMonthPickerModal
          currentMonthStr={selectedMonth}
          onClose={() => setShowMonthPickerModal(false)}
          onSelectMonth={(m) => setSelectedMonth(m)}
        />
      )}

      <EmployeeBottomNav />
    </div>
  );
}
