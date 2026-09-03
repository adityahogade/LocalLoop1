import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiDollarSign, FiClock, FiCheckCircle, FiTrendingUp, FiShoppingBag, FiLayers } from 'react-icons/fi';

export default function ProviderSettlements() {
  const [data, setData] = useState({
    total_earnings: '0.00',
    pending_settlement: '0.00',
    settled_amount: '0.00',
    recent_services: [],
    settlement_history: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEarningsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await providerApi.getEarningsSummary();
      if (res?.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load earnings and settlements data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  if (loading && !data.recent_services.length) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8 text-left pb-12">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Earnings & Settlements</h2>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Track completed service earnings, pending settlement balance, and payout ledger history.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Earnings</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <FiTrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">₹{data.total_earnings}</div>
          <p className="text-[11px] text-gray-400 font-semibold">Accumulated provider revenue from completed jobs</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Pending Settlement</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <FiClock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">₹{data.pending_settlement}</div>
          <p className="text-[11px] text-gray-400 font-semibold">Completed service funds awaiting admin payout</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Settled Amount</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">₹{data.settled_amount}</div>
          <p className="text-[11px] text-gray-400 font-semibold">Total funds transferred and paid out to you</p>
        </div>
      </div>

      {/* Recent Services Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Recent Completed Services</h3>
            <p className="text-xs text-gray-400 font-medium">Earnings generated from completed deliveries and orders</p>
          </div>
        </div>

        {data.recent_services.length === 0 ? (
          <EmptyState
            title="No completed services yet"
            description="When you complete orders or deliver scheduled subscriptions, your earned payouts will appear here."
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Quantity</th>
                    <th className="px-6 py-3.5">Rate</th>
                    <th className="px-6 py-3.5">Gross Paid</th>
                    <th className="px-6 py-3.5">Your Earning</th>
                    <th className="px-6 py-3.5 text-right">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {data.recent_services.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-gray-900 capitalize">{item.service_name}</td>
                      <td className="px-6 py-4 text-gray-700">{item.customer_name}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">{item.date}</td>
                      <td className="px-6 py-4 text-gray-700">{item.quantity} {item.unit}</td>
                      <td className="px-6 py-4 text-gray-700">₹{item.rate}</td>
                      <td className="px-6 py-4 text-gray-500">₹{item.gross_amount}</td>
                      <td className="px-6 py-4 font-black text-blue-600 text-sm">₹{item.provider_payable}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.status === 'Settled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Settlement History Table */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">Settlement Payout History</h3>
          <p className="text-xs text-gray-400 font-medium">Official payout settlements processed by platform administration</p>
        </div>

        {data.settlement_history.length === 0 ? (
          <EmptyState
            title="No settlement payouts yet"
            description="Your payout transfer history will appear here once admin processes your pending earnings."
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Settlement Cycle</th>
                    <th className="px-6 py-3.5">Settled Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Payout Reference</th>
                    <th className="px-6 py-3.5 text-right">Processed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {data.settlement_history.map((settle) => (
                    <tr key={settle.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-bold">
                        {new Date(settle.period_start).toLocaleDateString()} - {new Date(settle.period_end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600 text-sm">
                        ₹{Number(settle.total_earnings).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={settle.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700 text-[11px]">
                        {settle.payout_reference || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 font-mono text-[11px]">
                        {settle.processed_at ? new Date(settle.processed_at).toLocaleString() : new Date(settle.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
