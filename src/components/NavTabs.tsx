import { useNavigate } from 'react-router-dom'

interface NavTabsProps {
  basePath: string
  activeView: string
  onDoubleTapDaily: () => void
  lastTapRef: React.RefObject<number>
}

const tabs = [
  { key: 'daily', icon: 'ph-duotone ph-note-pencil', label: 'บันทึก' },
  { key: 'monthly', icon: 'ph-duotone ph-clock-counter-clockwise', label: 'ประวัติ' },
  { key: 'salary', icon: 'ph-duotone ph-wallet', label: 'รายได้' },
]

export default function NavTabs({ basePath, activeView, onDoubleTapDaily, lastTapRef }: NavTabsProps) {
  const navigate = useNavigate()

  return (
    <div className="nav-tabs">
      {tabs.map(({ key, icon, label }) => {
        const path = basePath ? `/${basePath}/${key}` : `/${key}`
        const isActive = activeView === key || activeView === `${basePath}/${key}` || (!basePath && activeView === key)
        return (
          <div
            key={key}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (key === 'daily') {
                const now = Date.now()
                if (now - lastTapRef.current < 300) {
                  onDoubleTapDaily()
                }
                lastTapRef.current = now
              }
              navigate(path)
            }}
          >
            <i className={`${icon} i-icon`}></i> {label}
          </div>
        )
      })}
    </div>
  )
}
