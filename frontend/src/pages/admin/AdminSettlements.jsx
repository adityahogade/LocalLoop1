import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiDollarSign, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Settlement update modal
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [status, setStatus] = useState('paid');
  const [payoutReference, setPayoutReference] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSettlements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSettlements();
      if (res?.success) {
        setSettlements(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform settlements list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSettlement) return;

    if (status === 'paid' && !payoutReference.trim()) {
      alert('Please enter a payout transaction reference.');
      return;
    }

    if (status === 'rejected' && !rejectionReason.trim()) {
      alert('Please explain the rejection reason.');
      return;
    }

    setSubmitting(true);
    const payload = {
      status,
      payout_reference: status === 'paid' ? payoutReference : null,
      rejection_reason: status === 'rejected' ? rejectionReason : null,
    };

    try {
      const res = await adminApi.updateSettlement(selectedSettlement.id, payload);
      if (res?.success) {
        alert(`Settlement payout request marked as ${status}!`);
        setModalOpen(false);
        setPayoutReference('');
        setRejectionReason('');
        setSelectedSettlement(null);
        fetchSettlements();
      }
    } catch (err) {
      alert(err.message || 'Failed to process settlement update.');
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
          <h2 className="text-2xl font-black text-gray-900">Manage Provider settlements</h2>
          <p className="text-xs text-gray-500 mt-1">Review settlement ledger request cycles and payout transaction references.</p>
        </div>
      </div>

      {settlements.length === 0 ? (
        <EmptyState title="No settlements logged" description="All requested settlements are resolved." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Store Business</th>
                  <th className="px-6 py-3">Settlement Cycle Period</th>
                  <th className="px-6 py-3">Payout Due</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs">
                {settlements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {item.provider?.business_name}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.period_start).toLocaleDateString()} - {new Date(item.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-green-600 font-black">₹{Number(item.total_earnings).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {item.status === 'paid' && (
                        <span className="font-mono text-gray-700">Ref: {item.payout_reference}</span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="text-red-500 font-sans font-medium">Rejection Reason: {item.rejection_reason}</span>
                      )}
                      {item.status === 'requested' && (
                        <span className="flex items-center text-gray-400 italic">
                          <FiClock className="w-3.5 h-3.5 mr-1" /> Requested {new Date(item.requested_at || item.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'requested' && (
                        <button
                          onClick={() => {
                            setSelectedSettlement(item);
                            setStatus('paid');
                            setPayoutReference('');
                            setRejectionReason('');
                            setModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold"
                        >
                          Resolve payout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settlement payout modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Resolve Settlement Payout</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Resolution Action</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                >
                  <option value="paid">Mark Paid (Fund Transferred)</option>
                  <option value="rejected">Reject Settlement Request</option>
                </select>
              </div>

              {status === 'paid' ? (
                <div>
                  <label className="block text-gray-500 mb-2">Payout Reference (UPI / NEFT ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TXN9876543210"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-500 mb-2">Rejection Reason</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Provide details for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedSettlement(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
