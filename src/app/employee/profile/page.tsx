"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, LogOut, CheckCircle2, ShieldCheck } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg("Mật khẩu mới không trùng khớp!");
      return;
    }
    setMsg("Đổi mật khẩu thành công!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="Tài khoản cá nhân" subtitle="Barbershop Manager" unreadCount={0} />

      <main className="px-4 pt-3 space-y-4">
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {/* Profile Info Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-[#741F2C] flex items-center justify-center font-bold text-xl">
            M
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#171717]">Minh Quân</h2>
            <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Quản lý tiệm · Thợ cắt chính</p>
            <p className="text-xs text-[rgba(23,23,23,0.5)]">quan@barbershop.com · 0912345678</p>
          </div>
        </div>

        {/* Change Password Card */}
        <form onSubmit={handleChangePassword} className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-3.5">
          <div className="flex items-center space-x-2 text-[#741F2C]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#171717]">
              ĐỔI MẬT KHẨU TÀI KHOẢN
            </h3>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#741F2C] text-white py-3 rounded-[10px] font-bold text-sm shadow-sm"
          >
            CẬP NHẬT MẬT KHẨU
          </button>
        </form>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-200 text-red-700 py-3.5 rounded-[12px] font-bold text-sm flex items-center justify-center space-x-2 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>ĐĂNG XUẤT HỆ THỐNG</span>
        </button>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
