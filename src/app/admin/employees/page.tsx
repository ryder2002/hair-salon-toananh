"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, ChevronRight, Crown, Users, UserPlus } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { BarberIcon } from "@/components/ui/BarberIcon";
import { formatVND } from "@/lib/money";
import { getEmployees, StoredEmployee } from "@/lib/employee-store";
import { fetchEmployeesAction } from "@/server/actions/employees";
import { fetchRevenuesAction } from "@/server/actions/revenue";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [employeesList, setEmployeesList] = useState<StoredEmployee[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [dbEmployees, dbRevenues] = await Promise.all([
          fetchEmployeesAction(),
          fetchRevenuesAction(),
        ]);

        const currentMonthPrefix = new Date().toISOString().substring(0, 7);
        const revenueMap: Record<string, number> = {};

        if (dbRevenues && dbRevenues.length > 0) {
          dbRevenues.forEach((r: any) => {
            if (r.status !== "voided" && (r.business_date || "").startsWith(currentMonthPrefix)) {
              const empId = r.employee_id;
              if (empId) {
                revenueMap[empId] = (revenueMap[empId] || 0) + Number(r.amount || 0);
              }
            }
          });
        }

        if (dbEmployees && dbEmployees.length > 0) {
          const formatted: StoredEmployee[] = dbEmployees.map((e: any) => ({
            id: e.id,
            username: e.username || (e.email || "").split("@")[0],
            fullName: e.full_name,
            phone: e.phone || "",
            jobTitle: e.job_title || "Thợ cắt tóc",
            baseSalary: e.salary_settings?.[0]?.base_salary || 6000000,
            allowance: e.salary_settings?.[0]?.allowance || 500000,
            commissionRate: e.salary_settings?.[0]?.commission_rate || 8.0,
            status: e.status || "active",
            monthRevenue: revenueMap[e.id] || 0,
            createdAt: new Date().toISOString(),
          }));
          setEmployeesList(formatted);
        } else {
          setEmployeesList([]);
        }
      } catch (err) {
        console.warn("DB fetch employees error:", err);
        setEmployeesList([]);
      }
    }
    loadData();
  }, []);

  const filteredEmployees = employeesList.filter((e) => {
    const matchesSearch =
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.username.toLowerCase().includes(search.toLowerCase());
    if (filter === "active") return matchesSearch && e.status === "active";
    if (filter === "inactive") return matchesSearch && e.status === "inactive";
    return matchesSearch;
  });

  const activeCount = employeesList.filter((e) => e.status === "active").length;
  const inactiveCount = employeesList.filter((e) => e.status === "inactive").length;

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <MobileHeader title="Barbershop Manager" subtitle="Quản lý thông tin và hiệu suất nhân viên" unreadCount={5} />

      <main className="px-4 pt-3 space-y-4">
        {/* Title Header & Add Staff Button */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
              Nhân viên
            </h2>
            <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium mt-0.5">
              Quản lý thông tin và hiệu suất nhân viên
            </p>
          </div>
          <Link
            href="/admin/employees/new"
            className="btn-primary text-xs px-3 py-2 flex items-center space-x-1 shadow-sm rounded-[10px]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhân viên</span>
          </Link>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nhân viên..."
            className="w-full bg-white border border-[rgba(23,23,23,0.14)] rounded-[12px] pl-10 pr-4 py-2.5 text-sm text-[#171717] placeholder-[rgba(23,23,23,0.4)] focus:outline-none focus:border-[#741F2C]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === "all"
                ? "bg-[#741F2C] text-white"
                : "bg-white border border-[rgba(23,23,23,0.2)] text-[#171717]"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === "active"
                ? "bg-[#741F2C] text-white"
                : "bg-white border border-[rgba(23,23,23,0.2)] text-[#171717]"
            }`}
          >
            • Đang hoạt động
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === "inactive"
                ? "bg-[#741F2C] text-white"
                : "bg-white border border-[rgba(23,23,23,0.2)] text-[#171717]"
            }`}
          >
            🔒 Tạm khóa
          </button>
        </div>

        {/* Summary Stats Card */}
        <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between text-xs font-medium text-[rgba(23,23,23,0.7)]">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#171717]" />
            <span>Tổng nhân sự: <strong className="text-[#741F2C] font-bold text-sm">{employeesList.length}</strong></span>
          </div>
          <div className="h-4 w-[1px] bg-[rgba(23,23,23,0.15)]" />
          <div>
            Đang hoạt động: <strong className="text-emerald-700 font-bold text-sm">{activeCount} •</strong>
          </div>
          <div className="h-4 w-[1px] bg-[rgba(23,23,23,0.15)]" />
          <div>
            Tạm khóa: <strong className="text-amber-700 font-bold text-sm">{inactiveCount} •</strong>
          </div>
        </div>

        {/* Employee List or Empty State */}
        <div className="space-y-3">
          {filteredEmployees.length === 0 ? (
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-8 text-center space-y-3 shadow-sm">
              <Users className="w-12 h-12 text-[rgba(23,23,23,0.3)] mx-auto" />
              <h3 className="font-bold text-base text-[#171717]">Chưa có nhân viên nào</h3>
              <p className="text-xs text-[rgba(23,23,23,0.6)]">
                Danh sách nhân viên đang trống. Bấm nút bên dưới để tạo tài khoản nhân viên mới.
              </p>
              <Link
                href="/admin/employees/new"
                className="inline-flex items-center space-x-2 bg-[#741F2C] text-white px-5 py-2.5 rounded-[10px] text-xs font-bold shadow-md hover:bg-[#5e1923]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm nhân viên ngay</span>
              </Link>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <Link
                key={emp.id}
                href={`/admin/employees/${emp.id}`}
                className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between hover:border-[#741F2C] transition-colors block"
              >
                {/* Left: Avatar & Profile info */}
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-red-50 border border-red-200 text-[#741F2C] flex items-center justify-center font-extrabold text-sm">
                    {emp.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-bold text-[#171717] text-sm">
                        {emp.fullName}
                      </h3>
                      <span className="text-[10px] text-[rgba(23,23,23,0.5)] font-semibold bg-[#F7F3EC] px-1.5 py-0.5 rounded">
                        @{emp.username}
                      </span>
                    </div>
                    <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium mt-0.5">
                      {emp.jobTitle}
                    </p>
                    <div className="mt-1 text-xs">
                      <span className="text-[rgba(23,23,23,0.5)]">Doanh thu tháng: </span>
                      <strong className="text-[#741F2C] font-bold">
                        {formatVND(emp.monthRevenue || 0)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & Chevron */}
                <div className="flex items-center space-x-2">
                  {emp.status === "active" ? (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      Đang làm
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700">
                      Đã nghỉ
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[rgba(23,23,23,0.4)]" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
