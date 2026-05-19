export const WORK_DAYS       = 26;
export const EXTRA_HOUR_RATE = 30;

export function calcNet({ daily_wage, absent_days, extra_hours, friday_days, cash_advance }) {
  const dw      = Number(daily_wage)   || 0;
  const absent  = Number(absent_days)  || 0;
  const extra   = Number(extra_hours)  || 0;
  const fridays = Number(friday_days)  || 0;
  const advance = Number(cash_advance) || 0;
  const base_salary       = dw * WORK_DAYS;
  const friday_pay        = dw * fridays;
  const absence_deduction = dw * absent;
  const extra_pay         = extra * EXTRA_HOUR_RATE;
  const net_salary        = base_salary + friday_pay - absence_deduction + extra_pay - advance;
  const actual_days       = WORK_DAYS + fridays - absent;
  return { base_salary, friday_pay, absence_deduction, extra_pay, cash_advance: advance, net_salary, actual_days };
}
