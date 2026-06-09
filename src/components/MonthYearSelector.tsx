/**
 * MonthYearSelector (แถบเลือก เดือน ปี ด้านบน)
 *   - แถบหลัก: MonthYearSelector bar
 *   - Popup ปฏิทิน: MonthYearPicker popup
 */
import { useState, useCallback, useMemo } from 'react';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const MIN_YEAR = 2026;
const MAX_YEAR = 2045;

const glassBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 48, minWidth: 48, cursor: 'pointer',
  background: 'var(--glass-bg, rgba(255,255,255,0.7))',
  backdropFilter: 'blur(6px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(6px) saturate(1.4)',
  border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
  borderRadius: 14,
  color: 'var(--text)',
  fontSize: 24, fontWeight: 500, fontFamily: 'inherit',
  transition: 'all 0.2s', lineHeight: 1, flexShrink: 0,
  padding: '6px 0',
};

const glassBtnDisabled: React.CSSProperties = {
  ...glassBtn, opacity: 0.25, cursor: 'default', pointerEvents: 'none',
};

export default function MonthYearSelector({ currentDate, onChangeMonth }: {
  currentDate: Date; onChangeMonth: (diff: number) => void;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) years.push(y);
    return years;
  }, []);

  const [pickMonth, setPickMonth] = useState(month);
  const [pickYear, setPickYear] = useState(year);

  const canPrevYear = year > MIN_YEAR;
  const canPrevMonth = year > MIN_YEAR || (year === MIN_YEAR && month > 0);

  const prevMonth = useCallback(() => {
    if (canPrevMonth) onChangeMonth(-1);
  }, [canPrevMonth, onChangeMonth]);
  const nextMonth = useCallback(() => onChangeMonth(1), [onChangeMonth]);
  const nextYear = useCallback(() => onChangeMonth(12), [onChangeMonth]);

  const openPopup = () => {
    setPickMonth(month);
    setPickYear(year);
    setShowPopup(true);
  };

  const handleMonthPick = (i: number) => {
    const diff = (pickYear - year) * 12 + (i - month);
    if (diff !== 0) onChangeMonth(diff);
    setShowPopup(false);
  };

  const confirmPick = () => {
    const diff = (pickYear - year) * 12 + (pickMonth - month);
    if (diff !== 0) onChangeMonth(diff);
    setShowPopup(false);
  };

  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    if (e.currentTarget.style.pointerEvents !== 'none') {
      e.currentTarget.style.background = 'var(--primary-bg)';
      e.currentTarget.style.borderColor = 'var(--primary)';
    }
  };
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'var(--glass-bg, rgba(255,255,255,0.7))';
    e.currentTarget.style.borderColor = 'var(--glass-border, rgba(0,0,0,0.08))';
  };

  return (
    <>
      {/* Main selector bar */}
      {/* MonthYearSelector bar — glass outer container */}
      <div style={{
        display: 'flex', gap: 'var(--space-sm)', alignItems: 'stretch', justifyContent: 'center',
        padding: 'var(--space-md)', width: '100%',
        background: 'var(--glass-bg, rgba(255,255,255,0.7))',
        backdropFilter: 'blur(4px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
        border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
        borderRadius: 20,
      }}>
        <button
          onClick={prevMonth}
          style={canPrevMonth ? glassBtn : glassBtnDisabled}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          aria-label="ก่อนหน้า"
        >‹</button>

        {/* MonthYearPicker popup — tap to open */}
        <div
          onClick={openPopup}
          style={{
            display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer',
            padding: 'var(--space-xs) var(--space-lg)', borderRadius: 14,
            background: 'var(--glass-bg, rgba(255,255,255,0.7))',
            border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
            transition: 'all 0.2s',
            flex: 1, justifyContent: 'center',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--glass-bg, rgba(255,255,255,0.7))';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--glass-bg, rgba(255,255,255,0.7))';
            e.currentTarget.style.borderColor = 'var(--glass-border, rgba(0,0,0,0.08))';
          }}
        >
          <span style={{
            fontSize: 22, fontWeight: 800, color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}>
            {MONTHS_TH[month]}
          </span>
          <span style={{
            fontSize: 20, fontWeight: 800, color: 'var(--primary)',
            whiteSpace: 'nowrap',
          }}>
            {year + 543}
          </span>
        </div>

        <button
          onClick={nextMonth}
          style={glassBtn}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          aria-label="ถัดไป"
        >›</button>
      </div>

      {/* Popup Overlay */}
      {showPopup && (
        <>
          <div
            onClick={() => setShowPopup(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 500,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 501,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(4px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 'var(--space-xl)',
            width: 'calc(100% - 40px)', maxWidth: 420,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}>
            {/* Year selector at top */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginBottom: 16,
            }}>
              <button
                onClick={() => setPickYear(p => p > MIN_YEAR ? p - 1 : p)}
                style={{
                  ...glassBtn, width: 30, minWidth: 30, height: 30, fontSize: 18,
                  opacity: pickYear > MIN_YEAR ? 1 : 0.25,
                  pointerEvents: pickYear > MIN_YEAR ? 'auto' : 'none',
                }}
              >‹</button>
              <span style={{
                fontSize: 22, fontWeight: 800, color: 'var(--text)',
                minWidth: 70, textAlign: 'center',
              }}>
                {pickYear + 543}
              </span>
              <button
                onClick={() => setPickYear(p => p < MAX_YEAR ? p + 1 : p)}
                style={{
                  ...glassBtn, width: 30, minWidth: 30, height: 30, fontSize: 18,
                  opacity: pickYear < MAX_YEAR ? 1 : 0.25,
                  pointerEvents: pickYear < MAX_YEAR ? 'auto' : 'none',
                }}
              >›</button>
            </div>

            {/* Month grid 3x4 with mini calendar dots */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
              marginBottom: 16,
            }}>
              {MONTHS_TH.map((m, i) => {
                const daysInMonth = new Date(pickYear, i + 1, 0).getDate();
                const firstDay = new Date(pickYear, i, 1).getDay();
                const today = new Date();
                const miniRows = [];
                const totalMiniCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
                for (let c = 0; c < totalMiniCells; c++) {
                  const dayNum = c - firstDay + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const isToday = isValid && pickYear === today.getFullYear() && i === today.getMonth() && dayNum === today.getDate();
                  if (c % 7 === 0) {
                    const rowCells = [];
                    for (let cc = c; cc < c + 7 && cc < totalMiniCells; cc++) {
                      const d = cc - firstDay + 1;
                      const v = d >= 1 && d <= daysInMonth;
                      const t = v && pickYear === today.getFullYear() && i === today.getMonth() && d === today.getDate();
                      rowCells.push(
                        <div key={cc}
                          style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: t ? 'var(--primary)' : v ? 'rgba(255,255,255,0.20)' : 'transparent',
                          }}
                        />
                      );
                    }
                    miniRows.push(
                      <div key={c} style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {rowCells}
                      </div>
                    );
                  }
                }
                return (
                  <div
                    key={i}
                    onClick={() => handleMonthPick(i)}
                    style={{
                      padding: '6px 0', cursor: 'pointer', textAlign: 'center',
                      fontSize: 14, fontWeight: i === pickMonth ? 700 : 500,
                      color: i === pickMonth ? 'var(--primary)' : 'var(--text)',
                      background: i === pickMonth
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(255,255,255,0.03)',
                      borderRadius: 12,
                      border: i === pickMonth
                        ? '1px solid var(--primary)'
                        : '1px solid transparent',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (i !== pickMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      if (i !== pickMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>{m}</div>
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 1,
                      alignItems: 'center',
                    }}>
                      {miniRows}
                    </div>
                  </div>
                );
              })}
            </div>


          </div>
        </>
      )}
    </>
  );
}