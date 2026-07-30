"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("dinhcongnhat");
  const [password, setPassword] = useState("10122002");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Vui lòng nhập Tên đăng nhập và Mật khẩu");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      // Admin verification
      if (cleanUsername === "dinhcongnhat" && cleanPassword === "10122002") {
        router.push("/admin");
        return;
      }

      // Employee verification
      const employeeUsernames = ["minhquan", "hoanglong", "ducanh", "baonam", "quan", "long"];
      if (employeeUsernames.includes(cleanUsername) && (cleanPassword === "10122002" || cleanPassword === "123456")) {
        router.push("/employee");
        return;
      }

      setError("Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại!");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col justify-center px-4 py-6 max-w-md mx-auto relative shadow-xl">
      {/* Centered Large Brand Logo */}
      <div className="text-center mb-6">
        <div className="w-40 h-40 mx-auto flex items-center justify-center">
          <img
            src="/Logo.png"
            alt="Logo"
            className="w-full h-full object-contain filter drop-shadow-md hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* Login Form Card */}
      <div className="bg-white border border-[rgba(23,23,23,0.14)] rounded-[16px] p-6 shadow-sm space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
                className="w-full bg-[#F7F3EC]/40 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-10 pr-4 py-3 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#F7F3EC]/40 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-10 pr-10 py-3 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#741F2C] text-white py-3.5 rounded-[10px] font-bold text-sm shadow-md active:scale-98 transition-transform mt-2"
          >
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP HỆ THỐNG"}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-[rgba(23,23,23,0.5)] font-medium border-t border-[rgba(23,23,23,0.08)]">
          Tài khoản do Tiệm cấp. Hệ thống tự động phân quyền sau khi đăng nhập.
        </div>
      </div>
    </div>
  );
}
