import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ezzy Truck',
    short_name: 'EzzyTruck',
    description: 'บันทึกข้อมูลประจำวัน',
    start_url: '/',
    display: 'standalone',
    background_color: '#e81e25',
    theme_color: '#e81e25',
    icons: [
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png', // ถ้ามีไฟล์ขนาด 512 ในโฟลเดอร์ให้ใส่บรรทัดนี้ไว้ด้วยครับ
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
