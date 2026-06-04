import DropdownSelect from './DropdownSelect';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export default function MonthYearSelector({ currentDate, onChangeMonth, availableYears }: { currentDate: Date; onChangeMonth: (diff: number) => void; availableYears?: number[] }) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const years = (availableYears && availableYears.length > 0) ? [...availableYears].sort((a, b) => a - b) : [year];

  const handleMonthChange = (val: string | number) => {
    const newMonth = Number(val);
    onChangeMonth(newMonth - month);
  };

  const handleYearChange = (val: string | number) => {
    const newYear = Number(val);
    const diff = (newYear - year) * 12;
    if (diff > 0) for (let i = 0; i < diff; i++) onChangeMonth(1);
    else for (let i = 0; i < Math.abs(diff); i++) onChangeMonth(-1);
  };

  return (
    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
      <DropdownSelect
        options={MONTHS_TH.map((m, i) => ({ label: m, value: i }))}
        value={month}
        onChange={handleMonthChange}
        style={{ flex: 1, minWidth: 0 }}
      />
      <DropdownSelect
        options={years.map((y) => ({ label: String(y + 543), value: y }))}
        value={year}
        onChange={handleYearChange}
        style={{ flex: 0, minWidth: 90, maxWidth: 110 }}
      />
    </div>
  );
}
