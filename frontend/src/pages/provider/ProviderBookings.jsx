import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiCheck, FiPlay, FiCheckCircle, FiSlash, FiSettings, FiHash } from 'react-icons/fi';

export default function ProviderBookings() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual Delivery Update Form
  const [deliveryId, setDeliveryId] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('out_for_delivery');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [updatingDelivery, setUpdatingDelivery] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await providerApi.getOrders();
      if (res?.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch provider orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Update order status to ${status.replace('_', ' ')}?`)) return;
    try {
      const res = await providerApi.updateOrderStatus(id, status);
      if (res?.success) {
        fetchOrders();
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    }
  };

  const handleManualDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!deliveryId) return;

    setUpdatingDelivery(true);
    try {
      const res = await providerApi.updateDeliveryStatus(deliveryId, deliveryStatus, deliveryNotes);
      if (res?.success) {
        alert(`Subscription delivery status updated successfully to ${deliveryStatus.replace(/_/g, ' ')}!`);
        setDeliveryId('');
        setDeliveryNotes('');
      }
    } catch (err) {
      alert(err.message || 'Failed to update delivery status. Verify delivery ID.');
    } finally {
      setUpdatingDelivery(false);
    }
  };

  if (loading && orders.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Manual Delivery Action Panel (Gap Mitigation) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <FiSettings className="text-blue-400 w-5 h-5 shrink-0" />
            <h3 className="text-md font-bold">Manual Subscription Delivery Action</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Due to backend API structural limitations, listing scheduled subscription deliveries in real-time is disabled. Enter the customer's delivery task ID below to update its status.
          </p>

          <form onSubmit={handleManualDeliverySubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs font-semibold">
            <div className="sm:col-span-1">
              <label className="block text-slate-400 mb-1.5 flex items-center">
                <FiHash className="mr-0.5" /> Task ID
              </label>
              <input
                type="number"
                required
                placeholder="102"
                value={deliveryId}
                onChange={(e) => setDeliveryId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-slate-400 mb-1.5">Action Status</label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="skipped">Skipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-slate-400 mb-1.5">Notes (Optional)</label>
              <input
                type="text"
                placeholder="Left at door"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingDelivery || !deliveryId}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded shadow disabled:opacity-50 text-xs tracking-wider uppercase"
            >
              {updatingDelivery ? 'Updating...' : 'Apply'}
            </button>
          </form>
        </div>
      </section>

      {/* Received one-time bookings */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Job Bookings Received</h3>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders assigned"
            description="You will see one-time water or cleaning requests here once customers select your storefront."
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 border px-2 py-0.5 rounded">
                        {order.order_number}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Customer Address: {order.address?.house_no}, {order.address?.building}, {order.address?.street}, {order.address?.area}, {order.address?.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center shadow-sm"
                        >
                          <FiCheck className="w-4 h-4 mr-1" />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 px-3 py-1.5 rounded flex items-center"
                        >
                          <FiSlash className="w-4 h-4 mr-1" />
                          Decline
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded flex items-center shadow-sm"
                      >
                        <FiPlay className="w-4 h-4 mr-1" />
                        Start Job
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center shadow-sm"
                      >
                        <FiCheckCircle className="w-4 h-4 mr-1" />
                        Complete Job
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg text-xs leading-normal">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Scheduled Date</span>
                    <span className="font-bold text-gray-800">{new Date(order.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Time Slot</span>
                    <span className="font-bold text-gray-800 capitalize">{order.scheduled_time_slot}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Subtotal Bill</span>
                    <span className="font-bold text-gray-800">₹{Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Total Earnings (platform commission deducted)</span>
                    <span className="font-black text-gray-900">₹{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
