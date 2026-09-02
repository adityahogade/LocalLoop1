import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { 
  FiCheck, 
  FiPlay, 
  FiCheckCircle, 
  FiSlash, 
  FiSettings, 
  FiHash, 
  FiUser, 
  FiMapPin, 
  FiExternalLink, 
  FiMail, 
  FiPhone, 
  FiClock, 
  FiPackage, 
  FiCalendar, 
  FiSun, 
  FiTruck, 
  FiAlertCircle, 
  FiLayers, 
  FiActivity 
} from 'react-icons/fi';

export default function ProviderBookings() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscriptions Tab State
  const [activeTab, setActiveTab] = useState('bookings');
  const [subscriptions, setSubscriptions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  // Manual Delivery Update Form
  const [deliveryId, setDeliveryId] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('out_for_delivery');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  const [otpInputs, setOtpInputs] = useState({});

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

  const fetchSubscriptions = async () => {
    setSubLoading(true);
    setError(null);
    try {
      console.log('Fetching provider subscriptions...');
      const res = await providerApi.getSubscriptions();
      console.log('Provider subscriptions response:', res);
      if (res?.success) {
        console.log('Setting subscriptions array:', res.data);
        setSubscriptions(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching provider subscriptions:', err);
      setError('Failed to fetch customer subscriptions.');
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchOrders();
    } else {
      fetchSubscriptions();
    }
  }, [activeTab]);

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

  const handleUpdateSubDelivery = async (delivId, status, otp = '') => {
    setUpdatingDelivery(true);
    try {
      const res = await providerApi.updateDeliveryStatus(delivId, status, '', otp);
      if (res?.success) {
        setOtpInputs(prev => ({ ...prev, [delivId]: '' }));
        fetchSubscriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to update delivery status. Verify OTP.');
    } finally {
      setUpdatingDelivery(false);
    }
  };

  if (activeTab === 'bookings' && loading && orders.length === 0) return <Skeleton type="table" count={5} />;
  if (activeTab === 'subscriptions' && subLoading && subscriptions.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold shadow-sm">⚠️ {error}</div>;

  return (
    <div className="space-y-6 text-left pb-12 font-semibold">
      {/* Page Top Header with Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Provider Dashboard
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs font-bold text-slate-500">Live Delivery Management</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
            {activeTab === 'bookings' ? 'One-Time Bookings' : 'Customer Subscriptions'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {activeTab === 'bookings'
              ? 'Manage and fulfill on-demand service orders placed by customers.'
              : 'Monitor recurring service schedules, track daily delivery progress, and verify customer delivery OTPs.'}
          </p>
        </div>

        {/* Modern Pill Tabs */}
        <div className="flex items-center bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>One-Time Bookings</span>
            {orders.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'bookings' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Customer Subscriptions</span>
            {subscriptions.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'subscriptions' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {subscriptions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <>
          {/* Manual Delivery Action Panel */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <FiSettings className="text-blue-400 w-5 h-5 shrink-0 animate-spin" />
                <h3 className="text-sm font-black uppercase tracking-wider">Manual Subscription Delivery Action</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Enter a specific subscription delivery task ID below to manually update its status if needed.
              </p>

              <form onSubmit={handleManualDeliverySubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 mb-1.5 flex items-center text-[9px] uppercase tracking-wider font-black">
                    <FiHash className="mr-0.5" /> Task ID
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="102"
                    value={deliveryId}
                    onChange={(e) => setDeliveryId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 text-[9px] uppercase tracking-wider font-black">Action Status</label>
                  <select
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="skipped">Skipped</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 text-[9px] uppercase tracking-wider font-black">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Left at door"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingDelivery || !deliveryId}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl shadow disabled:opacity-50 text-[10px] tracking-wider uppercase active:scale-[0.98] transition-all duration-150 h-10 cursor-pointer"
                >
                  {updatingDelivery ? 'Updating...' : 'Apply'}
                </button>
              </form>
            </div>
          </section>

          {/* Received one-time bookings */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Job Bookings Received</h3>

            {orders.length === 0 ? (
              <EmptyState
                title="No Bookings Received"
                description="You will see one-time service requests here once customers place orders."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-3.5">
                      <div className="space-y-1.5 text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            {order.order_number}
                          </span>
                          <div className="scale-90">
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold">
                          Customer Address: {order.address?.house_no}, {order.address?.building}, {order.address?.street}, {order.address?.area}, {order.address?.city}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl flex items-center shadow-md shadow-blue-500/10 cursor-pointer active:scale-[0.98] transition-all"
                            >
                              <FiCheck className="w-4 h-4 mr-1" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="bg-red-50 text-red-700 border border-red-100 hover:bg-red-100/50 px-3.5 py-2 rounded-xl flex items-center cursor-pointer active:scale-[0.98] transition-all"
                            >
                              <FiSlash className="w-4 h-4 mr-1" />
                              Decline
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl flex items-center shadow-md shadow-indigo-500/10 cursor-pointer active:scale-[0.98] transition-all"
                          >
                            <FiPlay className="w-4 h-4 mr-1" />
                            Start Job
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl flex items-center shadow-md shadow-green-500/10 cursor-pointer active:scale-[0.98] transition-all"
                          >
                            <FiCheckCircle className="w-4 h-4 mr-1" />
                            Complete Job
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/80 border border-slate-150 p-4 rounded-xl text-[10px] leading-normal font-semibold text-slate-800">
                      <div>
                        <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Scheduled Date</span>
                        <span className="font-extrabold text-slate-800 text-xs">{new Date(order.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Scheduled Time Slot</span>
                        <span className="font-extrabold text-slate-800 text-xs capitalize">{order.scheduled_time_slot || 'Morning'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Subtotal Bill</span>
                        <span className="font-extrabold text-slate-800 text-xs">₹{Number(order.subtotal).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Total Net Earnings</span>
                        <span className="font-black text-slate-900 text-xs">₹{Number(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        /* Customer Subscriptions List */
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FiLayers className="text-blue-600 w-4 h-4" />
                Subscribed Customer Deliveries
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage daily dispatch lifecycles, verify delivery OTPs, and track subscription schedules.
              </p>
            </div>
            {subscriptions.length > 0 && (
              <span className="self-start sm:self-auto text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full">
                {subscriptions.filter(s => s.status === 'active').length} Active Subscriptions
              </span>
            )}
          </div>

          {subscriptions.length === 0 ? (
            <EmptyState
              title="No Subscriptions Yet"
              description="You will see customers who have subscribed to your recurring plans here once checkout processes succeed."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {subscriptions.map((sub) => {
                const isActionRequired = sub.status === 'active' && 
                  sub.delivery_tracking?.today_delivery && 
                  ['scheduled', 'ready', 'out_for_delivery'].includes(sub.delivery_tracking.today_delivery.status);

                const initials = sub.customer?.user?.full_name 
                  ? sub.customer.user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'C';

                return (
                  <div 
                    key={sub.id} 
                    className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all duration-200 space-y-5 ${
                      isActionRequired 
                        ? 'border-blue-200 shadow-sm ring-1 ring-blue-500/10' 
                        : 'border-slate-200/80 shadow-xs'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 tracking-wider">
                          {initials}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-black text-slate-900 tracking-tight">
                              {sub.customer?.user?.full_name || `Customer #${sub.customer_id}`}
                            </span>
                            <StatusBadge status={sub.status} />
                            {isActionRequired && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                ACTION REQUIRED TODAY
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                            <span className="font-bold text-blue-600 capitalize">{sub.service?.name}</span>
                            <span>•</span>
                            <span className="capitalize">{sub.servicePlan?.frequency || 'Daily'} Plan</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100/80 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                          Sub ID: #{sub.id}
                        </span>
                      </div>
                    </div>

                    {/* Customer Details & Delivery Location Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                      {/* Customer Information Box */}
                      <div className="bg-slate-50/70 border border-slate-200/70 p-4 rounded-xl space-y-2.5">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                          <FiUser className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          Customer Information
                        </h4>
                        <div className="space-y-2 font-semibold">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1.5 shrink-0">
                              <FiUser className="w-3 h-3 text-slate-400" /> Name
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs text-right truncate">
                              {sub.customer?.user?.full_name || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1.5 shrink-0">
                              <FiMail className="w-3 h-3 text-slate-400" /> Email
                            </span>
                            <span className="font-medium text-slate-700 text-xs text-right truncate">
                              {sub.customer?.user?.email || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1.5 shrink-0">
                              <FiPhone className="w-3 h-3 text-slate-400" /> Phone
                            </span>
                            <span className="font-medium text-slate-700 text-xs text-right">
                              {sub.customer?.user?.phone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Location Box */}
                      <div className="bg-slate-50/70 border border-slate-200/70 p-4 rounded-xl space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                            <FiMapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            Delivery Location
                          </h4>
                          {sub.address ? (
                            <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                              {[
                                sub.address.house_no,
                                sub.address.building,
                                sub.address.street,
                                sub.address.area,
                                sub.address.city,
                                sub.address.state,
                                sub.address.pincode
                              ].filter(Boolean).join(', ')}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-medium">No address specified</p>
                          )}
                        </div>

                        {sub.address?.latitude && sub.address?.longitude && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 mt-2">
                            <span className="text-[10px] font-mono text-slate-500">
                              Coords: {Number(sub.address.latitude).toFixed(4)}, {Number(sub.address.longitude).toFixed(4)}
                            </span>
                            <a
                              href={`https://www.google.com/maps?q=${sub.address.latitude},${sub.address.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-[0.98]"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" />
                              View Location
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service & Plan Information Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-blue-50/40 border border-blue-100/80 p-3.5 rounded-xl text-xs font-semibold text-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold mb-0.5">Service</span>
                        <span className="font-black text-slate-900 capitalize text-xs">{sub.service?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold mb-0.5">Plan Frequency</span>
                        <span className="font-black text-slate-900 capitalize text-xs">{sub.servicePlan?.frequency || 'Daily'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold mb-0.5">Quantity</span>
                        <span className="font-black text-slate-900 text-xs">{sub.quantity} {sub.service?.unit || 'Units'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold mb-0.5">Next Billing</span>
                        <span className="font-black text-slate-900 text-xs">
                          {sub.next_billing_date ? new Date(`${sub.next_billing_date}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold mb-0.5">Delivery Slot</span>
                        <span className="font-black text-blue-700 capitalize text-xs">
                          {sub.delivery_time_slot === 'custom' ? sub.custom_time : (sub.delivery_time_slot || 'Morning')}
                        </span>
                      </div>
                    </div>

                    {/* TODAY'S DELIVERY SECTION (MOST IMPORTANT) */}
                    {sub.status === 'active' && sub.delivery_tracking && (
                      <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b border-slate-200/70 pb-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                              Today's Delivery Status
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {sub.delivery_tracking.today_delivery_status === 'DELIVERED' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <FiCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                  DELIVERED TODAY
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
                                  NO DELIVERY SCHEDULED TODAY
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions for Today's Delivery */}
                          {sub.delivery_tracking.today_delivery && (
                            <div className="flex items-center gap-2 pt-1 lg:pt-0">
                              {sub.delivery_tracking.today_delivery.status === 'scheduled' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubDelivery(sub.delivery_tracking.today_delivery.id, 'ready')}
                                  disabled={updatingDelivery}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                                >
                                  <FiCheck className="w-4 h-4" />
                                  MARK READY
                                </button>
                              )}
                              {sub.delivery_tracking.today_delivery.status === 'ready' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubDelivery(sub.delivery_tracking.today_delivery.id, 'out_for_delivery')}
                                  disabled={updatingDelivery}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-sm shadow-blue-600/20 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                                >
                                  <FiTruck className="w-4 h-4" />
                                  OUT FOR DELIVERY
                                </button>
                              )}
                              {sub.delivery_tracking.today_delivery.status === 'out_for_delivery' && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-blue-50/90 p-2.5 rounded-xl border border-blue-200">
                                  <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider pl-1">
                                    Waiting for customer OTP:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="OTP"
                                      maxLength={6}
                                      value={otpInputs[sub.delivery_tracking.today_delivery.id] || ''}
                                      onChange={(e) => setOtpInputs({ ...otpInputs, [sub.delivery_tracking.today_delivery.id]: e.target.value })}
                                      className="w-20 px-2.5 py-1.5 text-xs font-mono font-black bg-white border border-blue-300 rounded-lg text-slate-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubDelivery(sub.delivery_tracking.today_delivery.id, 'delivered', otpInputs[sub.delivery_tracking.today_delivery.id])}
                                      disabled={updatingDelivery || !otpInputs[sub.delivery_tracking.today_delivery.id]}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-black tracking-wider uppercase transition-all shadow-xs cursor-pointer shrink-0"
                                    >
                                      VERIFY OTP & COMPLETE DELIVERY
                                    </button>
                                  </div>
                                </div>
                              )}
                              {sub.delivery_tracking.today_delivery.status === 'delivered' && (
                                <div className="text-right">
                                  <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                                    <FiCheckCircle className="w-4 h-4 text-emerald-600" /> Delivered Today
                                  </span>
                                  {sub.delivery_tracking.today_delivery.delivered_at && (
                                    <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                                      Delivered at {new Date(sub.delivery_tracking.today_delivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Subscription Progress Statistics */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Subscription Progress
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-semibold">
                            <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs">
                              <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider">Completed</span>
                                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                              <span className="text-lg font-black text-emerald-600 leading-tight block">
                                {sub.delivery_tracking.completed_deliveries}
                              </span>
                            </div>

                            <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs">
                              <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider">Remaining</span>
                                <FiClock className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <span className="text-lg font-black text-slate-900 leading-tight block">
                                {sub.delivery_tracking.remaining_deliveries}
                              </span>
                            </div>

                            <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs">
                              <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider">Total</span>
                                <FiPackage className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <span className="text-lg font-black text-slate-900 leading-tight block">
                                {sub.delivery_tracking.total_deliveries}
                              </span>
                            </div>

                            <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs">
                              <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider">Next Delivery</span>
                                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                              <span className="text-sm font-black text-blue-600 leading-tight block mt-0.5">
                                {sub.delivery_tracking.next_delivery_label}
                              </span>
                            </div>

                            <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs">
                              <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider">Remaining Days</span>
                                <FiSun className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <span className="text-lg font-black text-slate-900 leading-tight block">
                                {sub.delivery_tracking.remaining_days} <span className="text-xs font-semibold text-slate-400">days</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
