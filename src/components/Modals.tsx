import { useState, useEffect } from 'react';
import { sb } from '@/lib/supabase';

interface ModalsProps {
  activeModal: 'profile' | 'theme' | null;
  onClose: () => void;
  onSelectTheme: (theme: string) => void;
}

const themeColors: Record<string, { bg: string; text: string; accent?: string }> = {
  'retro-pastel':    { bg: '#FFF5F0', text: '#2D2D2D', accent: '#FF6B6B' },
  'shinchan':        { bg: '#FFF9C4', text: '#4a3f3b', accent: '#4CAF50' },
  'blue-sky':        { bg: '#F0F8FF', text: '#1E3A5F', accent: '#007AFF' },
  'modern':          { bg: '#1A1A1E', text: '#FFFFFF', accent: '#3A3A3E' },
  'cotton-candy':    { bg: '#FFF0F5', text: '#2D2D2D', accent: '#FF69B4' },
  'summer-morning':  { bg: '#FFF7E0', text: '#2D2D2D', accent: '#FF9F43' },
  'retro-dark':      { bg: '#1A1A1E', text: '#EDE0CC', accent: '#FF6B6B' },
  'shinchan-sleep':  { bg: '#1A2035', text: '#E8E0D0', accent: '#F5C542' },
  'midnight-ocean':  { bg: '#1A2744', text: '#E0F0FF', accent: '#4FC3F7' },
  'twilight':        { bg: '#2D1B4E', text: '#F0E6FF', accent: '#C084FC' },
  'sunset':          { bg: '#1A0830', text: '#F0E6FF', accent: '#FF477E' },
};

export default function Modals({ activeModal, onClose, onSelectTheme }: ModalsProps) {
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    if (activeModal === 'profile') {
      sb.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) setCurrentEmail(user.email);
      });
    }
  }, [activeModal]);

  if (!activeModal) return null;

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (!error) {
      alert('เปลี่ยนรหัสผ่านสำเร็จ 🔑');
      setNewPassword('');
      onClose();
    } else {
      alert(error.message);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.includes('@')) {
      alert('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }
    const { error } = await sb.auth.updateUser({ email: newEmail });
    if (!error) {
      alert('🔗 ระบบส่งลิงก์ยืนยันไปที่อีเมลใหม่ของคุณแล้ว\n📧 และส่งอีเมลแจ้งเตือนไปที่อีเมลเดิม');
      setNewEmail('');
      onClose();
    } else {
      alert(error.message);
    }
  };

  const commonInputStyle: React.CSSProperties = {
    width: '100%', padding: '8px', borderRadius: '10px',
    background: 'var(--card)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  };

  const commonBtnStyle: React.CSSProperties = {
    width: '100%', padding: '8px', borderRadius: '12px',
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '15px'
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '320px',
            margin: 0,
            position: 'relative',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--glass-bg, rgba(255,255,255,0.7))',
            backdropFilter: 'blur(4px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
            border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
            borderRadius: 20,
            padding: '14px',
          }}>
          {activeModal === 'profile' && (
            <div style={{ margin: '-10px' }}>
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                {/* Current email display */}
                <div style={{
                  textAlign: 'center', marginBottom: '14px',
                  fontSize: '13px', color: 'var(--muted)',
                  wordBreak: 'break-all',
                }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>อีเมลปัจจุบัน</span>
                  {currentEmail || '...'}
                </div>

                {/* Change email */}
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text)' }}>
                  <i className="ph-duotone ph-envelope"></i> เปลี่ยนอีเมล
                </h3>
                <input
                  type="email"
                  placeholder="อีเมลใหม่"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ ...commonInputStyle, marginBottom: '8px' }}
                />
                <button onClick={handleUpdateEmail} style={{ ...commonBtnStyle, marginBottom: '16px' }}>
                  ยืนยันเปลี่ยนอีเมล
                </button>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--border)', opacity: 0.3, marginBottom: '14px' }} />

                {/* Change password */}
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text)' }}>
                  <i className="ph-duotone ph-lock-key"></i> เปลี่ยนรหัสผ่าน
                </h3>
                <input
                  type="password"
                  placeholder="รหัสผ่านใหม่"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ ...commonInputStyle, marginBottom: '8px' }}
                />
                <button onClick={handleUpdatePassword} style={commonBtnStyle}>
                  ยืนยันเปลี่ยนรหัสผ่าน
                </button>
              </div>
            </div>
          )}

          {activeModal === 'theme' && (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Light Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['retro-pastel', 'Retro Pastel'],
                    ['shinchan', 'ชินจัง - กางเกง'],
                    ['blue-sky', 'ชินจัง - Blue'],
                    ['modern', 'Modern'],
                    ['cotton-candy', 'Cotton Candy'],
                    ['summer-morning', 'Summer Morning'],
                  ].map(([key, label]) => {
                    const c = themeColors[key];
                    return (
                      <button
                        key={key}
                        className="theme-btn"
                        onClick={() => onSelectTheme(key)}
                        style={{
                          background: `linear-gradient(135deg, ${c.bg}, ${c.bg})`,
                          border: `2px solid ${c.accent}`,
                          color: c.text,
                          borderRadius: 14,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: 14,
                          padding: '10px 0',
                          fontFamily: 'inherit',
                          transition: 'all 0.2s',
                          boxShadow: `0 2px 8px ${c.accent}33`,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Dark Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['retro-dark', 'Retro Dark'],
                    ['shinchan-sleep', 'ชินจัง - สลีป'],
                    ['midnight-ocean', 'Midnight Ocean'],
                    ['twilight', 'Twilight'],
                    ['sunset', 'Neon Sunset'],
                  ].map(([key, label]) => {
                    const c = themeColors[key];
                    return (
                      <button
                        key={key}
                        className="theme-btn"
                        onClick={() => onSelectTheme(key)}
                        style={{
                          background: `linear-gradient(135deg, ${c.bg}, ${c.bg})`,
                          border: `2px solid ${c.accent}`,
                          color: c.text,
                          borderRadius: 14,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: 14,
                          padding: '10px 0',
                          fontFamily: 'inherit',
                          transition: 'all 0.2s',
                          boxShadow: `0 2px 8px ${c.accent}33`,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
