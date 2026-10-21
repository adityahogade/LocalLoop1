import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { FiPlus, FiTrash2, FiEdit2, FiTrendingUp } from 'react-icons/fi';

const EXPENSE_CATEGORIES = [
  'fuel',
  'ingredients',
  'raw_materials',
  'cleaning_supplies',
  'staff_salary',
  'maintenance',
  'packaging',
  'transportation',
  'other',
];

export default function ProviderExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [category, setCategory] = useState('fuel');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await providerApi.getExpenses();
      if (res?.success) {
        setExpenses(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenAdd = () => {
    setEditExpenseId(null);
    setCategory('fuel');
    setAmount('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setReceiptUrl('');
    setModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditExpenseId(exp.id);
    setCategory(exp.category);
    setAmount(exp.amount);
    setExpenseDate(exp.expense_date);
    setDescription(exp.description);
    setReceiptUrl(exp.receipt_url || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    const payload = {
      category,
      amount: Number(amount),
      expense_date: expenseDate,
      description,
      receipt_url: receiptUrl || null,
    };

    try {
      if (editExpenseId) {
        await providerApi.updateExpense(editExpenseId, payload);
        alert('Expense record updated successfully.');
      } else {
        await providerApi.createExpense(payload);
        alert('Expense logged successfully.');
      }
      setModalOpen(false);
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      await providerApi.deleteExpense(id);
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  if (loading && expenses.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Operating Expenses Log</h2>
          <p className="text-xs text-gray-500 mt-1">Record costs to calculate real business net profit.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-1" />
          Log Cost
        </button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses logged"
          description="Log daily costs like vehicle fuel, kitchen ingredients, or helper salaries."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Expense Category</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Logged Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-bold text-gray-800 capitalize">
                      <FiTrendingUp className="w-4 h-4 mr-2 text-slate-400" />
                      {exp.category?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-red-600 font-black">₹{Number(exp.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{exp.description}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 text-xs font-bold">
                      <button
                        onClick={() => handleOpenEdit(exp)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editExpenseId ? 'Edit Expense details' : 'Log Operating Cost'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Description</label>
                <textarea
                  rows="3"
                  placeholder="Details of expense (e.g. 5 liters petrol, 10kg flour)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Receipt Document URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/receipt.jpg"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
