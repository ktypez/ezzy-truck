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

  // 🟢 เติมระบบความปลอดภัย (|| 0) เผื่อค่าหลุดเป็น undefined บราวเซอร์จะได้ไม่พังหน้าจอขาวครับ
  const fmt = (num: number) => (num || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtFloat = (num: number) => (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div id="view-salary" className="view active">
      
      {/* 📦 กล่องรายละเอียดรายได้เวอร์ชันอัปเกรด รอบ วิ่ง และ จุดส่งสินค้า */}
      <div className="card">
        <div className="input-group">
          <span>เงินเดือน</span>
          <span className="mid-label"></span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.base)} readOnly />
        </div>
        
        <div className="input-group">
          <span>X2</span>
          <span className="mid-label">{salaryResult.x2Days || 0} วัน</span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.extraInc)} readOnly />
        </div>
        
        {/* 🟢 เปลี่ยนแถวรถยนต์เดิม แยกออกเป็น "จำนวนรอบวิ่ง" และ "จำนวนจุดส่ง" ชัดเจนตามกฎใหม่ */}
        <div className="input-group">
          <span>จำนวนรอบ</span>
          <span className="mid-label">{salaryResult.totalRounds || 0} รอบ</span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.roundInc)} readOnly />
        </div>

        <div className="input-group">
          <span>จำนวนจุด</span>
          <span className="mid-label">{salaryResult.totalPoints || 0} จุด</span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.pointInc)} readOnly />
        </div>

        <div className="input-group">
          <span>ค่า OT</span>
          <span className="mid-label">{salaryResult.totalOT || 0} ชม.</span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.otInc)} readOnly />
        </div>
        
        <div className="input-group">
          <span>ค่าอาหาร</span>
          <span className="mid-label">{salaryResult.workDays || 0} วัน</span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.foodInc)} readOnly />
        </div>
        
        <div className="input-group">
          <span>ค่าโทรศัพท์</span>
          <span className="mid-label">{salaryResult.workDays || 0} วัน</span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.phoneInc)} readOnly />
        </div>
        
        <div className="input-group">
          <span>เบี้ยขยัน</span>
          <span className="mid-label"></span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.diligenceInc)} readOnly />
        </div>
        
        <div className="input-group">
          <span>หักสาย</span>
          <span className="mid-label"></span>
          <input type="text" className="input-field input-readonly" value={fmt(salaryResult.lateDed)} readOnly style={{ color: '#e74c3c' }} />
        </div>
      </div>

      {/* 📊 ตารางการแยกประเภทเงินเดือนและภาษีหัก ณ ที่จ่าย */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
        <div className="card" style={{ marginBottom: 0, padding: '15px', borderTop: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>เงินเดือนหลัก</div>
          <div style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0', color: 'var(--text)' }}>{fmtFloat(salaryResult.salaryBase)}</div>
          <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 600 }}>ภาษี: <span>-{fmtFloat(salaryResult.salaryBaseTax)}</span></div>
        </div>
        <div className="card" style={{ marginBottom: 0, padding: '15px', borderTop: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>รายได้เพิ่ม</div>
          <div style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0', color: 'var(--text)' }}>{fmtFloat(salaryResult.othersGross)}</div>
          <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 600 }}>ภาษี: <span>-{fmtFloat(salaryResult.othersTax)}</span></div>
        </div>
      </div>

      {/* 💎 การสรุปผลลัพธ์สุทธิ (กรอบแดชบอร์ดล่างสุด) */}
      <div className="card" style={{ background: 'var(--primary-bg)', border: '2px dashed var(--primary)', marginTop: '15px', padding: '20px 15px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '15px', fontWeight: 600 }}>
          <span style={{ color: 'var(--text)' }}>ยอดรวม (Gross)</span>
          <strong style={{ color: 'var(--text)' }}>{fmtFloat(salaryResult.totalGross)}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontSize: '15px', fontWeight: 600, color: '#e74c3c' }}>
          <span>ภาษีรวม 3%</span>
          <strong>-{fmtFloat(salaryResult.totalTax)}</strong>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '24px', 
          color: 'var(--primary)', 
          borderTop: '1px solid var(--border)', 
          paddingTop: '15px', 
          marginTop: '5px' 
        }}>
          <span style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>รายรับสุทธิ</span>
          <strong style={{ fontWeight: 900 }}>{fmtFloat(salaryResult.netIncome)}</strong>
        </div>

      </div>
    </div>
  );
}
