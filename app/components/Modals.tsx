'use client';
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
            <p style={{ gridColumn: 'span 2', fontSize: '13px', color: 'var(--muted)', fontWeight: 800, marginBottom: '-2px', letterSpacing: '0.5px' }}>โหมดมาตรฐาน</p>
            <button className="theme-btn" onClick={() => onSelectTheme('light')} style={{ background: '#ffffff', color: '#e81e25', borderColor: '#0054a6' }}><i className="ph-duotone ph-sun"></i> Light</button>
            <button className="theme-btn" onClick={() => onSelectTheme('dark')} style={{ background: '#1e1e1e', color: '#ffffff', borderColor: '#e81e25' }}><i className="ph-duotone ph-moon"></i> Dark</button>

            <p style={{ gridColumn: 'span 2', fontSize: '13px', color: 'var(--muted)', fontWeight: 800, marginTop: '10px', marginBottom: '-2px', letterSpacing: '0.5px' }}>ธีม (Light / Dark)</p>
            <button className="theme-btn" onClick={() => onSelectTheme('white')} style={{ background: '#ffffff', color: '#000000' }}>WHITE</button>
            <button className="theme-btn" onClick={() => onSelectTheme('black')} style={{ background: '#000000', color: '#ffffff' }}>BLACK</button>
            <button className="theme-btn" onClick={() => onSelectTheme('rosepine-light')} style={{ background: '#faf4ed', color: '#d7827e' }}><i className="ph-duotone ph-flower-lotus"></i> Pine L</button>
            <button className="theme-btn" onClick={() => onSelectTheme('rosepine')} style={{ background: '#191724', color: '#eb6f92' }}><i className="ph-duotone ph-flower"></i> Pine D</button>

            <p style={{ gridColumn: 'span 2', fontSize: '13px', color: 'var(--muted)', fontWeight: 800, marginTop: '10px', marginBottom: '-2px', letterSpacing: '0.5px' }}>ธีมแนะนำใหม่ ✨</p>
            <button className="theme-btn" onClick={() => onSelectTheme('shinchan')} style={{ background: 'rgba(255, 253, 238, 0.9)', color: '#417e2c', borderColor: 'rgba(217, 199, 182, 0.6)' }}><i className="ph-duotone ph-sparkle"></i> Shin-Chan</button>
            <button className="theme-btn" onClick={() => onSelectTheme('eva01')} style={{ background: '#0e0c15', color: '#7cff00', border: '2px solid #cc00ff' }}>👾 Project EVA</button>
            <button className="theme-btn" onClick={() => onSelectTheme('matcha')} style={{ background: '#f4f6f0', color: '#7d9d79', borderColor: '#d3dbd4' }}>🍵 Matcha</button>
            <button className="theme-btn" onClick={() => onSelectTheme('cyber')} style={{ background: '#0b0f19', color: '#fce21b', borderColor: '#1e293b' }}>🚧 Cyber</button>
            <button className="theme-btn" onClick={() => onSelectTheme('sakura')} style={{ background: '#fff5f7', color: '#ff9aa2', borderColor: '#ffd1dc' }}>🌸 Sakura Petal</button>
            <button className="theme-btn" onClick={() => onSelectTheme('sunset')} style={{ background: '#1a0b2e', color: '#ff477e', borderColor: '#432c7a' }}>🌆 Neon Sunset</button>
            <button className="theme-btn" onClick={() => onSelectTheme('solar-mint')} style={{ background: '#FFFFFF', color: '#2DD4BF', borderColor: '#E5E7EB' }}>🌿 Solar Mint</button>
            <button className="theme-btn" onClick={() => onSelectTheme('siblò')} style={{ background: '#0d0d0d', color: '#ff007f', borderColor: '#333333' }}>🚛 สิบล้อซิ่ง</button>
          </div>
        )}
      </div>
    </div>
  );
}
