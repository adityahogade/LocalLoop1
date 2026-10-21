import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { FiScissors, FiPlus, FiEdit2, FiTag } from 'react-icons/fi';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coupon Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editCouponId, setEditCouponId] = useState(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCoupons();
      if (res?.success) {
        setCoupons(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load discount coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAdd = () => {
    setEditCouponId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('');
    setMaxDiscountAmount('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setMaxUses('');
    setMaxUsesPerUser(1);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditCouponId(c.id);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setMinOrderAmount(c.min_order_amount || '');
    setMaxDiscountAmount(c.max_discount_amount || '');
    setStartDate(c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : '');
    setEndDate(c.end_date ? new Date(c.end_date).toISOString().slice(0, 10) : '');
    setMaxUses(c.max_uses || '');
    setMaxUsesPerUser(c.max_uses_per_user || 1);
    setIsActive(c.is_active);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    setSubmitting(true);
    const payload = {
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
      max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      max_uses: maxUses ? Number(maxUses) : null,
      max_uses_per_user: Number(maxUsesPerUser) || 1,
      is_active: isActive,
    };

    try {
      if (editCouponId) {
        await adminApi.updateCoupon(editCouponId, payload);
        alert('Coupon updated successfully!');
      } else {
        await adminApi.createCoupon(payload);
        alert('Coupon created successfully!');
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      alert(err.message || 'Failed to save coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && coupons.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Discount Coupons</h2>
          <p className="text-xs text-gray-500 mt-1">Manage marketing coupons and discount percentages for checkouts.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-1" />
          Add Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState title="No coupons active" description="Create promotional coupons to drive checkout conversions." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Promo Code</th>
                  <th className="px-6 py-3">Discount Details</th>
                  <th className="px-6 py-3">Requirements</th>
                  <th className="px-6 py-3">Active Status</th>
                  <th className="px-6 py-3">Validity End</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-bold text-gray-800 font-mono">
                      <FiTag className="w-4 h-4 mr-2 text-slate-400" />
                      {c.code}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% Off` : `₹${c.discount_value} Off`}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500">
                      {c.min_order_amount ? `Min Order: ₹${c.min_order_amount}` : 'No Min Limit'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        c.is_active
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {c.is_active ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editCouponId ? 'Edit Discount Coupon' : 'Create Discount Coupon'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME50"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (INR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Min order amount (₹)</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Max discount cap (₹)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Max platform usage limits</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Max uses per customer</label>
                  <input
                    type="number"
                    required
                    value={maxUsesPerUser}
                    onChange={(e) => setMaxUsesPerUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => setIsActive(!isActive)}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-xs text-gray-700">Set coupon code status as Active</span>
              </label>

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
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
