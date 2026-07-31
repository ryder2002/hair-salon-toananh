"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setAuthSession } from "@/lib/auth";
import { resolveLoginIdentifierAction } from "@/server/actions/auth";
import { logAuditAction } from "@/server/actions/audit";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const cleanIdentifier = identifier.trim().toLowerCase();
    if (!cleanIdentifier || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const profile = await resolveLoginIdentifierAction(cleanIdentifier);
      if (!profile?.email) throw new Error("INVALID_CREDENTIALS");
      const { data, error: authError } = await createClient().auth.signInWithPassword({
        email: profile.email,
        password,
      });
      if (authError || !data.user) throw new Error("INVALID_CREDENTIALS");

      setAuthSession({
        id: profile.id,
        username: profile.username || cleanIdentifier,
        fullName: profile.full_name,
        role: profile.role,
        email: profile.email,
        mustChangePassword: profile.must_change_password,
      });
      void logAuditAction({ action: "LOGIN", entityType: "auth", entityId: profile.id });
      router.push(profile.role === "admin" ? "/admin" : "/employee");
    } catch {
      setError("Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col justify-center px-4 py-6 max-w-md mx-auto relative shadow-xl">
      <div className="text-center mb-6">
        <div className="w-40 h-40 mx-auto flex items-center justify-center">
          <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-md" />
        </div>
      </div>
      <div className="bg-white border border-[rgba(23,23,23,0.14)] rounded-[16px] p-6 shadow-sm space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">Tên đăng nhập / Email / Số điện thoại</label>
            <div className="relative">
              <User className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3.5 top-3.5" />
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" className="w-full bg-[#F7F3EC]/40 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-10 pr-4 py-3 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3.5 top-3.5" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="w-full bg-[#F7F3EC]/40 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-10 pr-10 py-3 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[rgba(23,23,23,0.5)]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#741F2C] text-white py-3.5 rounded-[10px] font-bold text-sm shadow-md disabled:opacity-50">
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP HỆ THỐNG"}
          </button>
        </form>
        <div className="pt-2 text-center text-[11px] text-[rgba(23,23,23,0.5)] border-t border-[rgba(23,23,23,0.08)]">Tài khoản do Tiệm cấp. Mật khẩu được xác thực bởi Supabase Auth.</div>
      </div>
    </div>
  );
}
