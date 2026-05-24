'use client';
import { useState, KeyboardEvent } from 'react';
import { sb } from '@/lib/supabase'; 
import { APP_CONFIG } from '../config'; // 💡 เรียกใช้เวอร์ชันอัตโนมัติ

export default function AuthScreen({ onAuth }: { onAuth: () => void }) {
  // 🟢 ล็อกสถานะให้เป็น true (เข้าสู่ระบบ) หน้าเดียวตายตัว ไม่ต้องมีโหมดสลับสมัครสมาชิก
  const isLogin = true; 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    if (!email || !password) return; 

    setLoading(true);
    setErrorMsg(''); 

    try {
      // ยิงตรงไปที่ฟังก์ชันเข้าสู่ระบบอย่างเดียวขาลุย
      const { data, error } = await sb.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMsg(error.message);
        alert(error.message);
      } else {
        onAuth(); 
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false); 
    }
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      document.getElementById('auth-password')?.focus();
    }
  };

  const handlePasswordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAuth();
    }
  };

  return (
    <div id="auth-screen">
      <div className="auth-card">
        
        {/* หัวข้อแอปพลิเคชันพร้อมเลขเวอร์ชันรวม */}
        <h1 id="auth-title-text" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', fontWeight: 800 }}>
          <i className="ph-duotone ph-truck i-icon" style={{ fontSize: '40px', marginRight: '10px' }}></i> {APP_CONFIG.APP_NAME} v.{APP_CONFIG.VERSION}
        </h1>
        
        <p id="auth-sub-text" style={{ color: 'var(--muted)', fontWeight: 600, textAlign: 'center', marginBottom: '25px', fontSize: '14px' }}>
          เข้าสู่ระบบเพื่อบันทึกงานวิ่งรถประจำวัน
        </p>
        
        {/* กล่องแสดงข้อความ Error เตือนเวลาใส่รหัสผิด */}
        <div id="auth-error" style={{ color: '#ff4757', fontSize: '14px', marginBottom: '15px', display: errorMsg ? 'block' : 'none', fontWeight: 700, textAlign: 'center' }}>
          ⚠️ {errorMsg}
        </div>
        
        {/* ช่องกรอกอีเมล */}
        <input 
          type="email" 
          id="auth-email" 
          placeholder="อีเมลผู้ใช้งาน" 
          className="driver-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleEmailKeyDown}
          style={{ width: '100%', marginBottom: '15px' }} 
        />
        
        {/* ช่องกรอกรหัสผ่าน */}
        <input 
          type="password" 
          id="auth-password" 
          placeholder="รหัสผ่าน (Password)" 
          className="driver-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handlePasswordKeyDown}
          style={{ width: '100%', marginBottom: '25px' }} 
        />
        
        {/* ปุ่มกดเข้าสู่ระบบ */}
        <button 
          className="auth-btn" 
          id="auth-btn" 
          onClick={handleAuth}
          disabled={loading}
          style={{ width: '100%', padding: '15px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px' }}
        >
          {loading ? (
            <><i className="ph-duotone ph-spinner-gap spin i-icon" style={{ marginRight: '10px' }}></i> กำลังตรวจสอบสิทธิ์...</>
          ) : (
            <><i className="ph-duotone ph-sign-in i-icon" style={{ marginRight: '10px' }}></i> เข้าสู่ระบบทันที</>
          )}
        </button>
        
        {/* 🟢 3. บังคับใส่ข้อความระบุเงื่อนไขการใช้งานชัดเจน แทนปุ่มสมัครสมาชิกเดิม */}
        <div style={{ marginTop: '35px', padding: '12px', background: 'var(--primary-bg)', borderRadius: '15px', border: '1px dashed var(--primary)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 700, textAlign: 'center', lineHeight: '1.4' }}>
            🔒 ระบบปิดสำหรับพนักงานขับรถ Ezzy Truck เท่านั้น<br/>
            <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 600 }}>
              *กรณีไม่มีบัญชีหรือลืมรหัสผ่าน กรุณาติดต่อหัวหน้างาน/แอดมิน เพื่อขอรับสิทธิ์ใช้งาน
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}
