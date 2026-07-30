"use client";

import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { getCurrentVietnamMonthStr } from "@/lib/dates";

interface PayrollMonthPickerModalProps {
  currentMonthStr: string; // e.g. "Tháng 07/2026" or "Tháng 5/2024"
  onClose: () => void;
  onSelectMonth: (monthStr: string) => void;
}

export function PayrollMonthPickerModal({
  currentMonthStr,
  onClose,
  onSelectMonth,
}: PayrollMonthPickerModalProps) {
  // Parse year and month from currentMonthStr or default to current year
  const match = currentMonthStr.match(/Tháng\s+(\d{1,2})\/(\d{4})/i);
  const initialMonth = match ? parseInt(match[1], 10) : new Date().getMonth() + 1;
  const initialYear = match ? parseInt(match[2], 10) : new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(initialMonth);

  const months = [
    { num: 1, label: "Tháng 1" },
    { num: 2, label: "Tháng 2" },
    { num: 3, label: "Tháng 3" },
    { num: 4, label: "Tháng 4" },
    { num: 5, label: "Tháng 5" },
    { num: 6, label: "Tháng 6" },
    { num: 7, label: "Tháng 7" },
    { num: 8, label: "Tháng 8" },
    { num: 9, label: "Tháng 9" },
    { num: 10, label: "Tháng 10" },
    { num: 11, label: "Tháng 11" },
    { num: 12, label: "Tháng 12" },
  ];

  const handleConfirm = () => {
    const formattedMonth = selectedMonthNum < 10 ? `0${selectedMonthNum}` : `${selectedMonthNum}`;
    const resultStr = `Tháng ${formattedMonth}/${selectedYear}`;
    onSelectMonth(resultStr);
    onClose();
  };

  const handleSetCurrentVietnamMonth = () => {
    const currentVN = getCurrentVietnamMonthStr();
    onSelectMonth(currentVN);
    onClose();
  };

  const handleNativeMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // e.g. "2026-07"
    if (!val) return;
    const [y, m] = val.split("-");
    if (y && m) {
      onSelectMonth(`Tháng ${m}/${y}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(23,23,23,0.1)] pb-3">
          <div className="flex items-center space-x-2 text-[#741F2C]">
            <Calendar className="w-5 h-5" />
            <h3 className="font-bold text-base text-[#171717]">Chọn kỳ lương (Lịch Việt Nam)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center justify-between bg-[#F7F3EC] p-2 rounded-[10px]">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1.5 rounded-md hover:bg-white text-[#741F2C]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-base text-[#171717]">Năm {selectedYear}</span>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1.5 rounded-md hover:bg-white text-[#741F2C]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((m) => {
            const isSelected = m.num === selectedMonthNum;
            return (
              <button
                key={m.num}
                type="button"
                onClick={() => setSelectedMonthNum(m.num)}
                className={`py-2.5 rounded-[10px] text-xs font-bold transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-[#741F2C] text-white shadow-md scale-105"
                    : "bg-white border border-[rgba(23,23,23,0.14)] text-[#171717] hover:bg-[rgba(23,23,23,0.04)]"
                }`}
              >
                <span>{m.label}</span>
                {isSelected && <Check className="w-3 h-3 mt-0.5 text-white" />}
              </button>
            );
          })}
        </div>

        {/* Native Month Input fallback & Jump to Current VN Month */}
        <div className="pt-2 space-y-2 border-t border-[rgba(23,23,23,0.08)]">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[rgba(23,23,23,0.6)] font-medium">Hoặc chọn nhanh theo tháng:</span>
            <input
              type="month"
              onChange={handleNativeMonthInput}
              className="bg-[#F7F3EC] border border-[rgba(23,23,23,0.14)] rounded-[8px] px-2 py-1 text-xs text-[#171717] font-semibold focus:outline-none focus:border-[#741F2C]"
            />
          </div>

          <button
            type="button"
            onClick={handleSetCurrentVietnamMonth}
            className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] text-xs font-bold flex items-center justify-center space-x-1 hover:bg-emerald-100"
          >
            <span>★ Về Tháng Hiện Tại Việt Nam ({getCurrentVietnamMonthStr()})</span>
          </button>
        </div>

        {/* Confirm Buttons */}
        <div className="flex space-x-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[rgba(23,23,23,0.2)] py-2.5 text-xs font-bold rounded-[10px] text-[#171717]"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 text-xs font-bold rounded-[10px] bg-[#741F2C] text-white shadow-md hover:bg-[#5e1923]"
          >
            Xác nhận chọn
          </button>
        </div>
      </div>
    </div>
  );
}
