'use client';
import { useState, useEffect, useRef } from 'react';
import { sb } from '@/lib/supabase';

interface DailyViewProps {
  userId: string;
  currentDate: Date;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSaveSuccess: () => void;
  currentShift: string;        
}

export default function DailyView({
  userId,
  currentDate,
  selectedDay,
  onSelectDay,
  onSaveSuccess,
  currentShift,
}: DailyViewProps) {
  const daysShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const sliderRef = useRef<HTMLDivElement>(null);

  const [isWork, setIsWork] = useState(true);
  const [dayType, setDayType] = useState('normal');
  const [odoIn, setOdoIn] = useState('');
  const [odoOut, setOdoOut] = useState('');
  const [otHours, setOtHours] = useState('');
  const [lateMin, setLateMin] = useState('');
  const [roundCount, setRoundCount] = useState(0);
  const [pointCount, setPointCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [showShiftSelector, setShowShiftSelector] = useState(false);
  const [isSavingShift, setIsSavingShift] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const allDaysArray = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1, i + 1);
    return { dayNum: i + 1, dayName: daysShort[d.getDay()] };
  });

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  };

  useEffect(() => {
    if (sliderRef.current) {
      const activeElement = sliderRef.current.querySelector(`[data-day="${selectedDay}"]`) as HTMLElement;
      if (activeElement) {
        const slider = sliderRef.current;
        const scrollLeft = activeElement.offsetLeft - (slider.clientWidth / 2) + (activeElement.clientWidth / 2);
        slider.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedDay]);

  useEffect(() => {
    async function loadDayData() {
      setIsWork(true); setDayType('normal'); setOdoIn(''); setOdoOut(''); setOtHours(''); setLateMin(''); setRoundCount(0); setPointCount(0);
      const { data } = await sb.from('logs').select('*')
        .eq('user_id', userId).eq('year', currentYear).eq('month', currentMonth).eq('day', selectedDay).maybeSingle();
      if (data) {
        const isHoliday = data.shift_time === 'หยุด' || data.day_type === 'วันหยุด' || data.is_work === false;
        setIsWork(!isHoliday);
        if (!isHoliday) {
          setDayType(data.day_type === 'special' ? 'special' : 'normal');
          setOdoIn(data.odo_in ? String(data.odo_in) : '');
          setOdoOut(data.odo_out ? String(data.odo_out) : '');
          setOtHours(data.ot ? String(data.ot) : '');
          setLateMin(data.late ? String(data.late) : '');
          setRoundCount(data.rounds || 0);
          setPointCount(data.points || 0);
        }
      }
    }
    loadDayData();
  }, [selectedDay, currentDate, userId]);

  const handleQuickSaveShift = async (chosenShift: string) => {
    if (!selectedDay || !chosenShift) return;
    setIsSavingShift(true);
    const isHoliday = chosenShift === 'หยุด';
    try {
      const payload: any = {
        user_id: userId, year: currentYear, month: currentMonth, day: selectedDay,
        shift_time: chosenShift, day_type: isHoliday ? 'วันหยุด' : 'วันทำงาน', is_work: !isHoliday
      };
      if (isHoliday) Object.assign(payload, { odo_in: 0, odo_out: 0, ot: 0, late: 0, drivers: [], trucks: 0, odo: 0 });
      const { error } = await sb.from('logs').upsert(payload, { onConflict: 'user_id,year,month,day' });
      if (error) { alert('เกิดข้อผิดพลาด: ' + error.message); } else { setShowShiftSelector(false); onSaveSuccess(); }
    } catch (err: any) { alert(err.message); } finally { setIsSavingShift(false); }
  };

  const distance = Math.max(0, (parseFloat(odoOut) || 0) - (parseFloat(odoIn) || 0));

  const handleSave = async () => {
    setSaveStatus('saving');
    const payload: any = {
      user_id: userId, year: currentYear, month: currentMonth, day: selectedDay,
      is_work: isWork, shift_time: currentShift || null
    };
    if (isWork) {
      Object.assign(payload, {
        day_type: dayType, odo_in: parseFloat(odoIn) || 0, odo_out: parseFloat(odoOut) || 0,
        ot: parseFloat(otHours) || 0, late: parseInt(lateMin) || 0, rounds: roundCount, points: pointCount,
        trucks: roundCount, odo: distance, drivers: []
      });
    } else {
      Object.assign(payload, { day_type: 'วันหยุด', shift_time: 'หยุด', is_work: false,
        odo_in: 0, odo_out: 0, ot: 0, late: 0, rounds: 0, points: 0, trucks: 0, odo: 0, drivers: [] });
    }
    const { error } = await sb.from('logs').upsert(payload, { onConflict: 'user_id,year,month,day' });
    if (error) { alert("เกิดข้อผิดพลาด: " + error.message); setSaveStatus('idle'); }
    else { setSaveStatus('success'); onSaveSuccess(); setTimeout(() => setSaveStatus('idle'), 2000); }
  };

  return (
    <div id="view-daily" className="view active">
      
      {/* Date Slider */}
      <div className="date-slider-container" ref={sliderRef}>
        {allDaysArray.map(item => {
          const isActive = selectedDay === item.dayNum;
          const today = isToday(item.dayNum);
          return (
            <div key={item.dayNum} onClick={() => onSelectDay(item.dayNum)}
              className={`date-slider-item ${isActive ? 'active' : ''} ${today && !isActive ? 'today' : ''}`}
              data-day={item.dayNum}
            >
              <span className="slider-day-name">{item.dayName}</span>
              <span className="slider-day-num">{item.dayNum}</span>
            </div>
          );
        })}
      </div>

      {/* Shift badge + Day type */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, background: 'var(--primary-bg)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowShiftSelector(true)}>
          <i className={`ph-duotone ${currentShift === 'หยุด' ? 'ph-prohibit' : 'ph-clock'} i-sm`} style={{ color: currentShift === 'หยุด' ? '#e74c3c' : 'var(--secondary)' }}></i>
          <span style={{ fontSize: '16px', fontWeight: 700, color: currentShift === 'หยุด' ? '#e74c3c' : 'var(--text)' }}>
            {currentShift ? (currentShift === 'หยุด' ? 'วันหยุด' : `เข้ากะ ${currentShift}`) : 'แตะเพื่อเข้ากะ'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          <button type="button" onClick={() => setDayType('normal')}
            style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', flex: 1, background: dayType === 'normal' ? 'var(--primary)' : 'var(--border)', color: dayType === 'normal' ? 'var(--active-date-text, white)' : 'var(--muted)' }}>
            ปกติ
          </button>
          <button type="button" onClick={() => setDayType('special')}
            style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', flex: 1, background: dayType === 'special' ? 'var(--primary)' : 'var(--border)', color: dayType === 'special' ? 'var(--active-date-text, white)' : 'var(--muted)' }}>
            x2
          </button>
        </div>
      </div>

      {isWork ? (
        <>
          {/* Summary Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-around', background: 'var(--primary-bg)', borderRadius: '14px', padding: '12px', marginBottom: '12px', border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.3px' }}>ระยะทาง</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{distance} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>กม.</span></div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.3px' }}>รอบ</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{roundCount} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>รอบ</span></div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.3px' }}>จุดส่ง</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{pointCount} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>จุด</span></div>
            </div>
          </div>

          {/* Odometer Card */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-duotone ph-speedometer" style={{ color: 'var(--secondary)' }}></i> ไมล์รถ
            </div>
            <div className="input-group"><span>ไมล์เข้า</span><input type="number" id="odoIn" className="input-field input-field-accent" value={odoIn} onChange={e => setOdoIn(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('odoOut')?.focus() }} /></div>
            <div className="input-group"><span>ไมล์ออก</span><input type="number" id="odoOut" className="input-field input-field-accent" value={odoOut} onChange={e => setOdoOut(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('otHours')?.focus() }} /></div>
            <div className="input-group"><span>ชั่วโมง OT</span><input type="number" step="0.5" id="otHours" className="input-field input-field-accent" value={otHours} onChange={e => setOtHours(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('lateMin')?.focus() }} /></div>
            <div className="input-group"><span>สาย (นาที)</span><input type="number" id="lateMin" className="input-field input-field-accent" value={lateMin} onChange={e => setLateMin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></div>
          </div>

          {/* Rounds & Points Card */}
          <div className="card" style={{ display: 'flex', gap: '10px', padding: '12px 10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="ph-duotone ph-arrows-clockwise i-sm" style={{ color: 'var(--secondary)' }}></i> รอบ
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button type="button" className="del-btn-small" onClick={() => setRoundCount(prev => Math.max(0, prev - 1))}><i className="ph-bold ph-minus"></i></button>
                <input type="number" inputMode="numeric" value={roundCount === 0 ? '' : roundCount} placeholder="0"
                  onChange={e => setRoundCount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '52px', height: '40px', fontSize: '32px', fontWeight: 800, margin: '0 4px', textAlign: 'center', border: 'none', outline: 'none', background: 'var(--primary-bg)', borderRadius: '10px', color: 'var(--text)' }} />
                <button type="button" className="del-btn-small" onClick={() => setRoundCount(prev => prev + 1)}><i className="ph-bold ph-plus"></i></button>
              </div>
            </div>
            <div style={{ borderLeft: '1px dashed var(--border)', height: '55px', alignSelf: 'center' }}></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="ph-duotone ph-map-trifold i-sm" style={{ color: 'var(--secondary)' }}></i> จุด
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button type="button" className="del-btn-small" onClick={() => setPointCount(prev => Math.max(0, prev - 1))}><i className="ph-bold ph-minus"></i></button>
                <input type="number" inputMode="numeric" value={pointCount === 0 ? '' : pointCount} placeholder="0"
                  onChange={e => setPointCount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '52px', height: '40px', fontSize: '32px', fontWeight: 800, margin: '0 4px', textAlign: 'center', border: 'none', outline: 'none', background: 'var(--primary-bg)', borderRadius: '10px', color: 'var(--text)' }} />
                <button type="button" className="del-btn-small" onClick={() => setPointCount(prev => prev + 1)}><i className="ph-bold ph-plus"></i></button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>😴</div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>วันหยุดพักผ่อน</h3>
          <p style={{ fontSize: '16px', color: 'var(--muted)' }}>พักผ่อนให้เต็มที่ หรือแตะปุ่มด้านบนเพื่อเปลี่ยนกะ</p>
        </div>
      )}

      {/* Save Button */}
      <button className={`main-save-btn ${saveStatus === 'success' ? 'success' : ''}`} onClick={handleSave} disabled={saveStatus === 'saving'}>
        <i className={`ph-duotone ${saveStatus === 'success' ? 'ph-check-circle' : saveStatus === 'saving' ? 'ph-spinner-gap spin' : 'ph-floppy-disk'} i-icon`}></i>
        {saveStatus === 'success' ? ' บันทึกเรียบร้อย ✨' : saveStatus === 'saving' ? ' กำลังบันทึก...' : ' บันทึกข้อมูลวันนี้'}
      </button>

      {/* Bottom Sheet Shift Selector */}
      {/* Backdrop */}
      <div onClick={() => setShowShiftSelector(false)} style={{ position: 'fixed', inset: 0, zIndex: 250, display: showShiftSelector ? 'block' : 'none', background: 'rgba(0,0,0,0.3)' }} />
      
      <div className={`shift-sheet ${showShiftSelector ? 'open' : ''}`} style={{ zIndex: 300 }}>
        <div className="shift-sheet-handle" />
        <div className="shift-sheet-header">
          <h4>วันที่ {selectedDay} {months[currentMonth - 1]} {currentYear}</h4>
          <button className="shift-sheet-close" onClick={() => setShowShiftSelector(false)}><i className="ph-bold ph-x"></i></button>
        </div>
        <div className="shift-sheet-body">
          <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderSpacing: '8px 0' }}>
            {['07:00', '08:00', '09:00'].map(time => {
              const sel = currentShift === time;
              return (
                <div key={time} onClick={() => !isSavingShift && handleQuickSaveShift(time)}
                  style={{ display: 'table-cell', padding: '14px 0', textAlign: 'center', borderRadius: '12px', cursor: isSavingShift ? 'default' : 'pointer', fontWeight: 700, fontSize: '16px',
                    border: sel ? '2px solid transparent' : '2px solid var(--border)', background: sel ? 'var(--primary)' : 'transparent', color: sel ? 'var(--active-date-text, white)' : 'var(--text)', opacity: isSavingShift ? 0.6 : 1 }}>
                  {time}
                </div>
              );
            })}
          </div>
          <div onClick={() => !isSavingShift && handleQuickSaveShift('หยุด')}
            style={{ width: '100%', padding: '14px 0', textAlign: 'center', borderRadius: '12px', cursor: isSavingShift ? 'default' : 'pointer', fontWeight: 700, fontSize: '16px', marginTop: '10px',
              border: currentShift === 'หยุด' ? '2px solid transparent' : '2px solid var(--border)', background: currentShift === 'หยุด' ? '#e74c3c' : 'transparent', color: currentShift === 'หยุด' ? 'white' : 'var(--text)', opacity: isSavingShift ? 0.6 : 1 }}>
            🛑 วันหยุด
          </div>
        </div>
      </div>
    </div>
  );
}
