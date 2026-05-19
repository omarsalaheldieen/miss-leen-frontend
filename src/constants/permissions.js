export const DEPS = {
  manage_employees:  ['view_employees'],
  manage_attendance: ['view_attendance'],
  manage_salary:     ['view_salary'],
  manage_ledger:     ['view_ledger'],
};

export const PERMISSION_GROUPS = [
  {
    group: 'الموظفون', icon: '👥', color: '#1A6EB0', bg: '#EBF5FF',
    permissions: [
      { key: 'view_employees',   label: 'عرض الموظفين',   desc: 'الاطلاع على قائمة الموظفين وبياناتهم' },
      { key: 'manage_employees', label: 'إدارة الموظفين',  desc: 'إضافة، تعديل، وحذف الموظفين' },
    ],
  },
  {
    group: 'الحضور والغياب', icon: '🗓️', color: '#B45309', bg: '#FFFBEB',
    permissions: [
      { key: 'view_attendance',   label: 'عرض الحضور والغياب',          desc: 'الاطلاع على سجلات الحضور الشهرية' },
      { key: 'manage_attendance', label: 'تسجيل وتعديل الحضور والغياب', desc: 'تسجيل حضور وغياب الموظفين يومياً' },
    ],
  },
  {
    group: 'الرواتب', icon: '💰', color: '#0A7A4E', bg: '#E8F8F0',
    permissions: [
      { key: 'view_salary',   label: 'عرض الرواتب',   desc: 'الاطلاع على سجلات رواتب الموظفين' },
      { key: 'manage_salary', label: 'إدارة الرواتب',  desc: 'إضافة، تعديل، وحذف سجلات الرواتب' },
    ],
  },
  {
    group: 'الديون والدائنون', icon: '⚖️', color: '#7B2FBE', bg: '#F3E8FF',
    permissions: [
      { key: 'view_ledger',   label: 'عرض دفتر الديون',  desc: 'الاطلاع على أرصدة المدينين والدائنين' },
      { key: 'manage_ledger', label: 'إدارة دفتر الديون', desc: 'إضافة أطراف ومعاملات، وتسجيل المدفوعات' },
    ],
  },
];
