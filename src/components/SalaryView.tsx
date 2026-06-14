import MonthYearSelector from './MonthYearSelector'
import { useQuery } from '@tanstack/react-query'
import { sb } from '@/lib/supabase'
import { calculateSalary } from '@/utils/calculator'

interface SalaryViewProps {
  userId: string
  currentDate: Date
  onChangeMonth: (diff: number) => void
}

export default function SalaryView({ userId, currentDate, onChangeMonth }: SalaryViewProps) {
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
  // salaryResult & leaveTotals from useQuery below

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()

  const { data: salaryResult } = useQuery({
    queryKey: ['salary', userId, year, month],
    queryFn: async () => {
      const { data } = await sb
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month)
      return data ? calculateSalary(data, daysInMonth) : null
    },
    enabled: !!userId,
  })

  const { data: leaveTotals } = useQuery({
    queryKey: ['yearly-leave', userId, year],
    queryFn: async () => {
      const { data } = await sb
        .from('logs')
        .select('leave_type')
        .eq('user_id', userId)
        .eq('year', year)
        .not('leave_type', 'is', null)
      if (data) {
        return {
          sick: data.filter((r: any) => r.leave_type === 'sick').length,
          personal: data.filter((r: any) => r.leave_type === 'personal').length,
        }
      }
      return { sick: 0, personal: 0 }
    },
    enabled: !!userId,
  })

  const yearlySick = leaveTotals?.sick ?? 0
  const yearlyPersonal = leaveTotals?.personal ?? 0

  if (!salaryResult) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-3xl)',
          color: 'var(--muted)',
          fontWeight: 500,
        }}
      >
        <i
          className="ph-duotone ph-spinner-gap spin"
          style={{
            fontSize: '24px',
            marginBottom: 'var(--space-sm)',
            display: 'block',
            margin: '0 auto',
          }}
        ></i>
        กำลังคำนวณรายได้...
      </div>
    )
  }

  const fmt = (num: number) =>
    (num || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const fmtFloat = (num: number) =>
    (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const SalaryRow = ({
    icon,
    label,
    sub,
    value,
    negative,
  }: {
    icon: string
    label: string
    sub?: string
    value: string
    negative?: boolean
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--space-sm) 0',
        borderBottom: '1px dashed var(--border)',
      }}
    >
      <i
        className={icon}
        style={{
          fontSize: '18px',
          color: 'var(--secondary)',
          marginRight: 'var(--space-sm)',
          width: '22px',
          textAlign: 'center',
        }}
      ></i>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {sub && (
          <div
            style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)', marginTop: '1px' }}
          >
            {sub}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: '17px',
          fontWeight: 700,
          color: negative ? '#e74c3c' : 'var(--primary)',
        }}
      >
        {negative ? '-' : ''}
        {value}
      </span>
    </div>
  )

  return (
    <div id="view-salary" className="view active">
      {/* Month/Year Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <MonthYearSelector currentDate={currentDate} onChangeMonth={onChangeMonth} />
      </div>

      {/* Hero Net Income Card */}
      <div
        className="card"
        style={{
          background:
            'var(--hero-gradient, linear-gradient(135deg, var(--primary), var(--secondary)))',
          padding: 'var(--space-lg) var(--space-xl)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.5px',
              }}
            >
              รายรับสุทธิ
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-1px',
                lineHeight: 1.2,
                marginTop: '2px',
              }}
            >
              ฿{fmtFloat(salaryResult.netIncome)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.5px',
              }}
            >
              รวม
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>
              {fmtFloat(salaryResult.totalGross)}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 'var(--space-xs)',
              }}
            >
              ภาษี -{fmtFloat(salaryResult.totalTax)}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      {(yearlySick > 0 || yearlyPersonal > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <div
            className="card"
            style={{ padding: 'var(--space-md)', textAlign: 'center', marginBottom: 0 }}
          >
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>🤒 ลาป่วย</div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: yearlySick > 25 ? '#e74c3c' : 'var(--secondary)',
              }}
            >
              {Math.max(0, 30 - yearlySick)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>คงเหลือ / 30 วัน</div>
          </div>
          <div
            className="card"
            style={{ padding: 'var(--space-md)', textAlign: 'center', marginBottom: 0 }}
          >
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>📋 ลากิจ</div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: yearlyPersonal >= 3 ? '#e74c3c' : 'var(--secondary)',
              }}
            >
              {Math.max(0, 3 - yearlyPersonal)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>คงเหลือ / 3 วัน</div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div
        className="card"
        style={{ padding: 0, overflow: 'hidden', marginTop: 'var(--space-lg)' }}
      >
        <div
          style={{
            background: 'var(--primary-bg)',
            padding: 'var(--space-sm) var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          <i
            className="ph-duotone ph-list-numbers"
            style={{ color: 'var(--muted)', fontSize: '16px' }}
          ></i>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--muted)',
              letterSpacing: '0.5px',
            }}
          >
            รายละเอียดรายได้
          </span>
        </div>
        <div className="salary-breakdown" style={{ padding: 'var(--space-xs) var(--space-lg)' }}>
          <SalaryRow
            icon="ph-duotone ph-currency-circle-dollar"
            label="เงินเดือน"
            value={fmt(salaryResult.base)}
          />
          <SalaryRow
            icon="ph-duotone ph-copy"
            label="X2"
            sub={`${salaryResult.x2Days || 0} วัน`}
            value={fmt(salaryResult.extraInc)}
          />
          <SalaryRow
            icon="ph-duotone ph-arrows-clockwise"
            label="รอบวิ่ง"
            sub={`${salaryResult.totalRounds || 0} รอบ`}
            value={fmt(salaryResult.roundInc)}
          />
          <SalaryRow
            icon="ph-duotone ph-map-trifold"
            label="จุดส่ง"
            sub={`${salaryResult.totalPoints || 0} จุด`}
            value={fmt(salaryResult.pointInc)}
          />
          <SalaryRow
            icon="ph-duotone ph-clock"
            label="ค่า OT"
            sub={`${salaryResult.totalOT || 0} ชม.`}
            value={fmt(salaryResult.otInc)}
          />
          <SalaryRow
            icon="ph-duotone ph-bowl-food"
            label="ค่าอาหาร"
            sub={`${salaryResult.workDays || 0} วัน`}
            value={fmt(salaryResult.foodInc)}
          />
          <SalaryRow
            icon="ph-duotone ph-device-mobile"
            label="ค่าโทรศัพท์"
            sub={`${salaryResult.workDays || 0} วัน`}
            value={fmt(salaryResult.phoneInc)}
          />
          <SalaryRow
            icon="ph-duotone ph-hand-heart"
            label="เบี้ยขยัน"
            sub={
              salaryResult.diligenceInc > 0
                ? 'ไม่มาสาย/ลา'
                : salaryResult.sickDays > 0 || salaryResult.personalDays > 0
                  ? 'มีวันลา'
                  : 'มีสาย'
            }
            value={fmt(salaryResult.diligenceInc)}
          />
          <SalaryRow
            icon="ph-duotone ph-warning-circle"
            label="หักสาย"
            value={fmt(salaryResult.lateDed)}
            negative
          />
          {salaryResult.leaveDed > 0 && (
            <SalaryRow
              icon="ph-duotone ph-prohibit"
              label="หักลาเกินสิทธิ"
              sub={
                salaryResult.sickExcess > 0
                  ? `ลาป่วยเกิน ${salaryResult.sickExcess} วัน`
                  : `ลากิจเกิน ${salaryResult.personalExcess} วัน`
              }
              value={fmt(salaryResult.leaveDed)}
              negative
            />
          )}
        </div>
      </div>

      {/* Tax Summary */}
      <div
        className="card"
        style={{ padding: 0, overflow: 'hidden', marginTop: 'var(--space-lg)' }}
      >
        <div
          style={{
            background: 'var(--primary-bg)',
            padding: 'var(--space-sm) var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          <i
            className="ph-duotone ph-receipt"
            style={{ color: 'var(--muted)', fontSize: '16px' }}
          ></i>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--muted)',
              letterSpacing: '0.5px',
            }}
          >
            ภาษีหัก ณ ที่จ่าย 3%
          </span>
        </div>
        <div style={{ padding: 'var(--space-sm) var(--space-lg)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-xs) 0',
            }}
          >
            <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>
              เงินเดือน
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              {fmtFloat(salaryResult.salaryBase)}
            </span>
            <span
              style={{
                fontSize: '13px',
                background: 'rgba(231,76,60,0.1)',
                color: '#e74c3c',
                fontWeight: 700,
                padding: '2px var(--space-sm)',
                borderRadius: '6px',
              }}
            >
              -{fmtFloat(salaryResult.salaryBaseTax)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-xs) 0',
              borderTop: '1px dashed var(--border)',
            }}
          >
            <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>
              รายได้เพิ่ม
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              {fmtFloat(salaryResult.othersGross)}
            </span>
            <span
              style={{
                fontSize: '13px',
                background: 'rgba(231,76,60,0.1)',
                color: '#e74c3c',
                fontWeight: 700,
                padding: '2px var(--space-sm)',
                borderRadius: '6px',
              }}
            >
              -{fmtFloat(salaryResult.othersTax)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0 4px',
              borderTop: '2px solid var(--border)',
              marginTop: 'var(--space-xs)',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>รวมภาษี</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#e74c3c' }}>
              -{fmtFloat(salaryResult.totalTax)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
