"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";

interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  details: string;
  time: string;
}

export default function AuditLogPage() {
  const logs: AuditLogEntry[] = [
    {
      id: "a1",
      action: "REVENUE_VOIDED",
      actorName: "Admin Manager",
      details: "Đã hủy giao dịch 300.000 đ của Hoàng Long (Lý do: Thao tác nhầm)",
      time: "22/05/2025 17:32",
    },
    {
      id: "a2",
      action: "PAYROLL_PUBLISHED",
      actorName: "Admin Manager",
      details: "Đã công bố bảng lương kỳ Tháng 5/2024 cho toàn bộ nhân viên",
      time: "20/05/2024 20:30",
    },
    {
      id: "a3",
      action: "DAY_CLOSED",
      actorName: "Admin Manager",
      details: "Đã chốt ngày 21/05/2025 (Tổng doanh thu: 12.560.000 đ)",
      time: "21/05/2025 21:10",
    },
    {
      id: "a4",
      action: "STAFF_CREATED",
      actorName: "Admin Manager",
      details: "Đã tạo tài khoản nhân viên mới cho Bảo Nam (Chức vụ: Thợ cắt tóc)",
      time: "18/05/2025 18:45",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/settings"
            className="p-1 rounded-full text-[#741F2C] hover:bg-[rgba(23,23,23,0.05)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-[#171717] tracking-tight">
            Nhật ký hoạt động
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="px-4 pt-3 space-y-3">
        <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
          Mọi thao tác sửa, hủy, mở khóa và chốt dữ liệu đều được ghi lại tự động.
        </div>

        <div className="space-y-2.5">
          {logs.map((l) => (
            <div
              key={l.id}
              className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[12px] p-3.5 shadow-sm space-y-1"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#741F2C]">{l.action}</span>
                <span className="text-[11px] text-[rgba(23,23,23,0.5)] font-medium">{l.time}</span>
              </div>
              <p className="text-xs font-semibold text-[#171717]">{l.details}</p>
              <div className="text-[11px] text-[rgba(23,23,23,0.5)]">Thực hiện bởi: {l.actorName}</div>
            </div>
          ))}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
