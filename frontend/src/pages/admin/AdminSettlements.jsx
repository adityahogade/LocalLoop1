import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiDollarSign, FiCheckCircle, FiClock, FiEye, FiCheck, FiX, FiLayers } from 'react-icons/fi';

export default function AdminSettlements() {
  const [overview, setOverview] = useState([]);
  const [settlementsHistory, setSettlementsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  // Details Modal
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Settle Modal
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [providerToSettle, setProviderToSettle] = useState(null);
  const [payoutRef, setPayoutRef] = useState('');
  const [settling, setSettling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, historyRes] = await Promise.all([
        adminApi.getSettlementsOverview(),
        adminApi.getSettlements()
      ]);

      if (overviewRes?.success) {
        setOverview(overviewRes.data || []);
      }
      if (historyRes?.success) {
        setSettlementsHistory(historyRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform settlements data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenSettle = (prov) => {
    setProviderToSettle(prov);
    setPayoutRef(`SETTLE-${Date.now()}-${prov.provider_id}`);
    setSettleModalOpen(true);
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!providerToSettle) return;

    setSettling(true);
    try {
      const res = await adminApi.settleProvider(providerToSettle.provider_id, payoutRef.trim() || null);
      if (res?.success) {
        alert(res.data?.message || 'Settlement processed successfully!');
        setSettleModalOpen(false);
        setProviderToSettle(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to process provider settlement.');
    } finally {
      setSettling(false);
    }
  };

  if (loading && overview.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Provider Settlements & Accounting</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Review completed provider services, gross earnings, platform commission, and settle payable amounts.
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'overview' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Provider Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Settlement History
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        /* PROVIDER SETTLEMENTS OVERVIEW */
        overview.length === 0 ? (
          <EmptyState title="No Provider Data" description="No providers found." />
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Provider / Business</th>
                    <th className="px-6 py-3.5">Completed Services</th>
                    <th className="px-6 py-3.5">Gross Earnings</th>
                    <th className="px-6 py-3.5">Already Settled</th>
                    <th className="px-6 py-3.5">Pending Settlement</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-xs">
                  {overview.map((prov) => {
                    const isPending = Number(prov.pending_settlement) > 0;
                    return (
                      <tr key={prov.provider_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-gray-900 text-xs">{prov.business_name}</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {prov.provider_name} {prov.phone ? `• ${prov.phone}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">{prov.completed_services}</td>
                        <td className="px-6 py-4 font-extrabold text-gray-800">₹{prov.gross_earnings}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">₹{prov.already_settled}</td>
                        <td className="px-6 py-4 font-extrabold text-blue-600">₹{prov.pending_settlement}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isPending ? 'Pending Settlement' : 'Settled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProvider(prov);
                                setDetailsModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            {isPending && (
                              <button
                                onClick={() => handleOpenSettle(prov)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <FiCheckCircle className="w-3.5 h-3.5" />
                                Settle Payment
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* SETTLEMENT HISTORY */
        settlementsHistory.length === 0 ? (
          <EmptyState title="No Settlements History" description="Processed payout settlements will appear here." />
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Store Business</th>
                    <th className="px-6 py-3.5">Settlement Period</th>
                    <th className="px-6 py-3.5">Total Settled</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Processed Date</th>
                    <th className="px-6 py-3.5">Payout Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-xs">
                  {settlementsHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {item.provider?.business_name || `Provider #${item.provider_id}`}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(item.period_start).toLocaleDateString()} - {new Date(item.period_end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600">₹{Number(item.total_earnings).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">
                        {item.processed_at ? new Date(item.processed_at).toLocaleString() : 'Pending'}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-gray-700">
                        {item.payout_reference || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* VIEW DETAILS MODAL */}
      {detailsModalOpen && selectedProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-5 text-left max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Settlement Breakdown</span>
                <h3 className="text-xl font-extrabold text-gray-900">{selectedProvider.business_name}</h3>
                <p className="text-xs text-gray-500">
                  {selectedProvider.provider_name} • Total Completed Services: {selectedProvider.completed_services}
                </p>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedProvider.earnings?.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-semibold">
                  No completed service transactions logged yet.
                </div>
              ) : (
                <table className="w-full text-xs text-left text-gray-600">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Gross</th>
                      <th className="px-4 py-3">Commission</th>
                      <th className="px-4 py-3">Provider Payable</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold">
                    {selectedProvider.earnings.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900 capitalize">{e.service_name}</td>
                        <td className="px-4 py-3 text-gray-700">{e.customer_name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">{e.date}</td>
                        <td className="px-4 py-3 text-gray-700">{e.quantity} {e.unit}</td>
                        <td className="px-4 py-3 text-gray-700">₹{e.rate}</td>
                        <td className="px-4 py-3 font-extrabold text-gray-900">₹{e.gross_amount}</td>
                        <td className="px-4 py-3 text-amber-700 font-bold">
                          ₹{e.commission_amount} <span className="text-[10px] text-gray-400">({e.commission_percentage}%)</span>
                        </td>
                        <td className="px-4 py-3 font-black text-blue-600">₹{e.provider_payable}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              e.status === 'Settled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 bg-gray-50/70 p-4 rounded-2xl">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Pending Settlement Balance</span>
                <div className="text-lg font-black text-blue-600">₹{selectedProvider.pending_settlement}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
                {Number(selectedProvider.pending_settlement) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      handleOpenSettle(selectedProvider);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Settle Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SETTLEMENT MODAL */}
      {settleModalOpen && providerToSettle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-left">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Confirm Settlement</span>
              <h3 className="text-lg font-black text-gray-900">Settle Provider Payout</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Transfer and record platform settlement to provider account.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-gray-400">Provider:</span>
                <span className="font-extrabold text-gray-900">{providerToSettle.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="font-black text-blue-600 text-sm">₹{providerToSettle.pending_settlement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Eligible Services:</span>
                <span className="font-bold text-gray-800">{providerToSettle.earnings?.filter(e => e.status === 'Pending').length || 0} completed services</span>
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                  Payout Transaction Reference
                </label>
                <input
                  type="text"
                  required
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g. UPI-987654321"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-mono font-bold text-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettleModalOpen(false);
                    setProviderToSettle(null);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiCheck className="w-4 h-4" />
                  {settling ? 'Settling...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
