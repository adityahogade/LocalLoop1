import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiDollarSign, FiPercent, FiTrendingUp, FiShoppingBag, FiCalendar, FiArrowDownLeft } from 'react-icons/fi';

export default function ProviderDashboard() {
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (period === 'custom') {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        params.from = fromDate;
        params.to = toDate;
      }

      const summaryRes = await providerApi.getAccountingSummary(params);
      if (summaryRes?.success) {
        setSummary(summaryRes.data);
      }

      const analyticsParams = {};
      if (period === 'custom') {
        analyticsParams.from = fromDate;
        analyticsParams.to = toDate;
      } else {
        // Resolve date boundaries locally for analytics custom query mapping
        const today = new Date();
        let from = new Date();
        if (period === 'today') from = today;
        else if (period === 'yesterday') from.setDate(today.getDate() - 1);
        else if (period === 'week') from.setDate(today.getDate() - 7);
        else if (period === 'month') from.setMonth(today.getMonth() - 1);
        else if (period === 'year') from.setFullYear(today.getFullYear() - 1);

        analyticsParams.from = from.toISOString().slice(0, 10);
        analyticsParams.to = today.toISOString().slice(0, 10);
      }

      const analyticsRes = await providerApi.getAccountingAnalytics(analyticsParams);
      if (analyticsRes?.success) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard accounting statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  if (loading && !summary) return <Skeleton type="table" count={5} />;

  const kpis = [
    { label: 'Gross Sales', val: `₹${Number(summary?.gross_sales || 0).toFixed(2)}`, icon: <FiShoppingBag />, color: 'bg-blue-500 text-white' },
    { label: 'Platform Commission', val: `₹${Number(summary?.platform_commission || 0).toFixed(2)}`, icon: <FiPercent />, color: 'bg-orange-500 text-white' },
    { label: 'Refunds Processed', val: `₹${Number(summary?.refunds || 0).toFixed(2)}`, icon: <FiArrowDownLeft />, color: 'bg-red-500 text-white' },
    { label: 'Log Expenses', val: `₹${Number(summary?.expenses || 0).toFixed(2)}`, icon: <FiTrendingUp />, color: 'bg-slate-500 text-white' },
    { label: 'Net Earnings', val: `₹${Number(summary?.provider_earnings || 0).toFixed(2)}`, icon: <FiDollarSign />, color: 'bg-green-600 text-white' },
    { label: 'Net Profit', val: `₹${Number(summary?.net_profit || 0).toFixed(2)}`, icon: <FiDollarSign />, color: 'bg-emerald-700 text-white' },
  ];

  return (
    <div className="space-y-8">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900">Dashboard Accounting Overview</h2>
          <p className="text-xs text-gray-500 mt-1">Period summary resolved in Indian Standard Time (IST).</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {['today', 'yesterday', 'week', 'month', 'year', 'custom'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded border capitalize transition-colors ${
                period === p
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <form onSubmit={handleCustomSearch} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-end text-xs font-bold">
          <div>
            <label className="block text-gray-500 mb-2">From Date</label>
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-500 mb-2">To Date</label>
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow"
          >
            Apply Range
          </button>
        </form>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 font-bold">{kpi.label}</span>
              <h3 className="text-lg sm:text-2xl font-black text-gray-900">{kpi.val}</h3>
            </div>
            <div className={`p-3 rounded-lg ${kpi.color} shadow-sm shrink-0`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Trend Chart */}
      {analytics?.trend && analytics.trend.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-gray-800">Earnings & Sales Revenue Trend</h3>
          <div className="h-72 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" h="100%">
              <AreaChart data={analytics.trend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="Gross Revenue" />
                <Area type="monotone" dataKey="earnings" stroke="#10b981" fillOpacity={1} fill="url(#colorEarnings)" name="Net Earnings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Booking and Sub Counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orders counts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <FiShoppingBag className="w-5 h-5 mr-2 text-blue-500" />
            Bookings Status Breakdown
          </h3>
          <div className="space-y-2">
            {analytics?.order_statuses?.length === 0 ? (
              <p className="text-xs text-gray-400">No bookings recorded during this period.</p>
            ) : (
              analytics?.order_statuses?.map((st) => (
                <div key={st.status} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-gray-50 last:border-0">
                  <span className="capitalize text-gray-600">{st.status}</span>
                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-100">{st.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subscription counts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <FiCalendar className="w-5 h-5 mr-2 text-blue-500" />
            Subscriptions Status Breakdown
          </h3>
          <div className="space-y-2">
            {analytics?.subscription_statuses?.length === 0 ? (
              <p className="text-xs text-gray-400">No subscriptions recorded during this period.</p>
            ) : (
              analytics?.subscription_statuses?.map((st) => (
                <div key={st.status} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-gray-50 last:border-0">
                  <span className="capitalize text-gray-600">{st.status}</span>
                  <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded font-bold border border-green-100">{st.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
