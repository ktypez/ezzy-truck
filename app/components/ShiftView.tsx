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
      <h3 style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', marginBottom: '15px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <i className="ph-duotone ph-calendar-blank"></i> จัดกะงานเดือน {months[currentMonth - 1]} {currentYear}
      </h3>

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
          
          return (
            <div 
              key={day} 
              className={`cal-cell ${isHoliday ? 'holiday' : ''}`}
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

      {/* ===================================================
         💎 SUB-MODAL เลือกกะงาน (เปลี่ยนพฤติกรรมเป็นจิ้มแล้วเซฟทันที)
         =================================================== */}
      {selectedDay !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '340px', textAlign: 'center', padding: '25px 20px', margin: 0, boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
            
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text)' }}>
              วันที่ {selectedDay} {months[currentMonth - 1]} {currentYear}
            </h4>
            
            <div style={{ marginBottom: '25px' }}>
              <label className="mid-label" style={{ display: 'block', textAlign: 'left', marginBottom: '10px', fontWeight: 600, fontSize: '13px', color: 'var(--muted)' }}>
                จิ้มเลือกเวลากะทำงาน หรือ วันหยุด (เซฟทันที)
              </label>
              
              {/* แถวบน: 3 ปุ่มเวลางานเรียงข้างกัน จิ้มแล้วยิงเซฟผ่านฟังก์ชันด่วน */}
              <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '6px 0', margin: '0 -6px 10px -6px' }}>
                {['07:00', '08:00', '09:00'].map(time => {
                  const isSelected = chosenShift === time;
                  return (
                    <div 
                      key={time}
                      onClick={() => !isSaving && handleQuickSaveActual(time)} // 🟢 สั่งเซฟทันที
                      style={{
                        display: 'table-cell',
                        padding: '12px 0',
                        textAlign: 'center',
                        borderRadius: '12px',
                        cursor: isSaving ? 'default' : 'pointer',
                        fontWeight: 700,
                        fontSize: '15px',
                        border: isSelected ? '2px solid transparent' : '2px solid var(--border)',
                        background: isSelected ? (time === '07:00' ? '#2ecc71' : time === '08:00' ? '#3498db' : '#9b59b6') : 'transparent',
                        color: isSelected ? 'white' : 'var(--text)',
                        opacity: isSaving ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      {time}
                    </div>
                  );
                })}
              </div>

              {/* แถวล่าง: ปุ่มวันหยุดกว้างเต็มพื้นที่ จิ้มแล้วยิงเซฟทันที */}
              <div 
                onClick={() => !isSaving && handleQuickSaveActual('หยุด')} // 🟢 สั่งเซฟทันที
                style={{
                  width: '100%',
                  padding: '12px 0',
                  textAlign: 'center',
                  borderRadius: '12px',
                  cursor: isSaving ? 'default' : 'pointer',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: chosenShift === 'หยุด' ? '2px solid transparent' : '2px solid var(--border)',
                  background: chosenShift === 'หยุด' ? '#e74c3c' : 'transparent',
                  color: chosenShift === 'หยุด' ? 'white' : 'var(--text)',
                  opacity: isSaving ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                🛑 วันหยุด
              </div>
            </div>
            
            {/* ปุ่มยกเลิก/ปิดหน้าต่างตัวเลือกย่อย */}
            <button 
              type="button"
              onClick={() => setSelectedDay(null)}
              disabled={isSaving}
              style={{ width: '100%', padding: '12px', borderRadius: '15px', border: '2px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }}
            >
              {isSaving ? 'กำลังบันทึกข้อมูล...' : 'ปิดหน้าต่าง'}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
