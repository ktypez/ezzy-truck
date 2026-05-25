'use client';

interface HeaderProps {
  userEmail: string;
  currentDate: Date;
  onChangeMonth: (diff: number) => void;
  activeView: string;
  onSwitchView: (view: string) => void;
  onOpenModal: (modalName: 'profile' | 'theme' | null) => void;
  onLogout: () => void;
  onOpenCalendar: () => void; 
}

export default function Header({
  userEmail,
  currentDate,
  onChangeMonth,
  activeView,
  onSwitchView,
  onOpenModal,
  onLogout,
  onOpenCalendar 
}: HeaderProps) {
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  return (
    <>
      <div className="sticky-header">
        <div className="user-bar">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onOpenModal('profile')}>
            <i className="ph-duotone ph-user i-sm"></i> <span>{userEmail}</span>
          </div>
          <div onClick={() => onOpenModal('theme')} style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <i className="ph-duotone ph-palette i-sm"></i> ตั้งค่าธีม
          </div>
          <div style={{ cursor: 'pointer', opacity: 0.6, display: 'flex', alignItems: 'center' }} onClick={onLogout}>
            <i className="ph-duotone ph-sign-out i-sm"></i> ออกจากระบบ
          </div>
        </div>
        
        <div className="header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <button className="del-btn-small" style={{ width: '35px', height: '35px' }} onClick={() => onChangeMonth(-1)}>
              <i className="ph-duotone ph-caret-left"></i>
            </button>
            
            {/* 🟢 ปรับสไตล์ตัวหนังสือชื่อเดือนให้หนาขึ้น */}
            <h2 
              style={{ 
                fontSize: '22px', /* ปรับลงมานิดนึงเพื่อให้ไม่เบียดกับปุ่มลูกศรในมือถือจอแคบ */
                fontWeight: 800,
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                userSelect: 'none',
              }}
            >
              {`${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`} 
            </h2>
            
            <button className="del-btn-small" style={{ width: '35px', height: '35px' }} onClick={() => onChangeMonth(1)}>
              <i className="ph-duotone ph-caret-right"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
