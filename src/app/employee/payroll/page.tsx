"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Calendar, CheckCircle2 } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { formatVND } from "@/lib/money";
import { PayrollMonthPickerModal } from "@/components/ui/PayrollMonthPickerModal";
import { getCurrentVietnamMonthStr } from "@/lib/dates";
import { loadAuthSession, type UserSession } from "@/lib/auth";
import { subscribeRealtime } from "@/lib/realtime";
import { Lock, ShieldAlert, Loader2 } from "lucide-react";
import { fetchMyPayrollSlipAction } from "@/server/actions/payroll";
import { withClientCache, invalidateClientCache } from "@/lib/cache";

export default function EmployeePayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentVietnamMonthStr());
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [mySlip, setMySlip] = useState<any>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayrollForMonth = async (monthStr: string) => {
    setIsLoading(true);
    try {
      // Try Database server action first
      const dbSlip = await withClientCache(`emp-payroll-${monthStr}`, () => fetchMyPayrollSlipAction(monthStr), 60000);
      if (dbSlip) {
        setIsPublished(dbSlip.status === "published" || dbSlip.status === "paid");
        setMySlip(dbSlip as any);
        return;
      }

      setIsPublished(false);
      setMySlip(null);
    } catch (err) {
      console.error("Error loading employee payroll slip:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void loadAuthSession().then((current) => {
      if (cancelled) return;
      setSession(current);
      void loadPayrollForMonth(selectedMonth);
    });
    const unsubscribe = subscribeRealtime(() => {
      invalidateClientCache(`emp-payroll-${selectedMonth}`);
      void loadPayrollForMonth(selectedMonth);
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [selectedMonth]);

  const empName = session?.fullName || mySlip?.name || "Nhân viên";
  const jobTitle = mySlip?.roleTitle || "Thợ cắt tóc";
  const isPaid = mySlip?.isPaid || false;
  const totalSalary = mySlip ? BigInt(mySlip.totalSalary) : 0n;

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="Bảng lương của tôi" subtitle="The Gentlemen Barbershop" unreadCount={0} />

      <main className="px-4 pt-3 space-y-4">
        {/* Month Selector */}
        <div className="bg-white border border-[rgba(23,23,23,0.14)] rounded-[12px] p-3 flex justify-between items-center text-xs font-bold text-[#171717]">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#741F2C]" />
            <span>Kỳ lương: <strong className="text-[#741F2C]">{selectedMonth}</strong></span>
          </div>
          <button
            onClick={() => setShowMonthPickerModal(true)}
            className="px-2.5 py-1 rounded-md bg-[#741F2C] text-white text-[10px] font-bold active:scale-95 transition-transform"
          >
            Đổi kỳ
          </button>
        </div>

        {!isPublished ? (
          /* Locked / Not Published Yet Card */
          <div className="bg-white border border-amber-200 rounded-[16px] p-8 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-[#171717]">Bảng lương chưa được công bố</h3>
            <p className="text-xs text-[rgba(23,23,23,0.6)] leading-relaxed">
              Bảng lương kỳ <strong className="text-[#741F2C]">{selectedMonth}</strong> đang được Quản lý tổng hợp. Thông tin lương của bạn sẽ tự động hiển thị sau khi Admin nhấn công bố.
            </p>
          </div>
        ) : !mySlip ? (
          /* Empty / No Record for this employee */
          <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[16px] p-8 text-center space-y-3 shadow-sm">
            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="font-bold text-base text-[#171717]">Chưa có dữ liệu lương kỳ này</h3>
            <p className="text-xs text-[rgba(23,23,23,0.6)]">
              Tài khoản <strong className="text-[#741F2C]">{empName}</strong> chưa có dữ liệu chấm công/doanh thu trong kỳ lương này.
            </p>
          </div>
        ) : (
          <>
            {/* Total Highlight Card */}
            <div className="bg-[#741F2C] text-white p-5 rounded-[16px] shadow-md space-y-2 text-center">
              <div className="flex items-center justify-between text-xs text-white/80 font-medium">
                <span>HỌ VÀ TÊN: {empName}</span>
                {isPaid ? (
                  <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold">✓ ĐÃ THANH TOÁN</span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold">✓ ĐÃ CÔNG BỐ</span>
                )}
              </div>
              <div className="text-xs text-white/80 font-medium uppercase tracking-wider pt-1">
                TỔNG LƯƠNG THỰC NHẬN
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {formatVND(totalSalary)}
              </div>
            </div>

            {/* Detailed Breakdown Card */}
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-[#741F2C] text-xs uppercase tracking-wider border-b border-[rgba(23,23,23,0.1)] pb-2">
                CHI TIẾT THU NHẬP CÁ NHÂN
              </h3>

              <div className="flex justify-between items-center py-1">
                <span className="text-[rgba(23,23,23,0.7)] font-medium">Lương cứng cố định:</span>
                <strong className="font-bold text-[#171717]">{formatVND(BigInt(mySlip.baseSalary || 0))}</strong>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[rgba(23,23,23,0.7)] font-medium">Phụ cấp công việc:</span>
                <strong className="font-bold text-[#171717]">{formatVND(BigInt(mySlip.allowance || 0))}</strong>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[rgba(23,23,23,0.7)] font-medium">Doanh thu cá nhân trong tháng:</span>
                <strong className="font-bold text-[#171717]">{formatVND(BigInt(mySlip.eligibleRevenue || 0))}</strong>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[rgba(23,23,23,0.7)] font-medium">Hoa hồng ({mySlip.commPercent || 10}%):</span>
                <strong className="font-bold text-[#741F2C]">{formatVND(BigInt(mySlip.commAmount || 0))}</strong>
              </div>

              <div className="border-t border-[rgba(23,23,23,0.12)] pt-2.5 flex justify-between items-center text-sm font-extrabold text-[#741F2C]">
                <span>TỔNG CỘNG LƯƠNG:</span>
                <span>{formatVND(BigInt(mySlip.totalSalary || 0))}</span>
              </div>
            </div>
          </>
        )}
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
