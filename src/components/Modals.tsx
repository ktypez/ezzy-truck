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
    <>
      <style>{`
  .theme-btn {
    background: var(--glass-bg, rgba(255,255,255,0.7));
    backdrop-filter: blur(4px) saturate(1.4);
    -webkit-backdrop-filter: blur(4px) saturate(1.4);
    border: 1px solid var(--glass-border, rgba(0,0,0,0.08));
    border-radius: 14px;
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
    padding: 8px 0;
    color: var(--text);
    font-family: inherit;
    transition: all 0.2s;
  }
  .theme-btn:hover {
    background: var(--primary-bg);
    border-color: var(--primary);
  }
`}</style>
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          maxHeight: '90vh', 
          overflowY: 'auto',
          background: 'var(--glass-bg, rgba(255,255,255,0.7))',
          backdropFilter: 'blur(4px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
          border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
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
              <button className="theme-btn" onClick={() => onSelectTheme('retro-pastel')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Retro Pastel</button>
              <button className="theme-btn" onClick={() => onSelectTheme('shinchan')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>ชินจัง - กางเกง</button>
              <button className="theme-btn" onClick={() => onSelectTheme('blue-sky')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>ชินจัง - Blue</button>
              <button className="theme-btn" onClick={() => onSelectTheme('modern')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Modern</button>
              <button className="theme-btn" onClick={() => onSelectTheme('cotton-candy')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Cotton Candy</button>
              <button className="theme-btn" onClick={() => onSelectTheme('summer-morning')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Summer Morning</button>
              </div>

            {/* Dark Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="theme-btn" onClick={() => onSelectTheme('retro-dark')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Retro Dark</button>
              <button className="theme-btn" onClick={() => onSelectTheme('shinchan-sleep')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>ชินจัง - สลีป</button>
              <button className="theme-btn" onClick={() => onSelectTheme('midnight-ocean')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Midnight Ocean</button>
              <button className="theme-btn" onClick={() => onSelectTheme('twilight')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Twilight</button>
              <button className="theme-btn" onClick={() => onSelectTheme('sunset')} style={{ background: 'var(--glass-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(4px) saturate(1.4)', WebkitBackdropFilter: 'blur(4px) saturate(1.4)', border: '1px solid var(--glass-border, rgba(0,0,0,0.08))', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Neon Sunset</button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
