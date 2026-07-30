"use client";

import React from "react";
import { CircleDollarSign, Banknote, CreditCard, Receipt } from "lucide-react";
import { formatVND } from "@/lib/money";

interface KpiCardsRowProps {
  totalRevenue?: bigint | number;
  cashTotal?: bigint | number;
  bankTotal?: bigint | number;
  transactionCount?: number;
  revenueGrowthPercent?: number;
}

export function KpiCardsRow({
  totalRevenue = 12560000n,
  cashTotal = 4350000n,
  bankTotal = 8210000n,
  transactionCount = 48,
  revenueGrowthPercent = 18.6,
}: KpiCardsRowProps) {
  const totalNum = Number(totalRevenue) || 1;
  const cashPercent = ((Number(cashTotal) / totalNum) * 100).toFixed(1);
  const bankPercent = ((Number(bankTotal) / totalNum) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {/* 1. Total Revenue Card (Burgundy background) */}
      <div className="bg-[#741F2C] text-white p-3 sm:p-3.5 rounded-[14px] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-[11px] font-medium text-white/90 leading-tight">
            Tổng doanh thu
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <CircleDollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-sm sm:text-lg font-extrabold tracking-tight leading-tight truncate" title={formatVND(totalRevenue)}>
            {formatVND(totalRevenue)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-white/80 font-medium mt-0.5">
            ↑ {revenueGrowthPercent}% hôm qua
          </div>
        </div>
      </div>

      {/* 2. Cash Total Card */}
      <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3 sm:p-3.5 rounded-[14px] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-[11px] font-medium text-[rgba(23,23,23,0.7)]">
            Tiền mặt
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[rgba(23,23,23,0.04)] flex items-center justify-center flex-shrink-0">
            <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#171717]" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-xs sm:text-base font-bold text-[#171717] tracking-tight truncate" title={formatVND(cashTotal)}>
            {formatVND(cashTotal)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-[rgba(23,23,23,0.6)] font-medium mt-0.5">
            {cashPercent}% tổng DT
          </div>
        </div>
      </div>

      {/* 3. Bank Transfer Card */}
      <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3 sm:p-3.5 rounded-[14px] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-[11px] font-medium text-[rgba(23,23,23,0.7)]">
            Chuyển khoản
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[rgba(23,23,23,0.04)] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#171717]" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-xs sm:text-base font-bold text-[#171717] tracking-tight truncate" title={formatVND(bankTotal)}>
            {formatVND(bankTotal)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-[rgba(23,23,23,0.6)] font-medium mt-0.5">
            {bankPercent}% tổng DT
          </div>
        </div>
      </div>

      {/* 4. Transaction Count Card */}
      <div className="bg-white border border-[rgba(23,23,23,0.12)] p-3 sm:p-3.5 rounded-[14px] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-[11px] font-medium text-[rgba(23,23,23,0.7)]">
            Số lượt làm
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[rgba(23,23,23,0.04)] flex items-center justify-center flex-shrink-0">
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#171717]" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-sm sm:text-lg font-bold text-[#171717] tracking-tight">
            {transactionCount}
          </div>
          <div className="text-[9px] sm:text-[10px] text-[rgba(23,23,23,0.6)] font-medium mt-0.5">
            Giao dịch
          </div>
        </div>
      </div>
    </div>
  );
}
