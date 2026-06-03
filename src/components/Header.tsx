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
  return (
    <>
      <div className="sticky-header">
        <div className="user-bar">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--muted)' }} onClick={() => onOpenModal('profile')}>
            <i className="ph-duotone ph-user i-sm" style={{ color: 'var(--secondary)' }}></i> <span>{userEmail}</span>
          </div>
          <div onClick={() => onOpenModal('theme')} style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <i className="ph-duotone ph-palette i-sm"></i> ตั้งค่าธีม
          </div>
          <div style={{ cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }} onClick={onLogout}>
            <i className="ph-duotone ph-sign-out i-sm"></i> ออกจากระบบ
          </div>
        </div>
      </div>
    </>
  );
}
