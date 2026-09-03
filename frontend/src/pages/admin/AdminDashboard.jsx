import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import { FiUsers, FiSliders, FiGrid, FiShoppingBag, FiCreditCard, FiAlertCircle, FiCalendar, FiPlay, FiShield } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scheduler Form
  const [targetDate, setTargetDate] = useState('');
  const [schedulerResult, setSchedulerResult] = useState(null);
  const [runningScheduler, setRunningScheduler] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      let statsData = {};
      try {
        const statsRes = await adminApi.getStats();
        if (statsRes?.success && statsRes.data) {
          statsData = statsRes.data;
        }
      } catch (e) {
        console.warn('Stats API failed:', e);
      }

      let usersCount = statsData.users || 0;
      let providersCount = statsData.providers || 0;
      let activeServicesCount = statsData.activeServices || 0;
      let ordersCount = statsData.orders || 0;
      let activeSubsCount = statsData.activeSubscriptions || 0;

      try {
        const usersRes = await adminApi.getUsers();
        if (usersRes?.success && Array.isArray(usersRes.data)) {
          usersCount = usersRes.data.length;
        }
      } catch (e) {
        console.warn('Users API failed:', e);
      }

      try {
        const providersRes = await adminApi.getProviders();
        if (providersRes?.success && Array.isArray(providersRes.data)) {
          providersCount = providersRes.data.length;
        }
      } catch (e) {
        console.warn('Providers API failed:', e);
      }

      try {
        const servicesRes = await adminApi.getServices();
        if (servicesRes?.success && Array.isArray(servicesRes.data)) {
          activeServicesCount = servicesRes.data.filter(s => s.is_active).length;
        }
      } catch (e) {
        console.warn('Services API failed:', e);
      }

      try {
        const ordersRes = await adminApi.getOrders();
        if (ordersRes?.success && ordersRes.data) {
          ordersCount = typeof ordersRes.data.count === 'number' ? ordersRes.data.count : (ordersRes.data.rows?.length || 0);
        }
      } catch (e) {
        console.warn('Orders API failed:', e);
      }

      try {
        const subsRes = await adminApi.getSubscriptions();
        if (subsRes?.success && subsRes.data) {
          activeSubsCount = typeof subsRes.data.count === 'number' ? subsRes.data.count : (subsRes.data.rows?.length || 0);
        }
      } catch (e) {
        console.warn('Subscriptions API failed:', e);
      }

      setStats({
        users: usersCount,
        providers: providersCount,
        activeServices: activeServicesCount,
        orders: ordersCount,
        activeSubscriptions: activeSubsCount,
        openTickets: statsData.openTickets || 0
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRunScheduler = async (e) => {
    e.preventDefault();
    setRunningScheduler(true);
    setSchedulerResult(null);
    try {
      const res = await adminApi.runScheduler(targetDate || null);
      if (res?.success) {
        setSchedulerResult(res.data);
        alert('Daily scheduler recovery completed successfully!');
        fetchStats();
      }
    } catch (err) {
      alert(err.message || 'Failed to trigger scheduler.');
    } finally {
      setRunningScheduler(false);
    }
  };

  if (loading && !stats) return <Skeleton type="table" count={5} />;

  const cards = [
    { label: 'Total Registered Users', val: stats?.users || 0, icon: <FiUsers className="w-5 h-5" />, color: 'bg-blue-500 text-white shadow-blue-500/10' },
    { label: 'Verified Service Providers', val: stats?.providers || 0, icon: <FiSliders className="w-5 h-5" />, color: 'bg-indigo-500 text-white shadow-indigo-500/10' },
    { label: 'Active Store Services', val: stats?.activeServices || 0, icon: <FiGrid className="w-5 h-5" />, color: 'bg-cyan-500 text-white shadow-cyan-500/10' },
    { label: 'Total Platform Bookings', val: stats?.orders || 0, icon: <FiShoppingBag className="w-5 h-5" />, color: 'bg-orange-500 text-white shadow-orange-500/10' },
    { label: 'Active Subscriptions', val: stats?.activeSubscriptions || 0, icon: <FiCalendar className="w-5 h-5" />, color: 'bg-green-600 text-white shadow-green-600/10' },
    { label: 'Open Support Tickets', val: stats?.openTickets || 0, icon: <FiAlertCircle className="w-5 h-5" />, color: 'bg-red-500 text-white shadow-red-500/10' },
  ];

  return (
    <div className="space-y-8 text-left pb-12 font-semibold">
      {error && (
        <div className="p-4 bg-red-50 border border-red-150 text-red-700 rounded-2xl text-xs font-bold shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300">
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{card.label}</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{card.val}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} shadow-sm shrink-0`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Scheduler recovery panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FiPlay className="text-blue-600 w-5 h-5 shrink-0" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Daily Delivery Scheduler</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            The platform schedules deliveries and processes subscription charges automatically. If a day's schedule was missed or needs manual execution, input the target date below and trigger recovery.
          </p>

          <form onSubmit={handleRunScheduler} className="flex flex-col sm:flex-row gap-4 items-end text-[10px] font-black uppercase tracking-wider">
            <div className="w-full sm:w-auto">
              <label className="block text-slate-400 mb-2">Target Date (Optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-805 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={runningScheduler}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center tracking-widest uppercase cursor-pointer"
            >
              <FiPlay className="w-4 h-4 mr-1.5" />
              {runningScheduler ? 'Running...' : 'Execute'}
            </button>
          </form>

          {/* Scheduler Results */}
          {schedulerResult && (
            <div className="mt-4 p-4.5 bg-slate-50 border border-slate-150 rounded-2xl text-xs leading-normal font-semibold space-y-2.5">
              <span className="font-black text-slate-800 block text-[10px] uppercase tracking-wider">Execution Results:</span>
              <div className="flex justify-between items-center text-[11px] border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Deliveries Scheduled:</span>
                <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">{schedulerResult.deliveries || 0}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Billing Runs Triggered:</span>
                <span className="font-extrabold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">{schedulerResult.billing || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Audit status helper */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-center items-center text-center py-12">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 text-blue-600 mb-2">
            <FiShield className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Security Control Matrix</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-semibold">
            All moderation actions, commission adjustments, user status suspensions, and KYC approvals are fully logged inside the system security audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
