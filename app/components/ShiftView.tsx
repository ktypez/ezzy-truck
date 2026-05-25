'use client';
import { useState, useEffect } from 'react';
import { sb } from '@/lib/supabase'; 

interface ShiftViewProps {
  userId: string;
  currentDate: Date;
  isOpen: boolean;       
  onClose: () => void;   
  onSaveSuccess?: () => void; // 💡 เพิ่มตัวส่งสัญญาณกลับไปบอกหน้าหลักให้รีเฟรชข้อมูล
}

const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", 
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function ShiftView({ userId, currentDate, isOpen, onClose, onSaveSuccess }: ShiftViewProps) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay(); 

  const [shiftDataMap, setShiftDataMap] = useState<{ [key: number]: string }>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [chosenShift, setChosenShift] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchShiftData = async () => {
    if (!userId || !isOpen) return;
    try {
      const { data, error } = await sb
        .from('logs') 
        .select('day, shift_time') 
        .eq('user_id', userId)
        .eq('year', currentYear)
        .eq('month', currentMonth);

      if (error) throw error;

      if (data) {
        const newShiftMap: { [key: number]: string } = {};
        data.forEach((record: any) => {
          if (record.day) newShiftMap[record.day] = record.shift_time;
        });
        setShiftDataMap(newShiftMap);
      }
    } catch (error: any) {
      console.error("Error fetching shift data:", error);
    }
  };

  useEffect(() => {
    fetchShiftData();
  }, [currentDate, currentYear, currentMonth, daysInMonth, userId, isOpen]);

  if (!isOpen) return null; 

  const handleCellClick = (day: number) => {
    setSelectedDay(day);
    setChosenShift(shiftDataMap[day] || ''); 
  };

  // 🟢 ปรับลอจิกให้รับค่ากะงานและยิงเซฟทันทีเมื่อคลิกเลือกปุ่มกะงาน
  const handleQuickSaveActual = async (targetShift: string) => {
    if (!selectedDay || !targetShift) return;
    
    const currentShiftName = shiftDataMap[selectedDay];
    if (currentShiftName && currentShiftName !== targetShift) {
      const confirmChange = window.confirm(`⚠️ วันที่ ${selectedDay} มีข้อมูลเดิมคือ "${currentShiftName}" อยู่แล้ว\nคุณต้องการบันทึกเปลี่ยนเป็น "${targetShift}" ใช่หรือไม่?`);
      if (!confirmChange) return;
    }

    setIsSaving(true);
    const isHoliday = targetShift === 'หยุด';

    try {
      const payload: any = {
        user_id: userId,
        year: currentYear,
        month: currentMonth,
        day: selectedDay,
        shift_time: targetShift,
        day_type: isHoliday ? 'วันหยุด' : 'วันทำงาน',
        is_work: !isHoliday 
      };

      if (isHoliday) {
        Object.assign(payload, { odo_in: 0, odo_out: 0, ot: 0, late: 0, drivers: [], trucks: 0, odo: 0 });
      }

      const { error } = await sb
        .from('logs')
        .upsert(payload, { onConflict: 'user_id,year,month,day' }); 

      if (error) throw error;

      setSelectedDay(null);
      fetchShiftData(); 
      if (onSaveSuccess) onSaveSuccess(); // 💡 ปลุกหน้าจอหลักให้ปุ่มอัปเดตอักษรตามด้วยทันที
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getBadgeClass = (shift: string) => {
    if (shift === '07:00') return 'badge-07';
    if (shift === '08:00') return 'badge-08';
    if (shift === '09:00') return 'badge-09';
    if (shift === 'หยุด') return 'badge-off';
    return '';
  };

  return (
    <div className="view active" style={{ paddingBottom: '80px' }}>
      <div className="card" style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '15px' }}>
        <div className="calendar-grid">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
            <div key={d} className="cal-header">{d}</div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-cell empty" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const shiftData = shiftDataMap[day]; 
            const isHoliday = shiftData === "หยุด";
            const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = new Date().getFullYear() === currentYear && new Date().getMonth() + 1 === currentMonth && new Date().getDate() === day;
            const isSelected = selectedDay === day;
            const shiftClass = shiftData === '07:00' ? 'has-shift-07' : shiftData === '08:00' ? 'has-shift-08' : shiftData === '09:00' ? 'has-shift-09' : shiftData === 'หยุด' ? 'has-shift-off' : '';
            
            return (
              <div 
                key={day} 
                className={`cal-cell ${shiftClass} ${isHoliday ? 'holiday' : ''} ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCellClick(day)}
                style={{ cursor: 'pointer' }}
              >
                <span className="cal-day">{day}</span>
                {shiftData && (
                  <div className={`cal-shift-badge ${getBadgeClass(shiftData)}`}>
                    {isHoliday ? 'หยุด' : shiftData}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================
         💎 BOTTOM SHEET เลือกกะงาน (แตะวันอื่นอัปเดตทันที)
         =================================================== */}
      {/* Backdrop */}
      <div onClick={() => setSelectedDay(null)} style={{ position: 'fixed', inset: 0, zIndex: 199, display: selectedDay !== null ? 'block' : 'none', background: 'rgba(0,0,0,0.3)' }} />
      
      <div className={`shift-sheet ${selectedDay !== null ? 'open' : ''}`} style={{ zIndex: 300 }}>
        <div className="shift-sheet-handle" />
        <div className="shift-sheet-header">
          <h4>วันที่ {selectedDay} {months[currentMonth - 1]} {currentYear}</h4>
          <button className="shift-sheet-close" onClick={() => setSelectedDay(null)}><i className="ph-bold ph-x"></i></button>
        </div>
        <div className="shift-sheet-body">
          <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderSpacing: '8px 0' }}>
            {['07:00', '08:00', '09:00'].map(time => {
              const sel = chosenShift === time;
              return (
                <div key={time} onClick={() => !isSaving && handleQuickSaveActual(time)}
                  style={{ display: 'table-cell', padding: '14px 0', textAlign: 'center', borderRadius: '12px', cursor: isSaving ? 'default' : 'pointer', fontWeight: 700, fontSize: '16px',
                    border: sel ? '2px solid transparent' : '2px solid var(--border)', background: sel ? 'var(--primary)' : 'transparent', color: sel ? 'var(--active-date-text, white)' : 'var(--text)', opacity: isSaving ? 0.6 : 1 }}>
                  {time}
                </div>
              );
            })}
          </div>
          <div onClick={() => !isSaving && handleQuickSaveActual('หยุด')}
            style={{ width: '100%', padding: '14px 0', textAlign: 'center', borderRadius: '12px', cursor: isSaving ? 'default' : 'pointer', fontWeight: 700, fontSize: '16px', marginTop: '10px',
              border: chosenShift === 'หยุด' ? '2px solid transparent' : '2px solid var(--border)', background: chosenShift === 'หยุด' ? '#e74c3c' : 'transparent', color: chosenShift === 'หยุด' ? 'white' : 'var(--text)', opacity: isSaving ? 0.6 : 1 }}>
            🛑 วันหยุด
          </div>
        </div>
      </div>
    </div>
  );
}
