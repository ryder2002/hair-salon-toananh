"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, CheckCircle2, WifiOff } from "lucide-react";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";
import { formatVND, parseVNDInput } from "@/lib/money";
import { getVietnamBusinessDate, formatTimeDisplay } from "@/lib/dates";
import { saveOfflineRevenue } from "@/lib/offline/idb";
import { addAuditLog } from "@/lib/audit-log";
import { getAuthSession } from "@/lib/auth";

import { addRevenueTransaction } from "@/lib/revenue-store";
import { createRevenueEntryAction } from "@/server/actions/revenue";
import { getCurrentBusinessDateAction, isDayClosedAction } from "@/server/actions/day-closing";

export default function RecordRevenuePage() {
  const router = useRouter();
  const [rawAmount, setRawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [serviceName, setServiceName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [businessDate, setBusinessDate] = useState<string>("");
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    async function initDate() {
      try {
        const date = await getCurrentBusinessDateAction();
        setBusinessDate(date);
        const closed = await isDayClosedAction(date);
        setIsClosed(closed);
      } catch (e) {
        setBusinessDate(getVietnamBusinessDate());
      }
    }
    initDate();
  }, []);

  const numericAmount = parseVNDInput(rawAmount);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRawAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0n || isClosed) return;
    setErrorMsg("");

    const currentSession = getAuthSession();
    const actorName = currentSession?.fullName || "Nhân viên";
    const targetDate = businessDate || getVietnamBusinessDate();

    setLoading(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      await createRevenueEntryAction({
        employee_id: currentSession?.id,
        amount: Number(numericAmount),
        payment_method: paymentMethod,
        service_name: serviceName || "Dịch vụ tóc",
        note,
        business_date: targetDate,
        idempotency_key: idempotencyKey,
      });

      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/employee"), 1000);
    } catch (err: any) {
      console.error("Database revenue entry sync:", err);
      setErrorMsg("Không thể lưu đơn hàng vào CSDL. Vui lòng kiểm tra lại kết nối.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full text-[#741F2C] hover:bg-[rgba(23,23,23,0.05)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-[#171717] tracking-tight">
            Ghi doanh thu
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="px-4 pt-4">
        {success ? (
          <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-8 text-center space-y-3 mt-6 shadow-sm">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <h2 className="text-xl font-bold text-[#171717]">Ghi nhận thành công!</h2>
            <p className="text-sm text-[rgba(23,23,23,0.6)]">
              Doanh thu <strong className="text-[#741F2C]">{formatVND(numericAmount)}</strong> đã được lưu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[10px] text-xs font-semibold text-center animate-bounce">
                ⚠️ {errorMsg}
              </div>
            )}
            {/* 1. Big Amount Input */}
            <div className="bg-white border border-[rgba(23,23,23,0.14)] rounded-[14px] p-4 shadow-sm text-center">
              <label className="block text-xs font-semibold text-[rgba(23,23,23,0.6)] uppercase tracking-wider mb-2">
                SỐ TIỀN THU (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={rawAmount ? formatVND(numericAmount).replace(" đ", "") : ""}
                onChange={handleAmountChange}
                placeholder="0"
                autoFocus
                className="w-full text-center text-3xl font-extrabold text-[#741F2C] placeholder-gray-300 focus:outline-none bg-transparent"
              />
              <div className="text-xs font-semibold text-[#741F2C] mt-1">
                {numericAmount > 0n ? formatVND(numericAmount) : "Nhập số tiền..."}
              </div>
            </div>

            {/* 2. Payment Method Segmented Control */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-[12px] border border-[rgba(23,23,23,0.14)]">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`py-3 rounded-[10px] font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${
                    paymentMethod === "cash"
                      ? "bg-[#741F2C] text-white shadow-sm"
                      : "text-[#171717] hover:bg-[rgba(23,23,23,0.04)]"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tiền mặt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`py-3 rounded-[10px] font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${
                    paymentMethod === "bank_transfer"
                      ? "bg-[#741F2C] text-white shadow-sm"
                      : "text-[#171717] hover:bg-[rgba(23,23,23,0.04)]"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Chuyển khoản</span>
                </button>
              </div>
            </div>

            {/* 3. Service Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                Dịch vụ (Tùy chọn)
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Ví dụ: Cắt tóc + Gội đầu"
                className="w-full bg-white border border-[rgba(23,23,23,0.14)] rounded-[12px] px-3.5 py-3 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
              />
            </div>

            {/* 4. Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                Ghi chú (Tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú thêm nếu có..."
                rows={2}
                className="w-full bg-white border border-[rgba(23,23,23,0.14)] rounded-[12px] px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
              />
            </div>

            {/* Date & Time preview info */}
            <div className="text-xs text-[rgba(23,23,23,0.5)] font-medium flex justify-between px-1">
              <span>Ngày: {getVietnamBusinessDate()}</span>
              <span>Giờ: {formatTimeDisplay(new Date())}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={numericAmount <= 0n || loading}
              className={`w-full bg-[#741F2C] text-white py-4 rounded-[12px] font-bold text-base shadow-md active:scale-98 transition-transform ${
                numericAmount <= 0n ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "ĐANG LƯU..." : "LƯU DOANH THU"}
            </button>
          </form>
        )}
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
