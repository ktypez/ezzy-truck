import { describe, it, expect } from 'vitest'
import { calculateSalary } from '@/utils/calculator'

describe('calculateSalary', () => {
  it('returns base salary with no extras', () => {
    const result = calculateSalary([], 30)
    expect(result.base).toBe(12000)
    expect(result.netIncome).toBeGreaterThan(0)
    expect(result.workDays).toBe(0)
  })

  it('calculates rounds and OT correctly', () => {
    const logs = [
      { rounds: 10, points: 5, ot: 2, late: 0, day_type: 'normal', leave_type: null, is_work: true, shift_time: '07:30' },
    ]
    const result = calculateSalary(logs, 30)
    expect(result.totalRounds).toBe(10)
    expect(result.totalOT).toBe(2)
    expect(result.roundInc).toBe(50) // 10 * 5
  })

  it('treats holidays as non-work days', () => {
    const logs = [
      { rounds: 10, points: 5, ot: 2, late: 0, day_type: 'วันหยุด', leave_type: null, is_work: false, shift_time: 'หยุด' },
    ]
    const result = calculateSalary(logs, 30)
    expect(result.workDays).toBe(0)
    expect(result.totalRounds).toBe(0)
  })
})
