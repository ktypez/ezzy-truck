import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // skipWaiting ถูกนำออกไปเพราะเดี๋ยวนี้ระบบจัดการให้อัตโนมัติใน v10+ ครับ
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
};

export default withPWA(nextConfig);
