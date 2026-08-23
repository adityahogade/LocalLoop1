import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Expense', key: 'name' },
  { label: 'Category', key: 'category' },
  { label: 'Amount', key: 'amount' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, name: 'Cleaning supplies', category: 'Operations', amount: '₹1,250', status: 'Approved' },
  { id: 2, name: 'Travel mileage', category: 'Travel', amount: '₹780', status: 'Pending' },
  { id: 3, name: 'Tool maintenance', category: 'Equipment', amount: '₹2,140', status: 'Submitted' },
];

const stats = [
  { label: 'Monthly spend', value: '₹14,600', hint: 'year-to-date', trend: '+8%' },
  { label: 'Pending claims', value: '5', hint: 'waiting approval', trend: '-2' },
  { label: 'Approved this month', value: '₹11,200', hint: 'reconciled', trend: '+4%' },
];

export default function ProviderExpensesPage() {
  return (
    <ProviderModulePage
      title="Expenses"
      subtitle="Operational spending, reimbursements, and approval workflow."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No expenses logged"
      emptyMessage="Operational spends and reimbursements will appear here once entered."
    />
  );
}
