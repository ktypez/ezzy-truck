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
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          maxHeight: '90vh', 
          overflowY: 'auto',
          backdropFilter: 'blur(4px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
          borderRadius: 20,
          padding: '20px',
        }}>
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
              <button className="theme-btn" onClick={() => onSelectTheme('retro-pastel')} style={{ background: '#FFADAD', color: '#1B263B', borderColor: '#2D3A5D' }}>Retro Pastel</button>
              <button className="theme-btn" onClick={() => onSelectTheme('shinchan')} style={{ background: 'rgba(255, 253, 238, 0.9)', color: '#417e2c', borderColor: '#feca57' }}>ชินจัง - กางเกง</button>
              <button className="theme-btn" onClick={() => onSelectTheme('blue-sky')} style={{ background: '#E8F4FD', color: '#2C3E50', borderColor: '#AED6F1' }}>ชินจัง - Blue</button>
              <button className="theme-btn" onClick={() => onSelectTheme('modern')} style={{ background: '#FAF7F2', color: '#C76B5D', borderColor: '#D4C9BE' }}>Modern</button>
              <button className="theme-btn" onClick={() => onSelectTheme('cotton-candy')} style={{ background: '#FDF2F8', color: '#EC4899', borderColor: '#F9A8D4' }}>Cotton Candy</button>
              <button className="theme-btn" onClick={() => onSelectTheme('summer-morning')} style={{ background: '#fff6de', color: '#f48f68', borderColor: '#8bdfdd' }}>Summer Morning</button>
              <button className="theme-btn" onClick={() => onSelectTheme('sunset')} style={{ background: '#1a0b2e', color: '#ff477e', borderColor: '#432c7a' }}>Neon Sunset</button>
              </div>

            {/* Dark Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="theme-btn" onClick={() => onSelectTheme('retro-dark')} style={{ background: '#2D2D2D', color: '#FDF6E3', borderColor: '#FDF6E3' }}>Retro Dark</button>
              <button className="theme-btn" onClick={() => onSelectTheme('midnight-ocean')} style={{ background: '#0D1B2A', color: '#38BDF8', borderColor: '#2D4A6E' }}>Midnight Ocean</button>
              <button className="theme-btn" onClick={() => onSelectTheme('twilight')} style={{ background: '#1A0A1E', color: '#C084FC', borderColor: '#3D2A50' }}>Twilight</button>
              <button className="theme-btn" onClick={() => onSelectTheme('shinchan-sleep')} style={{ background: '#0D1321', color: '#F5C542', borderColor: '#3A4A6A' }}>ชินจัง - สลีป</button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
