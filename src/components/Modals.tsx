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
        className="card" 
        onClick={e => e.stopPropagation()} 
        style={{
          width: '100%', 
          maxWidth: '440px', 
          padding: '25px 20px', 
          margin: 0, 
          position: 'relative', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          maxHeight: '90vh', 
          overflowY: 'auto',
          ...(activeModal === 'theme' ? { paddingTop: '40px' } : {})
        }}
      >
        {/* 🟢 2. ปรับปุ่มกากบาทมุมบนขวาให้เป็นวงกลมสีแดงแบบพรีเมียมตามมาตรฐานแอปตัวใหม่ */}
        <button className="modal-close-red" onClick={onClose} style={{ top: '15px', right: '15px' }}>
          <i className="ph-bold ph-x"></i>
        </button>

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* Light Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 800, marginBottom: '-5px', textAlign: 'center' }}>&nbsp;</p>
              <button className="theme-btn" onClick={() => onSelectTheme('retro-pastel')} style={{ background: '#FFADAD', color: '#1B263B', borderColor: '#2D3A5D' }}>Retro Pastel</button>
              <button className="theme-btn" onClick={() => onSelectTheme('shinchan')} style={{ background: 'rgba(255, 253, 238, 0.9)', color: '#417e2c', borderColor: '#feca57' }}>ชินจัง</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva00')} style={{ background: '#071828', color: '#00aacc', borderColor: '#0e2a40' }}>🔵 EVA-00</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva02')} style={{ background: '#1c0a00', color: '#ff8c00', borderColor: '#cc1100' }}>EVA-02</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva04')} style={{ background: '#0d1120', color: '#4a90d9', borderColor: '#1e2d45' }}>EVA-04</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva06')} style={{ background: '#ffffff', color: '#c8a840', borderColor: '#e0d4b8' }}>🤍 EVA-06</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva-mark09')} style={{ background: '#111811', color: '#88cc88', borderColor: '#1a2e1a' }}>👻 Mark.09</button>
              </div>

            {/* Dark Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 800, marginBottom: '-5px', textAlign: 'center' }}>&nbsp;</p>
              <button className="theme-btn" onClick={() => onSelectTheme('retro-dark')} style={{ background: '#2D2D2D', color: '#FDF6E3', borderColor: '#FDF6E3' }}>Retro Dark</button>
              <button className="theme-btn" onClick={() => onSelectTheme('sunset')} style={{ background: '#1a0b2e', color: '#ff477e', borderColor: '#432c7a' }}>Neon Sunset</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva01')} style={{ background: '#0e0c15', color: '#7cff00', borderColor: '#cc00ff' }}>EVA-01</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva03')} style={{ background: '#111111', color: '#8b0000', borderColor: '#3a3a3a' }}>EVA-03</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva05')} style={{ background: '#141414', color: '#c8a000', borderColor: '#2a2416' }}>🟡 EVA-05</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva08')} style={{ background: '#1e0418', color: '#ff66cc', borderColor: '#4a1040' }}>🩷 EVA-08</button>
              <button className="theme-btn" onClick={() => onSelectTheme('eva13')} style={{ background: '#111111', color: '#f0f0f0', borderColor: '#222222' }}>☯️ EVA-13</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
