"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Briefcase, Lock, DollarSign, Percent, CheckCircle2 } from "lucide-react";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { formatVND, parseVNDInput } from "@/lib/money";

export default function AddEmployeePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("Thợ cắt tóc");
  const [password, setPassword] = useState("123456");
  const [rawBaseSalary, setRawBaseSalary] = useState("6000000");
  const [rawAllowance, setRawAllowance] = useState("500000");
  const [commissionRate, setCommissionRate] = useState("8.0");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const baseSalaryNum = parseVNDInput(rawBaseSalary);
  const allowanceNum = parseVNDInput(rawAllowance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/admin/employees"), 1000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full text-[#741F2C] hover:bg-[rgba(23,23,23,0.05)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-[#171717] tracking-tight">
            Thêm nhân viên mới
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="px-4 pt-4">
        {success ? (
          <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-8 text-center space-y-3 mt-6 shadow-sm">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <h2 className="text-xl font-bold text-[#171717]">Tạo nhân viên thành công!</h2>
            <p className="text-xs text-[rgba(23,23,23,0.6)]">
              Tài khoản nhân viên <strong className="text-[#741F2C]">{fullName}</strong> đã được tạo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Info Group */}
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold text-[#741F2C] uppercase tracking-wider">
                THÔNG TIN CÁ NHÂN
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Họ và tên nhân viên *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                    required
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Email đăng nhập *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hung@barbershop.com"
                    required
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Số điện thoại *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    required
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Chức vụ
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <select
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  >
                    <option value="Thợ cắt tóc">Thợ cắt tóc</option>
                    <option value="Thợ chính">Thợ chính</option>
                    <option value="Thợ phụ">Thợ phụ</option>
                    <option value="Quản lý">Quản lý tiệm</option>
                    <option value="Thực tập">Thực tập</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Mật khẩu tạm thời *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  />
                </div>
              </div>
            </div>

            {/* Salary Settings Group */}
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold text-[#741F2C] uppercase tracking-wider">
                CẤU HÌNH LƯƠNG & HOA HỒNG
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Lương cứng hàng tháng (VND)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatVND(baseSalaryNum).replace(" đ", "")}
                    onChange={(e) => setRawBaseSalary(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Phụ cấp cố định (VND)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatVND(allowanceNum).replace(" đ", "")}
                    onChange={(e) => setRawAllowance(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
                  Tỷ lệ hoa hồng (% doanh thu)
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#741F2C] text-white py-3.5 rounded-[12px] font-bold text-sm shadow-md active:scale-98 transition-transform"
            >
              {loading ? "ĐANG TẠO..." : "LƯU VÀ TẠO TÀI KHOẢN NHÂN VIÊN"}
            </button>
          </form>
        )}
      </main>

      <AdminBottomNav />
    </div>
  );
}
