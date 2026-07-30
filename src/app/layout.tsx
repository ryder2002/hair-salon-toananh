import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export const metadata: Metadata = {
  title: "Toàn Anh Hair Salon - Quản lý tiệm tóc",
  description: "Ứng dụng PWA quản lý doanh thu, nhân viên và bảng lương cho Toàn Anh Hair Salon",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#741F2C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-[#F7F3EC] text-[#171717] antialiased min-h-screen">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
