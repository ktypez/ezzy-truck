import { useCallback } from 'react';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const MIN_YEAR = 2026;
const MIN_MONTH = 0; // January

const glassBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 34, minWidth: 34, height: 34, cursor: 'pointer',
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(6px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(6px) saturate(1.4)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: 'var(--text)',
  fontSize: 20, fontWeight: 500, fontFamily: 'inherit',
  transition: 'all 0.2s', lineHeight: 1,
};

const glassBtnDisabled: React.CSSProperties = {
  ...glassBtn,
  opacity: 0.25,
  cursor: 'default',
  pointerEvents: 'none',
};

export default function MonthYearSelector({ currentDate, onChangeMonth }: {
  currentDate: Date; onChangeMonth: (diff: number) => void;
}) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const canPrevYear = year > MIN_YEAR;
  const canPrevMonth = year > MIN_YEAR || (year === MIN_YEAR && month > MIN_MONTH);

  const prevMonth = useCallback(() => {
    if (canPrevMonth) onChangeMonth(-1);
  }, [canPrevMonth, onChangeMonth]);
  const nextMonth = useCallback(() => onChangeMonth(1), [onChangeMonth]);
  const nextYear = useCallback(() => onChangeMonth(12), [onChangeMonth]);

  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    if (e.currentTarget.style.pointerEvents !== 'none') {
      e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
    }
  };
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
  };

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
      padding: '2px 0',
    }}>
      <button
        onClick={prevMonth}
        style={canPrevMonth ? glassBtn : glassBtnDisabled}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        aria-label="เดือนก่อนหน้า"
      >‹</button>
      <span style={{
        fontSize: 17, fontWeight: 700, color: 'var(--text)',
        textAlign: 'center', whiteSpace: 'nowrap', minWidth: 100,
      }}>
        {MONTHS_TH[month]}
      </span>
      <button
        onClick={nextMonth}
        style={glassBtn}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        aria-label="เดือนถัดไป"
      >›</button>
      <span style={{
        fontSize: 16, fontWeight: 600, color: 'var(--muted)',
        whiteSpace: 'nowrap', marginLeft: 2,
      }}>
        {year + 543}
      </span>
    </div>
  );
}
