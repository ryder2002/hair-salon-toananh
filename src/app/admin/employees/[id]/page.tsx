"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Lock, Unlock, Save, CheckCircle2, DollarSign, Percent, Trash2, AlertTriangle, X } from "lucide-react";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { formatVND, parseVNDInput } from "@/lib/money";
import { addAuditLog } from "@/lib/audit-log";
import { getEmployees, deleteEmployee, toggleEmployeeStatus } from "@/lib/employee-store";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [jobTitle, setJobTitle] = useState("Thợ cắt tóc");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [rawBaseSalary, setRawBaseSalary] = useState("6000000");
  const [rawAllowance, setRawAllowance] = useState("500000");
  const [commissionRate, setCommissionRate] = useState("8.0");
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const employees = getEmployees();
    const found = employees.find((e) => e.id === id || e.username === id);
    if (found) {
      setFullName(found.fullName);
      setUsername(found.username);
      setJobTitle(found.jobTitle);
      setStatus(found.status);
      setRawBaseSalary(String(found.baseSalary || 6000000));
      setRawAllowance(String(found.allowance || 500000));
      setCommissionRate(String(found.commissionRate || 8.0));
    } else {
      setFullName(id);
      setUsername(id);
    }
  }, [id]);

  const baseSalaryNum = parseVNDInput(rawBaseSalary);
  const allowanceNum = parseVNDInput(rawAllowance);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    addAuditLog({
      action: "STAFF_UPDATED",
      actorName: "Admin Manager",
      actorRole: "admin",
      details: `Đã cập nhật cấu hình lương cho nhân viên ${fullName} (@${username}) (Lương cứng: ${formatVND(baseSalaryNum)}, Phụ cấp: ${formatVND(allowanceNum)}, Hoa hồng: ${commissionRate}%)`,
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleStatus = () => {
    const newStatus = toggleEmployeeStatus(id);
    setStatus(newStatus);
    addAuditLog({
      action: newStatus === "inactive" ? "STAFF_LOCKED" : "STAFF_UNLOCKED",
      actorName: "Admin Manager",
      actorRole: "admin",
      details: `Đã ${newStatus === "inactive" ? "khóa tài khoản" : "mở khóa tài khoản"} nhân viên ${fullName} (@${username})`,
    });
  };

  const handleDeleteEmployee = () => {
    setDeleting(true);

    // Call persistent delete from employee-store
    deleteEmployee(id);

    addAuditLog({
      action: "STAFF_DELETED",
      actorName: "Admin Manager",
      actorRole: "admin",
      details: `Đã xóa vĩnh viễn tài khoản người dùng/nhân viên ${fullName} (@${username}) khỏi hệ thống`,
    });

    setTimeout(() => {
      setDeleting(false);
      setShowDeleteModal(false);
      router.push("/admin/employees");
    }, 400);
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
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-1.5 rounded-full text-red-600 hover:bg-red-50"
            title="Xóa người dùng"
          >
            <Trash2 className="w-5 h-5" />
          </button>
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

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[rgba(23,23,23,0.7)]">
              Chức vụ công việc
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Nhập hoặc chọn chức vụ (Ví dụ: Thợ gội đầu, Lễ tân...)"
              className="w-full bg-[#F7F3EC]/50 border border-[rgba(23,23,23,0.14)] rounded-[10px] px-3.5 py-2.5 text-sm text-[#171717] focus:outline-none focus:border-[#741F2C]"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Thợ cắt tóc", "Thợ gội đầu", "Gội đầu & Massage", "Thợ phụ", "Lễ tân", "Quản lý tiệm"].map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setJobTitle(title)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                    jobTitle === title
                      ? "bg-[#741F2C] text-white border-[#741F2C]"
                      : "bg-white text-[rgba(23,23,23,0.7)] border-[rgba(23,23,23,0.14)] hover:bg-gray-50"
                  }`}
                >
                  + {title}
                </button>
              ))}
            </div>
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

        {/* Delete User Section */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-white border border-red-200 text-red-700 py-3 rounded-[10px] font-bold text-sm shadow-sm flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>XÓA TÀI KHOẢN NGƯỜI DÙNG</span>
          </button>
        </div>
      </main>

      {/* Confirmation Modal Delete User */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 text-[rgba(23,23,23,0.4)] hover:text-[#171717]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#171717]">Xác nhận xóa người dùng</h3>
            </div>

            <p className="text-xs text-[rgba(23,23,23,0.7)] leading-relaxed">
              Bạn có chắc chắn muốn xóa nhân viên <strong className="text-red-700 font-bold">{fullName}</strong> không? Hành động này sẽ gỡ bỏ tài khoản và dữ liệu liên quan.
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-[rgba(23,23,23,0.2)] py-2.5 text-xs font-bold rounded-[10px] text-[#171717]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteEmployee}
                className="flex-1 py-2.5 text-xs font-bold rounded-[10px] bg-red-700 text-white hover:bg-red-800 transition-colors"
              >
                {deleting ? "Đang xóa..." : "Xác nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}

