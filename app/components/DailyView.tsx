'use client';
import { useState, useEffect, useRef } from 'react'; // 🟢 เพิ่ม useRef เข้ามาช่วยจับตำแหน่งวัน
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
  
  // 🟢 ตัวจับตำแหน่งของตัว Slide (สไลเดอร์หลัก)
  const sliderRef = useRef<HTMLDivElement>(null);

  // Form States
  const [isWork, setIsWork] = useState(true);
  const [dayType, setDayType] = useState('normal');
  const [odoIn, setOdoIn] = useState('');
  const [odoOut, setOdoOut] = useState('');
  const [otHours, setOtHours] = useState('');
  const [lateMin, setLateMin] = useState('');
  
  // ตัวแปร รอบ และ จุด
  const [roundCount, setRoundCount] = useState(0);
  const [pointCount, setPointCount] = useState(0);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [showShiftSelector, setShowShiftSelector] = useState(false);
  const [isSavingShift, setIsSavingShift] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // 🟢 ลอจิกเจนวันใหม่: ดึงวันทั้งหมดในเดือนนั้นออกมากองยาวๆ เพื่อให้ปัดนิ้วสไลด์ได้แบบไร้ขีดจำกัด
  const getAllDaysInMonth = () => {
    const items = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(currentYear, currentMonth - 1, day);
      items.push({ dayNum: day, dayName: daysShort[d.getDay()] });
    }
    return items;
  };

  const allDaysArray = getAllDaysInMonth();

  // 🟢 หมัดเด็ดเล็งเป้า Auto-Scroll: ดักจับทุกครั้งที่เปลี่ยน selectedDay บังคับให้หน้าจอสไลด์วิ่งไปหาวันนั้นให้อยู่ตรงกลางจอทันที
  useEffect(() => {
    if (sliderRef.current) {
      const activeElement = sliderRef.current.querySelector(`[data-day="${selectedDay}"]`) as HTMLElement;
      if (activeElement) {
        const slider = sliderRef.current;
        // คำนวณจุดกึ่งกลางเพื่อให้วันปัจจุบันเด้งมาอยู่กลางแผงสวยๆ ไม่ชิดขอบซ้ายเกินไป
        const scrollLeft = activeElement.offsetLeft - (slider.clientWidth / 2) + (activeElement.clientWidth / 2);
        slider.scrollTo({
          left: scrollLeft,
          behavior: 'smooth' // เลื่อนไปแบบนุ่มนวลไหลลื่น
        });
      }
    }
  }, [selectedDay]); // ทำงานทันทีเมื่อเปลี่ยนวันที่

  // โหลดข้อมูลเก่ารายวัน
  useEffect(() => {
    async function loadDayData() {
      setIsWork(true); setDayType('normal'); setOdoIn(''); setOdoOut(''); setOtHours(''); setLateMin(''); setRoundCount(0); setPointCount(0);
      
      const { data } = await sb.from('logs').select('*')
        .eq('user_id', userId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .eq('day', selectedDay)
        .maybeSingle();

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
        user_id: userId,
        year: currentYear,
        month: currentMonth,
        day: selectedDay,
        shift_time: chosenShift,
        day_type: isHoliday ? 'วันหยุด' : dayType,
        is_work: !isHoliday
      };

      if (isHoliday) {
        Object.assign(payload, { 
          day_type: 'วันหยุด', is_work: false, 
          odo_in: 0, odo_out: 0, ot: 0, late: 0, rounds: 0, points: 0, trucks: 0, odo: 0, drivers: [] 
        });
        setIsWork(false);
      } else {
        setIsWork(true);
      }

      const { error } = await sb.from('logs').upsert(payload, { onConflict: 'user_id,year,month,day' });
      if (error) throw error;
      setShowShiftSelector(false); onSaveSuccess(); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSavingShift(false);
    }
  };

  const distance = Math.max(0, (parseFloat(odoOut) || 0) - (parseFloat(odoIn) || 0));

  const handleSave = async () => {
    setSaveStatus('saving');
    const payload: any = {
      user_id: userId,
      year: currentYear,
      month: currentMonth,
      day: selectedDay,
      is_work: isWork,
      shift_time: currentShift || null 
    };

    if (isWork) {
      Object.assign(payload, {
        day_type: dayType, 
        odo_in: parseFloat(odoIn) || 0,
        odo_out: parseFloat(odoOut) || 0,
        ot: parseFloat(otHours) || 0,
        late: parseInt(lateMin) || 0,
        rounds: roundCount,
        points: pointCount,
        trucks: roundCount, 
        odo: distance,
        drivers: []
      });
    } else {
      Object.assign(payload, { 
        day_type: 'วันหยุด', shift_time: 'หยุด', is_work: false, 
        odo_in: 0, odo_out: 0, ot: 0, late: 0, rounds: 0, points: 0, trucks: 0, odo: 0, drivers: []
      });
    }

    const { error } = await sb.from('logs').upsert(payload, { onConflict: 'user_id,year,month,day' });
    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message); setSaveStatus('idle');
    } else {
      setSaveStatus('success'); onSaveSuccess(); setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <div id="view-daily" className="view active">
      
      {/* 📅 ปรับเป็นแผงสไลเดอร์แบบปัดนิ้วได้ ซ่อนสกอร์บาร์ และติดหนึบเลื่อนไปกึ่งกลางตามวันปัจจุบันให้อัตโนมัติ */}
      <div className="date-slider-container" ref={sliderRef}>
        {allDaysArray.map(item => { 
          const isCurrent = selectedDay === item.dayNum;
          return (
            <div 
              key={item.dayNum} 
              onClick={() => onSelectDay(item.dayNum)} 
              className={`date-slider-item ${isCurrent ? 'active' : ''}`}
              data-day={item.dayNum} // ฝัง ID วันเพื่อให้ลอจิกสั่งเลื่อนยิงพิกัดถูกกล่อง
            >
              <span className="slider-day-name">{item.dayName}</span>
              <span className="slider-day-num">{item.dayNum}</span>
            </div>
          );
        })}
      </div>

      {/* แบนเนอร์สรุปรายวันด้านบน */}
      <div className="summary-banner">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}><i className="ph-duotone ph-map-pin-line i-sm"></i> ระยะทาง</div>
          <div className="sum-val"><span>{distance}</span> กม.</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}><i className="ph-duotone ph-arrows-clockwise i-sm"></i> รอบวิ่ง</div>
          <div className="sum-val"><span>{roundCount}</span> รอบ</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}><i className="ph-duotone ph-map-trifold i-sm"></i> จุดส่ง</div>
          <div className="sum-val"><span>{pointCount}</span> จุด</div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="controls-row">
        <div className="segmented-control" style={{ flex: '1' }}>
          <button 
            type="button" 
            className="seg-btn active" 
            onClick={() => setShowShiftSelector(true)} 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '10px 4px',
              color: currentShift === 'หยุด' ? '#e74c3c' : (currentShift ? 'var(--primary)' : 'var(--secondary)'),
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            <i className={`ph-duotone ${currentShift === 'หยุด' ? 'ph-prohibit' : 'ph-clock'} i-sm`} style={{ marginRight: '4px' }}></i>
            <span style={{ fontSize: '12px', fontWeight: 800 }}>
              {currentShift ? (currentShift === 'หยุด' ? 'วันหยุด' : `${currentShift}`) : 'เข้ากะ'}
            </span>
          </button>
        </div>
        
        <div className="segmented-control" style={{ flex: '2' }}>
          <button type="button" className={`seg-btn ${dayType === 'normal' ? 'active' : ''}`} onClick={() => setDayType('normal')}>ปกติ (x1)</button>
          <button type="button" className={`seg-btn ${dayType === 'special' ? 'active' : ''}`} onClick={() => setDayType('special')}>พิเศษ (x2)</button>
        </div>
      </div>

      {isWork ? (
        <div id="form-container">
          {/* การ์ดบันทึกตัวเลขไมล์รถและเวลาสาย */}
          <div className="card">
            <div className="input-group"><span>ไมล์เข้า</span><input type="number" id="odoIn" className="input-field input-field-accent" value={odoIn} onChange={e => setOdoIn(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('odoOut')?.focus() }} /></div>
            <div className="input-group"><span>ไมล์ออก</span><input type="number" id="odoOut" className="input-field input-field-accent" value={odoOut} onChange={e => setOdoOut(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('otHours')?.focus() }} /></div>
            <div className="input-group"><span>ชั่วโมง OT</span><input type="number" step="0.5" id="otHours" className="input-field input-field-accent" value={otHours} onChange={e => setOtHours(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('lateMin')?.focus() }} /></div>
            <div className="input-group"><span>สาย (นาที)</span><input type="number" id="lateMin" className="input-field input-field-accent" value={lateMin} onChange={e => setLateMin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></div>
          </div>

          {/* การ์ดป้อน "รอบ" และ "จุด" เวอร์ชันปุ่มและฟอนต์บิ๊กบึ้ม */}
          <div className="card" style={{ display: 'flex', gap: '10px', padding: '15px 10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px', whiteSpace: 'nowrap' }}>
                <i className="ph-duotone ph-arrows-clockwise i-sm"></i> รอบวิ่ง
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                <button type="button" className="del-btn-small" style={{ width: '48px', height: '45px', background: 'var(--border)' }} onClick={() => setRoundCount(prev => Math.max(0, prev - 1))}><i className="ph-bold ph-minus" style={{ fontSize: '16px' }}></i></button>
                <input type="number" pattern="[0-9]*" inputMode="numeric" value={roundCount === 0 ? '' : roundCount} placeholder="0" 
                  onChange={e => { const val = parseInt(e.target.value); setRoundCount(isNaN(val) ? 0 : Math.max(0, val)); }}
                  onBlur={e => { if (e.target.value === '') setRoundCount(0); }}
                  style={{ width: '56px', height: '45px', fontSize: '28px', fontWeight: 800, margin: '0 4px', textAlign: 'center', border: 'none', outline: 'none', background: 'var(--primary-bg)', borderRadius: '10px', color: 'var(--text)' }}
                />
                <button type="button" className="del-btn-small" style={{ width: '48px', height: '45px', background: 'var(--border)' }} onClick={() => setRoundCount(prev => prev + 1)}><i className="ph-bold ph-plus" style={{ fontSize: '16px' }}></i></button>
              </div>
            </div>

            <div style={{ borderLeft: '1px dashed var(--border)', height: '65px', alignSelf: 'center' }}></div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px', whiteSpace: 'nowrap' }}>
                <i className="ph-duotone ph-map-trifold i-sm"></i> จุดส่งสินค้า
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                <button type="button" className="del-btn-small" style={{ width: '48px', height: '45px', background: 'var(--border)' }} onClick={() => setPointCount(prev => Math.max(0, prev - 1))}><i className="ph-bold ph-minus" style={{ fontSize: '16px' }}></i></button>
                <input type="number" pattern="[0-9]*" inputMode="numeric" value={pointCount === 0 ? '' : pointCount} placeholder="0" 
                  onChange={e => { const val = parseInt(e.target.value); setPointCount(isNaN(val) ? 0 : Math.max(0, val)); }}
                  onBlur={e => { if (e.target.value === '') setPointCount(0); }}
                  style={{ width: '56px', height: '45px', fontSize: '28px', fontWeight: 800, margin: '0 4px', textAlign: 'center', border: 'none', outline: 'none', background: 'var(--primary-bg)', borderRadius: '10px', color: 'var(--text)' }}
                />
                <button type="button" className="del-btn-small" style={{ width: '48px', height: '45px', background: 'var(--border)' }} onClick={() => setPointCount(prev => prev + 1)}><i className="ph-bold ph-plus" style={{ fontSize: '16px' }}></i></button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><i className="ph-duotone ph-coffee i-lg"></i></div>
          <h3 style={{ marginTop: '5px', color: 'var(--primary)' }}>วันนี้เป็นวันหยุด</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>พักผ่อนให้เต็มที่จ้า (เปลี่ยนกะทำงานได้ที่ปุ่มเข้ากะด้านบน)</p>
        </div>
      )}

      {/* ปุ่มบันทึกใหญ่ */}
      <button className={`main-save-btn ${saveStatus === 'success' ? 'success' : ''}`} onClick={handleSave} disabled={saveStatus === 'saving'}>
        <i className={`ph-duotone ${saveStatus === 'success' ? 'ph-check-circle' : saveStatus === 'saving' ? 'ph-spinner-gap spin' : 'ph-floppy-disk'} i-icon`}></i>
        {saveStatus === 'success' ? ' บันทึกข้อมูลเรียบร้อย ✨' : saveStatus === 'saving' ? ' กำลังบันทึก...' : ' บันทึกข้อมูลวันนี้'}
      </button>

      {/* Pop-up เลือกกะด่วน */}
      {showShiftSelector && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '340px', textAlign: 'center', padding: '25px 20px', margin: 0, boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text)' }}>เลือกเวลาเข้างาน วันที่ {selectedDay}/{currentMonth}/{currentYear}</h4>
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '6px 0', margin: '0 -6px 10px -6px' }}>
                {['07:00', '08:00', '09:00'].map(time => {
                  const isSelected = currentShift === time;
                  return (
                    <div key={time} onClick={() => !isSavingShift && handleQuickSaveShift(time)} style={{ display: 'table-cell', padding: '12px 0', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '15px', border: isSelected ? '2px solid transparent' : '2px solid var(--border)', background: isSelected ? 'var(--primary)' : 'transparent', color: isSelected ? 'var(--active-date-text, white)' : 'var(--text)', opacity: isSavingShift ? 0.6 : 1, transition: 'all 0.2s' }}>{time}</div>
                  );
                })}
              </div>
              <div onClick={() => !isSavingShift && handleQuickSaveShift('หยุด')} style={{ width: '100%', padding: '12px 0', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '15px', border: currentShift === 'หยุด' ? '2px solid transparent' : '2px solid var(--border)', background: currentShift === 'หยุด' ? '#e74c3c' : 'transparent', color: currentShift === 'หยุด' ? 'white' : 'var(--text)', opacity: isSavingShift ? 0.6 : 1, transition: 'all 0.2s' }}>🛑 วันหยุด</div>
            </div>
            <button type="button" onClick={() => setShowShiftSelector(false)} disabled={isSavingShift} style={{ width: '100%', padding: '12px', borderRadius: '15px', border: '2px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}>{isSavingShift ? 'กำลังบันทึกกะงาน...' : 'ยกเลิก'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
