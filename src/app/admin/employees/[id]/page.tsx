"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Lock, Unlock, Save, CheckCircle2, DollarSign, Percent } from "lucide-react";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { formatVND, parseVNDInput } from "@/lib/money";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [fullName, setFullName] = useState(id === "e1" ? "Minh Quân" : "Hoàng Long");
  const [jobTitle, setJobTitle] = useState(id === "e1" ? "Quản lý" : "Thợ cắt tóc");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [rawBaseSalary, setRawBaseSalary] = useState("8000000");
  const [rawAllowance, setRawAllowance] = useState("1000000");
  const [commissionRate, setCommissionRate] = useState("10.0");
  const [saved, setSaved] = useState(false);

  const baseSalaryNum = parseVNDInput(rawBaseSalary);
  const allowanceNum = parseVNDInput(rawAllowance);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleStatus = () => {
    setStatus((prev) => (prev === "active" ? "inactive" : "active"));
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-28 max-w-md mx-auto relative shadow-xl">
      <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full text-[#741F2C] hover:bg-[rgba(23,23,23,0.05)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-[#171717] tracking-tight">
            Hồ sơ nhân viên
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu thông tin nhân viên thành công!</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-[#741F2C] flex items-center justify-center font-bold text-lg">
              {fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#171717]">{fullName}</h2>
              <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">{jobTitle}</p>
              <div className="mt-1">
                {status === "active" ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    • Đang hoạt động
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                    🔒 Tạm khóa
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleStatus}
            className={`p-2.5 rounded-full border transition-colors ${
              status === "active"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {status === "active" ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </button>
        </div>

        {/* Edit Salary Settings Form */}
        <form onSubmit={handleSave} className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-4 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#741F2C] uppercase tracking-wider">
            CẤU HÌNH LƯƠNG NHÂN VIÊN
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
              Chức vụ
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
              Lương cứng (VND)
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
              Phụ cấp (VND)
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
              Tỷ lệ hoa hồng (%)
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

          <button
            type="submit"
            className="w-full bg-[#741F2C] text-white py-3 rounded-[10px] font-bold text-sm shadow-sm flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>LƯU CẤU HÌNH LƯƠNG</span>
          </button>
        </form>
      </main>

      <AdminBottomNav />
    </div>
  );
}
