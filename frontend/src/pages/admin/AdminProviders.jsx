import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiSliders, FiCheckCircle, FiXCircle, FiSlash, FiBriefcase } from 'react-icons/fi';

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual KYC review modal
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [kycStatus, setKycStatus] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getProviders();
      if (res?.success) {
        setProviders(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch provider logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleActive = async (id, currentActive) => {
    const nextActive = !currentActive;
    if (!window.confirm(`Change provider listing status to ${nextActive ? 'Active' : 'Suspended'}?`)) return;
    try {
      const res = await adminApi.updateProviderStatus(id, nextActive);
      if (res?.success) {
        fetchProviders();
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle active status.');
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setSubmittingKyc(true);
    try {
      const res = await adminApi.updateProviderKyc(
        selectedProvider.id,
        kycStatus,
        kycStatus === 'rejected' ? rejectionReason : null
      );
      if (res?.success) {
        alert('KYC state modified successfully!');
        setKycModalOpen(false);
        setRejectionReason('');
        setSelectedProvider(null);
        fetchProviders();
      }
    } catch (err) {
      alert(err.message || 'Failed to update KYC status.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (loading && providers.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Service Providers Registry</h2>
          <p className="text-xs text-gray-500 mt-1">Review store metadata, activate listings, or update KYC approvals.</p>
        </div>
      </div>

      {providers.length === 0 ? (
        <EmptyState title="No providers registered" description="Provider businesses will appear here once they complete registration." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Store / Business Name</th>
                  <th className="px-6 py-3">Owner Contact</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">KYC Status</th>
                  <th className="px-6 py-3">Active status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-bold text-gray-800">
                      <FiBriefcase className="w-4 h-4 mr-2 text-slate-400" />
                      {p.business_name}
                    </td>
                    <td className="px-6 py-4">
                      {p.full_name} <br />
                      <span className="text-[10px] text-gray-400 font-mono font-semibold">{p.email}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {Number(p.average_rating) > 0 ? Number(p.average_rating).toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.kyc_status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        p.is_active
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {p.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 text-xs font-bold">
                      <button
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        className={`p-1.5 rounded-lg border text-xs font-bold ${
                          p.is_active
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {p.is_active ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProvider(p);
                          setKycStatus(p.kyc_status || 'approved');
                          setKycModalOpen(true);
                        }}
                        className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold"
                      >
                        Edit KYC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual KYC Update Modal */}
      {kycModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Review KYC Approval</h3>
            <form onSubmit={handleKycSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">KYC Status</label>
                <select
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {kycStatus === 'rejected' && (
                <div>
                  <label className="block text-gray-500 mb-2">Rejection Reason</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="e.g. Invalid bank check, mismatch names..."
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
                    setKycModalOpen(false);
                    setRejectionReason('');
                    setSelectedProvider(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Apply KYC State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
