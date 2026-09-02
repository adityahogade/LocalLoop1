import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiCalendar, FiClock, FiPlus, FiAlertCircle, FiX } from 'react-icons/fi';

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
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

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
      if (err.code === 'CUSTOMER_NOT_FOUND') {
        setError('Customer profile not found in database. Please register a new customer account using the Sign Up page.');
      } else {
        setError('Failed to load subscriptions.');
      }
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

  const handleCancelClick = (sub) => {
    setSelectedSub(sub);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSub) return;
    setCancelModalOpen(false);
    try {
      const res = await customerApi.cancelSubscription(selectedSub.id);
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
  if (error) return <div className="p-5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold shadow-sm">⚠️ {error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="text-left space-y-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">My Subscriptions</h2>
        <p className="text-xs text-slate-400 font-semibold">Manage active delivery plans, set skips/vacation pauses, and view your scheduling calendar.</p>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          title="No Active Subscriptions"
          description="Setup a daily, weekly or custom plan for fresh dairy, tiffin food, or purified mineral water cans."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300 text-left">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥛</span>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">{sub.service?.name}</h3>
                    <div className="scale-90">
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-8">
                    Provider: {sub.provider?.business_name}
                  </p>
                </div>
                
                {/* Utilities Controls */}
                <div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-wider">
                  {sub.status === 'active' && (
                    <>
                      <button
                        onClick={() => handlePause(sub.id)}
                        className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100/55 px-3 py-2 rounded-xl transition-all cursor-pointer font-black"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setSkipModalOpen(true);
                        }}
                        className="bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100/55 px-3 py-2 rounded-xl transition-all cursor-pointer font-black"
                      >
                        Skip Date
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setVacationModalOpen(true);
                        }}
                        className="bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/55 px-3 py-2 rounded-xl transition-all cursor-pointer font-black"
                      >
                        Vacation
                      </button>
                    </>
                  )}
                  {sub.status === 'paused' && (
                    <button
                      onClick={() => handleResume(sub.id)}
                      className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100/55 px-3 py-2 rounded-xl transition-all cursor-pointer font-black"
                    >
                      Resume
                    </button>
                  )}
                  {['active', 'paused', 'vacation'].includes(sub.status) && (
                    <button
                      onClick={() => handleCancelClick(sub)}
                      className="bg-red-50 text-red-700 border border-red-100 hover:bg-red-100/55 px-3 py-2 rounded-xl transition-all cursor-pointer font-black"
                    >
                      Cancel
                    </button>
                  )}
                  {['expired', 'cancelled'].includes(sub.status) && (
                    <button
                      onClick={() => handleRenew(sub.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer font-black"
                    >
                      Renew
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenCalendar(sub)}
                    className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100/60 px-3 py-2 rounded-xl transition-all cursor-pointer font-black"
                  >
                    View Calendar
                  </button>
                </div>
              </div>

              {/* DELIVERY TRACKING SECTION */}
              {sub.status === 'active' && sub.delivery_tracking && (
                <div className="bg-blue-50/60 border border-blue-100/80 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-blue-200/50 pb-3">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                        Today's Delivery
                      </span>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {sub.service?.name} • {sub.quantity} {sub.service?.unit}
                      </div>
                      {sub.address && (
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {sub.address.house_no ? `${sub.address.house_no}, ` : ''}
                          {sub.address.building ? `${sub.address.building}, ` : ''}
                          {sub.address.street ? `${sub.address.street}, ` : ''}
                          {sub.address.area ? `${sub.address.area}, ` : ''}
                          {sub.address.city || ''}
                        </p>
                      )}
                    </div>

                    <div>
                      {sub.delivery_tracking.today_delivery_status === 'DELIVERED' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                          DELIVERED
                        </span>
                      )}
                      {sub.delivery_tracking.today_delivery_status === 'OUT_FOR_DELIVERY' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
                          OUT FOR DELIVERY
                        </span>
                      )}
                      {sub.delivery_tracking.today_delivery_status === 'READY' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />
                          READY
                        </span>
                      )}
                      {sub.delivery_tracking.today_delivery_status === 'SCHEDULED' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                          SCHEDULED
                        </span>
                      )}
                      {sub.delivery_tracking.today_delivery_status === 'NO_DELIVERY' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-300">
                          NO DELIVERY TODAY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery OTP for Customer */}
                  {sub.delivery_tracking.today_delivery?.delivery_otp && (
                    <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                            Delivery Verification OTP
                          </span>
                          <span className="text-[11px] text-amber-700 font-medium">
                            Share this OTP with your delivery partner upon arrival:
                          </span>
                        </div>
                      </div>
                      <div className="bg-white px-4 py-1 rounded-lg border border-amber-300 shadow-xs text-lg font-mono font-black text-amber-900 tracking-widest self-start sm:self-auto">
                        {sub.delivery_tracking.today_delivery.delivery_otp}
                      </div>
                    </div>
                  )}

                  {/* Cycle Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                    <div className="bg-white/80 border border-blue-100 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Remaining Deliveries</span>
                      <span className="text-base font-black text-slate-900">{sub.delivery_tracking.remaining_deliveries}</span>
                    </div>
                    <div className="bg-white/80 border border-blue-100 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Remaining Days</span>
                      <span className="text-base font-black text-slate-900">{sub.delivery_tracking.remaining_days} days</span>
                    </div>
                    <div className="bg-white/80 border border-blue-100 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivered Deliveries</span>
                      <span className="text-base font-black text-emerald-600">
                        {sub.delivery_tracking.completed_deliveries} / {sub.delivery_tracking.total_deliveries}
                      </span>
                    </div>
                    <div className="bg-white/80 border border-blue-100 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Next Delivery</span>
                      <span className="text-base font-black text-blue-600">{sub.delivery_tracking.next_delivery_label}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl text-[10px] leading-normal font-semibold">
                <div>
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Quantity</span>
                  <span className="font-extrabold text-slate-800 text-xs">{sub.quantity} {sub.service?.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Price (Per Unit)</span>
                  <span className="font-extrabold text-slate-800 text-xs">₹{Number(sub.servicePlan?.price || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Cycle Frequency</span>
                  <span className="font-extrabold text-slate-805 text-xs capitalize">{sub.servicePlan?.frequency} ({sub.servicePlan?.billing_cycle_days} Days)</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Next Billing</span>
                  <span className="font-extrabold text-blue-600 text-xs flex items-center">
                    <FiClock className="w-3.5 h-3.5 mr-1" />
                    {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Cancel Subscription?
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed font-semibold">
              Are you sure you want to cancel your <span className="font-black text-slate-800">{selectedSub?.service?.name}</span> subscription?
              <br /><br />
              Future recurring deliveries will stop after cancellation.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors cursor-pointer"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-750 text-white rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Date Modal */}
      {skipModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Skip Delivery</h3>
              <button onClick={() => setSkipModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSkipSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Select Skip Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={skipDate}
                  onChange={(e) => setSkipDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-805 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Skip Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Excess stock"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-805 placeholder-slate-400 bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setSkipModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors"
                >
                  Confirm Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vacation Modal */}
      {vacationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Vacation Pause Settings</h3>
              <button onClick={() => setVacationModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleVacationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={vacationStart}
                    onChange={(e) => setVacationStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-805 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    min={vacationStart || new Date().toISOString().slice(0, 10)}
                    value={vacationEnd}
                    onChange={(e) => setVacationEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-805 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setVacationModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center">
                <FiCalendar className="w-4 h-4 mr-2 text-blue-600" />
                Scheduled Deliveries
              </h3>
              <button onClick={() => setCalendarModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {loadingDeliveries ? (
                <Skeleton count={4} />
              ) : deliveries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No deliveries scheduled yet.</p>
              ) : (
                deliveries.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-750 hover:bg-slate-100/50 transition-colors">
                    <div>
                      <span className="font-extrabold text-slate-800 block mb-0.5">
                        {new Date(item.delivery_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {item.notes && <span className="text-[10px] text-slate-400 font-bold">Notes: {item.notes}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty: {item.quantity}</span>
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
