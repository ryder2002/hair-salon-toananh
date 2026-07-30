"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronRight, Crown, Users } from "lucide-react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { BarberIcon } from "@/components/ui/BarberIcon";
import { formatVND } from "@/lib/money";

interface EmployeeItem {
  id: string;
  name: string;
  roleTitle: string;
  isManager?: boolean;
  status: "active" | "inactive";
  monthRevenue: number | bigint;
  avatarText?: string;
  avatarIcon?: "scissors" | "comb";
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const employees: EmployeeItem[] = [
    {
      id: "e1",
      name: "Minh Quân",
      roleTitle: "Quản lý",
      isManager: true,
      status: "active",
      monthRevenue: 5250000n,
    },
    {
      id: "e2",
      name: "Hoàng Long",
      roleTitle: "Thợ cắt tóc",
      status: "active",
      monthRevenue: 3520000n,
      avatarText: "HL",
      avatarIcon: "scissors",
    },
    {
      id: "e3",
      name: "Đức Anh",
      roleTitle: "Thợ cắt tóc",
      status: "active",
      monthRevenue: 2260000n,
    },
    {
      id: "e4",
      name: "Bảo Nam",
      roleTitle: "Thợ cắt tóc",
      status: "active",
      monthRevenue: 1530000n,
      avatarText: "BN",
      avatarIcon: "comb",
    },
    {
      id: "e5",
      name: "Tấn Phát",
      roleTitle: "Thợ cắt tóc",
      status: "inactive",
      monthRevenue: 0n,
    },
  ];

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "active") return matchesSearch && e.status === "active";
    if (filter === "inactive") return matchesSearch && e.status === "inactive";
    return matchesSearch;
  });

  const activeCount = employees.filter((e) => e.status === "active").length;
  const inactiveCount = employees.filter((e) => e.status === "inactive").length;

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
            <span>Tổng nhân sự: <strong className="text-[#741F2C] font-bold text-sm">{employees.length}</strong></span>
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

        {/* Employees Cards List matching Image 4 */}
        <div className="space-y-3">
          {filteredEmployees.map((emp) => (
            <Link
              key={emp.id}
              href={`/admin/employees/${emp.id}`}
              className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between hover:border-[#741F2C] transition-colors block"
            >
              {/* Left: Avatar & Profile info */}
              <div className="flex items-center space-x-3">
                {emp.avatarText ? (
                  <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-[#741F2C] flex flex-col items-center justify-center font-bold text-sm relative">
                    <span>{emp.avatarText}</span>
                    {emp.avatarIcon && (
                      <BarberIcon type={emp.avatarIcon} className="w-3 h-3 text-[#741F2C] -mt-0.5" />
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[rgba(23,23,23,0.1)] border border-[rgba(23,23,23,0.15)] flex items-center justify-center text-[#171717] font-bold text-sm">
                    {emp.name.charAt(0)}
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-[#171717] text-base">
                      {emp.name}
                    </h3>
                    {emp.isManager && (
                      <Crown className="w-4 h-4 text-[#741F2C] fill-[#741F2C]" />
                    )}
                  </div>
                  <p className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
                    {emp.roleTitle}
                  </p>
                  <div className="mt-1 text-xs">
                    <span className="text-[rgba(23,23,23,0.5)]">Doanh thu tháng này: </span>
                    <strong className="text-[#741F2C] font-bold">
                      {formatVND(emp.monthRevenue)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right: Status badge & Chevron */}
              <div className="flex items-center space-x-2">
                {emp.status === "active" ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    • Đang hoạt động
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                    🔒 Tạm khóa
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-[rgba(23,23,23,0.4)]" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
