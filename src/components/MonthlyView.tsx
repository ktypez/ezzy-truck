import MonthYearSelector from './MonthYearSelector'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { sb } from '@/lib/supabase'

interface MonthlyViewProps {
  userId: string
  currentDate: Date
  onSelectDayRow: (day: number) => void
  onChangeMonth: (diff: number) => void
}

const MONTHS_TH = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export default function MonthlyView({
  userId,
  currentDate,
  onSelectDayRow,
  onChangeMonth,
}: MonthlyViewProps) {
  // logs & availableYears from useQuery below
  const [selDay, setSelDay] = useState<number | null>(null)
  const [showShiftPicker, setShowShiftPicker] = useState(false)
  const [shiftPickerDay, setShiftPickerDay] = useState<number | null>(null)
  const [chosenShift, setChosenShift] = useState('')
  const [chosenLeave, setChosenLeave] = useState<string | null>(null)
  const [isSavingShift, setIsSavingShift] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthNum = month + 1
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const queryClient = useQueryClient()
  const { data: logs = [] } = useQuery({
    queryKey: ['monthly-logs', userId, year, monthNum],
    queryFn: async () => {
      const { data } = await sb
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', monthNum)
        .order('day', { ascending: true })
      return data || []
    },
    enabled: !!userId,
  })

  const months = MONTHS_TH

  const handleQuickSaveShift = async (targetShift: string, targetLeave?: string | null) => {
    if (!shiftPickerDay) return
    setIsSavingShift(true)
    const isHoliday = targetShift === 'หยุด'
    try {
      const payload: any = {
        user_id: userId,
        year,
        month: monthNum,
        day: shiftPickerDay,
        shift_time: targetShift,
        day_type: isHoliday ? 'วันหยุด' : 'วันทำงาน',
        is_work: !isHoliday,
        leave_type: isHoliday ? targetLeave || null : null,
      }
      if (isHoliday) Object.assign(payload, { odo_in: 0, odo_out: 0, ot: 0, late: 0, odo: 0 })
      const { error } = await sb
        .from('logs')
        .upsert(payload, { onConflict: 'user_id,year,month,day' })
      if (error) throw error
      setShowShiftPicker(false)
      setShiftPickerDay(null)
      queryClient.invalidateQueries({ queryKey: ['monthly-logs', userId, year, monthNum] })
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message)
    } finally {
      setIsSavingShift(false)
    }
  }

  const dayMap: Record<number, any> = {}
  logs.forEach((r) => {
    dayMap[r.day] = r
  })

  const merged = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const r = dayMap[day]
    const isOff = r?.shift_time === 'หยุด' || r?.day_type === 'วันหยุด' || r?.is_work === false
    return {
      day,
      rounds: isOff ? 0 : r?.rounds || 0,
      points: isOff ? 0 : r?.points || 0,
      help_work: isOff ? 0 : r?.help_work || 0,
      fix_work: isOff ? 0 : r?.fix_work || 0,
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
    }
  })

  const tot = merged.reduce(
    (a, r) => ({
      workDays: a.workDays + (r.isOff ? 0 : 1),
      rounds: a.rounds + r.rounds,
      points: a.points + r.points,
      help_work: a.help_work + (r.help_work || 0),
      fix_work: a.fix_work + (r.fix_work || 0),
      km: a.km + r.km,
      ot: a.ot + r.ot,
      late: a.late + r.late,
      holiday: a.holiday + (r.isHoliday ? 1 : 0),
      sickLeave: a.sickLeave + (r.leave_type === 'sick' ? 1 : 0),
      personalLeave: a.personalLeave + (r.leave_type === 'personal' ? 1 : 0),
    }),
    {
      workDays: 0,
      rounds: 0,
      points: 0,
      help_work: 0,
      fix_work: 0,
      km: 0,
      ot: 0,
      late: 0,
      holiday: 0,
      sickLeave: 0,
      personalLeave: 0,
    },
  )

  const selected = selDay ? merged.find((m) => m.day === selDay) : null
  const maxKm = Math.max(...merged.map((r) => r.km), 1)

  return (
    <>
      <div id="view-monthly" className="view active">
        {/* Month/Year Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) 0',
          }}
        >
          <MonthYearSelector currentDate={currentDate} onChangeMonth={onChangeMonth} />
        </div>

        {/* ── Calendar Grid ── */}
        <div style={{ padding: '0' }}>
          <div
            className="card"
            style={{
              padding: 'var(--space-md)',
              marginBottom: 0,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 'var(--space-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>
                <i
                  className="ph-duotone ph-calendar-blank i-icon"
                  style={{ marginRight: 'var(--space-xs)' }}
                ></i>
                ปฏิทินรายวัน
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-bg)',
                  padding: '2px var(--space-sm)',
                  borderRadius: 99,
                }}
              >
                {tot.workDays} วัน
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 'var(--space-2xs)',
              }}
            >
              {DAYS_TH.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color:
                      [
                        'var(--primary)',
                        'var(--muted)',
                        'var(--muted)',
                        'var(--muted)',
                        'var(--muted)',
                        'var(--muted)',
                        'var(--secondary)',
                      ][DAYS_TH.indexOf(d)] || 'var(--muted)',
                    paddingBottom: 'var(--space-xs)',
                  }}
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {merged.map((r) => {
                const intensity = r.km / maxKm
                const hasData = r.hasData

                let bg = 'var(--card)'
                let borderColor = 'var(--border)'
                let textColor = 'var(--text)'

                if (r.isOff) {
                  bg = 'var(--primary-bg)'
                  borderColor = 'var(--border)'
                  textColor = 'var(--primary)'
                } else if (hasData) {
                  bg = `color-mix(in srgb, var(--primary) ${Math.round(8 + intensity * 20)}%, var(--card))`
                  borderColor = 'var(--primary)'
                }

                const isSelected = selDay === r.day
                const isToday =
                  new Date().getDate() === r.day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year

                return (
                  <button
                    key={r.day}
                    onClick={() => setSelDay(isSelected ? null : r.day)}
                    onDoubleClick={() => onSelectDayRow(r.day)}
                    style={{
                      background: bg,
                      border: `${isSelected ? 2 : isToday ? 2 : 1}px solid ${isSelected ? 'var(--primary)' : isToday ? 'var(--primary)' : borderColor}`,
                      borderRadius: 8,
                      padding: 'var(--space-xs) 0',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: isToday ? '0 0 0 2px var(--primary)' : 'none',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      outline: 'none',
                      fontFamily: 'inherit',
                      textAlign: 'center',
                      height: 76,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)'
                      e.currentTarget.style.boxShadow =
                        '0 0 16px color-mix(in srgb, var(--primary) 30%, transparent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: '1px',
                        justifyContent: 'space-between',
                        height: '100%',
                      }}
                    >
                      <div
                        style={{ fontSize: 16, fontWeight: 700, color: textColor, lineHeight: 1.1 }}
                      >
                        {r.day}
                      </div>
                      {hasData && !r.isOff && (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0 var(--space-xs)',
                              fontSize: '8px',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            <span>รอบ</span>
                            <span>{r.rounds + r.help_work + r.fix_work}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0 var(--space-xs)',
                              fontSize: '8px',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            <span>จุด</span>
                            <span>{r.points + r.help_work + r.fix_work}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0 var(--space-xs)',
                              fontSize: '8px',
                              fontWeight: 600,
                              color: 'var(--muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            <span>KM</span>
                            <span>{r.km}</span>
                          </div>
                        </>
                      )}
                      {r.shift_time && !r.isOff && (
                        <div
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            color: 'white',
                            background: 'var(--primary)',
                            borderRadius: 99,
                            padding: '1px 3px',
                            lineHeight: 1.4,
                            marginTop: 1,
                            alignSelf: 'center',
                          }}
                        >
                          {r.shift_time}
                        </div>
                      )}
                      {r.isHoliday && (
                        <div
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            color: 'white',
                            background: 'var(--muted)',
                            borderRadius: 99,
                            padding: '1px 3px',
                            lineHeight: 1.4,
                            marginTop: 1,
                            alignSelf: 'center',
                          }}
                        >
                          หยุด
                        </div>
                      )}
                      {r.isSick && (
                        <div
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            color: 'white',
                            background: '#f1c40f',
                            borderRadius: 99,
                            padding: '1px 3px',
                            lineHeight: 1.4,
                            marginTop: 1,
                            alignSelf: 'center',
                          }}
                        >
                          ป่วย
                        </div>
                      )}
                      {r.isPersonal && (
                        <div
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            color: 'white',
                            background: '#3498db',
                            borderRadius: 99,
                            padding: '1px 3px',
                            lineHeight: 1.4,
                            marginTop: 1,
                            alignSelf: 'center',
                          }}
                        >
                          กิจ
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* ── Detail Panel ── */}
            {selected && (
              <div
                className="slide-in"
                style={{
                  marginTop: 'var(--space-lg)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }}
              >
                {/* 🎨 Gradient Header — subtle glass */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    padding: 'var(--space-xl) var(--space-lg) var(--space-lg)',
                    textAlign: 'center',
                  }}
                >
                  {/* Date + Month Year on same line */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center',
                      gap: 'var(--space-sm)',
                      marginBottom: 'var(--space-md)',
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                      {selected.day}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
                      {MONTHS_TH[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                    </span>
                  </div>

                  {/* subtle glass Stats Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 'var(--space-sm)',
                      marginBottom: 'var(--space-md)',
                    }}
                  >
                    {[
                      {
                        label: 'รอบ',
                        value: selected.rounds + selected.help_work + selected.fix_work,
                      },
                      {
                        label: 'จุด',
                        value: selected.points + selected.help_work + selected.fix_work,
                      },
                      { label: 'KM', value: selected.km },
                      { label: 'สาย', value: selected.late ? `${selected.late}′` : '—' },
                    ].map((x) => (
                      <div
                        key={x.label}
                        style={{
                          textAlign: 'center',
                          padding: '6px var(--space-xs)',
                          background: 'rgba(255,255,255,0.06)',
                          backdropFilter: 'blur(4px) saturate(1.5)',
                          WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
                          borderRadius: 14,
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div
                          style={{ fontSize: 19, fontWeight: 800, color: 'white', lineHeight: 1.2 }}
                        >
                          {x.value}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.6)',
                            fontWeight: 600,
                            marginTop: 1,
                          }}
                        >
                          {x.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* subtle glass Shift Button */}
                  <button
                    onClick={() => {
                      const dayData = merged.find((m) => m.day === selected.day)
                      setShiftPickerDay(selected.day)
                      setChosenShift(dayData?.shift_time || '')
                      setChosenLeave(dayData?.leave_type || null)
                      setShowShiftPicker(true)
                    }}
                    style={{
                      width: '100%',
                      padding: 'var(--space-sm) 0',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'white',
                      background: 'rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(4px) saturate(1.5)',
                      WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-xs)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="ph-duotone ph-clock" style={{ fontSize: 14 }}></i>
                    {selected.shift_time ? `กะ ${selected.shift_time}` : 'แตะเพื่อเข้ากะ'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-xs)', textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                💡 คลิกวันที่เพื่อดูรายละเอียด · ดับเบิลคลิกไปบันทึกวันนั้น
              </span>
            </div>
          </div>
        </div>

        {/* ── Summary Card ── */}
        <div
          className="card"
          style={{
            padding: 'var(--space-md)',
            marginTop: 'var(--space-lg)',
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            <i
              className="ph-duotone ph-chart-bar i-icon"
              style={{ marginRight: 'var(--space-xs)' }}
            ></i>
            สรุปเดือนนี้
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'var(--space-sm)',
            }}
          >
            {[
              { label: 'รอบ', value: tot.rounds + tot.help_work + tot.fix_work },
              { label: 'จุด', value: tot.points + tot.help_work + tot.fix_work },
              { label: 'KM', value: tot.km.toLocaleString() },
              { label: 'OT', value: tot.ot.toFixed(1) },
              { label: 'สาย', value: tot.late + "'" },
              { label: 'วันทำงาน', value: tot.workDays },
              { label: 'วันหยุด', value: tot.holiday },
              { label: 'ลา', value: tot.sickLeave + tot.personalLeave },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-xs) 0',
                  background: 'var(--primary-bg)',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- Shift Picker Dialog -- */}
      {showShiftPicker && (
        <>
          <div
            onClick={() => setShowShiftPicker(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 501,
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(4px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: 'var(--space-xl)',
              width: 'calc(100% - 40px)',
              maxWidth: 360,
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 'var(--space-md)',
                textAlign: 'center',
              }}
            >
              วันที่ {shiftPickerDay} {shiftPickerDay !== null && months[currentDate.getMonth()]}{' '}
              {currentDate.getFullYear() + 543}
            </div>
            <div
              style={{
                display: 'table',
                width: '100%',
                tableLayout: 'fixed',
                borderSpacing: '8px 0',
              }}
            >
              {['07:30', '08:00', '09:00'].map((time) => {
                const sel = chosenShift === time
                return (
                  <div
                    key={time}
                    onClick={() => !isSavingShift && handleQuickSaveShift(time)}
                    style={{
                      display: 'table-cell',
                      padding: 'var(--space-md) 0',
                      textAlign: 'center',
                      borderRadius: 12,
                      cursor: isSavingShift ? 'default' : 'pointer',
                      fontWeight: 700,
                      fontSize: 16,
                      border: sel ? '2px solid transparent' : '1px solid rgba(255,255,255,0.12)',
                      background: sel ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                      backdropFilter: sel ? 'none' : 'blur(2px) saturate(1.3)',
                      WebkitBackdropFilter: sel ? 'none' : 'blur(2px) saturate(1.3)',
                      color: sel ? 'var(--active-date-text, white)' : 'var(--text)',
                      opacity: isSavingShift ? 0.6 : 1,
                    }}
                  >
                    {time}
                  </div>
                )
              })}
            </div>
            <div
              style={{
                display: 'table',
                width: '100%',
                tableLayout: 'fixed',
                borderSpacing: '8px 0',
                marginTop: 4,
              }}
            >
              {[
                { key: null, icon: '🛑', label: 'วันหยุด', color: '#e74c3c' },
                { key: 'sick', icon: '🤒', label: 'ลาป่วย', color: '#f1c40f' },
                { key: 'personal', icon: '📋', label: 'ลากิจ', color: '#3498db' },
              ].map((opt) => {
                const sel = chosenShift === 'หยุด' && chosenLeave === opt.key
                return (
                  <div
                    key={opt.key || 'off'}
                    onClick={() => !isSavingShift && handleQuickSaveShift('หยุด', opt.key)}
                    style={{
                      display: 'table-cell',
                      padding: 'var(--space-md) 0',
                      textAlign: 'center',
                      borderRadius: 12,
                      cursor: isSavingShift ? 'default' : 'pointer',
                      fontWeight: 700,
                      fontSize: 14,
                      border: sel ? '2px solid transparent' : '1px solid rgba(255,255,255,0.12)',
                      background: sel ? opt.color : 'rgba(255,255,255,0.06)',
                      backdropFilter: sel ? 'none' : 'blur(2px) saturate(1.3)',
                      WebkitBackdropFilter: sel ? 'none' : 'blur(2px) saturate(1.3)',
                      color: sel ? 'white' : 'var(--text)',
                      opacity: isSavingShift ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{opt.icon}</div>
                    <div>{opt.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
