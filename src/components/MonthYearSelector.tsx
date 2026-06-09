import DropdownSelect from './DropdownSelect';
import { useCallback } from 'react';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const smallBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 32, minWidth: 32, height: 32, cursor: 'pointer',
  background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontSize: 18, fontWeight: 600, fontFamily: 'inherit',
  transition: 'border-color 0.15s', lineHeight: 1,
};

const labelStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: 'var(--text)',
  textAlign: 'center', whiteSpace: 'nowrap',
};

export default function MonthYearSelector({ currentDate, onChangeMonth }: {
  currentDate: Date; onChangeMonth: (diff: number) => void;
}) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const monthOptions = MONTHS_TH.map((m, i) => ({ label: m, value: i }));
  const handleMonthChange = (val: string | number) => {
    const newMonth = Number(val);
    onChangeMonth(newMonth - month);
  };

  const prevMonth = useCallback(() => onChangeMonth(-1), [onChangeMonth]);
  const nextMonth = useCallback(() => onChangeMonth(1), [onChangeMonth]);
  const prevYear = useCallback(() => onChangeMonth(-12), [onChangeMonth]);
  const nextYear = useCallback(() => onChangeMonth(12), [onChangeMonth]);

  const hoverIn = (e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.borderColor = 'var(--primary)';
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.borderColor = 'var(--border)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={prevMonth} style={smallBtn} onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="เดือนก่อนหน้า">‹</button>
        <DropdownSelect
          options={monthOptions}
          value={month}
          onChange={handleMonthChange}
          style={{ minWidth: 140 }}
        />
        <button onClick={nextMonth} style={smallBtn} onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="เดือนถัดไป">›</button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={prevYear} style={smallBtn} onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="ปีก่อนหน้า">‹</button>
        <span style={{ ...labelStyle, fontSize: 15 }}>{year + 543}</span>
        <button onClick={nextYear} style={smallBtn} onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="ปีถัดไป">›</button>
      </div>
    </div>
  );
}
