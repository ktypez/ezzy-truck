import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sb } from '@/lib/supabase';
import Header from '@/components/Header';
import Modals from '@/components/Modals';

const ALLOWED_THEMES = ["retro-pastel", "retro-dark", "shinchan", "modern", "crayon", "sunset"];

const DailyView = lazy(() => import('@/components/DailyView'));
const MonthlyView = lazy(() => import('@/components/MonthlyView'));
const SalaryView = lazy(() => import('@/components/SalaryView'));

function useSession() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, setSession };
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('truck-theme');
    if (saved && ALLOWED_THEMES.includes(saved)) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'retro-dark' : 'retro-pastel';
  });

  // Particle effect for Shin-chan theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('truck-theme', theme);

    const oldChocobi = document.querySelector('.chocobi-fall');
    if (oldChocobi) oldChocobi.remove();

    if (theme === 'shinchan') {
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

  return { theme, setTheme };
}

export default function Home() {
  const { session, setSession } = useSession();
  const { theme, setTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activeView, setActiveView] = useState('daily');
  const [activeModal, setActiveModal] = useState<'profile' | 'theme' | null>(null);

  // Fetch current day's shift info via TanStack Query
  const { data: shiftData, refetch: refetchShift } = useQuery({
    queryKey: ['day-shift', session?.user?.id, currentDate.getFullYear(), currentDate.getMonth() + 1, selectedDay],
    queryFn: async () => {
      if (!session?.user?.id) return { shift_time: '', leave_type: null };
      const { data } = await sb
        .from('logs')
        .select('shift_time, leave_type')
        .eq('user_id', session.user.id)
        .eq('year', currentDate.getFullYear())
        .eq('month', currentDate.getMonth() + 1)
        .eq('day', selectedDay)
        .maybeSingle();
      return { shift_time: data?.shift_time || '', leave_type: data?.leave_type || null };
    },
    enabled: !!session?.user?.id,
  });

  const handleChangeMonth = useCallback((diff: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + diff, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  }, [currentDate]);

  const handleLogout = () => {
    sb.auth.signOut().then(() => setSession(null));
  };

  if (!session) {
    return (
      <div id="auth-screen">
        <div className="auth-card">
          <h1 id="auth-title-text" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ph-duotone ph-truck i-icon" style={{ fontSize: '40px', marginRight: '10px' }}></i> Ezzy Truck
          </h1>
          <p id="auth-sub-text" style={{ color: 'var(--muted)', fontWeight: 500, marginBottom: '25px', textAlign: 'center' }}>เข้าสู่ระบบเพื่อบันทึกงาน</p>
          <input type="email" id="auth-email" placeholder="อีเมลของคุณ" className="driver-input" style={{ width: '100%', marginBottom: '15px' }} />
          <input type="password" id="auth-password" placeholder="รหัสผ่าน" className="driver-input" style={{ width: '100%', marginBottom: '25px' }} />
          <button className="auth-btn" style={{ width: '100%', borderRadius: '18px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, padding: '15px', cursor: 'pointer' }} onClick={async () => {
            const email = (document.getElementById('auth-email') as HTMLInputElement).value;
            const password = (document.getElementById('auth-password') as HTMLInputElement).value;
            const { data, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) alert(error.message);
            else setSession(data.session);
          }}>
            <i className="ph-duotone ph-sign-in i-icon" style={{ marginRight: '10px' }}></i> เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} style={{ minHeight: '100vh' }}>
      <Header
        userEmail={session.user.email}
        currentDate={currentDate}
        onChangeMonth={handleChangeMonth}
        activeView={activeView}
        onSwitchView={setActiveView}
        onOpenModal={setActiveModal}
        onLogout={handleLogout}
      />

      <main className="content-area">
        <Suspense fallback={<div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>⏳ กำลังโหลด...</div>}>
          {activeView === 'daily' && (
            <DailyView
              userId={session.user.id}
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onSaveSuccess={() => refetchShift()}
              currentShift={shiftData?.shift_time || ''}
              currentLeaveType={shiftData?.leave_type || null}
              onChangeMonth={handleChangeMonth}
            />
          )}
          {activeView === 'monthly' && (
            <MonthlyView
              userId={session.user.id}
              currentDate={currentDate}
              onSelectDayRow={(day) => {
                setSelectedDay(day);
                setActiveView('daily');
              }}
              onChangeMonth={handleChangeMonth}
            />
          )}
          {activeView === 'salary' && (
            <SalaryView
              userId={session.user.id}
              currentDate={currentDate}
              onChangeMonth={handleChangeMonth}
            />
          )}
        </Suspense>
      </main>

      <div className="nav-tabs">
        <div className={`tab ${activeView === 'daily' ? 'active' : ''}`} onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            setSelectedDay(today.getDate());
            setActiveView('daily');
          }}>
          <i className="ph-duotone ph-note-pencil i-icon"></i> บันทึก
        </div>
        <div className={`tab ${activeView === 'monthly' ? 'active' : ''}`} onClick={() => setActiveView('monthly')}>
          <i className="ph-duotone ph-clock-counter-clockwise i-icon"></i> ประวัติ
        </div>
        <div className={`tab ${activeView === 'salary' ? 'active' : ''}`} onClick={() => setActiveView('salary')}>
          <i className="ph-duotone ph-wallet i-icon"></i> รายได้
        </div>
      </div>

      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onResetTheme={() => {
          localStorage.removeItem('truck-theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(prefersDark ? 'retro-dark' : 'retro-pastel');
        }}
        onSelectTheme={setTheme}
      />
    </div>
  );
}
