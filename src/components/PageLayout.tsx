import React from 'react'

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <main className="content-area">{children}</main>
    </div>
  )
}
