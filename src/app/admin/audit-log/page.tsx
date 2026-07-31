"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Search } from "lucide-react";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { fetchAuditLogsAction } from "@/server/actions/audit";
type AuditLogEntry = { id: string; action: string; details: string; actorName: string; actorRole?: string; timestamp: string };

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        const dbLogs = await fetchAuditLogsAction();
        if (dbLogs) {
          setLogs((dbLogs as any[]).map((entry) => ({
            id: entry.id,
            action: entry.action || entry.event_type || "AUDIT",
            details: entry.details || entry.metadata?.details || "",
            actorName: entry.actor_name || entry.profiles?.full_name || "",
            actorRole: entry.actor_role || entry.profiles?.role,
            timestamp: new Date(entry.created_at || Date.now()).toLocaleString("vi-VN"),
          })));
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.warn("DB audit log fetch error:", err);
        setLogs([]);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) =>
    l.details.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.actorName.toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadgeColor = (action: string) => {
    if (action.includes("DELETED") || action.includes("VOIDED")) return "bg-red-100 text-red-800 border-red-200";
    if (action.includes("LOGIN") || action.includes("RECORDED")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (action.includes("CLOSED") || action.includes("LOCKED")) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] pb-24 max-w-md mx-auto relative shadow-xl">
      <header className="sticky top-0 z-40 bg-[#F7F3EC] border-b border-[rgba(23,23,23,0.08)] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/settings"
            className="p-1 rounded-full text-[#741F2C] hover:bg-[rgba(23,23,23,0.05)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-[#171717] tracking-tight flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-[#741F2C]" />
            <span>Nhật ký hoạt động</span>
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="px-4 pt-3 space-y-3">
        <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">
          Mọi thao tác đăng nhập, xóa tài khoản, hủy giao dịch và chốt ngày đều được lưu vết tự động.
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[rgba(23,23,23,0.4)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo hành động, nhân viên..."
            className="w-full bg-white border border-[rgba(23,23,23,0.14)] rounded-[12px] pl-10 pr-4 py-2.5 text-xs text-[#171717] placeholder-[rgba(23,23,23,0.4)] focus:outline-none focus:border-[#741F2C]"
          />
        </div>

        <div className="space-y-2.5 pt-1">
          {filteredLogs.length === 0 ? (
            <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[12px] p-6 text-center text-xs text-[rgba(23,23,23,0.5)]">
              Chưa có nhật ký hoạt động nào phù hợp.
            </div>
          ) : (
            filteredLogs.map((l) => (
              <div
                key={l.id}
                className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[12px] p-3.5 shadow-sm space-y-1.5"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getActionBadgeColor(l.action)}`}>
                    {l.action}
                  </span>
                  <span className="text-[11px] text-[rgba(23,23,23,0.5)] font-medium">{l.timestamp}</span>
                </div>
                <p className="text-xs font-semibold text-[#171717] leading-snug">{l.details}</p>
                <div className="text-[11px] text-[rgba(23,23,23,0.5)] flex items-center justify-between border-t border-[rgba(23,23,23,0.06)] pt-1.5 mt-1">
                  <span>Thực hiện bởi: <strong className="text-[#171717]">{l.actorName}</strong></span>
                  {l.actorRole && <span className="capitalize text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">{l.actorRole}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
