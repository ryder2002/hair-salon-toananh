"use client";

import React from "react";
import { Banknote, CreditCard, ChevronRight } from "lucide-react";
import { BarberIcon } from "@/components/ui/BarberIcon";
import { formatVND } from "@/lib/money";

export interface TransactionItem {
  id: string;
  staffName: string;
  avatarType?: "scissors" | "mustache" | "comb" | "pole";
  serviceName: string;
  amount: number | bigint;
  paymentMethod: "cash" | "bank_transfer";
  time: string;
  status?: "recorded" | "voided";
}

interface RecentTransactionsListProps {
  transactions?: TransactionItem[];
  showStatusBadge?: boolean;
}

export function RecentTransactionsList({
  transactions = [
    {
      id: "t1",
      staffName: "Minh Quân",
      avatarType: "pole",
      serviceName: "Cắt tóc + Gội đầu",
      amount: 250000n,
      paymentMethod: "cash",
      time: "09:35",
      status: "recorded",
    },
    {
      id: "t2",
      staffName: "Hoàng Long",
      avatarType: "scissors",
      serviceName: "Cạo mặt",
      amount: 120000n,
      paymentMethod: "bank_transfer",
      time: "09:12",
      status: "recorded",
    },
    {
      id: "t3",
      staffName: "Đức Anh",
      avatarType: "mustache",
      serviceName: "Cắt tóc",
      amount: 180000n,
      paymentMethod: "cash",
      time: "08:47",
      status: "recorded",
    },
  ],
  showStatusBadge = false,
}: RecentTransactionsListProps) {
  return (
    <div className="space-y-2.5">
      {transactions.map((t) => {
        const isVoided = t.status === "voided";

        return (
          <div
            key={t.id}
            className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-2 overflow-hidden"
          >
            {/* Left: Avatar & Info */}
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[rgba(23,23,23,0.04)] border border-[rgba(23,23,23,0.1)] flex items-center justify-center flex-shrink-0 text-[#171717]">
                <BarberIcon type={t.avatarType || "scissors"} className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[#171717] text-xs sm:text-sm truncate leading-tight">
                  {t.staffName}
                </h4>
                <p className="text-[11px] sm:text-xs text-[rgba(23,23,23,0.6)] font-medium truncate mt-0.5" title={t.serviceName}>
                  {t.serviceName}
                </p>
              </div>
            </div>

            {/* Right: Amount, Payment Method, Status & Time */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-right flex-shrink-0">
              <div className="text-right">
                <div
                  className={`font-extrabold text-xs sm:text-sm whitespace-nowrap ${
                    isVoided ? "line-through text-red-600" : "text-[#741F2C]"
                  }`}
                >
                  {isVoided ? `-${formatVND(Math.abs(Number(t.amount)))}` : formatVND(t.amount)}
                </div>
                <div className="flex items-center justify-end space-x-1 mt-0.5 text-[10px] sm:text-xs text-[rgba(23,23,23,0.6)] font-medium whitespace-nowrap">
                  {t.paymentMethod === "cash" ? (
                    <>
                      <Banknote className="w-3 h-3 text-[#171717]" />
                      <span>Tiền mặt</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3 h-3 text-[#171717]" />
                      <span>CK</span>
                    </>
                  )}
                  <span className="text-[rgba(23,23,23,0.4)] ml-1">{t.time}</span>
                </div>
              </div>

              {showStatusBadge && (
                <div className="pl-0.5">
                  {isVoided ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 whitespace-nowrap">
                      Hủy
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                      OK
                    </span>
                  )}
                </div>
              )}

              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[rgba(23,23,23,0.4)] flex-shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
