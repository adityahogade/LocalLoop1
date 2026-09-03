import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  FiDollarSign,
  FiCreditCard,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiEye,
  FiX,
  FiTrendingUp,
  FiLayers,
  FiCalendar,
  FiCheck
} from 'react-icons/fi';

export default function AdminPayments() {
  const [data, setData] = useState({
    summary: {
      total_payments_count: 0,
      total_payments_amount: '0.00',
      customer_revenue: '0.00',
      provider_payable: '0.00',
      platform_commission: '0.00',
      settlement_pending: '0.00',
      settlement_paid: '0.00'
    },
    payments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Details Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settling, setSettling] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (paymentStatusFilter !== 'all') params.status = paymentStatusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await adminApi.getPayments(params);
      if (res?.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load payment transactions ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [paymentStatusFilter, fromDate, toDate]);

  // Unique services list for filter dropdown
  const uniqueServices = Array.from(
    new Set(data.payments.map((p) => p.service?.name).filter(Boolean))
  );

  // Client-side filtering for search, settlement status, and service
  const filteredPayments = data.payments.filter((item) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = String(item.id).includes(q);
      const matchCustomer =
        item.customer?.name?.toLowerCase().includes(q) ||
        item.customer?.email?.toLowerCase().includes(q) ||
        item.customer?.phone?.toLowerCase().includes(q);
      const matchProvider =
        item.provider?.business_name?.toLowerCase().includes(q) ||
        item.provider?.name?.toLowerCase().includes(q);
      const matchService = item.service?.name?.toLowerCase().includes(q);
      const matchRef =
        String(item.subscription_id).includes(q) ||
        String(item.order_number).toLowerCase().includes(q);

      if (!matchId && !matchCustomer && !matchProvider && !matchService && !matchRef) {
        return false;
      }
    }

    // Settlement status filter
    if (settlementStatusFilter !== 'all') {
      if (settlementStatusFilter === 'pending' && item.settlement?.status !== 'PENDING') return false;
      if (settlementStatusFilter === 'eligible' && item.settlement?.status !== 'PENDING') return false;
      if (settlementStatusFilter === 'paid' && item.settlement?.status !== 'PAID') return false;
      if (settlementStatusFilter === 'not_eligible' && item.settlement?.status !== 'NOT_ELIGIBLE') return false;
    }

    // Service filter
    if (serviceFilter !== 'all' && item.service?.name !== serviceFilter) {
      return false;
    }

    return true;
  });

  const handleSettleFromModal = async () => {
    if (!selectedPayment?.provider?.id) return;
    setSettling(true);
    try {
      const res = await adminApi.settleProvider(selectedPayment.provider.id);
      if (res?.success) {
        alert(res.data?.message || 'Provider settlement processed successfully!');
        setModalOpen(false);
        setSelectedPayment(null);
        fetchPayments();
      }
    } catch (err) {
      alert(err.message || 'Failed to process provider settlement.');
    } finally {
      setSettling(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'paid' || s === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FiCheckCircle className="w-3 h-3 mr-1" /> PAID
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          <FiClock className="w-3 h-3 mr-1" /> PENDING
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
          <FiXCircle className="w-3 h-3 mr-1" /> FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-50 text-gray-700 border border-gray-200">
        <FiAlertCircle className="w-3 h-3 mr-1" /> {status?.toUpperCase()}
      </span>
    );
  };

  const getSettlementBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          PAID
        </span>
      );
    }
    if (s === 'PENDING' || s === 'ELIGIBLE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200">
        NOT ELIGIBLE
      </span>
    );
  };

  if (loading && data.payments.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8 text-left pb-12">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Management</h2>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Comprehensive ledger of customer payments, marketplace commission shares, and provider settlement lifecycle.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Payments</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FiCreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">₹{data.summary.total_payments_amount}</div>
          <p className="text-[10px] text-gray-400 font-semibold">{data.summary.total_payments_count} total transactions</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Customer Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">₹{data.summary.customer_revenue}</div>
          <p className="text-[10px] text-gray-400 font-semibold">Total paid customer volume</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Provider Payable</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">₹{data.summary.provider_payable}</div>
          <p className="text-[10px] text-gray-400 font-semibold">Net earned provider share</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Platform Commission</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FiLayers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 tracking-tight">₹{data.summary.platform_commission}</div>
          <p className="text-[10px] text-gray-400 font-semibold">Platform retained commission</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Settlement Pending</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">₹{data.summary.settlement_pending}</div>
          <p className="text-[10px] text-gray-400 font-semibold">Awaiting admin payout</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <FiSearch className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Customer, Provider, Payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold text-gray-800"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="md:col-span-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Settlement Status Filter */}
          <div className="md:col-span-2">
            <select
              value={settlementStatusFilter}
              onChange={(e) => setSettlementStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Settlements</option>
              <option value="pending">Pending</option>
              <option value="eligible">Eligible</option>
              <option value="paid">Paid</option>
              <option value="not_eligible">Not Eligible</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="md:col-span-2">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Services</option>
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={() => {
                setSearch('');
                setPaymentStatusFilter('all');
                setSettlementStatusFilter('all');
                setServiceFilter('all');
                setFromDate('');
                setToDate('');
              }}
              className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-colors text-center"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState title="No Payment Transactions" description="No payments matched the search or filter criteria." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5">Payment ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Provider</th>
                  <th className="px-4 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Type / Ref</th>
                  <th className="px-4 py-3.5">Provider Amt</th>
                  <th className="px-4 py-3.5">Commission</th>
                  <th className="px-4 py-3.5">Customer Paid</th>
                  <th className="px-4 py-3.5">Payment Status</th>
                  <th className="px-4 py-3.5">Settlement</th>
                  <th className="px-4 py-3.5">Payment Date</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900">#{p.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-gray-900">{p.customer?.name}</div>
                      <div className="text-[10px] text-gray-400">{p.customer?.phone || p.customer?.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-gray-800">{p.provider?.business_name}</div>
                      <div className="text-[10px] text-gray-400">{p.provider?.name}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900 capitalize">{p.service?.name}</div>
                      <div className="text-[10px] text-gray-400">Qty: {p.service?.quantity}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-gray-600">
                      {p.reference_type === 'subscription_payment' ? (
                        <span className="text-blue-600 font-bold">Sub #{p.subscription_id}</span>
                      ) : (
                        <span className="text-purple-600 font-bold">Order #{p.order_number || p.reference_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-purple-700">₹{p.pricing?.provider_amount}</td>
                    <td className="px-4 py-3.5 font-bold text-amber-700">
                      ₹{p.pricing?.commission_amount}{' '}
                      <span className="text-[10px] text-gray-400">({p.pricing?.commission_percent}%)</span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-emerald-600 text-sm">₹{p.pricing?.customer_paid}</td>
                    <td className="px-4 py-3.5">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-3.5">{getSettlementBadge(p.settlement?.status)}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-gray-500">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ml-auto"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT DETAILS MODAL */}
      {modalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                  Payment Transaction #{selectedPayment.id}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900">
                  {selectedPayment.service?.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(selectedPayment.status)}
                  {getSettlementBadge(selectedPayment.settlement?.status)}
                </div>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedPayment(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Customer and Provider Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200/70 p-4 rounded-2xl space-y-1 text-xs">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Customer Details</span>
                <div className="font-extrabold text-gray-900 text-sm">{selectedPayment.customer?.name}</div>
                <div className="text-gray-600">{selectedPayment.customer?.email}</div>
                <div className="text-gray-600">{selectedPayment.customer?.phone}</div>
              </div>

              <div className="bg-gray-50 border border-gray-200/70 p-4 rounded-2xl space-y-1 text-xs">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Provider Details</span>
                <div className="font-extrabold text-gray-900 text-sm">{selectedPayment.provider?.business_name}</div>
                <div className="text-gray-600">{selectedPayment.provider?.name}</div>
                <div className="text-gray-600">{selectedPayment.provider?.phone || selectedPayment.provider?.email}</div>
              </div>
            </div>

            {/* Service & Transaction Metadata */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-gray-400">Transaction Reference:</span>
                <span className="font-mono text-gray-800">
                  {selectedPayment.reference_type === 'subscription_payment'
                    ? `Subscription #${selectedPayment.subscription_id}`
                    : `Order #${selectedPayment.order_number || selectedPayment.reference_id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plan / Frequency:</span>
                <span className="font-bold text-gray-800 capitalize">
                  {selectedPayment.service?.plan_frequency || 'Standard'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="font-bold text-gray-800">
                  {selectedPayment.service?.quantity} {selectedPayment.service?.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Date:</span>
                <span className="font-mono text-gray-800">
                  {selectedPayment.paid_at ? new Date(selectedPayment.paid_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Financial Marketplace Breakdown */}
            <div className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-white">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Financial Breakdown
              </span>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-gray-700">
                  <span>Provider Share (Base Amount):</span>
                  <span className="font-extrabold text-purple-700">₹{selectedPayment.pricing?.provider_amount}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Admin Commission ({selectedPayment.pricing?.commission_percent}%):</span>
                  <span className="font-extrabold text-amber-700">₹{selectedPayment.pricing?.commission_amount}</span>
                </div>
                <div className="flex justify-between text-gray-900 border-t border-gray-100 pt-2 text-sm">
                  <span className="font-black">Customer Total Paid:</span>
                  <span className="font-black text-emerald-600">₹{selectedPayment.pricing?.customer_paid}</span>
                </div>
              </div>
            </div>

            {/* Settlement Status Details */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs font-semibold">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Settlement Lifecycle
              </span>
              <div className="flex justify-between">
                <span className="text-gray-400">Settlement Status:</span>
                <span className="font-extrabold text-gray-900">{selectedPayment.settlement?.status}</span>
              </div>
              {selectedPayment.settlement?.settlement_date && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Processed Date:</span>
                  <span className="font-mono text-gray-800">
                    {new Date(selectedPayment.settlement.settlement_date).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedPayment.settlement?.payout_reference && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Payout Reference:</span>
                  <span className="font-mono text-gray-800">{selectedPayment.settlement.payout_reference}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
              {selectedPayment.status === 'paid' &&
                selectedPayment.settlement?.status === 'PENDING' &&
                selectedPayment.provider?.id && (
                  <button
                    type="button"
                    onClick={handleSettleFromModal}
                    disabled={settling}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <FiCheck className="w-4 h-4" />
                    {settling ? 'Settling...' : 'Settle Provider'}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
