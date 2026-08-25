import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import { FiUsers, FiSliders, FiGrid, FiShoppingBag, FiCreditCard, FiAlertCircle, FiCalendar, FiPlay } from 'react-icons/fi';

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
      const res = await adminApi.getStats();
      if (res?.success) {
        setStats(res.data);
      }
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
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  const cards = [
    { label: 'Total Users', val: stats?.users || 0, icon: <FiUsers />, color: 'bg-blue-600' },
    { label: 'Service Providers', val: stats?.providers || 0, icon: <FiSliders />, color: 'bg-indigo-600' },
    { label: 'Active Services', val: stats?.activeServices || 0, icon: <FiGrid />, color: 'bg-cyan-600' },
    { label: 'Platform Bookings', val: stats?.orders || 0, icon: <FiShoppingBag />, color: 'bg-orange-600' },
    { label: 'Active Subscriptions', val: stats?.activeSubscriptions || 0, icon: <FiCalendar />, color: 'bg-green-600' },
    { label: 'Open Support Tickets', val: stats?.openTickets || 0, icon: <FiAlertCircle />, color: 'bg-red-600' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 font-bold">{card.label}</span>
              <h3 className="text-2xl font-black text-gray-900">{card.val}</h3>
            </div>
            <div className={`p-3 rounded-lg text-white ${card.color} shadow-sm shrink-0`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scheduler recovery panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <FiPlay className="text-blue-500 w-5 h-5 shrink-0" />
            <h3 className="text-md font-bold text-gray-800">Trigger Daily Delivery Scheduler</h3>
          </div>
          <p className="text-xs text-gray-500 leading-normal">
            The platform schedules deliveries and processes subscription charges automatically. If a day's schedule was missed or needs manual execution, input the target date below and trigger recovery.
          </p>

          <form onSubmit={handleRunScheduler} className="flex gap-4 items-end text-xs font-semibold">
            <div>
              <label className="block text-gray-500 mb-2">Target Date (Optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="border rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={runningScheduler}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded shadow disabled:opacity-50 flex items-center"
            >
              <FiPlay className="w-4 h-4 mr-1" />
              {runningScheduler ? 'Running...' : 'Execute Scheduler'}
            </button>
          </form>

          {/* Scheduler Results */}
          {schedulerResult && (
            <div className="mt-4 p-4 bg-gray-50 border rounded-lg text-xs leading-normal font-medium space-y-2">
              <span className="font-bold text-gray-800 block">Execution Results:</span>
              <div className="flex justify-between">
                <span>Deliveries Scheduled:</span>
                <span className="font-bold text-blue-600">{schedulerResult.deliveries || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Runs Triggered:</span>
                <span className="font-bold text-green-600">{schedulerResult.billing || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Audit status helper */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-center items-center text-center">
          <FiShield className="w-12 h-12 text-blue-200 mb-2" />
          <h3 className="text-md font-bold text-gray-800">Security Control Matrix</h3>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
            All moderation actions, commission adjustments, user status suspensions, and KYC approvals are fully logged inside the system security audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
import { FiShield } from 'react-icons/fi';
