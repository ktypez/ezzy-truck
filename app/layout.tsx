import type { Metadata } from "next";
import "./globals.css";
import PWAStatus from "@/components/PWAStatus";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  title: `${APP_CONFIG.APP_NAME} v.${APP_CONFIG.VERSION}`,
  description: "บันทึกข้อมูลประจำวัน",
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        {/* 🟢 1. ดักสิทธิ์ขนาดจอสมาร์ตโฟน: บังคับขนาดพอดีจอ และล็อกไม่ให้ Safari แอบซูมเองตอนจิ้มคีย์บอร์ดพิมพ์งาน */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        <script src="https://unpkg.com/@phosphor-icons/web" async></script>
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TruckLog" />
        
        <link rel="apple-touch-startup-image" href="/splash.png" />
      </head>
      {/* 🟢 2. สั่งเคลือบฟอนต์ Google Sans ลงที่เนื้อหาชั้นนอกสุด เพื่อให้หน้าต่าง Modal และตัวเลขปฏิทินสวยโค้งมนเหมือนกันหมด */}
      <body style={{ fontFamily: "'Google Sans', sans-serif" }}>
        {children}
        <PWAStatus />
      </body>
    </html>
  );
}
