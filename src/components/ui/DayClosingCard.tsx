"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CalendarCheck, RotateCcw, Store, X } from "lucide-react";
import { closeDayAction, getBusinessDayStatusAction, getCurrentBusinessDateAction, reopenDayAction } from "@/server/actions/day-closing";

export function DayClosingCard({ onCloseDay }: { onCloseDay?: () => void }) {
  const [businessDate, setBusinessDate] = useState("");
  const [closed, setClosed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const date = await getCurrentBusinessDateAction();
      const status = await getBusinessDayStatusAction(date);
      setBusinessDate(date);
      setClosed(status.isClosed);
      setError("");
    } catch (err: any) {
      setError(err.message || "Không thể đọc trạng thái ngày");
    }
  };

  useEffect(() => { load(); }, []);

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      if (closed) {
        const result = await reopenDayAction(businessDate, reason);
        if (!result.success) throw new Error(result.error || "Không thể mở lại ngày");
        setClosed(false);
        setReason("");
      } else {
        const result = await closeDayAction({ businessDate });
        if (!result.success) throw new Error(result.error || "Không thể chốt ngày");
        setClosed(true);
        onCloseDay?.();
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-[rgba(23,23,23,0.12)] rounded-[14px] p-3.5 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center ${closed ? "bg-gray-600" : "bg-[#741F2C]"}`}><Store className="w-5 h-5" /></div>
          <div>
            <div className="text-xs text-[rgba(23,23,23,0.6)] font-medium">Trạng thái ngày làm việc</div>
            <div className={`text-base font-bold ${closed ? "text-amber-800" : "text-emerald-700"}`}>{closed ? "Đã đóng" : "Đang mở"}</div>
            <div className="text-[10px] text-gray-500">{businessDate || "Đang tải..."}</div>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} disabled={!businessDate} className={`px-4 py-2.5 flex items-center space-x-1.5 text-xs font-bold rounded-[10px] text-white disabled:opacity-50 ${closed ? "bg-amber-700" : "bg-[#741F2C]"}`}>
          {closed ? <RotateCcw className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}
          <span>{closed ? "Mở lại ngày" : "Chốt ngày"}</span>
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-700 font-semibold">{error}</div>}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-gray-400"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2 text-[#741F2C]"><CalendarCheck className="w-6 h-6" /><h3 className="font-bold text-base text-[#171717]">{closed ? "Mở lại ngày làm việc" : "Xác nhận chốt ngày"}</h3></div>
            <p className="text-xs text-gray-600">Ngày nghiệp vụ: <strong>{businessDate}</strong>. {closed ? "Mở lại sẽ cho phép chỉnh sửa doanh thu." : "Sau khi chốt, nhân viên không thể ghi hoặc sửa doanh thu ngày này."}</p>
            {closed && <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do mở lại ngày (bắt buộc)" rows={3} className="w-full border rounded-lg p-2 text-sm" />}
            <div className="flex space-x-2"><button onClick={() => setShowModal(false)} className="flex-1 border py-2.5 rounded-lg text-xs font-bold">Hủy</button><button onClick={confirm} disabled={loading || (closed && reason.trim().length < 3)} className="flex-1 bg-[#741F2C] text-white py-2.5 rounded-lg text-xs font-bold disabled:opacity-50">{loading ? "Đang xử lý..." : closed ? "Xác nhận mở lại" : "Xác nhận chốt ngày"}</button></div>
            {!closed && <div className="flex items-center gap-1 text-[10px] text-amber-700"><AlertTriangle className="w-3 h-3" />Tổng tiền sẽ được tính lại từ Database.</div>}
          </div>
        </div>
      )}
    </>
  );
}
