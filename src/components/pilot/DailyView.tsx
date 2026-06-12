import MonthYearSelector from '@/components/MonthYearSelector'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pilotStorage as sb } from '@/lib/pilot-storage'

interface PilotDailyViewProps {
  userId: string
  currentDate: Date
  selectedDay: number
  onSelectDay: (day: number) => void
  onSaveSuccess: () => void
  onChangeMonth: (diff: number) => void
}

export default function PilotDailyView({
  userId,
  currentDate,
  selectedDay,
  onSelectDay,
  onSaveSuccess,
  onChangeMonth,
}: PilotDailyViewProps) {
  // Shared style constants
  const counterInputStyle = {
    width: '52px',
    height: '40px',
    fontSize: '32px',
    fontWeight: 800,
    margin: '0 var(--space-xs)',
    textAlign: 'center',
    border: 'none',
    outline: 'none',
    background: 'var(--primary-bg)',
    borderRadius: '10px',
    color: 'var(--text)',
  } as const
  const months = [
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
  const [isWork, setIsWork] = useState(true)
  const [dayType, setDayType] = useState('normal')
  const [leaveType, setLeaveType] = useState<string | null>(null)
  const [odoIn, setOdoIn] = useState('')
  const [odoOut, setOdoOut] = useState('')
  const [otHours, setOtHours] = useState('')
  const [lateMin, setLateMin] = useState('')
  const [roundCount, setRoundCount] = useState(0)
  const [pointCount, setPointCount] = useState(0)
  const [helpWork, setHelpWork] = useState(0)
  const [fixWork, setFixWork] = useState(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle')
  const [showShiftSelector, setShowShiftSelector] = useState(false)
  const [derivedShift, setDerivedShift] = useState('')
  const [derivedLeaveType, setDerivedLeaveType] = useState<string | null>(null)
  const [isSavingShift, setIsSavingShift] = useState(false)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate()

  const daysShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

  const allDaysArray = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1, i + 1)
    return { dayNum: i + 1, dayName: daysShort[d.getDay()] }
  })

  const isToday = (day: number) => {
    const now = new Date()
    return (
      day === now.getDate() &&
      currentMonth === now.getMonth() + 1 &&
      currentYear === now.getFullYear()
    )
  }

  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sliderRef.current) return
    const el = sliderRef.current.querySelector(`[data-day="${selectedDay}"]`) as HTMLElement
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDay])

  const queryClient = useQueryClient()

  // Load day log via TanStack Query
  const { data: dayData } = useQuery({
    queryKey: ['day-log', userId, currentYear, currentMonth, selectedDay],
    queryFn: async () => {
      const { data } = await sb
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .eq('day', selectedDay)
        .maybeSingle()
      return data || null
    },
    enabled: !!userId,
  })

  useEffect(() => {
    if (dayData) {
      const isHoliday =
        dayData.shift_time === 'หยุด' || dayData.day_type === 'วันหยุด' || dayData.is_work === false
      setDerivedShift(dayData.shift_time || '')
      setDerivedLeaveType(dayData.leave_type || null)
      setIsWork(!isHoliday)
      if (isHoliday) {
        setLeaveType(dayData.leave_type || null)
      } else {
        setDayType(dayData.day_type === 'special' ? 'special' : 'normal')
        setOdoIn(dayData.odo_in ? String(dayData.odo_in) : '')
        setOdoOut(dayData.odo_out ? String(dayData.odo_out) : '')
        setOtHours(dayData.ot ? String(dayData.ot) : '')
        setLateMin(dayData.late ? String(dayData.late) : '')
        setRoundCount(dayData.rounds || 0)
        setPointCount(dayData.points || 0)
        setHelpWork(dayData.help_work || 0)
        setFixWork(dayData.fix_work || 0)
      }
    } else {
      setDerivedShift('')
      setDerivedLeaveType(null)
      setIsWork(true)
      setDayType('normal')
      setLeaveType(null)
      setOdoIn('')
      setOdoOut('')
      setOtHours('')
      setLateMin('')
      setRoundCount(0)
      setPointCount(0)
      setHelpWork(0)
      setFixWork(0)
    }
  }, [dayData])

  const handleQuickSaveShift = async (chosenShift: string, chosenLeaveType?: string | null) => {
    if (!selectedDay || !chosenShift) return
    setIsSavingShift(true)
    const isHoliday = chosenShift === 'หยุด'
    try {
      const payload: any = {
        user_id: userId,
        year: currentYear,
        month: currentMonth,
        day: selectedDay,
        shift_time: chosenShift,
        day_type: isHoliday ? 'วันหยุด' : 'วันทำงาน',
        is_work: !isHoliday,
        leave_type: isHoliday ? chosenLeaveType || null : null,
      }
      if (isHoliday)
        Object.assign(payload, {
          odo_in: 0,
          odo_out: 0,
          ot: 0,
          late: 0,
          drivers: [],
          trucks: 0,
          odo: 0,
        })
      const { error } = await sb
        .from('logs')
        .upsert(payload, { onConflict: 'user_id,year,month,day' })
      if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message)
      } else {
        setShowShiftSelector(false)
        onSaveSuccess()
        queryClient.invalidateQueries({
          queryKey: ['day-log', userId, currentYear, currentMonth, selectedDay],
        })
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSavingShift(false)
    }
  }

  const distance = Math.max(0, (parseFloat(odoOut) || 0) - (parseFloat(odoIn) || 0))

  const handleSave = async (dayTypeOverride?: string) => {
    setSaveStatus('saving')
    const payload: any = {
      user_id: userId,
      year: currentYear,
      month: currentMonth,
      day: selectedDay,
      is_work: isWork,
      shift_time: derivedShift || null,
    }
    if (isWork) {
      Object.assign(payload, {
        day_type: dayTypeOverride ?? dayType,
        odo_in: parseFloat(odoIn) || 0,
        odo_out: parseFloat(odoOut) || 0,
        ot: parseFloat(otHours) || 0,
        late: parseInt(lateMin) || 0,
        rounds: roundCount,
        points: pointCount,
        help_work: helpWork,
        fix_work: fixWork,
        trucks: roundCount,
        odo: distance,
        drivers: [],
        leave_type: null,
      })
    } else {
      Object.assign(payload, {
        day_type: 'วันหยุด',
        shift_time: 'หยุด',
        is_work: false,
        odo_in: 0,
        odo_out: 0,
        ot: 0,
        late: 0,
        rounds: 0,
        points: 0,
        help_work: 0,
        fix_work: 0,
        trucks: 0,
        odo: 0,
        drivers: [],
        leave_type: leaveType,
      })
    }
    const { error } = await sb
      .from('logs')
      .upsert(payload, { onConflict: 'user_id,year,month,day' })
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
      setSaveStatus('idle')
    } else {
      setSaveStatus('success')
      onSaveSuccess()
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  return (
    <div id="view-daily" className="view active">
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

      {/* Date Slider (Embla) */}
      <div className="date-slider-container" ref={sliderRef}>
        {allDaysArray.map((item) => {
          const isActive = selectedDay === item.dayNum
          const today = isToday(item.dayNum)
          return (
            <button
              key={item.dayNum}
              onClick={() => onSelectDay(item.dayNum)}
              className={`date-slider-item ${isActive ? 'active' : ''} ${today && !isActive ? 'today' : ''}`}
              data-day={item.dayNum}
            >
              <span className="slider-day-name">{item.dayName}</span>
              <span className="slider-day-num">{item.dayNum}</span>
            </button>
          )
        })}
      </div>

      {/* Shift badge + Day type */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
          marginTop: 'var(--space-sm)',
          alignItems: 'center',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--glass-bg, rgba(255,255,255,0.7))',
          backdropFilter: 'blur(4px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
          border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => setShowShiftSelector(true)}
          style={{
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-xs)',
            background: derivedShift ? 'var(--primary)' : 'var(--border)',
            color: derivedShift ? 'var(--active-date-text, white)' : 'var(--muted)',
            border: derivedShift ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <i
            className={`ph-duotone ${derivedShift === 'หยุด' ? (derivedLeaveType === 'sick' ? 'ph-thermometer-hot' : derivedLeaveType === 'personal' ? 'ph-briefcase' : 'ph-prohibit') : 'ph-clock'} i-sm`}
          ></i>
          {derivedShift
            ? derivedShift === 'หยุด'
              ? derivedLeaveType === 'sick'
                ? 'ลาป่วย'
                : derivedLeaveType === 'personal'
                  ? 'ลากิจ'
                  : 'วันหยุด'
              : `เข้ากะ ${derivedShift}`
            : 'แตะเพื่อเข้ากะ'}
        </button>
        <label
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            cursor: derivedShift === 'หยุด' ? 'default' : 'pointer',
            opacity: derivedShift === 'หยุด' ? 0.35 : 1,
            userSelect: 'none',
          }}
          onClick={() => {
            if (derivedShift !== 'หยุด') {
              const next = dayType === 'normal' ? 'special' : 'normal'
              setDayType(next)
              handleSave(next)
            }
          }}
        >
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: dayType === 'normal' ? 'var(--primary)' : 'var(--muted)',
            }}
          >
            ปกติ
          </span>
          <div
            style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: dayType === 'special' ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: dayType === 'special' ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: dayType === 'special' ? 'var(--primary)' : 'var(--muted)',
            }}
          >
            x2
          </span>
        </label>
      </div>

      {isWork ? (
        <>
          {/* Summary Banner */}
          <div
            className="daily-summary card"
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  letterSpacing: '0.3px',
                }}
              >
                ระยะทาง
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                {distance}{' '}
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>
                  กม.
                </span>
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  letterSpacing: '0.3px',
                }}
              >
                รอบ
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                {roundCount + helpWork + fixWork}{' '}
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>
                  รอบ
                </span>
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  letterSpacing: '0.3px',
                }}
              >
                จุดส่ง
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                {pointCount + helpWork + fixWork}{' '}
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>
                  จุด
                </span>
              </div>
            </div>
          </div>

          {/* Odometer Card */}
          <div className="card" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
            <div className="input-group">
              <span>ไมล์เข้า</span>
              <input
                type="number"
                id="odoIn"
                className="input-field input-field-accent"
                value={odoIn}
                onChange={(e) => setOdoIn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') document.getElementById('odoOut')?.focus()
                }}
              />
            </div>
            <div className="input-group">
              <span>ไมล์ออก</span>
              <input
                type="number"
                id="odoOut"
                className="input-field input-field-accent"
                value={odoOut}
                onChange={(e) => setOdoOut(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') document.getElementById('otHours')?.focus()
                }}
              />
            </div>
            <div className="input-group">
              <span>ชั่วโมง OT</span>
              <input
                type="number"
                step="0.5"
                id="otHours"
                className="input-field input-field-accent"
                value={otHours}
                onChange={(e) => setOtHours(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') document.getElementById('lateMin')?.focus()
                }}
              />
            </div>
            <div className="input-group">
              <span>สาย (นาที)</span>
              <input
                type="number"
                id="lateMin"
                className="input-field input-field-accent"
                value={lateMin}
                onChange={(e) => setLateMin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
              />
            </div>
          </div>

          <div
            className="card"
            style={{ padding: 'var(--space-sm) var(--space-md)', marginBottom: 'var(--space-md)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--muted)',
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  background: 'var(--primary)',
                  color: 'var(--active-date-text, white)',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  flexShrink: 0,
                }}
              >
                i
              </span>
              <span>+ รอบ = จุดอัตโนมัติ · + งานช่วย/แก้ เพิ่มรอบ-จุด ในผลรวม</span>
            </div>
          </div>
          {/* Rounds & Points Card */}
          <div
            className="card"
            style={{ display: 'flex', gap: '10px', padding: 'var(--space-md) var(--space-sm)' }}
          >
            <div
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: 'var(--space-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                }}
              >
                <i
                  className="ph-duotone ph-arrows-clockwise i-sm"
                  style={{ color: 'var(--muted)' }}
                ></i>{' '}
                รอบ
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  className="del-btn-small"
                  onClick={() => {
                    setRoundCount((prev) => Math.max(0, prev - 1))
                    setPointCount((prev) => Math.max(0, prev - 1))
                  }}
                >
                  <i className="ph-bold ph-minus"></i>
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={roundCount === 0 ? '' : roundCount}
                  placeholder="0"
                  onChange={(e) => setRoundCount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={counterInputStyle}
                />
                <button
                  type="button"
                  className="del-btn-small"
                  onClick={() => {
                    setRoundCount((prev) => prev + 1)
                    setPointCount((prev) => prev + 1)
                  }}
                >
                  <i className="ph-bold ph-plus"></i>
                </button>
              </div>
            </div>
            <div
              style={{
                borderLeft: '1px dashed var(--border)',
                height: '55px',
                alignSelf: 'center',
              }}
            ></div>
            <div
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: 'var(--space-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                }}
              >
                <i className="ph-duotone ph-map-trifold i-sm" style={{ color: 'var(--muted)' }}></i>{' '}
                จุด
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  className="del-btn-small"
                  onClick={() => setPointCount((prev) => Math.max(0, prev - 1))}
                >
                  <i className="ph-bold ph-minus"></i>
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pointCount === 0 ? '' : pointCount}
                  placeholder="0"
                  onChange={(e) => setPointCount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '52px',
                    height: '40px',
                    fontSize: '32px',
                    fontWeight: 800,
                    margin: '0 var(--space-xs)',
                    textAlign: 'center',
                    border: 'none',
                    outline: 'none',
                    background: 'var(--primary-bg)',
                    borderRadius: '10px',
                    color: 'var(--text)',
                  }}
                />
                <button
                  type="button"
                  className="del-btn-small"
                  onClick={() => setPointCount((prev) => prev + 1)}
                >
                  <i className="ph-bold ph-plus"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Help Work & Fix Work Card */}
          <div className="card" style={{ padding: 'var(--space-md) var(--space-sm)' }}>
            <div
              style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}
            >
              <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 'var(--space-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                  }}
                >
                  <i
                    className="ph-duotone ph-hand-heart i-sm"
                    style={{ color: 'var(--muted)' }}
                  ></i>{' '}
                  งานช่วย
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="del-btn-small"
                    onClick={() => setHelpWork((prev) => Math.max(0, prev - 1))}
                  >
                    <i className="ph-bold ph-minus"></i>
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={helpWork === 0 ? '' : helpWork}
                    placeholder="0"
                    onChange={(e) => setHelpWork(Math.max(0, parseInt(e.target.value) || 0))}
                    style={counterInputStyle}
                  />
                  <button
                    type="button"
                    className="del-btn-small"
                    onClick={() => setHelpWork((prev) => prev + 1)}
                  >
                    <i className="ph-bold ph-plus"></i>
                  </button>
                </div>
              </div>
              <div
                style={{
                  borderLeft: '1px dashed var(--border)',
                  height: '55px',
                  alignSelf: 'center',
                }}
              ></div>
              <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 'var(--space-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                  }}
                >
                  <i className="ph-duotone ph-wrench i-sm" style={{ color: 'var(--muted)' }}></i>{' '}
                  งานแก้
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="del-btn-small"
                    onClick={() => setFixWork((prev) => Math.max(0, prev - 1))}
                  >
                    <i className="ph-bold ph-minus"></i>
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={fixWork === 0 ? '' : fixWork}
                    placeholder="0"
                    onChange={(e) => setFixWork(Math.max(0, parseInt(e.target.value) || 0))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave()
                    }}
                    style={counterInputStyle}
                  />
                  <button
                    type="button"
                    className="del-btn-small"
                    onClick={() => setFixWork((prev) => prev + 1)}
                  >
                    <i className="ph-bold ph-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div
          className="card"
          style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-xl)' }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {leaveType === 'sick' ? '🤒' : leaveType === 'personal' ? '📋' : '😴'}
          </div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color:
                leaveType === 'sick'
                  ? '#f1c40f'
                  : leaveType === 'personal'
                    ? '#3498db'
                    : 'var(--primary)',
              marginBottom: '4px',
            }}
          >
            {leaveType === 'sick'
              ? 'ลาป่วย'
              : leaveType === 'personal'
                ? 'ลากิจ'
                : 'วันหยุดพักผ่อน'}
          </h3>
          <p style={{ fontSize: '16px', color: 'var(--muted)' }}>
            {leaveType
              ? 'แตะปุ่มด้านบนเพื่อเปลี่ยนสถานะ'
              : 'พักผ่อนให้เต็มที่ หรือแตะปุ่มด้านบนเพื่อเปลี่ยนกะ'}
          </p>
        </div>
      )}

      {/* Save Button */}
      <button
        className={`main-save-btn ${saveStatus === 'success' ? 'success' : ''}`}
        onClick={() => handleSave()}
        disabled={saveStatus === 'saving'}
      >
        <i
          className={`ph-duotone ${saveStatus === 'success' ? 'ph-check-circle' : saveStatus === 'saving' ? 'ph-spinner-gap spin' : 'ph-floppy-disk'} i-icon`}
        ></i>
        {saveStatus === 'success'
          ? ' บันทึกเรียบร้อย ✨'
          : saveStatus === 'saving'
            ? ' กำลังบันทึก...'
            : ' บันทึกข้อมูลวันนี้'}
      </button>

      {/* — Shift Picker Modal (centered + blur backdrop) — */}
      {showShiftSelector && (
        <>
          <div
            onClick={() => setShowShiftSelector(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 250,
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
              zIndex: 251,
              background: 'var(--glass-bg, rgba(255,255,255,0.7))',
              backdropFilter: 'blur(4px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(4px) saturate(1.5)',
              border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
              borderRadius: 20,
              padding: 'var(--space-xl)',
              width: 'calc(100% - 40px)',
              maxWidth: 360,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 14,
                textAlign: 'center',
              }}
            >
              วันที่ {selectedDay} {months[currentMonth - 1]} {currentYear + 543}
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
                const sel = derivedShift === time
                return (
                  <div
                    key={time}
                    onClick={() => !isSavingShift && handleQuickSaveShift(time)}
                    style={{
                      display: 'table-cell',
                      padding: 'var(--space-md) 0',
                      textAlign: 'center',
                      borderRadius: '12px',
                      cursor: isSavingShift ? 'default' : 'pointer',
                      fontWeight: 700,
                      fontSize: '16px',
                      border: sel
                        ? '2px solid var(--primary)'
                        : '1px solid var(--glass-border, rgba(0,0,0,0.08))',
                      background: sel ? 'var(--primary)' : 'var(--glass-bg, rgba(255,255,255,0.7))',
                      backdropFilter: sel ? 'none' : 'blur(4px) saturate(1.4)',
                      WebkitBackdropFilter: sel ? 'none' : 'blur(4px) saturate(1.4)',
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
                marginTop: '4px',
              }}
            >
              {[
                { key: null, icon: '🛑', label: 'วันหยุด', color: '#e74c3c' },
                { key: 'sick', icon: '🤒', label: 'ลาป่วย', color: '#f1c40f' },
                { key: 'personal', icon: '📋', label: 'ลากิจ', color: '#3498db' },
              ].map((opt) => {
                const sel = derivedShift === 'หยุด' && (derivedLeaveType || null) === opt.key
                return (
                  <div
                    key={opt.key || 'off'}
                    onClick={() => !isSavingShift && handleQuickSaveShift('หยุด', opt.key)}
                    style={{
                      display: 'table-cell',
                      padding: 'var(--space-md) 0',
                      textAlign: 'center',
                      borderRadius: '12px',
                      cursor: isSavingShift ? 'default' : 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                      border: sel
                        ? '2px solid var(--primary)'
                        : '1px solid var(--glass-border, rgba(0,0,0,0.08))',
                      background: sel ? opt.color : 'rgba(255,255,255,0.06)',
                      backdropFilter: sel ? 'none' : 'blur(4px) saturate(1.4)',
                      WebkitBackdropFilter: sel ? 'none' : 'blur(4px) saturate(1.4)',
                      color: sel ? 'white' : 'var(--text)',
                      opacity: isSavingShift ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: '18px' }}>{opt.icon}</div>
                    <div>{opt.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
