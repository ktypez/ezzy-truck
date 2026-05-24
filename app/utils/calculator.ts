export const calculateSalary = (logs: any[]) => {
  let totalRounds = 0;  // 🟢 เปลี่ยนจาก Trucks เป็น รอบ
  let totalPoints = 0;  // 🟢 เพิ่มตัวนับจำนวน จุด
  let totalOT = 0;
  let workDays = 0;     
  let totalLate = 0;
  let x2Days = 0;       
  
  logs.forEach(r => {
    const isRealHoliday = 
      r.is_work === false || 
      r.shift_time === 'หยุด' || 
      r.day_type === 'วันหยุด';

    if (!isRealHoliday) {
      workDays++; 
      
      // 🟢 ดึงค่ารอบและจุดสะสมจากฐานข้อมูลมารวมกัน
      totalRounds += (r.rounds || 0);
      totalPoints += (r.points || 0);
      
      totalOT += (r.ot || 0);
      totalLate += (r.late || 0);

      if (r.day_type === 'special' || r.day_type === 'holiday') {
        x2Days++;
      }
    }
  });

  const base = 12000;
  
  // 🟢 [จุดตั้งค่าราคา] พี่สามารถเปลี่ยนตัวคูณเงินของ รอบ และ จุด ได้ที่ 2 บรรทัดนี้เลยครับ
  const roundInc = totalRounds * 5;  // สมมติวิ่งรอบปกติ (ถ้ามีค่ารอบให้แก้เลข 0 เป็นจำนวนเงินได้เลยครับ)
  const pointInc = totalPoints * 0;  // สมมติได้ค่าจุดละ 5 บาท (ปรับเปลี่ยนได้ตามใจชอบครับ)
  
  const otInc = totalOT * 75;
  const foodInc = workDays * 30;
  const phoneInc = workDays * 15;
  const diligenceInc = totalLate > 0 ? 0 : 600;
  const extraInc = x2Days * 400; 
  const lateDed = totalLate;

  const salaryBase = base;
  const salaryBaseTax = salaryBase * 0.03;
  
  // 🟢 รวมเงินค่ารอบ + ค่าจุด เข้าไปในหมวดรายได้อื่นๆ
  const othersGross = (roundInc + pointInc + otInc + foodInc + phoneInc + diligenceInc + extraInc) - lateDed;
  const othersTax = othersGross * 0.03;
  const totalGross = salaryBase + othersGross;
  const totalTax = salaryBaseTax + othersTax;
  const netIncome = totalGross - totalTax;

  return {
    base, roundInc, pointInc, otInc, foodInc, phoneInc, diligenceInc, extraInc, lateDed,
    salaryBase, salaryBaseTax, othersGross, othersTax, totalGross, totalTax, netIncome,
    totalRounds, totalPoints, totalOT, x2Days, workDays
  };
};
