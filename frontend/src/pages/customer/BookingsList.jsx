import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiShoppingBag, FiCalendar, FiClock, FiStar, FiSlash } from 'react-icons/fi';

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
      setError('Failed to load bookings.');
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
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-900">My One-Time Bookings</h2>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No bookings recorded"
          description="Book one-time on-demand services such as home deep cleaning or emergency mineral water cans."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 border px-2 py-0.5 rounded">
                      {order.order_number}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <h3 className="text-md font-bold text-gray-900 mt-1">
                    Provider: {order.provider?.business_name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 px-3 py-1.5 rounded flex items-center"
                    >
                      <FiSlash className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <button
                      onClick={() => {
                        setSelectedOrderForReview(order);
                        setReviewModalOpen(true);
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 rounded flex items-center"
                    >
                      <FiStar className="w-3.5 h-3.5 mr-1" />
                      Write Review
                    </button>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-2">Service Item</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Unit Price</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0 font-medium">
                        <td className="px-4 py-3 text-gray-800 font-bold">{item.service?.name}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">₹{Number(item.unit_price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-800 font-bold">
                          ₹{Number(item.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Scheduling details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg text-xs leading-normal">
                <div className="flex items-center">
                  <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <span className="text-gray-400 block mb-0.5">Booking Date</span>
                    <span className="font-bold text-gray-800">{new Date(order.scheduled_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <span className="text-gray-400 block mb-0.5">Time Slot</span>
                    <span className="font-bold text-gray-800 capitalize">{order.scheduled_time_slot}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center sm:ml-auto">
                  <div className="text-right">
                    <span className="text-gray-400 block mb-0.5">Total Amount paid</span>
                    <span className="text-lg font-black text-gray-900">₹{Number(order.total_amount).toFixed(2)}</span>
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
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Write Service Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <FiStar
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Comment</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Share your experience (quality, punctuality, politeness)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
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
