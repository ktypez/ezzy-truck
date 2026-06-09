import { useState, useCallback, useMemo } from 'react';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const MIN_YEAR = 2026;
const MAX_YEAR = 2045;

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

  // Generate year options from MIN_YEAR to MAX_YEAR
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
      e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
    }
  };
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
  };

  return (
    <>
      {/* Main selector bar */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
        padding: '4px 10px', width: '100%',
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
            display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer',
            padding: '6px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'background 0.2s',
            flex: 1, justifyContent: 'center',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          <span style={{
            fontSize: 17, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}>
            {MONTHS_TH[month]}
          </span>
          <span style={{
            fontSize: 16, fontWeight: 600, color: 'var(--muted)',
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
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 501,
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            padding: 'var(--space-lg)',
            width: 'calc(100% - 48px)', maxWidth: 340,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 16, textAlign: 'center' }}>
              เลือกเดือน / ปี
            </div>

            {/* Month & Year picker side by side */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {/* Month picker */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textAlign: 'center' }}>
                  เดือน
                </div>
                <div style={{
                  maxHeight: 220, overflowY: 'auto', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  {MONTHS_TH.map((m, i) => (
                    <div
                      key={i}
                      onClick={() => setPickMonth(i)}
                      style={{
                        padding: '8px 10px', cursor: 'pointer', textAlign: 'center',
                        fontSize: 15, fontWeight: i === pickMonth ? 700 : 500,
                        color: i === pickMonth ? 'var(--primary)' : 'var(--text)',
                        background: i === pickMonth ? 'var(--primary-bg)' : 'transparent',
                        borderBottom: i < 11 ? '1px solid rgba(255,255,255,0.04)' : 'none',
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
              </div>

              {/* Year picker */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textAlign: 'center' }}>
                  ปี
                </div>
                <div style={{
                  maxHeight: 220, overflowY: 'auto', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  {yearOptions.map((y) => (
                    <div
                      key={y}
                      onClick={() => setPickYear(y)}
                      style={{
                        padding: '8px 10px', cursor: 'pointer', textAlign: 'center',
                        fontSize: 15, fontWeight: y === pickYear ? 700 : 500,
                        color: y === pickYear ? 'var(--primary)' : 'var(--text)',
                        background: y === pickYear ? 'var(--primary-bg)' : 'transparent',
                        borderBottom: y < MAX_YEAR ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (y !== pickYear) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (y !== pickYear) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {y + 543}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={confirmPick}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: 14,
                background: 'var(--primary)', color: 'white', fontWeight: 700,
                fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'opacity 0.15s',
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
