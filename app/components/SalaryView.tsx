'use client';
import { useState, useEffect } from 'react';
import { sb } from '@/lib/supabase';
import { calculateSalary } from '@/utils/calculator';

interface SalaryViewProps {
  userId: string;
  currentDate: Date;
  refreshTrigger: boolean;
}

export default function SalaryView({ userId, currentDate, refreshTrigger }: SalaryViewProps) {
  const [salaryResult, setSalaryResult] = useState<any>(null);

  useEffect(() => {
    async function loadAndCalc() {
      const { data } = await sb.from('logs').select('*')
        .eq('user_id', userId)
        .eq('year', currentDate.getFullYear())
        .eq('month', currentDate.getMonth() + 1);
      if (data) {
        setSalaryResult(calculateSalary(data));
      }
    }
    loadAndCalc();
  }, [currentDate, userId, refreshTrigger]);

  if (!salaryResult) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontWeight: 500 }}>
        <i className="ph-duotone ph-spinner-gap spin" style={{ fontSize: '24px', marginBottom: '8px', display: 'block', margin: '0 auto' }}></i>
        กำลังคำนวณรายได้...
      </div>
    );
  }

  const fmt = (num: number) => (num || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtFloat = (num: number) => (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const SalaryRow = ({ icon, label, sub, value, negative }: { icon: string; label: string; sub?: string; value: string; negative?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
      <i className={icon} style={{ fontSize: '18px', color: 'var(--secondary)', marginRight: '10px', width: '22px', textAlign: 'center' }}></i>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', marginTop: '1px' }}>{sub}</div>}
      </div>
      <span style={{ fontSize: '15px', fontWeight: 700, color: negative ? '#e74c3c' : 'var(--primary)' }}>{negative ? '-' : ''}{value}</span>
    </div>
  );

  return (
    <div id="view-salary" className="view active">
      
      {/* Hero Net Income Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        borderRadius: '16px',
        padding: '18px 20px',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
              รายรับสุทธิ
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.2, marginTop: '2px' }}>
              ฿{fmtFloat(salaryResult.netIncome)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>รวม</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'white' }}>{fmtFloat(salaryResult.totalGross)}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>ภาษี -{fmtFloat(salaryResult.totalTax)}</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ marginTop: '15px', background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ background: 'var(--primary-bg)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ph-duotone ph-list-numbers" style={{ color: 'var(--secondary)', fontSize: '16px' }}></i>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px' }}>รายละเอียดรายได้</span>
        </div>
        <div className="salary-breakdown" style={{ padding: '6px 16px' }}>
          <SalaryRow icon="ph-duotone ph-currency-circle-dollar" label="เงินเดือน" value={fmt(salaryResult.base)} />
          <SalaryRow icon="ph-duotone ph-copy" label="X2" sub={`${salaryResult.x2Days || 0} วัน`} value={fmt(salaryResult.extraInc)} />
          <SalaryRow icon="ph-duotone ph-arrows-clockwise" label="รอบวิ่ง" sub={`${salaryResult.totalRounds || 0} รอบ`} value={fmt(salaryResult.roundInc)} />
          <SalaryRow icon="ph-duotone ph-map-trifold" label="จุดส่ง" sub={`${salaryResult.totalPoints || 0} จุด`} value={fmt(salaryResult.pointInc)} />
          <SalaryRow icon="ph-duotone ph-clock" label="ค่า OT" sub={`${salaryResult.totalOT || 0} ชม.`} value={fmt(salaryResult.otInc)} />
          <SalaryRow icon="ph-duotone ph-bowl-food" label="ค่าอาหาร" sub={`${salaryResult.workDays || 0} วัน`} value={fmt(salaryResult.foodInc)} />
          <SalaryRow icon="ph-duotone ph-device-mobile" label="ค่าโทรศัพท์" sub={`${salaryResult.workDays || 0} วัน`} value={fmt(salaryResult.phoneInc)} />
          <SalaryRow icon="ph-duotone ph-hand-heart" label="เบี้ยขยัน" value={fmt(salaryResult.diligenceInc)} />
          <SalaryRow icon="ph-duotone ph-warning-circle" label="หักสาย" value={fmt(salaryResult.lateDed)} negative />
        </div>
      </div>

      {/* Tax Summary */}
      <div style={{ marginTop: '15px', background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ background: 'var(--primary-bg)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ph-duotone ph-receipt" style={{ color: 'var(--secondary)', fontSize: '16px' }}></i>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px' }}>ภาษีหัก ณ ที่จ่าย 3%</span>
        </div>
        <div style={{ padding: '10px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>เงินเดือน</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{fmtFloat(salaryResult.salaryBase)}</span>
            <span style={{ fontSize: '13px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>-{fmtFloat(salaryResult.salaryBaseTax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>รายได้เพิ่ม</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{fmtFloat(salaryResult.othersGross)}</span>
            <span style={{ fontSize: '13px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>-{fmtFloat(salaryResult.othersTax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 4px', borderTop: '2px solid var(--border)', marginTop: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>รวมภาษี</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#e74c3c' }}>-{fmtFloat(salaryResult.totalTax)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
