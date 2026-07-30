"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckSquare,
  Wallet,
  UserPlus,
  AlertTriangle,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";

interface NotificationItem {
  id: string;
  iconType: "cash" | "closing" | "payroll" | "user" | "alert";
  title: string;
  time: string;
  message: string;
  unread: boolean;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([
    {
      id: "n1",
      iconType: "cash",
      title: "Nhân viên đã ghi nhận doanh thu",
      time: "09:35",
      message: "Minh Quân đã ghi nhận doanh thu 5.250.000 đ vào 09:35",
      unread: true,
    },
    {
      id: "n2",
      iconType: "closing",
      title: "Đã hoàn tất chốt ngày",
      time: "21:10",
      message: "Chốt ngày 21/05/2025 đã được hoàn tất vào 21:10",
      unread: true,
    },
    {
      id: "n3",
      iconType: "payroll",
      title: "Đã công bố bảng lương",
      time: "20:30",
      message: "Bảng lương kỳ 2 (11/05 – 20/05) đã được công bố",
      unread: true,
    },
    {
      id: "n4",
      iconType: "user",
      title: "Tạo tài khoản nhân viên mới",
      time: "18:45",
      message: "Tài khoản cho nhân viên Bảo Nam đã được tạo thành công",
      unread: false,
    },
    {
      id: "n5",
      iconType: "alert",
      title: "Giao dịch đã bị hủy",
      time: "17:32",
      message: "Giao dịch 250.000 đ của Hoàng Long đã bị hủy bởi Admin",
      unread: true,
    },
  ]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "cash":
        return <Banknote className="w-5 h-5 text-[#171717]" />;
      case "closing":
        return <CheckSquare className="w-5 h-5 text-[#171717]" />;
      case "payroll":
        return <Wallet className="w-5 h-5 text-[#171717]" />;
      case "user":
        return <UserPlus className="w-5 h-5 text-[#171717]" />;
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-[#171717]" />;
      default:
        return <Bell className="w-5 h-5 text-[#171717]" />;
    }
  };

  const unreadCount = items.filter((i) => i.unread).length;

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <MobileHeader unreadCount={unreadCount} />

      <main className="px-4 pt-3 space-y-4">
        {/* Title & Mark as read */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
            Thông báo
          </h2>
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-[#741F2C] hover:underline"
          >
            Đánh dấu đã đọc
          </button>
        </div>

        {/* Top Summary Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#741F2C] text-white flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#741F2C] text-sm">
                {unreadCount} thông báo mới
              </div>
              <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                Tổng {items.length} thông báo
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[rgba(23,23,23,0.4)]" />
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm relative overflow-hidden flex items-start space-x-3 ${
                n.unread ? "border-l-4 border-l-[#741F2C]" : "border-l-4 border-l-[rgba(23,23,23,0.2)]"
              }`}
            >
              {/* Icon Container */}
              <div className="w-10 h-10 rounded-full bg-[rgba(23,23,23,0.05)] border border-[rgba(23,23,23,0.08)] flex items-center justify-center flex-shrink-0 mt-0.5">
                {renderIcon(n.iconType)}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-bold text-[#171717] text-sm truncate leading-tight">
                    {n.title}
                  </h4>
                  <span className="text-xs text-[rgba(23,23,23,0.5)] font-medium">
                    {n.time}
                  </span>
                </div>
                <p className="text-xs text-[rgba(23,23,23,0.7)] font-medium leading-relaxed">
                  {n.message}
                </p>
              </div>

              {/* Unread Indicator Dot */}
              <div className="absolute right-3 top-4">
                {n.unread ? (
                  <span className="w-2.5 h-2.5 bg-[#741F2C] rounded-full block" />
                ) : (
                  <span className="w-2.5 h-2.5 bg-[rgba(23,23,23,0.2)] rounded-full block" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-3 pb-2 text-xs text-[rgba(23,23,23,0.5)] font-medium">
          Không còn thông báo cũ hơn
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
