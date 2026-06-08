import { useState } from 'react';
import { sb } from '@/lib/supabase';

interface ModalsProps {
  activeModal: 'profile' | 'theme' | null;
  onClose: () => void;
  onSelectTheme: (theme: string) => void;
}

export default function Modals({ activeModal, onClose, onSelectTheme }: ModalsProps) {
  const [newPassword, setNewPassword] = useState('');

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

  return (
    /* 🟢 1. อัปเกรดฉากหลังโมดอลหลักให้โปร่งใส+เบลอกระจกแก้ว ล้อไปกับปฏิทินกะงาน */
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
          maxWidth: '440px', 
          margin: 0, 
          position: 'relative', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          maxHeight: '90vh', 
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.6)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 20,
          padding: '16px',
        }}>
          {/* liquid surface */}
          <div style={{
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.6)',
            borderRadius: 14,
            padding: '16px 14px',
            boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.45), inset 0 -4px 12px -8px rgba(255,255,255,0.30)',
            ...(activeModal === 'theme' ? { paddingTop: '55px' } : {})
          }}>
        {/* Top bar: Reset (left) / ปิด (right) */}
        <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* reset removed */}
          <button onClick={onClose}
            style={{ background: 'var(--border)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '12px', fontWeight: 700, padding: '4px 12px', height: '32px', borderRadius: '20px' }}>
            ปิด <i className="ph-bold ph-x" style={{ fontSize: '13px' }}></i>
          </button>
        </div>

        {activeModal === 'profile' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--primary)' }}>
              <i className="ph-duotone ph-lock-key"></i> เปลี่ยนรหัสผ่าน
            </h3>
            <input 
              type="password" 
              placeholder="รหัสผ่านใหม่" 
              className="driver-input" /* ใช้คลาสอินพุตมาตรฐานเพื่อให้แสดงผลตามธีมชินจัง/เอวาได้ถูกต้อง */
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '12px' }} 
            />
            <button 
              onClick={handleUpdatePassword} 
              style={{ width: '100%', padding: '14px', borderRadius: '15px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
            >
              ยืนยันเปลี่ยนรหัสผ่าน
            </button>
          </div>
        )}

        {activeModal === 'theme' && (
          <div style={{ position: 'relative' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* Light Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: 'transparent', fontWeight: 800, marginBottom: '2px', textAlign: 'center', userSelect: 'none' }}>&nbsp;</p>
              <button className="theme-btn" onClick={() => onSelectTheme('retro-pastel')} style={{ background: '#FFADAD', color: '#1B263B', borderColor: '#2D3A5D' }}>Retro Pastel</button>
              <button className="theme-btn" onClick={() => onSelectTheme('shinchan')} style={{ background: 'rgba(255, 253, 238, 0.9)', color: '#417e2c', borderColor: '#feca57' }}>ชินจัง</button>
              <button className="theme-btn" onClick={() => onSelectTheme('modern')} style={{ background: '#FAF7F2', color: '#C76B5D', borderColor: '#D4C9BE' }}>Modern</button>
              <button className="theme-btn" onClick={() => onSelectTheme('blue-sky')} style={{ background: '#E8F4FD', color: '#2C3E50', borderColor: '#AED6F1' }}>Blue Sky</button>
              <button className="theme-btn" onClick={() => onSelectTheme('cotton-candy')} style={{ background: '#FDF2F8', color: '#EC4899', borderColor: '#F9A8D4' }}>Cotton Candy</button>
              <button className="theme-btn" onClick={() => onSelectTheme('summer-morning')} style={{ background: '#fff6de', color: '#f48f68', borderColor: '#8bdfdd' }}>Summer Morning</button>
              </div>

            {/* Dark Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: 'transparent', fontWeight: 800, marginBottom: '2px', textAlign: 'center', userSelect: 'none' }}>&nbsp;</p>
              <button className="theme-btn" onClick={() => onSelectTheme('retro-dark')} style={{ background: '#2D2D2D', color: '#FDF6E3', borderColor: '#FDF6E3' }}>Retro Dark</button>
              <button className="theme-btn" onClick={() => onSelectTheme('sunset')} style={{ background: '#1a0b2e', color: '#ff477e', borderColor: '#432c7a' }}>Neon Sunset</button>
              <button className="theme-btn" onClick={() => onSelectTheme('midnight-ocean')} style={{ background: '#0D1B2A', color: '#38BDF8', borderColor: '#2D4A6E' }}>Midnight Ocean</button>
              <button className="theme-btn" onClick={() => onSelectTheme('twilight')} style={{ background: '#1A0A1E', color: '#C084FC', borderColor: '#3D2A50' }}>Twilight</button>
            </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
