"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Laptop } from "lucide-react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker automatically
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registered successfully:", reg))
        .catch((err) => console.error("PWA Service Worker registration failed:", err));
    }

    // 2. Listen for beforeinstallprompt event for PWA Desktop Installability
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("PWA install choice outcome:", outcome);

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-[#741F2C] text-white p-3 rounded-[12px] shadow-2xl flex items-center justify-between border border-white/20 animate-bounce">
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
          <Laptop className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-xs font-bold leading-tight">CÀI ĐẶT TOÀN ANH HAIR SALON</div>
          <div className="text-[10px] text-white/80 font-medium">Tải ứng dụng về Laptop / Điện thoại</div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          onClick={handleInstallClick}
          className="bg-white text-[#741F2C] text-xs font-extrabold px-3 py-1.5 rounded-[8px] shadow-sm hover:bg-cream transition-colors flex items-center space-x-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>CÀI ĐẶT</span>
        </button>
        <button
          onClick={() => setShowInstallBanner(false)}
          className="text-white/70 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
