"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandLoadingOverlay } from "./BrandLoadingOverlay";

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Đang tải dữ liệu...");

  // Initial page load handler
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Pathname / SearchParams change listener
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Click interceptor for navigation links & buttons
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (target && target.href && target.href.startsWith(window.location.origin)) {
        const url = new URL(target.href);
        if (url.pathname !== window.location.pathname) {
          setIsLoading(true);
          setLoadingMessage("Đang chuyển trang...");
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <BrandLoadingOverlay isVisible={isLoading} message={loadingMessage} />
      {children}
    </>
  );
}
