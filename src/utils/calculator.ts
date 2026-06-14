export const calculateSalary = (logs: any[], daysInMonth?: number) => {
  let totalRounds = 0
  let totalPoints = 0
  let totalOT = 0
  let workDays = 0
  let totalLate = 0
  let x2Days = 0
  let sickDays = 0
  let personalDays = 0

  const totalDays = daysInMonth || 30

  logs.forEach((r) => {
    const isRealHoliday = r.is_work === false || r.shift_time === 'หยุด' || r.day_type === 'วันหยุด'

    if (r.leave_type === 'sick') sickDays++
    if (r.leave_type === 'personal') personalDays++

    if (!isRealHoliday) {
      workDays++

      totalRounds += (r.rounds || 0) + (r.help_work || 0) + (r.fix_work || 0)
      totalPoints += (r.points || 0) + (r.help_work || 0) + (r.fix_work || 0)

      totalOT += r.ot || 0
      totalLate += r.late || 0

      if (r.day_type === 'special' || r.day_type === 'holiday') {
        x2Days++
      }
    }
  })

  const base = 12000
  const dailyRate = base / totalDays

  const roundInc = totalRounds * 5
  const pointInc = totalPoints * 5

  const otInc = totalOT * 75
  const foodInc = workDays * 30
  const phoneInc = workDays * 15
  const diligenceInc = totalLate > 0 || sickDays > 0 || personalDays > 0 ? 0 : 600
  const extraInc = x2Days * 400
  const lateDed = totalLate * 5

  const sickExcess = Math.max(0, sickDays - 30)
  const personalExcess = Math.max(0, personalDays - 3)
  const leaveDed = Math.round((sickExcess + personalExcess) * dailyRate)

  const salaryBase = base
  const salaryBaseTax = salaryBase * 0.03

  const othersGross =
    roundInc + pointInc + otInc + foodInc + phoneInc + diligenceInc + extraInc - lateDed - leaveDed
  const othersTax = othersGross * 0.03
  const totalGross = salaryBase + othersGross
  const totalTax = salaryBaseTax + othersTax
  const netIncome = totalGross - totalTax

  return {
    base,
    roundInc,
    pointInc,
    otInc,
    foodInc,
    phoneInc,
    diligenceInc,
    extraInc,
    lateDed,
    leaveDed,
    salaryBase,
    salaryBaseTax,
    othersGross,
    othersTax,
    totalGross,
    totalTax,
    netIncome,
    totalRounds,
    totalPoints,
    totalOT,
    x2Days,
    workDays,
    sickDays,
    personalDays,
    sickExcess,
    personalExcess,
  }
}
