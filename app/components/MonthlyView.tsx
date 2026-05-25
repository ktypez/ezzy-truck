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

  const totalRounds = logs.reduce((acc, curr) => acc + (curr.rounds || 0), 0);
  const totalPoints = logs.reduce((acc, curr) => acc + (curr.points || 0), 0);
  const totalOT = logs.reduce((acc, curr) => acc + (curr.ot || 0), 0);
  const totalLate = logs.reduce((acc, curr) => acc + (curr.late || 0), 0);
  const workDays = logs.filter(r => !(r.shift_time === 'หยุด' || r.day_type === 'วันหยุด' || r.is_work === false)).length;

  return (
    <div id="view-monthly" className="view active">

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {[
          { label: 'ทำงาน', value: `${workDays} วัน`, color: 'var(--primary)' },
          { label: 'รอบ', value: `${totalRounds}`, color: 'var(--secondary)' },
          { label: 'จุด', value: `${totalPoints}`, color: 'var(--secondary)' },
          { label: 'OT', value: `${totalOT} ชม.`, color: 'var(--secondary)' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'var(--card)', borderRadius: '12px', padding: '8px 6px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.3px' }}>{stat.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: stat.color, marginTop: '2px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--muted)' }}>
            <i className="ph-duotone ph-database" style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}></i>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>ยังไม่มีข้อมูลในเดือนนี้</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>เริ่มบันทึกข้อมูลประจำวันกันเลย!</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="th-sort" onClick={() => setSortDesc(!sortDesc)}>
                  วันที่ <i className={`ph-duotone ${sortDesc ? 'ph-sort-descending' : 'ph-sort-ascending'} i-sm`} style={{ margin: 0 }}></i>
                </th>
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
                  <tr key={r.day} className={(isDouble ? 'row-x2' : '') + (isOff ? ' row-off' : '')} onClick={() => onSelectDayRow(r.day)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className="date-cell">
                        {r.day} {isDouble && <span className="double-badge">(x2)</span>}
                      </span>
                    </td>
                    {isOff ? (
                      <td colSpan={5} className="text-off">--- วันหยุด ---</td>
                    ) : (
                      <>
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
              
              <tr className="total-row">
                <td>TOTAL</td>
                <td><strong>{totalRounds || '-'}</strong></td>
                <td><strong>{totalPoints || '-'}</strong></td>
                <td>-</td>
                <td><strong>{totalOT || '-'}</strong></td>
                <td><strong className={totalLate ? 'text-late' : ''}>{totalLate || '-'}</strong></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
