"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, LogOut, CheckCircle2, ShieldCheck } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmployeeBottomNav } from "@/components/layout/EmployeeBottomNav";

import { getAuthSession, clearAuthSession } from "@/lib/auth";
import { changeUserPasswordAction } from "@/server/actions/employees";
import { logAuditAction } from "@/server/actions/audit";

import { BellRing } from "lucide-react";
import { registerWebPushSubscription } from "@/lib/push/webpush";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(() => getAuthSession());
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const toggleNotif = async () => {
    const nextState = !notifEnabled;
    setNotifEnabled(nextState);
    if (nextState) {
      await registerWebPushSubscription();
      setMsg("Đã bật nhận thông báo công bố bảng lương & Salon!");
    } else {
      setMsg("Đã tắt thông báo ứng dụng.");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg("Mật khẩu mới không trùng khớp!");
      return;
    }

    setLoading(true);
    const res = await changeUserPasswordAction({
      username: session?.username || "nhanvien",
      oldPassword,
      newPassword,
    });

    setLoading(false);
    if (!res.success) {
      setMsg("Lỗi: " + (res.error || "Không thể đổi mật khẩu"));
      return;
    }

    await logAuditAction({
      action: "PASSWORD_CHANGED",
      actorName: session?.fullName || "Nhân viên",
      actorRole: "employee",
      details: `Đã đổi mật khẩu tài khoản nhân viên @${session?.username} thành công trong CSDL Supabase`,
    });

    setMsg("Đổi mật khẩu thành công vào CSDL!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  const empName = session?.fullName || "Nhân viên";
  const empRole = session?.role === "admin" ? "Quản lý tiệm" : "Thợ cắt tóc";

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
            {empName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#171717]">{empName}</h2>
            <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">{empRole}</p>
            <p className="text-xs text-[rgba(23,23,23,0.5)]">Tài khoản: @{session?.username || "nhanvien"}</p>
          </div>
        </div>

        {/* Notification Settings Toggle Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm flex justify-between items-center text-sm font-semibold">
          <div className="flex items-center space-x-3">
            <BellRing className="w-5 h-5 text-[#741F2C]" />
            <div>
              <div className="text-[#171717]">Thông báo ứng dụng</div>
              <div className="text-xs text-[rgba(23,23,23,0.5)] font-normal">Nhận thông báo khi Admin công bố lương</div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleNotif}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              notifEnabled ? "bg-[#741F2C]" : "bg-gray-300"
            }`}
          >
            <span
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                notifEnabled ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
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
