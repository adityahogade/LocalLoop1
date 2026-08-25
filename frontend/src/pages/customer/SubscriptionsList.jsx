import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiCalendar, FiClock, FiPlus, FiAlertCircle } from 'react-icons/fi';

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected subscription for detail view / modal actions
  const [selectedSub, setSelectedSub] = useState(null);
  
  // Modals status
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [vacationModalOpen, setVacationModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // Modal forms
  const [skipDate, setSkipDate] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getSubscriptions();
      if (res?.success) {
        setSubscriptions(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handlePause = async (id) => {
    if (!window.confirm('Are you sure you want to pause this subscription?')) return;
    try {
      const res = await customerApi.pauseSubscription(id);
      if (res?.success) {
        fetchSubscriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to pause subscription.');
    }
  };

  const handleResume = async (id) => {
    try {
      const res = await customerApi.resumeSubscription(id);
      if (res?.success) {
        fetchSubscriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to resume subscription.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? Undelivered rows will be cancelled.')) return;
    try {
      const res = await customerApi.cancelSubscription(id);
      if (res?.success) {
        fetchSubscriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription.');
    }
  };

  const handleRenew = async (id) => {
    try {
      const res = await customerApi.renewSubscription(id);
      if (res?.success) {
        alert('Subscription renewal payment request created. Go to Checkout.');
        fetchSubscriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to renew subscription.');
    }
  };

  const handleSkipSubmit = async (e) => {
    e.preventDefault();
    if (!skipDate) return;
    try {
      const res = await customerApi.skipSubscriptionDate(selectedSub.id, skipDate, skipReason);
      if (res?.success) {
        alert('Date skipped successfully!');
        setSkipModalOpen(false);
        setSkipDate('');
        setSkipReason('');
        fetchSubscriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to skip date.');
    }
  };

  const handleVacationSubmit = async (e) => {
    e.preventDefault();
    if (!vacationStart || !vacationEnd) return;
    try {
      const res = await customerApi.setVacationMode(selectedSub.id, vacationStart, vacationEnd);
      if (res?.success) {
        alert('Vacation mode set successfully!');
        setVacationModalOpen(false);
        setVacationStart('');
        setVacationEnd('');
        fetchSubscriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to set vacation mode.');
    }
  };

  const handleOpenCalendar = async (sub) => {
    setSelectedSub(sub);
    setCalendarModalOpen(true);
    setLoadingDeliveries(true);
    setDeliveries([]);
    try {
      const res = await customerApi.getSubscriptionDeliveries(sub.id);
      if (res?.success) {
        setDeliveries(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-900">My Recurring Subscriptions</h2>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          title="No subscriptions active"
          description="Browse our service catalog and subscribe to daily/weekly essentials like milk or fresh meals."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-gray-900">{sub.service?.name}</h3>
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Provider: {sub.provider?.business_name}
                  </p>
                </div>
                
                {/* Dashboard Action Utilities */}
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {sub.status === 'active' && (
                    <>
                      <button
                        onClick={() => handlePause(sub.id)}
                        className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 px-3 py-1.5 rounded"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setSkipModalOpen(true);
                        }}
                        className="bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 px-3 py-1.5 rounded"
                      >
                        Skip Date
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setVacationModalOpen(true);
                        }}
                        className="bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200 px-3 py-1.5 rounded"
                      >
                        Set Vacation
                      </button>
                    </>
                  )}
                  {sub.status === 'paused' && (
                    <button
                      onClick={() => handleResume(sub.id)}
                      className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 px-3 py-1.5 rounded"
                    >
                      Resume
                    </button>
                  )}
                  {['active', 'paused', 'vacation'].includes(sub.status) && (
                    <button
                      onClick={() => handleCancel(sub.id)}
                      className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 px-3 py-1.5 rounded"
                    >
                      Cancel
                    </button>
                  )}
                  {['expired', 'cancelled'].includes(sub.status) && (
                    <button
                      onClick={() => handleRenew(sub.id)}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded"
                    >
                      Renew
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenCalendar(sub)}
                    className="bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded"
                  >
                    View Calendar
                  </button>
                </div>
              </div>

              {/* Sub Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg text-xs leading-normal">
                <div>
                  <span className="text-gray-400 block mb-0.5">Quantity</span>
                  <span className="font-bold text-gray-800">{sub.quantity} {sub.service?.unit}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Price (Per Unit)</span>
                  <span className="font-bold text-gray-800">₹{Number(sub.servicePlan?.price || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Billing Period Cycle</span>
                  <span className="font-bold text-gray-800 capitalize">{sub.servicePlan?.frequency} ({sub.servicePlan?.billing_cycle_days} Days)</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Next Renewal Billing</span>
                  <span className="font-bold text-slate-900 flex items-center">
                    <FiClock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skip Date Modal */}
      {skipModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Skip Scheduled Delivery Date</h3>
            <form onSubmit={handleSkipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={skipDate}
                  onChange={(e) => setSkipDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Out of town, excess milk"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setSkipModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vacation Modal */}
      {vacationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Set Vacation Pause Dates</h3>
            <form onSubmit={handleVacationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={vacationStart}
                    onChange={(e) => setVacationStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    min={vacationStart || new Date().toISOString().slice(0, 10)}
                    value={vacationEnd}
                    onChange={(e) => setVacationEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setVacationModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Set Vacation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar deliveries View Modal */}
      {calendarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-lg font-bold text-gray-800">Scheduled Delivery Deliveries</h3>
              <button onClick={() => setCalendarModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {loadingDeliveries ? (
                <Skeleton count={4} />
              ) : deliveries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No delivery rows generated yet.</p>
              ) : (
                deliveries.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg text-xs font-semibold text-gray-700">
                    <div>
                      <span className="font-bold text-gray-800 block mb-1">
                        {new Date(item.delivery_date).toLocaleDateString()}
                      </span>
                      {item.notes && <span className="text-[10px] text-gray-500 font-medium">Notes: {item.notes}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Qty: {item.quantity}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
