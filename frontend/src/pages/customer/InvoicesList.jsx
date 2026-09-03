import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiDownload, FiFileText, FiCheckCircle, FiPackage, FiBriefcase, FiCalendar, FiDollarSign } from 'react-icons/fi';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

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
      if (err.code === 'CUSTOMER_NOT_FOUND') {
        setError('Customer profile not found in database. Please register a new customer account using the Sign Up page.');
      } else {
        setError('Failed to load invoices.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownload = async (id, invoiceNumber) => {
    setDownloadingId(id);
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
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold shadow-xs">⚠️ {error}</div>;

  const paidCount = invoices.filter(i => i.payment_status === 'paid').length;
  const totalSpent = invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + Number(i.total || 0), 0);

  return (
    <div className="space-y-6 text-left font-semibold pb-12 w-full max-w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Customer Billing
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs font-bold text-slate-500">ServiceHub Invoices</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">Official Tax Invoices & Receipts</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Download and review official tax invoices for all completed subscriptions and on-demand bookings.
          </p>
        </div>

        {invoices.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-xs">
              <FiCheckCircle className="text-emerald-600 w-4 h-4 shrink-0" />
              <span className="text-emerald-800 font-bold">
                {paidCount} Paid Receipts
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs">
              <span className="text-slate-500 font-bold">Total Paid:</span>
              <span className="text-slate-900 font-black">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Invoices are generated automatically upon successful checkout and payment confirmation."
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          {/* Desktop Table (hidden on small mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Invoice No.</th>
                  <th className="px-5 py-3.5">Service Type</th>
                  <th className="px-5 py-3.5">Service Provider</th>
                  <th className="px-5 py-3.5">Total Paid</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 flex items-center">
                      <FiFileText className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                      {inv.invoice_number}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {inv.reference_type === 'subscription_payment' ? (
                          <>
                            <FiPackage className="w-3 h-3 text-blue-600 shrink-0" />
                            Subscription
                          </>
                        ) : (
                          <>
                            <FiBriefcase className="w-3 h-3 text-indigo-600 shrink-0" />
                            One-Time Order
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {inv.provider?.business_name || 'Local Service Provider'}
                    </td>
                    <td className="px-5 py-4 text-slate-900 font-black text-sm">
                      ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={inv.payment_status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-medium">
                      {new Date(inv.issued_at || inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDownload(inv.id, inv.invoice_number)}
                        disabled={downloadingId === inv.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        {downloadingId === inv.id ? 'Generating...' : 'Download PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (visible on screens < 640px) */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs">
                    <FiFileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{inv.invoice_number}</span>
                  </div>
                  <StatusBadge status={inv.payment_status} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Provider:</span>
                  <span className="font-bold text-slate-800">{inv.provider?.business_name || 'Local Service Provider'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Service Type:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                    {inv.reference_type === 'subscription_payment' ? (
                      <>
                        <FiPackage className="w-2.5 h-2.5 text-blue-600" />
                        Subscription
                      </>
                    ) : (
                      <>
                        <FiBriefcase className="w-2.5 h-2.5 text-indigo-600" />
                        One-Time
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(inv.issued_at || inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">TOTAL PAID</span>
                    <span className="text-sm font-black text-slate-900">
                      ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(inv.id, inv.invoice_number)}
                    disabled={downloadingId === inv.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    {downloadingId === inv.id ? 'Generating...' : 'PDF Bill'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
