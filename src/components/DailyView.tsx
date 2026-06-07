import MonthYearSelector from './MonthYearSelector';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sb } from '@/lib/supabase';

interface DailyViewProps {
  userId: string;
  currentDate: Date;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSaveSuccess: () => void;
  currentShift: string;
  currentLeaveType?: string | null;
  onChangeMonth: (diff: number) => void;
}

export default function DailyView({
  userId,
  currentDate,
  selectedDay,
  onSelectDay,
  onSaveSuccess,
  currentShift,
  currentLeaveType,
  onChangeMonth,
}: DailyViewProps) {
  const queryClient = useQueryClient();
  const daysShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const sliderRef = useRef<HTMLDivElement>(null);

  const [isWork, setIsWork] = useState(true);
  const [dayType, setDayType] = useState('normal');
  const [leaveType, setLeaveType] = useState<string | null>(null);
  const [odoIn, setOdoIn] = useState('');
  const [odoOut, setOdoOut] = useState('');
  const [otHours, setOtHours] = useState('');
  const [lateMin, setLateMin] = useState('');
  const [roundCount, setRoundCount] = useState(0);
  const [pointCount, setPointCount] = useState(0);
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

  // Fetch day log data via TanStack Query
  const { data: dayData, isFetching } = useQuery({
    queryKey: ['day-log', userId, currentYear, currentMonth, selectedDay],
    queryFn: async () => {
      const { data } = await sb.from('logs').select('*')
        .eq('user_id', userId).eq('year', currentYear).eq('month', currentMonth).eq('day', selectedDay).maybeSingle();
      return data || null;
    },
    enabled: !!userId,
  });

  // Sync local state from fetched data
  useEffect(() => {
    if (dayData) {
      const isHoliday = dayData.shift_time === 'หยุด' || dayData.day_type === 'วันหยุด' || dayData.is_work === false;
      setIsWork(!isHoliday);
      if (isHoliday) {
        setLeaveType(dayData.leave_type || null);
      } else {
        setDayType(dayData.day_type === 'special' ? 'special' : 'normal');
        setOdoIn(dayData.odo_in ? String(dayData.odo_in) : '');
        setOdoOut(dayData.odo_out ? String(dayData.odo_out) : '');
        setOtHours(dayData.ot ? String(dayData.ot) : '');
        setLateMin(dayData.late ? String(dayData.late) : '');
        setRoundCount(dayData.rounds || 0);
        setPointCount(dayData.points || 0);
      }
    } else {
      setIsWork(true); setDayType('normal'); setLeaveType(null);
      setOdoIn(''); setOdoOut(''); setOtHours(''); setLateMin('');
      setRoundCount(0); setPointCount(0);
    }
  }, [dayData]);

  // Mutation: quick save shift (from shift selector)
  const quickShiftMutation = useMutation({
    mutationFn: async ({ chosenShift, chosenLeaveType }: { chosenShift: string; chosenLeaveType?: string | null }) => {
      if (!selectedDay || !chosenShift) return;
      const isHoliday = chosenShift === 'หยุด';
      const payload: any = {
        user_id: userId, year: currentYear, month: currentMonth, day: selectedDay,
        shift_time: chosenShift, day_type: isHoliday ? 'วันหยุด' : 'วันทำงาน', is_work: !isHoliday,
        leave_type: isHoliday ? (chosenLeaveType || null) : null
      };
      if (isHoliday) Object.assign(payload, { odo_in: 0, odo_out: 0, ot: 0, late: 0, drivers: [], trucks: 0, odo: 0 });
      const { error } = await sb.from('logs').upsert(payload, { onConflict: 'user_id,year,month,day' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-log', userId, currentYear, currentMonth, selectedDay] });
      setShowShiftSelector(false);
      onSaveSuccess();
    },
    onError: (err: any) => { alert('เกิดข้อผิดพลาด: ' + err.message); },
  });

  const distance = Math.max(0, (parseFloat(odoOut) || 0) - (parseFloat(odoIn) || 0));

  // Mutation: full save
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const payload: any = {
        user_id: userId,
        year: currentYear,
        month: currentMonth,
        day: selectedDay,
        shift_time: currentShift || null,
        day_type: dayType === 'special' ? 'special' : 'วันทำงาน',
        is_work: true,
        odo_in: parseInt(odoIn) || 0,
        odo_out: parseInt(odoOut) || 0,
        odo: distance,
        ot: parseFloat(otHours) || 0,
        late: parseInt(lateMin) || 0,
        rounds: roundCount,
        points: pointCount,
        drivers: [],
        trucks: 0,
        leave_type: null,
      };
      const { error } = await sb.from('logs').upsert(payload, { onConflict: 'user_id,year,month,day' });
      if (error) throw error;
      setSaveStatus('success');
      queryClient.invalidateQueries({ queryKey: ['day-log', userId, currentYear, currentMonth, selectedDay] });
      onSaveSuccess();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
      setSaveStatus('idle');
    }
  };

  const handleQuickSaveShift = async (chosenShift: string, chosenLeaveType?: string | null) => {
    setIsSavingShift(true);
    await quickShiftMutation.mutateAsync({ chosenShift, chosenLeaveType });
    setIsSavingShift(false);
  };

  return (
    <div id="view-daily">
      {/* Date Month/Year Selector */}
      <MonthYearSelector currentDate={currentDate} onChangeMonth={onChangeMonth} />

      {/* Date Slider */}
      <div ref={sliderRef} className="date-bar" style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '8px 0', marginBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {allDaysArray.map(({ dayNum, dayName }) => (
          <div key={dayNum} data-day={dayNum}
            className={`date-bar-item ${dayNum === selectedDay ? 'active' : ''} ${isToday(dayNum) ? 'today' : ''}`}
            onClick={() => onSelectDay(dayNum)}
            style={{ flex: '0 0 48px', textAlign: 'center', padding: '6px 0', borderRadius: '12px', cursor: 'pointer', background: dayNum === selectedDay ? 'var(--primary)' : 'var(--card)', color: dayNum === selectedDay ? 'var(--active-date-text)' : 'var(--text)', border: isToday(dayNum) ? '2px solid var(--primary)' : '1px solid var(--border)', fontWeight: dayNum === selectedDay ? 800 : 500, fontSize: '12px' }}>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>{dayName}</div>
            <div style={{ fontSize: '18px', lineHeight: 1.2 }}>{dayNum}</div>
          </div>
        ))}
      </div>

      {/* Shift Toggle + Work Status */}
      <div className="card" style={{ marginBottom: '15px' }}>
        <div className="controls-row">
          <div className="segmented-control" style={{ flex: 1 }}>
            <button className="seg-btn active" onClick={() => setShowShiftSelector(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <i className="ph-duotone ph-clock i-sm"></i> {currentShift || 'เลือกกะ'}
            </button>
          </div>
        </div>
      </div>

      {isWork ? (
        <>
          {/* Odometer Section */}
          <div className="card">
            <div className="input-group">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                <i className="ph-duotone ph-speedometer i-sm" style={{ color: 'var(--primary)' }}></i> ระยะทาง
              </span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)' }}>{distance.toLocaleString()} km</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input type="number" placeholder="เลขไมล์เข้า" className="driver-input" value={odoIn} onChange={e => setOdoIn(e.target.value)} style={{ flex: 1 }} />
              <input type="number" placeholder="เลขไมล์ออก" className="driver-input" value={odoOut} onChange={e => setOdoOut(e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>

          {/* OT, Late, Round, Point Section */}
          <div className="card">
            <div className="input-group">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                <i className="ph-duotone ph-clock-afternoon i-sm" style={{ color: 'var(--primary)' }}></i> OT (ชม.)
              </span>
              <input type="number" placeholder="0" className="driver-input" value={otHours} onChange={e => setOtHours(e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
            </div>
            <div className="input-group">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                <i className="ph-duotone ph-alarm i-sm" style={{ color: 'var(--primary)' }}></i> สาย (นาที)
              </span>
              <input type="number" placeholder="0" className="driver-input" value={lateMin} onChange={e => setLateMin(e.target.value)} style={{ width: '80px', textAlign: 'center' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                <i className="ph-duotone ph-arrows-clockwise i-sm" style={{ color: 'var(--primary)' }}></i> รอบ
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button type="button" className="del-btn-small" onClick={() => setRoundCount(prev => Math.max(0, prev - 1))}><i className="ph-bold ph-minus"></i></button>
                <input type="number" value={roundCount} onChange={e => setRoundCount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '52px', height: '40px', fontSize: '32px', fontWeight: 800, margin: '0 4px', textAlign: 'center', border: 'none', outline: 'none', background: 'var(--primary-bg)', borderRadius: '10px', color: 'var(--text)' }} />
                <button type="button" className="del-btn-small" onClick={() => setRoundCount(prev => prev + 1)}><i className="ph-bold ph-plus"></i></button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                <i className="ph-duotone ph-map-trifold i-sm" style={{ color: 'var(--primary)' }}></i> จุด
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button type="button" className="del-btn-small" onClick={() => setPointCount(prev => Math.max(0, prev - 1))}><i className="ph-bold ph-minus"></i></button>
                <input type="number" value={pointCount} onChange={e => setPointCount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '52px', height: '40px', fontSize: '32px', fontWeight: 800, margin: '0 4px', textAlign: 'center', border: 'none', outline: 'none', background: 'var(--primary-bg)', borderRadius: '10px', color: 'var(--text)' }} />
                <button type="button" className="del-btn-small" onClick={() => setPointCount(prev => prev + 1)}><i className="ph-bold ph-plus"></i></button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {leaveType === 'sick' ? '🤒' : leaveType === 'personal' ? '📋' : '😴'}
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: leaveType === 'sick' ? '#e67e22' : leaveType === 'personal' ? '#3498db' : 'var(--primary)', marginBottom: '4px' }}>
            {leaveType === 'sick' ? 'ลาป่วย' : leaveType === 'personal' ? 'ลากิจ' : 'วันหยุดพักผ่อน'}
          </h3>
          <p style={{ fontSize: '16px', color: 'var(--muted)' }}>
            {leaveType ? 'แตะปุ่มด้านบนเพื่อเปลี่ยนสถานะ' : 'พักผ่อนให้เต็มที่ หรือแตะปุ่มด้านบนเพื่อเปลี่ยนกะ'}
          </p>
        </div>
      )}

      {/* Save Button */}
      <button className={`main-save-btn ${saveStatus === 'success' ? 'success' : ''}`} onClick={handleSave} disabled={saveStatus === 'saving'}>
        <i className={`ph-duotone ${saveStatus === 'success' ? 'ph-check-circle' : saveStatus === 'saving' ? 'ph-spinner-gap spin' : 'ph-floppy-disk'} i-icon`}></i>
        {saveStatus === 'success' ? ' บันทึกเรียบร้อย ✨' : saveStatus === 'saving' ? ' กำลังบันทึก...' : ' บันทึกข้อมูลวันนี้'}
      </button>

      {/* Bottom Sheet Shift Selector */}
      <div onClick={() => setShowShiftSelector(false)} style={{ position: 'fixed', inset: 0, zIndex: 250, display: showShiftSelector ? 'block' : 'none', background: 'rgba(0,0,0,0.3)' }} />
      <div className={`shift-sheet ${showShiftSelector ? 'open' : ''}`} style={{ zIndex: 300 }}>
        <div className="shift-sheet-handle" />
        <div className="shift-sheet-header">
          <h4>วันที่ {selectedDay} {months[currentMonth - 1]} {currentYear}</h4>
          <button className="shift-sheet-close" onClick={() => setShowShiftSelector(false)}><i className="ph-bold ph-x"></i></button>
        </div>
        <div className="shift-sheet-body">
          <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderSpacing: '8px 0' }}>
            {['07:30', '08:00', '09:00'].map(time => {
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
          <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderSpacing: '8px 0', marginTop: '4px' }}>
            {[
              { key: null, icon: '🛑', label: 'วันหยุด', color: '#e74c3c' },
              { key: 'sick', icon: '🤒', label: 'ลาป่วย', color: '#e67e22' },
              { key: 'personal', icon: '📋', label: 'ลากิจ', color: '#3498db' },
            ].map(opt => {
              const sel = currentShift === 'หยุด' && (currentLeaveType || null) === opt.key;
              return (
                <div key={opt.key || 'off'} onClick={() => !isSavingShift && handleQuickSaveShift('หยุด', opt.key)}
                  style={{ display: 'table-cell', padding: '12px 0', textAlign: 'center', borderRadius: '12px', cursor: isSavingShift ? 'default' : 'pointer', fontWeight: 700, fontSize: '14px',
                    border: sel ? '2px solid transparent' : '2px solid var(--border)', background: sel ? opt.color : 'transparent', color: sel ? 'white' : 'var(--text)', opacity: isSavingShift ? 0.6 : 1 }}>
                  <div style={{ fontSize: '18px' }}>{opt.icon}</div>
                  <div>{opt.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
