import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { sb } from '@/lib/supabase'
import Header from '@/components/Header'
import Modals from '@/components/Modals'
import AuthScreen from '@/components/AuthScreen'
import Sidebar from '@/components/Sidebar'

import ThemeEffects from '@/components/ThemeEffects'
import PageLayout from '@/components/PageLayout'

const DailyView = lazy(() => import('@/components/DailyView'))
const MonthlyView = lazy(() => import('@/components/MonthlyView'))
const SalaryView = lazy(() => import('@/components/SalaryView'))


export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeView = location.pathname.replace('/', '') || 'daily'

  const [session, setSession] = useState<any>(null)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('truck-theme')
    if (saved) return saved
    return 'retro-pastel'
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [activeModal, setActiveModal] = useState<'profile' | 'theme' | null>(null)
  const lastTapRef = useRef(0)

  const queryClient = useQueryClient()

  // 🚨 2. กลุ่มแชร์ State ของระบบปฏิทินกะงานลอยแก้ว

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])



  const handleChangeMonth = (diff: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + diff, 1)
    setCurrentDate(newDate)
    setSelectedDay(1)
  }

  const handleLogout = () => {
    sb.auth.signOut().then(() => setSession(null))
  }

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [
        'monthly-logs',
        session?.user?.id,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
      ],
    })
    queryClient.invalidateQueries({
      queryKey: [
        'salary',
        session?.user?.id,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
      ],
    })
    queryClient.invalidateQueries({
      queryKey: [
        'day-log',
        session?.user?.id,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        selectedDay,
      ],
    })
  }

  const goToDaily = () => {
    navigate('/daily')
  }


  if (!session) {
    return <AuthScreen onAuth={() => {}} />
  }

  return (
    <div data-theme={theme} style={{ minHeight: '100vh' }}>
       <ThemeEffects theme={theme} />
       {/* Mobile header (hidden on desktop) */}
       <header className="mobile-header">
         <Header 
           userEmail={session.user.email} 
           onOpenModal={setActiveModal} 
           onLogout={handleLogout} 
         />
       </header>
       {/* Desktop sidebar */}
       <Sidebar
         userEmail={session.user.email}
         onOpenModal={setActiveModal}
         onLogout={handleLogout}
         activeView={activeView}
         lastTapRef={lastTapRef}
         setCurrentDate={setCurrentDate}
         setSelectedDay={setSelectedDay}
       />

      <main className="content-area">
        <Suspense
          fallback={
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--muted)',
                fontWeight: 500,
              }}
            >
              Loading...
            </div>
          }
        >
          <Routes>
                <Route
                  path="/daily"
                  element={
                    <PageLayout>
                      <DailyView
                        userId={session.user.id}
                        currentDate={currentDate}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                        onSaveSuccess={handleSaveSuccess}
                        onChangeMonth={handleChangeMonth}
                      />
                    </PageLayout>
                  }
                />
                <Route
                  path="/monthly"
                  element={
                    <PageLayout>
                      <MonthlyView
                        userId={session.user.id}
                        currentDate={currentDate}
                        onSelectDayRow={(day) => {
                          setSelectedDay(day)
                          navigate('/daily')
                        }}
                        onChangeMonth={handleChangeMonth}
                      />
                    </PageLayout>
                  }
                />
                <Route
                  path="/salary"
                  element={
                    <PageLayout>
                      <SalaryView
                        userId={session.user.id}
                        currentDate={currentDate}
                        onChangeMonth={handleChangeMonth}
                      />
                    </PageLayout>
                  }
                />
            <Route
              path="/"
              element={
                <DailyView
                  userId={session.user.id}
                  currentDate={currentDate}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  onSaveSuccess={handleSaveSuccess}
                  onChangeMonth={handleChangeMonth}
                />
              }
            />
          </Routes>
        </Suspense>
      </main>

      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSelectTheme={setTheme}
      />
    </div>
  )
}
