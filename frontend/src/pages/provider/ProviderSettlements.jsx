import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiPlus, FiDollarSign, FiClock } from 'react-icons/fi';

export default function ProviderSettlements() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSettlements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await providerApi.getSettlements();
      if (res?.success) {
        setSettlements(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load settlements log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      const res = await providerApi.requestSettlement({
        period_start: startDate,
        period_end: endDate,
      });

      if (res?.success) {
        alert('Settlement payout requested successfully!');
        setModalOpen(false);
        setStartDate('');
        setEndDate('');
        fetchSettlements();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit settlement request. Ensure there are unsettled earnings in the date range.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && settlements.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Payout Settlements</h2>
          <p className="text-xs text-gray-500 mt-1">Request payouts for completed, unsettled job earnings.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-1" />
          Request Settlement
        </button>
      </div>

      {settlements.length === 0 ? (
        <EmptyState
          title="No settlements found"
          description="Your payout settlement history will appear here once you request transfers for accumulated store earnings."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Settlement Cycle Range</th>
                  <th className="px-6 py-3">Total Earnings</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Requested At</th>
                  <th className="px-6 py-3">Payout Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {settlements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-bold text-gray-800">
                      <FiDollarSign className="w-4 h-4 mr-2 text-slate-400" />
                      {new Date(item.period_start).toLocaleDateString()} - {new Date(item.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-green-600 font-black">₹{Number(item.total_earnings).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(item.requested_at || item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {item.payout_reference || (
                        <span className="flex items-center text-gray-400 italic">
                          <FiClock className="w-3.5 h-3.5 mr-1" />
                          Processing
                        </span>
                      )}
                      {item.rejection_reason && (
                        <span className="block text-[10px] text-red-500 font-medium font-sans">
                          Reason: {item.rejection_reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Settlement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Request Payout Settlement</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Request Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
