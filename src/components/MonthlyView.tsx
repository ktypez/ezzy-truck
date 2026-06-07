import MonthYearSelector from './MonthYearSelector';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sb } from '@/lib/supabase';

interface MonthlyViewProps {
  userId: string;
  currentDate: Date;
  onSelectDayRow: (day: number) => void;
  onChangeMonth: (diff: number) => void;
}

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function MonthlyView({ userId, currentDate, onSelectDayRow, onChangeMonth }: MonthlyViewProps) {
  const queryClient = useQueryClient();
  const [selDay, setSelDay] = useState<number | null>(null);
  const [showShiftPicker, setShowShiftPicker] = useState(false);
  const [shiftPickerDay, setShiftPickerDay] = useState<number | null>(null);
  const [chosenShift, setChosenShift] = useState("");
  const [chosenLeave, setChosenLeave] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNum = month + 1;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Fetch monthly logs
  const { data: logs = [] } = useQuery({
    queryKey: ['monthly-logs', userId, year, monthNum],
    queryFn: async () => {
      const { data } = await sb
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', monthNum)
        .order('day', { ascending: true });
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch available years
  const { data: availableYears = [] } = useQuery({
    queryKey: ['available-years', userId],
    queryFn: async () => {
      const { data } = await sb
        .from("logs")
        .select("year")
        .eq("user_id", userId)
        .order("year", { ascending: false });
      if (data) {
        return [...new Set(data.map(r => r.year))] as number[];
      }
      return [];
    },
    enabled: !!userId,
  });

  // Mutation for quick save shift
  const shiftMutation = useMutation({
    mutationFn: async ({ targetDay, targetShift, targetLeave }: { targetDay: number; targetShift: string; targetLeave?: string | null }) => {
      const isHoliday = targetShift === "หยุด";
      const payload: any = {
        user_id: userId, year, month: monthNum, day: targetDay,
        shift_time: targetShift,
        day_type: isHoliday ? "วันหยุด" : "วันทำงาน",
        is_work: !isHoliday,
        leave_type: isHoliday ? (targetLeave || null) : null
      };
      if (isHoliday) Object.assign(payload, { odo_in: 0, odo_out: 0, ot: 0, late: 0, odo: 0 });
      const { error } = await sb.from("logs").upsert(payload, { onConflict: "user_id,year,month,day" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-logs', userId, year, monthNum] });
      setShowShiftPicker(false);
      setShiftPickerDay(null);
    },
    onError: (error: any) => {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    },
  });

  const dayMap: Record<number, any> = {};
  logs.forEach((r: any) => {
    dayMap[r.day] = r;
  });

  const merged = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const r = dayMap[day];
    const isOff = r?.shift_time === 'หยุด' || r?.day_type === 'วันหยุด' || r?.is_work === false;
    return {
      day,
      rounds: isOff ? 0 : r?.rounds || 0,
      points: isOff ? 0 : r?.points || 0,
      km: r?.odo || 0,
      ot: isOff ? 0 : r?.ot || 0,
      late: isOff ? 0 : r?.late || 0,
      hasData: !!r,
      shift_time: r?.shift_time || null,
      leave_type: r?.leave_type || null,
      isOff,
      isHoliday: r?.shift_time === 'หยุด' && !r?.leave_type,
      isSick: r?.leave_type === 'sick',
      isPersonal: r?.leave_type === 'personal',
      isDouble: r?.day_type === 'special' || r?.day_type === 'holiday' || r?.is_special === true,
    };
  });

  const tot = merged.reduce(
    (a, r) => ({
      workDays: a.workDays + (r.isOff ? 0 : 1),
      rounds: a.rounds + r.rounds,
      points: a.points + r.points,
      km: a.km + r.km,
      ot: a.ot + r.ot,
      late: a.late + r.late,
      holiday: a.holiday + (r.isHoliday ? 1 : 0),
      sickLeave: a.sickLeave + (r.leave_type === 'sick' ? 1 : 0),
      personalLeave: a.personalLeave + (r.leave_type === 'personal' ? 1 : 0),
    }),
    { workDays: 0, rounds: 0, points: 0, km: 0, ot: 0, late: 0, holiday: 0, sickLeave: 0, personalLeave: 0 },
  );

  // The rest of the component stays the same (UI rendering)
  // Build calendar grid
  const blanksBefore = firstDay;
  const totalCells = blanksBefore + daysInMonth;
  const rows: { day: number; isBlank: boolean }[][] = [];
  let row: { day: number; isBlank: boolean }[] = [];
  for (let i = 0; i < blanksBefore; i++) {
    row.push({ day: 0, isBlank: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    row.push({ day: d, isBlank: false });
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length > 0) rows.push(row);

  const months = MONTHS_TH;

  const handleCellClick = (day: number) => {
    setSelDay(day);
    if (onSelectDayRow) onSelectDayRow(day);
  };

  const handleShiftPickerOpen = (e: React.MouseEvent, day: number) => {
    e.stopPropagation();
    setShiftPickerDay(day);
    setChosenShift("");
    setChosenLeave(null);
    setShowShiftPicker(true);
  };

  const handleQuickSaveShift = (targetShift: string, targetLeave?: string | null) => {
    if (!shiftPickerDay) return;
    setChosenShift(targetShift);
    setChosenLeave(targetLeave || null);
    shiftMutation.mutate({ targetDay: shiftPickerDay, targetShift, targetLeave });
  };

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && monthNum === now.getMonth() + 1 && year === now.getFullYear();
  };

  const getDayColor = (r: typeof merged[0]): string => {
    if (!r.hasData) return 'var(--card)';
    if (r.isHoliday) return '#fde8e8';
    if (r.isSick) return '#fef3c7';
    if (r.isPersonal) return '#dbeafe';
    if (r.isDouble) return '#ede9fe';
    if (r.rounds > 0 || r.km > 0) return '#d1fae5';
    return '#fef9c3';
  };

  const getDayIcon = (r: typeof merged[0]): string => {
    if (!r.hasData) return '';
    if (r.isHoliday) return '🛑';
    if (r.isSick) return '🤒';
    if (r.isPersonal) return '📋';
    if (r.isDouble) return '2️⃣';
    if (r.rounds > 0 || r.km > 0) return '✅';
    return '';
  };

  return (<>
    <div id="view-monthly">
      <MonthYearSelector currentDate={currentDate} onChangeMonth={onChangeMonth} availableYears={availableYears} />

      {/* Calendar Grid */}
      <div className="card" style={{ padding: '10px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {DAYS_TH.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        {rows.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {week.map((cell) => {
              if (cell.isBlank) return <div key={`b-${wi}-${cell.day}`} />;
              const r = merged[cell.day - 1] || merged.find(m => m.day === cell.day);
              return (
                <div
                  key={cell.day}
                  onClick={() => handleCellClick(cell.day)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: r ? getDayColor(r) : 'var(--card)',
                    borderRadius: '10px',
                    border: isToday(cell.day) ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    fontWeight: r?.hasData ? 700 : 400,
                    fontSize: '14px',
                    color: 'var(--text)',
                    transition: '0.15s',
                  }}
                >
                  <span>{cell.day}</span>
                  {r && <span style={{ fontSize: '10px', lineHeight: 1 }}>{getDayIcon(r)}</span>}
                  <div
                    onClick={(e) => handleShiftPickerOpen(e, cell.day)}
                    style={{
                      position: 'absolute', top: 0, right: 0,
                      width: '16px', height: '16px',
                      fontSize: '11px', lineHeight: '16px', textAlign: 'center',
                      cursor: 'pointer', opacity: 0.5,
                      background: 'transparent', borderRadius: '50%',
                      color: 'var(--muted)',
                    }}
                    title="ตั้งค่ากะ"
                  >+</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card summary-banner">
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 10 }}>
          📊 สรุปเดือนนี้
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'รอบ', value: tot.rounds },
            { label: 'จุด', value: tot.points },
            { label: 'KM', value: tot.km.toLocaleString() },
            { label: 'OT', value: tot.ot.toFixed(1) },
            { label: 'สาย', value: tot.late + "'" },
            { label: 'วันทำงาน', value: tot.workDays },
            { label: 'วันหยุด', value: tot.holiday },
            { label: 'ลา', value: tot.sickLeave + tot.personalLeave },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '6px 0', background: 'var(--primary-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', lineHeight: 1.3 }}>{item.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Shift Picker Dialog */}
    {showShiftPicker && (
      <>
        <div onClick={() => setShowShiftPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.35)" }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 501, background: "var(--card)", border: "2px solid var(--border)", borderRadius: 16, padding: "20px", width: "calc(100% - 40px)", maxWidth: 360, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 14, textAlign: "center" }}>
            วันที่ {shiftPickerDay} {shiftPickerDay !== null && months[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
          </div>
          <div style={{ display: "table", width: "100%", tableLayout: "fixed", borderSpacing: "8px 0" }}>
            {["07:30", "08:00", "09:00"].map(time => {
              const sel = chosenShift === time;
              return (
                <div key={time} onClick={() => !shiftMutation.isPending && handleQuickSaveShift(time)}
                  style={{ display: "table-cell", padding: "14px 0", textAlign: "center", borderRadius: 12, cursor: shiftMutation.isPending ? "default" : "pointer", fontWeight: 700, fontSize: 16, border: sel ? "2px solid transparent" : "2px solid var(--border)", background: sel ? "var(--primary)" : "transparent", color: sel ? "var(--active-date-text, white)" : "var(--text)", opacity: shiftMutation.isPending ? 0.6 : 1 }}>
                  {time}
                </div>
              );
            })}
          </div>
          <div style={{ display: "table", width: "100%", tableLayout: "fixed", borderSpacing: "8px 0", marginTop: 4 }}>
            {[
              { key: null, icon: "🛑", label: "วันหยุด", color: "#e74c3c" },
              { key: "sick", icon: "🤒", label: "ลาป่วย", color: "#e67e22" },
              { key: "personal", icon: "📋", label: "ลากิจ", color: "#3498db" },
            ].map(opt => {
              const sel = chosenShift === "หยุด" && chosenLeave === opt.key;
              return (
                <div key={opt.key || "off"} onClick={() => !shiftMutation.isPending && handleQuickSaveShift("หยุด", opt.key)}
                  style={{ display: "table-cell", padding: "12px 0", textAlign: "center", borderRadius: 12, cursor: shiftMutation.isPending ? "default" : "pointer", fontWeight: 700, fontSize: 14, border: sel ? "2px solid transparent" : "2px solid var(--border)", background: sel ? opt.color : "transparent", color: sel ? "white" : "var(--text)", opacity: shiftMutation.isPending ? 0.6 : 1 }}>
                  <div style={{ fontSize: 18 }}>{opt.icon}</div>
                  <div>{opt.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}
  </>);
}
