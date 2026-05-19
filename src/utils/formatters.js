const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export const fmt = (n) => Number(n || 0).toLocaleString('ar-EG');

export function formatMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `${AR_MONTHS[parseInt(mo, 10) - 1]} ${y}`;
}

export function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function countFridaysInMonth(yearMonth) {
  if (!yearMonth) return 0;
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === 5) count++;
  }
  return count;
}
