import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sb } from '@/lib/supabase';
import Header from '@/components/Header';
import Modals from '@/components/Modals';
import AuthScreen from '@/components/AuthScreen';

const DailyView = lazy(() => import('@/components/DailyView'));
const MonthlyView = lazy(() => import('@/components/MonthlyView'));
const SalaryView = lazy(() => import('@/components/SalaryView'));

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeView = location.pathname.replace('/', '') || 'daily';

  const [session, setSession] = useState<any>(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('truck-theme');
    if (saved) return saved;
    return 'retro-pastel';
  });
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeModal, setActiveModal] = useState<'profile' | 'theme' | null>(null);
  const lastTapRef = useRef(0);

  const queryClient = useQueryClient();

  // 🚨 2. กลุ่มแชร์ State ของระบบปฏิทินกะงานลอยแก้ว




  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Effect จัดการ Particle เอฟเฟกต์ (ซากุระ และ ช็อกโกบี) ตามธีมที่กดเลือก
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('truck-theme', theme);

    const oldSakura = document.querySelector('.sakura-fall');
    const oldChocobi = document.querySelector('.chocobi-fall');
    if (oldSakura) oldSakura.remove();
    if (oldChocobi) oldChocobi.remove();

    if (theme === 'sakura') {
      const container = document.createElement('div');
      container.className = 'sakura-fall';
      document.body.appendChild(container);
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('div'); p.className = 'petal';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 5 + 5) + 's';
        p.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(p);
      }
    } else if (theme === 'shinchan') {
      const container = document.createElement('div');
      container.className = 'chocobi-fall';
      document.body.appendChild(container);
      for (let i = 0; i < 10; i++) {
        const s = document.createElement('div'); s.className = 'star';
        s.style.left = Math.random() * 100 + '%';
        s.style.animationDuration = (Math.random() * 4 + 4) + 's';
        s.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(s);
      }
    }
  }, [theme]);

  const handleChangeMonth = (diff: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + diff, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  const handleLogout = () => {
    sb.auth.signOut().then(() => setSession(null));
  };

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['monthly-logs', session?.user?.id, currentDate.getFullYear(), currentDate.getMonth() + 1] });
    queryClient.invalidateQueries({ queryKey: ['salary', session?.user?.id, currentDate.getFullYear(), currentDate.getMonth() + 1] });
    queryClient.invalidateQueries({ queryKey: ['day-log', session?.user?.id, currentDate.getFullYear(), currentDate.getMonth() + 1, selectedDay] });
  };

  const goToDaily = () => {
    navigate('/daily');
  };

  if (!session) {
    return <AuthScreen onAuth={() => {}} />;
  }

  return (
    <div data-theme={theme} style={{ minHeight: '100vh' }}>
      <Header
        userEmail={session.user.email}
        onOpenModal={setActiveModal}
        onLogout={handleLogout}
      />

      <main className="content-area">
        <Suspense fallback={<div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontWeight: 500 }}>Loading...</div>}>
        <Routes>
          <Route path="/daily" element={
            <DailyView
              userId={session.user.id}
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onSaveSuccess={handleSaveSuccess}
              onChangeMonth={handleChangeMonth}
            />
          } />
          <Route path="/monthly" element={
            <MonthlyView
              userId={session.user.id}
              currentDate={currentDate}
              onSelectDayRow={(day) => {
                setSelectedDay(day);
                navigate('/daily');
              }}
              onChangeMonth={handleChangeMonth}
            />
          } />
          <Route path="/salary" element={
            <SalaryView
              userId={session.user.id}
              currentDate={currentDate}
              onChangeMonth={handleChangeMonth}
            />
          } />
          <Route path="/" element={
            <DailyView
              userId={session.user.id}
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onSaveSuccess={handleSaveSuccess}
              onChangeMonth={handleChangeMonth}
            />
          } />
        </Routes>
        </Suspense>
      </main>

      <div className="nav-tabs">
        <div className={`tab ${activeView === 'daily' ? 'active' : ''}`} onClick={() => {
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDay(today.getDate());
            }
            lastTapRef.current = now;
            goToDaily();
          }}>
          <i className="ph-duotone ph-note-pencil i-icon"></i> บันทึก
        </div>
        <div className={`tab ${activeView === 'monthly' ? 'active' : ''}`} onClick={() => navigate('/monthly')}>
          <i className="ph-duotone ph-clock-counter-clockwise i-icon"></i> ประวัติ
        </div>
        <div className={`tab ${activeView === 'salary' ? 'active' : ''}`} onClick={() => navigate('/salary')}>
          <i className="ph-duotone ph-wallet i-icon"></i> รายได้
        </div>
      </div>

      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}

        onSelectTheme={setTheme}
      />
    </div>
  );
}
