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
  width: 44, minWidth: 44, height: 44, cursor: 'pointer',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 14,
  color: 'var(--text)',
  fontSize: 26, fontWeight: 500, fontFamily: 'inherit',
  transition: 'all 0.2s', lineHeight: 1, flexShrink: 0,
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

  const confirmPick = () => {
    const diff = (pickYear - year) * 12 + (pickMonth - month);
    if (diff !== 0) onChangeMonth(diff);
    setShowPopup(false);
  };

  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    if (e.currentTarget.style.pointerEvents !== 'none') {
      e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
    }
  };
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
  };

  return (
    <>
      {/* Main selector bar */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center',
        padding: '6px 12px', width: '100%',
      }}>
        <button
          onClick={prevMonth}
          style={canPrevMonth ? glassBtn : glassBtnDisabled}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          aria-label="ก่อนหน้า"
        >‹</button>

        <div
          onClick={openPopup}
          style={{
            display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer',
            padding: '10px 20px', borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            transition: 'background 0.2s',
            flex: 1, justifyContent: 'center',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          <span style={{
            fontSize: 22, fontWeight: 800, color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}>
            {MONTHS_TH[month]}
          </span>
          <span style={{
            fontSize: 20, fontWeight: 700, color: 'var(--muted)',
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
              background: 'rgba(0,0,0,0.65)',
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 501,
            background: 'var(--card-bg)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '24px',
            width: 'calc(100% - 32px)', maxWidth: 360,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
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

            {/* Month grid 3x4 */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
              marginBottom: 12,
            }}>
              {MONTHS_SHORT.map((m, i) => (
                <div
                  key={i}
                  onClick={() => setPickMonth(i)}
                  style={{
                    padding: '8px 0', cursor: 'pointer', textAlign: 'center',
                    fontSize: 15, fontWeight: i === pickMonth ? 700 : 500,
                    color: i === pickMonth ? 'var(--primary)' : 'var(--text)',
                    background: i === pickMonth ? 'var(--primary-bg)' : 'transparent',
                    borderRadius: 10,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (i !== pickMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (i !== pickMonth) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {m}
                </div>
              ))}
            </div>

            {/* Day dots - simple calendar hint */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              alignItems: 'center', marginBottom: 16,
            }}>
              {[0,1,2,3,4].map(row => (
                <div key={row} style={{ display: 'flex', gap: 2 }}>
                  {[0,1,2,3,4,5,6].map(col => {
                    const day = row * 7 + col + 1;
                    const isFilled = day <= 28;
                    const isHighlighted = isFilled && day === 15;
                    return (
                      <div
                        key={col}
                        style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: isHighlighted
                            ? 'var(--primary)'
                            : isFilled
                              ? 'rgba(255,255,255,0.15)'
                              : 'transparent',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Confirm button */}
            <button
              onClick={confirmPick}
              style={{
                width: '100%', padding: '14px', border: 'none', borderRadius: 14,
                background: 'var(--primary)', color: 'white', fontWeight: 800,
                fontSize: 18, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'opacity 0.15s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              ตกลง
            </button>
          </div>
        </>
      )}
    </>
  );
}
