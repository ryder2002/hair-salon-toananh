"use client";

import React, { useState } from "react";
import { Store, CalendarCheck } from "lucide-react";

interface DayClosingCardProps {
  isClosed?: boolean;
  onCloseDay?: () => void;
}

export function DayClosingCard({ isClosed = false, onCloseDay }: DayClosingCardProps) {
  const [closing, setClosing] = useState(false);

  const handleAction = async () => {
    setClosing(true);
    if (onCloseDay) await onCloseDay();
    setTimeout(() => setClosing(false), 500);
  };

  return (
    <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between">
      {/* Left Icon & Text */}
      <div className="flex items-center space-x-3">
        <div className="w-11 h-11 rounded-full bg-[#741F2C] text-white flex items-center justify-center shadow-sm">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
            Trạng thái ngày
          </div>
          <div
            className={`text-lg font-bold ${
              isClosed ? "text-[rgba(23,23,23,0.6)]" : "text-[#741F2C]"
            }`}
          >
            {isClosed ? "Đã chốt ngày" : "Đang mở"}
          </div>
        </div>
      </div>

      {/* Right Action Button */}
      <button
        onClick={handleAction}
        disabled={isClosed || closing}
        className={`btn-primary px-5 py-2.5 flex items-center space-x-2 text-sm font-semibold rounded-[10px] ${
          isClosed ? "opacity-50 cursor-not-allowed bg-[rgba(23,23,23,0.4)]" : "bg-[#741F2C]"
        }`}
      >
        <CalendarCheck className="w-4 h-4" />
        <span>{isClosed ? "Đã chốt" : closing ? "Đang chốt..." : "Chốt ngày"}</span>
      </button>
    </div>
  );
}
