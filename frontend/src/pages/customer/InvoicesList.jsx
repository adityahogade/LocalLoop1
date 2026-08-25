import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiDownload, FiFileText } from 'react-icons/fi';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getInvoices();
      if (res?.success) {
        setInvoices(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch billing invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownload = async (id, invoiceNumber) => {
    try {
      const blob = await customerApi.getInvoicePdfBlob(id);
      const file = new Blob([blob], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      link.click();
      
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Invoice download failed:', err);
      alert('Failed to download invoice PDF.');
    }
  };

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-900">Billing Invoices</h2>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Invoices are generated automatically upon successful payment verification checkout."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Invoice No.</th>
                  <th className="px-6 py-3">Reference Type</th>
                  <th className="px-6 py-3">Bill Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Issued Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-bold text-gray-800">
                      <FiFileText className="w-4 h-4 mr-2 text-gray-400" />
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4 capitalize">{inv.reference_type?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-gray-900 font-black">₹{Number(inv.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.payment_status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(inv.issued_at || inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownload(inv.id, inv.invoice_number)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        <FiDownload className="w-3.5 h-3.5 mr-1" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
