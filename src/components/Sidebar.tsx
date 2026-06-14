import React from 'react'
import Header from '@/components/Header'
import NavTabs from '@/components/NavTabs'

interface SidebarProps {
  userEmail: string
  onOpenModal: (modal: 'profile' | 'theme' | null) => void
  onLogout: () => void
  activeView: string
  lastTapRef: React.RefObject<number>
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>
  setSelectedDay: React.Dispatch<React.SetStateAction<number>>
}

export default function Sidebar({
  userEmail,
  onOpenModal,
  onLogout,
  activeView,
  lastTapRef,
  setCurrentDate,
  setSelectedDay
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <Header 
        userEmail={userEmail} 
        onOpenModal={onOpenModal} 
        onLogout={onLogout} 
      />
      <NavTabs
        basePath=""
        activeView={activeView}
        onDoubleTapDaily={() => {
          const now = Date.now()
          if (now - lastTapRef.current < 300) {
            const today = new Date()
            setCurrentDate(today)
            setSelectedDay(today.getDate())
          }
          lastTapRef.current = now
        }}
        lastTapRef={lastTapRef}
      />
    </aside>
  )
}