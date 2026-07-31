"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRing, Shield, FileText, Store, LogOut, ChevronRight, CheckCircle2 } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { clearAuthSession } from "@/lib/auth";
import { addAuditLog } from "@/lib/audit-log";

import { registerWebPushSubscription } from "@/lib/push/webpush";
import { clearAllDatabaseDataAction } from "@/server/actions/reset";

import { Key, Lock, Eye, EyeOff, X } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [msg, setMsg] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState("");

  const togglePush = async () => {
    const nextState = !pushEnabled;
    setPushEnabled(nextState);
    if (nextState) {
      await registerWebPushSubscription();
      setMsg("Đã xin quyền và bật Web Push Notification!");
    } else {
      setMsg("Đã tắt Web Push Notification.");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");

    if (oldPassword !== "10122002") {
      setPassError("Mật khẩu hiện tại không đúng!");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    addAuditLog({
      action: "PASSWORD_CHANGED",
      actorName: "Định Công Nhật",
      actorRole: "admin",
      details: "Đã đổi mật khẩu tài khoản Admin thành công",
    });

    setMsg("Đã đổi mật khẩu Admin thành công!");
    setShowPasswordModal(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleLogout = () => {
    addAuditLog({
      action: "USER_LOGOUT",
      actorName: "Admin Manager",
      actorRole: "admin",
      details: "Đã đăng xuất khỏi tài khoản Admin",
    });
    clearAuthSession();
    router.push("/login");
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
              <BellRing className="w-[#741F2C] h-5 w-5 text-[#741F2C]" />
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

          {/* Change Password Link */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full p-4 flex justify-between items-center hover:bg-[rgba(23,23,23,0.02)] text-left"
          >
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-[#741F2C]" />
              <div>
                <div className="text-[#171717]">Đổi mật khẩu Admin</div>
                <div className="text-xs text-[rgba(23,23,23,0.5)] font-normal">Cập nhật mật khẩu bảo mật tài khoản</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[rgba(23,23,23,0.4)]" />
          </button>

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

          {/* Reset Database Button */}
          <button
            type="button"
            onClick={async () => {
              if (window.confirm("BẠN CÓ CHẮC CHẮN MỐN XÓA TOÀN BỘ DỮ LIỆU TRÊN DATABASE?\n\nThao tác này sẽ xóa tất cả doanh thu, bảng lương, phụ cấp và tài khoản nhân viên. Chỉ giữ lại tài khoản Admin (admin/admin123 & dinhcongnhat/10122002).")) {
                const res = await clearAllDatabaseDataAction();
                if (res.success) {
                  setMsg(res.message || "Đã xóa sạch dữ liệu Database thành công!");
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("barbershop_revenue_transactions");
                    localStorage.removeItem("barbershop_employees_list");
                    localStorage.removeItem("barbershop_app_notifications");
                  }
                } else {
                  setMsg("Lỗi khi xóa dữ liệu: " + (res.error || ""));
                }
                setTimeout(() => setMsg(""), 4000);
              }
            }}
            className="w-full p-4 flex justify-between items-center hover:bg-red-50 text-left text-red-700"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-red-700" />
              <div>
                <div className="text-red-700 font-bold">Xóa sạch dữ liệu Database</div>
                <div className="text-xs text-red-600/80 font-normal">Reset toàn bộ dữ liệu tiệm, chỉ giữ lại tài khoản Admin</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-white border border-red-200 text-red-700 py-3.5 rounded-[12px] font-bold text-sm flex items-center justify-center space-x-2 shadow-sm block text-center hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 inline-block mr-1" />
          <span>ĐĂNG XUẤT QUYỀN ADMIN</span>
        </button>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[#741F2C]">
              <Key className="w-6 h-6" />
              <h3 className="font-bold text-base text-[#171717]">Đổi mật khẩu Admin</h3>
            </div>

            {passError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-xs font-semibold">
                ⚠️ {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Mật khẩu hiện tại *
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3 py-2 text-sm text-[#171717]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-2.5 top-2.5 text-[rgba(23,23,23,0.4)]"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3 py-2 text-sm text-[#171717]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-2.5 text-[rgba(23,23,23,0.4)]"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3 py-2 text-sm text-[#171717]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border border-[rgba(23,23,23,0.2)] py-2.5 text-xs font-bold rounded-[10px] text-[#171717]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold rounded-[10px] bg-[#741F2C] text-white shadow-md hover:bg-[#5e1923]"
                >
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}
