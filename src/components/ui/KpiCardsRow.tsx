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
    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none snap-x">
      {/* 1. Total Revenue Card (Burgundy background) */}
      <div className="min-w-[170px] flex-1 bg-[#741F2C] text-white p-3.5 rounded-[14px] shadow-sm snap-start flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-medium text-white/90 leading-tight">
            Tổng doanh thu hôm nay
          </span>
          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
            <CircleDollarSign className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-lg font-bold tracking-tight leading-tight">
            {formatVND(totalRevenue)}
          </div>
          <div className="text-[10px] text-white/80 font-medium mt-1 flex items-center">
            <span>↑ {revenueGrowthPercent}% so với hôm qua</span>
          </div>
        </div>
      </div>

      {/* 2. Cash Total Card */}
      <div className="min-w-[130px] flex-1 bg-white border border-[rgba(23,23,23,0.12)] p-3.5 rounded-[14px] shadow-sm snap-start flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-medium text-[rgba(23,23,23,0.7)]">
            Tiền mặt
          </span>
          <div className="w-7 h-7 rounded-full bg-[rgba(23,23,23,0.04)] flex items-center justify-center">
            <Banknote className="w-4 h-4 text-[#171717]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-base font-bold text-[#171717] tracking-tight">
            {formatVND(cashTotal)}
          </div>
          <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium mt-1">
            {cashPercent}%
          </div>
        </div>
      </div>

      {/* 3. Bank Transfer Card */}
      <div className="min-w-[130px] flex-1 bg-white border border-[rgba(23,23,23,0.12)] p-3.5 rounded-[14px] shadow-sm snap-start flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-medium text-[rgba(23,23,23,0.7)]">
            Chuyển khoản
          </span>
          <div className="w-7 h-7 rounded-full bg-[rgba(23,23,23,0.04)] flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[#171717]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-base font-bold text-[#171717] tracking-tight">
            {formatVND(bankTotal)}
          </div>
          <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium mt-1">
            {bankPercent}%
          </div>
        </div>
      </div>

      {/* 4. Transaction Count Card */}
      <div className="min-w-[120px] flex-1 bg-white border border-[rgba(23,23,23,0.12)] p-3.5 rounded-[14px] shadow-sm snap-start flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-medium text-[rgba(23,23,23,0.7)]">
            Số giao dịch
          </span>
          <div className="w-7 h-7 rounded-full bg-[rgba(23,23,23,0.04)] flex items-center justify-center">
            <Receipt className="w-4 h-4 text-[#171717]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-lg font-bold text-[#171717] tracking-tight">
            {transactionCount}
          </div>
          <div className="text-[10px] text-[rgba(23,23,23,0.6)] font-medium mt-1">
            Giao dịch
          </div>
        </div>
      </div>
    </div>
  );
}
