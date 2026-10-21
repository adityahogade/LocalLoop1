import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiDollarSign, FiPercent, FiTrendingUp, FiShoppingBag, FiCalendar, FiArrowDownLeft, FiMapPin, FiLayers } from 'react-icons/fi';

export default function ProviderDashboard() {
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reverse geocode saved provider coordinates
  useEffect(() => {
    const reverseGeocode = async () => {
      if (profile?.latitude && profile?.longitude) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${profile.latitude}&lon=${profile.longitude}&format=json`, {
            headers: { 'User-Agent': 'LocalLoop-ServiceHub-Dashboard' }
          });
          if (res.ok) {
            const data = await res.json();
            setAddress(data.display_name || `${profile.latitude}, ${profile.longitude}`);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    reverseGeocode();
  }, [profile]);

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

      const profileRes = await providerApi.getProfile();
      if (profileRes?.success) {
        setProfile(profileRes.data);
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
    { label: 'Gross Sales', val: `₹${Number(summary?.gross_sales || 0).toFixed(2)}`, icon: <FiShoppingBag className="w-5 h-5" />, color: 'bg-blue-500 text-white shadow-blue-500/10' },
    { label: 'Platform Commission', val: `₹${Number(summary?.platform_commission || 0).toFixed(2)}`, icon: <FiPercent className="w-5 h-5" />, color: 'bg-orange-500 text-white shadow-orange-500/10' },
    { label: 'Refunds Processed', val: `₹${Number(summary?.refunds || 0).toFixed(2)}`, icon: <FiArrowDownLeft className="w-5 h-5" />, color: 'bg-red-500 text-white shadow-red-500/10' },
    { label: 'Log Expenses', val: `₹${Number(summary?.expenses || 0).toFixed(2)}`, icon: <FiTrendingUp className="w-5 h-5" />, color: 'bg-slate-500 text-white shadow-slate-500/10' },
    { label: 'Net Earnings', val: `₹${Number(summary?.provider_earnings || 0).toFixed(2)}`, icon: <FiDollarSign className="w-5 h-5" />, color: 'bg-green-600 text-white shadow-green-600/10' },
    { label: 'Net Profit', val: `₹${Number(summary?.net_profit || 0).toFixed(2)}`, icon: <FiDollarSign className="w-5 h-5" />, color: 'bg-emerald-700 text-white shadow-emerald-700/10' },
  ];

  return (
    <div className="space-y-8 text-left pb-12">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-805 uppercase tracking-wider">Accounting Ledger & Analytics</h2>
          <p className="text-[11px] text-slate-400 mt-1 font-semibold">Real-time statistics compiled under Indian Standard Time (IST).</p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-wider">
          {['today', 'yesterday', 'week', 'month', 'year', 'custom'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                period === p
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-55'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <form onSubmit={handleCustomSearch} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-wrap gap-4 items-end text-[10px] font-black uppercase tracking-wider">
          <div className="space-y-2">
            <label className="block text-slate-400 font-black">From Date</label>
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-slate-400 font-black">To Date</label>
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-250 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer"
          >
            Apply Range
          </button>
        </form>
      )}

      {error && <div className="p-4 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs font-bold shadow-sm">⚠️ {error}</div>}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-300">
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{kpi.label}</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{kpi.val}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.color} shadow-sm shrink-0`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Trend Chart */}
      {analytics?.trend && analytics.trend.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Earnings & Revenue Trend</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Visual timeline comparison between gross sales and net operating profit.</p>
          </div>
          <div className="h-72 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.trend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Gross Revenue" />
                <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" name="Net Earnings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Booking, Sub, and Location Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders counts */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest border-b border-slate-100 pb-3">
            <FiShoppingBag className="w-4.5 h-4.5 mr-2 text-blue-600" />
            Bookings Summary
          </h3>
          <div className="space-y-1">
            {analytics?.order_statuses?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 font-semibold">No bookings recorded during this period.</p>
            ) : (
              analytics?.order_statuses?.map((st) => (
                <div key={st.status} className="flex justify-between items-center text-xs font-semibold py-2.5 border-b border-slate-100 last:border-0">
                  <span className="capitalize text-slate-650 font-bold">{st.status}</span>
                  <span className="bg-blue-50 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-blue-100">{st.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Service Location & Area Coverage */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest border-b border-slate-100 pb-3">
            <FiMapPin className="w-4.5 h-4.5 mr-2 text-rose-500" />
            Service Area Coverage
          </h3>
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-0.5">Service Center</span>
                <span className="font-extrabold text-slate-850 leading-snug break-words block">
                  {address || (profile?.latitude ? `${profile.latitude}, ${profile.longitude}` : 'Not configured')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-205 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-0.5">Service Radius</span>
                  <span className="font-extrabold text-blue-600 text-sm">
                    {profile?.service_radius_km ? `${Number(profile.service_radius_km).toFixed(0)} KM` : '10 KM'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-0.5">Coordinates</span>
                  <span className="font-bold text-slate-500 text-[10px]">
                    {profile?.latitude ? `${Number(profile.latitude).toFixed(4)}, ${Number(profile.longitude).toFixed(4)}` : 'None'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-semibold">
              My services are available within {profile?.service_radius_km ? `${Number(profile.service_radius_km).toFixed(0)} KM` : '10 KM'} of my service location.
            </p>
          </div>
        </div>

        {/* Subscription counts */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest border-b border-slate-100 pb-3">
            <FiLayers className="w-4.5 h-4.5 mr-2 text-green-600" />
            Subscriptions Summary
          </h3>
          <div className="space-y-1">
            {analytics?.subscription_statuses?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 font-semibold">No subscriptions recorded during this period.</p>
            ) : (
              analytics?.subscription_statuses?.map((st) => (
                <div key={st.status} className="flex justify-between items-center text-xs font-semibold py-2.5 border-b border-slate-100 last:border-0">
                  <span className="capitalize text-slate-650 font-bold">{st.status}</span>
                  <span className="bg-green-50 text-green-800 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-green-100">{st.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
