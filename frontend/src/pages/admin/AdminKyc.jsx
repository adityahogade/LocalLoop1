import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';
import { getFullFileUrl, viewKycDocument } from '../../utils/kycDocumentViewer';

export default function AdminKyc() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rejection modal
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const fetchPendingDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPendingKyc();
      if (res?.success) {
        setDocs(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending KYC submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDocs();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this KYC document?')) return;
    try {
      const res = await adminApi.reviewKyc(id, 'approved');
      if (res?.success) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to approve KYC');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setSubmittingReview(true);
    try {
      const res = await adminApi.reviewKyc(selectedDoc.id, 'rejected', rejectionReason);
      if (res?.success) {
        setDocs((prev) => prev.filter((d) => d.id !== selectedDoc.id));
        setRejectModalOpen(false);
        setRejectionReason('');
        setSelectedDoc(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to reject KYC');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Pending KYC Submissions</h2>
          <p className="text-xs text-gray-500 font-medium">Verify legal documents uploaded by active platform vendors.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
          {error}
        </div>
      )}

      {docs.length === 0 ? (
        <EmptyState
          title="No pending KYC documents"
          description="All provider identity and compliance records have been reviewed."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Provider / Business</th>
                  <th className="px-6 py-3">Document Type</th>
                  <th className="px-6 py-3">File</th>
                  <th className="px-6 py-3">Uploaded Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {doc.business_name || doc.provider?.business_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 capitalize">{doc.document_type?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <a
                        href={getFullFileUrl(doc.file_url)}
                        onClick={(e) => {
                          e.preventDefault();
                          viewKycDocument(doc.file_url, 'admin');
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-xs"
                      >
                        <FiEye className="w-3.5 h-3.5" /> View document
                      </a>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 text-xs font-bold">
                      <button
                        onClick={() => handleApprove(doc.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-150 rounded-lg"
                      >
                        <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setRejectModalOpen(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-150 rounded-lg"
                      >
                        <FiXCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Provide Rejection Reason</h3>
            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Rejection Reason</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Document image is blurry, expired GST license..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectionReason('');
                    setSelectedDoc(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                >
                  Reject Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
