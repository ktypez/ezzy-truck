import MonthYearSelector from './MonthYearSelector';
import { useState, useEffect } from 'react';
import { sb } from '@/lib/supabase';

interface MonthlyViewProps {
  userId: string;
  currentDate: Date;
  onSelectDayRow: (day: number) => void;
  refreshTrigger: boolean;
  onChangeMonth: (diff: number) => void;
}

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function MonthlyView({ userId, currentDate, onSelectDayRow, refreshTrigger, onChangeMonth }: MonthlyViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [selDay, setSelDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNum = month + 1;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  useEffect(() => {
    async function fetchMonthlyLogs() {
      const { data } = await sb
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', monthNum)
        .order('day', { ascending: true });
      if (data) setLogs(data);
    }
    fetchMonthlyLogs();
  }, [currentDate, userId, refreshTrigger]);

  const dayMap: Record<number, any> = {};
  logs.forEach((r) => {
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
      isOff,
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
    }),
    { workDays: 0, rounds: 0, points: 0, km: 0, ot: 0, late: 0 },
  );

  const selected = selDay ? merged.find((m) => m.day === selDay) : null;
  const maxKm = Math.max(...merged.map((r) => r.km), 1);

  return (
    <div id="view-monthly" className="view active">
      {/* Month/Year Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 0 8px' }}>
        <MonthYearSelector currentDate={currentDate} onChangeMonth={onChangeMonth} />
      </div>
      {/* ── KPI Cards ── */}
      <div style={{ padding: '0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 5,
            marginBottom: 5,
          }}
        >
          <KpiCard icon="ph-arrows-clockwise" label="รอบรวม" value={tot.rounds} unit="รอบ" />
          <KpiCard icon="ph-map-pin" label="จุดรวม" value={tot.points} unit="จุด" />
          <KpiCard icon="ph-road" label="ระยะทาง" value={tot.km.toLocaleString()} unit="km" />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 5,
            marginBottom: 8,
          }}
        >
          <KpiCard icon="ph-clock" label="OT รวม" value={tot.ot.toFixed(1)} unit="ชม." />
          <KpiCard
            icon="ph-warning"
            label="มาสาย"
            value={`${tot.late}`}
            unit="นาที"
            accent={tot.late > 0 ? 'var(--primary)' : 'var(--muted)'}
          />
          <KpiCard icon="ph-briefcase" label="ทำงาน" value={tot.workDays} unit="วัน" />
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div style={{ padding: '0' }}>
        <div
          className="card"
          style={{
            padding: '10px',
            marginBottom: 0,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              <i className="ph-duotone ph-calendar-blank i-icon" style={{ marginRight: 6 }}></i>
              ปฏิทินรายวัน
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'var(--primary-bg)',
              padding: '3px 10px',
              borderRadius: 99,
            }}>
              {tot.workDays} วัน
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 3,
            }}
          >
            {DAYS_TH.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--muted)',
                  paddingBottom: 4,
                }}
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {merged.map((r) => {
              const intensity = r.km / maxKm;
              const hasData = r.hasData;

              let bg = 'var(--card)';
              let borderColor = 'var(--border)';
              let textColor = 'var(--text)';

              if (r.isOff) {
                bg = 'var(--primary-bg)';
                borderColor = 'var(--border)';
                textColor = 'var(--muted)';
              } else if (hasData) {
                bg = `color-mix(in srgb, var(--primary) ${Math.round(8 + intensity * 20)}%, var(--card))`;
                borderColor = 'var(--primary)';
              }

              const isSelected = selDay === r.day;

              return (
                <button
                  key={r.day}
                  onClick={() => setSelDay(isSelected ? null : r.day)}
                  onDoubleClick={() => onSelectDayRow(r.day)}
                  style={{
                    background: bg,
                    border: `${isSelected ? 2 : 1}px solid ${isSelected ? 'var(--primary)' : borderColor}`,
                    borderRadius: 8,
                    padding: '4px 0',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    outline: 'none',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    minHeight: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.boxShadow = '0 0 16px color-mix(in srgb, var(--primary) 30%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: textColor,
                      lineHeight: 1.2,
                    }}
                  >
                    {r.day}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Detail Panel ── */}
          {selected && (
            <div
              className="slide-in"
              style={{
                marginTop: 10,
                background: 'var(--primary-bg)',
                border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                borderRadius: 10,
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 6,
                textAlign: 'center',
              }}
            >
              {[
                { label: 'วันที่', value: selected.day, color: 'var(--text)' },
                { label: 'รอบ', value: selected.rounds, color: 'var(--primary)' },
                { label: 'จุด', value: selected.points, color: 'var(--secondary)' },
                { label: 'km', value: selected.km, color: 'var(--primary)' },
                {
                  label: 'มาสาย',
                  value: selected.late ? `${selected.late}′` : '—',
                  color: selected.late ? 'var(--primary)' : 'var(--muted)',
                },
              ].map((x) => (
                <div key={x.label}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: x.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {x.value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                      fontWeight: 600,
                      marginTop: 1,
                    }}
                  >
                    {x.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>
              💡 คลิกดูรายละเอียด · ดับเบิลคลิกไปบันทึกวันนั้น
            </span>
          </div>
        </div>
      </div>

      {/* ── Daily Details Table ── */}
      <div style={{ padding: '0', marginTop: 10 }}>
        <div
          className="card"
          style={{
            padding: '10px',
            marginBottom: 0,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            <i className="ph-duotone ph-list-numbers i-icon" style={{ marginRight: 6 }}></i>
            ตารางรายวัน
          </div>

          {merged.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
                color: 'var(--muted)',
                fontWeight: 600,
              }}
            >
              <i className="ph-duotone ph-database i-icon" style={{ fontSize: 24, display: 'block', marginBottom: 6 }}></i>
              ยังไม่มีข้อมูลในเดือนนี้
              <div style={{ fontSize: 12, marginTop: 4 }}>
                เริ่มบันทึกข้อมูลประจำวันกันเลย!
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['วัน', 'รอบ', 'จุด', 'km', 'OT', 'สาย'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '6px 6px',
                          textAlign: 'right',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderBottom: '1.5px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {merged.map((r, i) => {
                    const isOffRow = r.isOff;
                    return (
                      <tr
                        key={r.day}
                        onClick={() => onSelectDayRow(r.day)}
                        style={{
                          background: i % 2 ? 'color-mix(in srgb, var(--primary) 3%, transparent)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          borderTop: isOffRow ? '1px dashed var(--border)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--primary-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = i % 2 ? 'color-mix(in srgb, var(--primary) 3%, transparent)' : 'transparent';
                        }}
                      >
                        <td
                          style={{
                            padding: '7px 6px',
                            fontWeight: 700,
                            color: isOffRow ? 'var(--muted)' : 'var(--text)',
                            textAlign: 'right',
                            opacity: isOffRow ? 0.5 : 1,
                          }}
                        >
                          {isOffRow ? (
                            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{r.day}</span>
                          ) : (
                            <span style={{ fontWeight: 800, fontSize: 16 }}>{r.day}</span>
                          )}
                        </td>
                        {isOffRow ? (
                          <td
                            colSpan={5}
                            style={{
                              padding: '7px 6px',
                              textAlign: 'center',
                              color: 'var(--muted)',
                              fontWeight: 700,
                              fontSize: 15,
                              opacity: 0.7,
                              letterSpacing: 2,
                            }}
                          >
                            {'--- ' + (r.isSick ? 'ลาป่วย' : r.isPersonal ? 'ลากิจ' : 'วันหยุด') + ' ---'}
                          </td>
                        ) : (
                          <>
                            <td
                              style={{
                                padding: '7px 6px',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                textAlign: 'right',
                                fontSize: 15,
                              }}
                            >
                              {r.rounds}
                            </td>
                            <td
                              style={{
                                padding: '7px 6px',
                                color: 'var(--secondary)',
                                textAlign: 'right',
                              }}
                            >
                              {r.points}
                            </td>
                            <td
                              style={{
                                padding: '7px 6px',
                                fontWeight: 700,
                                color: 'var(--text)',
                                textAlign: 'right',
                              }}
                            >
                              {r.km}
                            </td>
                            <td
                              style={{
                                padding: '7px 6px',
                                color: r.ot > 0 ? 'var(--primary)' : 'var(--border)',
                                textAlign: 'right',
                              }}
                            >
                              {r.ot > 0 ? (
                                <span style={{ fontWeight: 700 }}>{r.ot}</span>
                              ) : (
                                <span style={{ color: 'var(--border)' }}>—</span>
                              )}
                            </td>
                            <td
                              style={{
                                padding: '7px 6px',
                                textAlign: 'right',
                              }}
                            >
                              {r.late > 0 ? (
                                <span
                                  style={{
                                    color: 'var(--primary)',
                                    fontWeight: 700,
                                    fontSize: 13,
                                  }}
                                >
                                  {r.late}′
                                </span>
                              ) : (
                                <span style={{ color: 'var(--border)' }}>—</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      borderTop: '1.5px solid var(--border)',
                      background: 'color-mix(in srgb, var(--primary) 6%, transparent)',
                    }}
                  >
                    <td
                      style={{
                        padding: '8px 6px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--muted)',
                        textAlign: 'right',
                      }}
                    >
                      รวม
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        fontWeight: 900,
                        color: 'var(--primary)',
                        textAlign: 'right',
                      }}
                    >
                      {tot.rounds}
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        fontWeight: 900,
                        color: 'var(--secondary)',
                        textAlign: 'right',
                      }}
                    >
                      {tot.points}
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        fontWeight: 900,
                        color: 'var(--text)',
                        textAlign: 'right',
                      }}
                    >
                      {tot.km.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        fontWeight: 900,
                        color: 'var(--primary)',
                        textAlign: 'right',
                      }}
                    >
                      {tot.ot.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        fontWeight: 900,
                        color: tot.late > 0 ? 'var(--primary)' : 'var(--muted)',
                        textAlign: 'right',
                      }}
                    >
                      {tot.late}′
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── KpiCard inline component ── */
function KpiCard({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  unit: string;
  accent?: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: '12px 8px',
        marginBottom: 0,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          fontSize: 32,
          opacity: 0.06,
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        <i className={`ph-duotone ${icon} i-icon`}></i>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: accent || 'var(--primary)',
          lineHeight: 1.2,
        }}
      >
        {value}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted)',
            marginLeft: 2,
          }}
        >
          {unit}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        <i
          className={`ph-duotone ${icon} i-icon`}
          style={{ fontSize: 11, marginRight: 3, verticalAlign: 'middle' }}
        ></i>
        {label}
      </div>
    </div>
  );
}


