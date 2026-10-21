import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiShoppingBag, FiCalendar, FiClock, FiStar, FiSlash, FiX } from 'react-icons/fi';

export default function BookingsList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getOrders();
      if (res?.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'CUSTOMER_NOT_FOUND') {
        setError('Customer profile not found in database. Please register a new customer account using the Sign Up page.');
      } else {
        setError('Failed to load bookings.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await customerApi.cancelOrder(id);
      if (res?.success) {
        alert('Booking cancelled successfully.');
        fetchOrders();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await customerApi.createReview({
        provider_id: selectedOrderForReview.provider_id,
        order_id: selectedOrderForReview.id,
        reference_type: 'order',
        reference_id: selectedOrderForReview.id,
        rating,
        comment,
      });

      if (res?.success) {
        alert('Review submitted successfully!');
        setReviewModalOpen(false);
        setRating(5);
        setComment('');
        fetchOrders();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review.');
    }
  };

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold shadow-sm">⚠️ {error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="text-left space-y-2 border-b border-slate-105 pb-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">My One-Time Bookings</h2>
        <p className="text-xs text-slate-400 font-semibold">Track pending appointments, view itemised receipts, and write feedback for completed jobs.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No Bookings Found"
          description="Schedule a cleaning session or emergency water canister deliveries directly from neighbor stores."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300 text-left">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {order.order_number}
                    </span>
                    <div className="scale-90">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                    Provider: <span className="text-slate-800 font-extrabold normal-case">{order.provider?.business_name}</span>
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="bg-red-50 text-red-700 border border-red-100 hover:bg-red-100/50 px-3 py-2 rounded-xl flex items-center transition-colors cursor-pointer"
                    >
                      <FiSlash className="w-3.5 h-3.5 mr-1" />
                      Cancel Booking
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <button
                      onClick={() => {
                        setSelectedOrderForReview(order);
                        setReviewModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <FiStar className="w-3.5 h-3.5 mr-1" />
                      Write Review
                    </button>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="border border-slate-150 rounded-2xl overflow-x-auto shadow-inner bg-slate-50/20">
                <table className="w-full text-[11px] text-left text-slate-650 min-w-[300px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest font-black text-[9px] border-b border-slate-150">
                    <tr>
                      <th className="px-4.5 py-3">Service Item</th>
                      <th className="px-4.5 py-3">Quantity</th>
                      <th className="px-4.5 py-3">Unit Price</th>
                      <th className="px-4.5 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0 font-medium">
                        <td className="px-4.5 py-3 text-slate-800 font-extrabold">{item.service?.name}</td>
                        <td className="px-4.5 py-3 font-semibold">{item.quantity}</td>
                        <td className="px-4.5 py-3 font-semibold">₹{Number(item.unit_price).toFixed(2)}</td>
                        <td className="px-4.5 py-3 text-right text-slate-800 font-extrabold">
                          ₹{Number(item.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Scheduling details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl text-[10px] leading-normal font-semibold">
                <div className="flex items-center">
                  <FiCalendar className="w-4 h-4 mr-2.5 text-blue-500/70" />
                  <div>
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Booking Date</span>
                    <span className="font-extrabold text-slate-800">{new Date(order.scheduled_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-2.5 text-blue-500/70" />
                  <div>
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Scheduled Time Slot</span>
                    <span className="font-extrabold text-slate-800 capitalize">{order.scheduled_time_slot || 'Morning'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center sm:ml-auto">
                  <div className="text-right">
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Total Paid</span>
                    <span className="text-base font-black text-slate-805">₹{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Submit Service Feedback</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Rating Score</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none hover:scale-110 active:scale-95 transition-transform duration-100"
                    >
                      <FiStar
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Review Comment</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Share details about timing, service quality, behaviour etc..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-650 text-xs font-semibold placeholder-slate-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
