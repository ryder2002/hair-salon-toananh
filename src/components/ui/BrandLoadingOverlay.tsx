"use client";

import React from "react";

interface BrandLoadingOverlayProps {
  isVisible?: boolean;
  message?: string;
}

export function BrandLoadingOverlay({
  isVisible = true,
  message = "Đang tải dữ liệu...",
}: BrandLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 transition-opacity animate-fadeIn">
      <div className="flex flex-col items-center space-y-4 text-center">
        {/* Glowing Brand Logo Container */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute w-36 h-36 rounded-full bg-[#741F2C]/40 blur-xl animate-pulse" />
          
          {/* Spinning Ring Accent */}
          <div className="w-32 h-32 rounded-full border-2 border-white/10 border-t-[#741F2C] border-r-amber-500 animate-spin" />

          {/* Logo Image Centered */}
          <div className="absolute w-24 h-24 flex items-center justify-center">
            <img
              src="/Logo.png"
              alt="Toàn Anh Hair Salon"
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] animate-bounce"
            />
          </div>
        </div>

        {/* Brand Title & Loading Message */}
        <div className="space-y-1 pt-2">
          <h2 className="text-base font-extrabold text-white tracking-widest uppercase">
            TOÀN ANH HAIR SALON
          </h2>
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-white/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{message}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
