'use client';
import { useState, useEffect } from 'react';
import { sb } from '@/lib/supabase';
import Header from '@/components/Header';
import DailyView from '@/components/DailyView';
import MonthlyView from '@/components/MonthlyView';
import SalaryView from '@/components/SalaryView';
import Modals from '@/components/Modals';
import ShiftView from '@/components/ShiftView';
import { APP_CONFIG } from "@/config";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [theme, setTheme] = useState('light');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activeView, setActiveView] = useState('daily');
  const [activeModal, setActiveModal] = useState<'profile' | 'theme' | null>(null);

  // 💡 1. ตัวแปรนี้อยู่ตรงนี้ตามเดิม
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // 🚨 2. กลุ่มแชร์ State ของระบบปฏิทินกะงานลอยแก้ว
  const [currentDayShift, setCurrentDayShift] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); 

  const fetchCurrentDayShift = async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await sb
        .from('logs')
        .select('shift_time')
        .eq('user_id', session.user.id)
        .eq('year', currentDate.getFullYear())
        .eq('month', currentDate.getMonth() + 1)
        .eq('day', selectedDay)
        .maybeSingle();

      setCurrentDayShift(data?.shift_time || '');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCurrentDayShift();
  }, [selectedDay, currentDate, session, refreshTrigger]); 


  // 🟢 3. [แก้ไขใหม่] ระบบ Real-time Auth Check ปลอดภัยและแม่นยำกว่าเดิม 100%
  useEffect(() => {
    // โหลดเซสชันปัจจุบันมารอไว้ก่อน
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // คอยตรวจจับถ้ามีการล็อกเอาต์ หรือ เซสชันหมดอายุ ระบบจะดีดกลับหน้า Login ทันที
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // ดึงค่าธีมเดิมที่เคยเซฟไว้ในเครื่อง
    const savedTheme = localStorage.getItem('truck-theme') || 'light';
    setTheme(savedTheme);

    // ล้างตัวดักฟัง (Cleanup) เมื่อ Component ถูกทำลาย
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
    <div data-theme={theme} className="min-h-screen">
      <Header 
        userEmail={session.user.email}
        currentDate={currentDate}
        onChangeMonth={handleChangeMonth}
        activeView={activeView}
        onSwitchView={setActiveView}
        onOpenModal={setActiveModal}
        onLogout={handleLogout}
        onOpenCalendar={() => setIsCalendarOpen(true)} 
      />

      <main className="content-area">
        {activeView === 'daily' && (
          <DailyView 
            userId={session.user.id}
            currentDate={currentDate}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onSaveSuccess={() => setRefreshTrigger(!refreshTrigger)}
            currentShift={currentDayShift} 
          />
        )}
        {activeView === 'monthly' && (
          <MonthlyView 
            userId={session.user.id}
            currentDate={currentDate}
            refreshTrigger={refreshTrigger}
            onSelectDayRow={(day) => {
              setSelectedDay(day);
              setActiveView('daily');
            }}
          />
        )}
        {activeView === 'salary' && (
          <SalaryView 
            userId={session.user.id}
            currentDate={currentDate}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      <footer style={{
          marginTop: '40px',
          padding: '20px',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          color: 'var(--muted)',
          fontSize: '12px'
      }}>
          <div style={{ marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0L16 14H0L8 0z" />
                  </svg>
                  Made with Next.js
              </span>
          </div>
          <div>{APP_CONFIG.APP_NAME} v.{APP_CONFIG.VERSION}</div>
      </footer>

      <Modals 
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSelectTheme={setTheme}
      />

      <ShiftView 
        userId={session.user.id} 
        currentDate={currentDate} 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />
    </div>
  );
}
