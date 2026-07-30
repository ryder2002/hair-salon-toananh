"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BellRing, Shield, FileText, Store, LogOut, ChevronRight, CheckCircle2 } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";

export default function AdminSettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [msg, setMsg] = useState("");

  const togglePush = () => {
    setPushEnabled(!pushEnabled);
    setMsg(!pushEnabled ? "Đã bật Web Push Notification!" : "Đã tắt Web Push Notification.");
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="Cài đặt hệ thống" subtitle="Barbershop Manager Admin" unreadCount={2} />

      <main className="px-4 pt-3 space-y-4">
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {/* Shop Info Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white border border-[rgba(23,23,23,0.12)] flex items-center justify-center p-1">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#171717]">The Gentlemen Barbershop</h2>
            <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Múi giờ: Asia/Ho_Chi_Minh (VND)</p>
          </div>
        </div>

        {/* Settings Options Group */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] overflow-hidden shadow-sm divide-y divide-[rgba(23,23,23,0.08)] text-sm font-semibold">
          {/* Push Notification Toggle */}
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BellRing className="w-5 h-5 text-[#741F2C]" />
              <div>
                <div className="text-[#171717]">Web Push Notification</div>
                <div className="text-xs text-[rgba(23,23,23,0.5)] font-normal">Nhận thông báo khi có doanh thu mới</div>
              </div>
            </div>
            <button
              onClick={togglePush}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                pushEnabled ? "bg-[#741F2C]" : "bg-gray-300"
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  pushEnabled ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Audit Log Link */}
          <Link href="/admin/audit-log" className="p-4 flex justify-between items-center hover:bg-[rgba(23,23,23,0.02)]">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-[#741F2C]" />
              <div>
                <div className="text-[#171717]">Nhật ký hoạt động (Audit Log)</div>
                <div className="text-xs text-[rgba(23,23,23,0.5)] font-normal">Lịch sử chốt ngày, hủy đơn, bảng lương</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[rgba(23,23,23,0.4)]" />
          </Link>
        </div>

        {/* Logout Button */}
        <Link
          href="/login"
          className="w-full bg-white border border-red-200 text-red-700 py-3.5 rounded-[12px] font-bold text-sm flex items-center justify-center space-x-2 shadow-sm block text-center"
        >
          <LogOut className="w-4 h-4 inline-block mr-1" />
          <span>ĐĂNG XUẤT QUYỀN ADMIN</span>
        </Link>
      </main>

      <AdminBottomNav />
    </div>
  );
}
