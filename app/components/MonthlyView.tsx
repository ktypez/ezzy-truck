'use client';
import { useState, useEffect } from 'react';
import { sb } from '@/lib/supabase';

interface MonthlyViewProps {
  userId: string;
  currentDate: Date;
  onSelectDayRow: (day: number) => void;
  refreshTrigger: boolean;
}

export default function MonthlyView({ userId, currentDate, onSelectDayRow, refreshTrigger }: MonthlyViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    async function fetchMonthlyLogs() {
      const { data } = await sb.from('logs').select('*')
        .eq('user_id', userId)
        .eq('year', currentDate.getFullYear())
        .eq('month', currentDate.getMonth() + 1)
        .order('day', { ascending: !sortDesc });
      if (data) setLogs(data);
    }
    fetchMonthlyLogs();
  }, [currentDate, userId, sortDesc, refreshTrigger]);

  // 🟢 คำนวณหายอดรวมประจำเดือนจากข้อมูล "รอบ" และ "จุด" ชุดใหม่
  const totalRounds = logs.reduce((acc, curr) => acc + (curr.rounds || 0), 0);
  const totalPoints = logs.reduce((acc, curr) => acc + (curr.points || 0), 0);
  const totalOT = logs.reduce((acc, curr) => acc + (curr.ot || 0), 0);
  const totalLate = logs.reduce((acc, curr) => acc + (curr.late || 0), 0);

  return (
    <div id="view-monthly" className="view active">
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => setSortDesc(!sortDesc)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                วันที่ <span><i className={`ph-duotone ${sortDesc ? 'ph-sort-descending' : 'ph-sort-ascending'} i-sm`} style={{ margin: 0 }}></i></span>
              </th>
              {/* 🟢 อัปเกรดหัวตารางใหม่ แยกช่อง รอบ และ จุด ชัดเจน */}
              <th>รอบ</th>
              <th>จุด</th>
              <th>กม.</th>
              <th>OT</th>
              <th>สาย</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((r) => {
              const isOff = r.shift_time === 'หยุด' || r.day_type === 'วันหยุด' || r.is_work === false;
              const isDouble = r.day_type === 'special' || r.day_type === 'holiday' || r.is_special === true; 
              
              return (
                <tr key={r.day} className={isDouble ? 'row-x2' : ''} onClick={() => onSelectDayRow(r.day)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span className="date-cell">
                      {r.day} {isDouble && <span className="double-badge">(x2)</span>}
                    </span>
                  </td>
                  {isOff ? (
                    /* 🟢 เพิ่ม colSpan เป็น 5 เพื่อให้แถบวันหยุดยาวคลุมพอดีตาราง 6 ช่องใหม่ */
                    <td colSpan={5} className="text-off">--- วันหยุด ---</td>
                  ) : (
                    <>
                      {/* 🟢 แสดงจำนวนรอบและจุดส่งที่พนักงานบันทึกไว้รายวัน */}
                      <td>{r.rounds || '-'}</td>
                      <td>{r.points || '-'}</td>
                      <td>{r.odo || '-'}</td>
                      <td>{r.ot || '-'}</td>
                      <td>{r.late || '-'}</td>
                    </>
                  )}
                </tr>
              );
            })}
            
            {/* แถวสรุปผลรวม (TOTAL) ท้ายตารางประจำเดือน */}
            <tr className="total-row">
              <td>TOTAL</td>
              {/* 🟢 แสดงผลรวมรอบและจุดส่งรวมทั้งเดือนเรียบร้อย */}
              <td>{totalRounds || '-'}</td>
              <td>{totalPoints || '-'}</td>
              <td>-</td>
              <td>{totalOT || '-'}</td>
              <td>{totalLate || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
