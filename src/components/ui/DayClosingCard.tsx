"use client";

import React, { useState, useEffect } from "react";
import { Store, CalendarCheck, RotateCcw, AlertTriangle, X } from "lucide-react";
import { getDayClosingState, setDayClosingState, subscribeDayClosing } from "@/lib/day-closing-store";
import { addAuditLog } from "@/lib/audit-log";

interface DayClosingCardProps {
  onCloseDay?: () => void;
}

export function DayClosingCard({ onCloseDay }: DayClosingCardProps) {
  const [closed, setClosed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentState = getDayClosingState();
    setClosed(currentState.isClosed);

    const unsubscribe = subscribeDayClosing((state) => {
      setClosed(state.isClosed);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleDay = () => {
    setLoading(true);
    const nextClosedState = !closed;
    setDayClosingState(nextClosedState);

    addAuditLog({
      action: nextClosedState ? "DAY_CLOSED" : "DAY_REOPENED",
      actorName: "Admin Manager",
      actorRole: "admin",
      details: nextClosedState
        ? "Đã chốt ngày doanh thu tại trang Tổng quan"
        : "Đã mở lại ngày làm việc tại trang Tổng quan",
    });

    if (onCloseDay) onCloseDay();

    setTimeout(() => {
      setLoading(false);
      setShowConfirmModal(false);
    }, 400);
  };

  return (
    <>
      <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between">
        {/* Left Icon & Text */}
        <div className="flex items-center space-x-3">
          <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center shadow-sm transition-colors ${
            closed ? "bg-gray-600" : "bg-[#741F2C]"
          }`}>
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
              Trạng thái ngày làm việc
            </div>
            <div
              className={`text-base font-bold ${
                closed ? "text-amber-800" : "text-emerald-700"
              }`}
            >
              {closed ? "🔒 Đã chốt ngày" : "• Đang mở bán"}
            </div>
          </div>
        </div>

        {/* Right Action Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          className={`px-4 py-2.5 flex items-center space-x-1.5 text-xs font-bold rounded-[10px] shadow-sm active:scale-95 transition-all text-white ${
            closed ? "bg-amber-700 hover:bg-amber-800" : "bg-[#741F2C] hover:bg-[#5e1923]"
          }`}
        >
          {closed ? <RotateCcw className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}
          <span>{closed ? "Mở lại ngày" : "Chốt ngày"}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#741F2C]">
              <CalendarCheck className="w-6 h-6" />
              <h3 className="font-bold text-base text-[#171717]">
                {closed ? "Xác nhận MỞ LẠI ngày làm việc" : "Xác nhận CHỐT NGÀY doanh thu"}
              </h3>
            </div>

            <p className="text-xs text-[rgba(23,23,23,0.7)] leading-relaxed">
              {closed
                ? "Mở lại ngày làm việc sẽ cho phép nhân viên tiếp tục ghi thêm và chỉnh sửa doanh thu hôm nay."
                : "Sau khi chốt ngày, nhân viên sẽ không thể tự thay đổi hoặc tạo thêm đơn hàng cho ngày hôm nay."}
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-[rgba(23,23,23,0.2)] py-2.5 text-xs font-bold rounded-[10px] text-[#171717]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleToggleDay}
                className="flex-1 py-2.5 text-xs font-bold rounded-[10px] bg-[#741F2C] text-white shadow-md hover:bg-[#5e1923]"
              >
                {loading ? "Đang xử lý..." : closed ? "Xác nhận Mở lại" : "Xác nhận Chốt ngày"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
