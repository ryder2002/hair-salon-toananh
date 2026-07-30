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
    <div className="space-y-3">
      {transactions.map((t) => {
        const isVoided = t.status === "voided";

        return (
          <div
            key={t.id}
            className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between"
          >
            {/* Left: Avatar & Info */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[rgba(23,23,23,0.04)] border border-[rgba(23,23,23,0.1)] flex items-center justify-center flex-shrink-0 text-[#171717]">
                <BarberIcon type={t.avatarType || "scissors"} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[#171717] text-sm truncate leading-tight">
                  {t.staffName}
                </h4>
                <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium truncate mt-0.5">
                  {t.serviceName}
                </p>
              </div>
            </div>

            {/* Right: Amount, Payment Method, Status & Time */}
            <div className="flex items-center space-x-2 text-right flex-shrink-0">
              <div>
                <div
                  className={`font-bold text-sm ${
                    isVoided ? "line-through text-red-600" : "text-[#741F2C]"
                  }`}
                >
                  {isVoided ? `-${formatVND(Math.abs(Number(t.amount)))}` : formatVND(t.amount)}
                </div>
                <div className="flex items-center justify-end space-x-1 mt-0.5 text-xs text-[rgba(23,23,23,0.6)] font-medium">
                  {t.paymentMethod === "cash" ? (
                    <>
                      <Banknote className="w-3.5 h-3.5 text-[#171717]" />
                      <span>Tiền mặt</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-[#171717]" />
                      <span>Chuyển khoản</span>
                    </>
                  )}
                </div>
              </div>

              {showStatusBadge && (
                <div className="pl-1">
                  {isVoided ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 text-red-800">
                      Đã hủy
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      Hoàn thành
                    </span>
                  )}
                </div>
              )}

              <div className="text-xs text-[rgba(23,23,23,0.5)] font-medium pl-1">
                {t.time}
              </div>

              <ChevronRight className="w-4 h-4 text-[rgba(23,23,23,0.4)]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
