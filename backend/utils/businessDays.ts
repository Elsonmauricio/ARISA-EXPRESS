const HOLIDAYS: string[] = [
  '01-01',
  '04-25',
  '05-01',
  '06-10',
  '08-15',
  '10-05',
  '11-01',
  '12-01',
  '12-08',
  '12-25',
];

export function addBusinessDays(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  let added = 0;

  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (isBusinessDay(date)) {
      added++;
    }
  }

  return date;
}

export function getBusinessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const date = new Date(start);

  while (date < end) {
    date.setDate(date.getDate() + 1);
    if (isBusinessDay(date)) {
      count++;
    }
  }

  return count;
}

export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return !HOLIDAYS.includes(monthDay);
}

export function calculateWeeksOverdue(deadline: Date, currentDate: Date): number {
  const diffMs = currentDate.getTime() - deadline.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 0) return 0;

  const weeks = diffDays / 7;
  return Math.ceil(weeks);
}

export function calculateFine(deadline: Date, currentDate: Date): number {
  const weeks = calculateWeeksOverdue(deadline, currentDate);
  return weeks * 5.0;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-PT');
}
