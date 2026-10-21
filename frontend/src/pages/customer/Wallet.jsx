import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWalletDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const walletRes = await customerApi.getWallet();
      if (walletRes?.success) {
        setWallet(walletRes.data);
      }
      const txRes = await customerApi.getWalletTransactions();
      if (txRes?.success) {
        setTransactions(txRes.data?.rows || txRes.data || []);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'CUSTOMER_NOT_FOUND') {
        setError('Customer profile not found in database. Please register a new customer account using the Sign Up page.');
      } else {
        setError('Failed to fetch wallet information.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold shadow-sm">⚠️ {error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* Wallet Balance Hero Card */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 rounded-3xl p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl overflow-hidden border border-blue-500/30 text-left">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_40%)]" />
        
        <div className="space-y-3 relative z-10">
          <span className="text-[10px] bg-white/10 text-blue-100 font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
            Active Digital Wallet
          </span>
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-200 block uppercase tracking-wider">Available Wallet Balance</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">₹{Number(wallet?.balance || 0).toFixed(2)}</h2>
          </div>
          <p className="text-[10px] text-blue-100/80 max-w-sm leading-normal font-medium">
            Wallet credits are automatically applied at checkout as a partial payment method for non-subscription bookings.
          </p>
        </div>
        
        <div className="bg-white/10 p-5 rounded-2xl border border-white/10 relative z-10 shadow-inner shrink-0 sm:self-center">
          <FiDollarSign className="w-12 h-12 text-blue-200" />
        </div>
      </div>

      {/* Transactions History */}
      <section className="space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-slate-805 uppercase tracking-wider">Transaction Ledger</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-semibold">Audit log of wallet credits, refunds, and coupon bonuses applied to bookings.</p>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title="No Transactions Logged"
            description="Your wallet transaction history will appear here once you receive refunds, promotional credits, or bonuses."
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-4.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2.5 rounded-xl border ${
                      tx.type === 'credit' || tx.type === 'refund'
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'refund' ? (
                        <FiTrendingUp className="w-4 h-4" />
                      ) : (
                        <FiTrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-xs">
                      <span className={`font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full ${
                        tx.type === 'credit' || tx.type === 'refund' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-805'
                      }`}>{tx.type}</span>
                      <p className="text-slate-405 mt-2 font-semibold">
                        Ref: {tx.reference_type?.replace(/_/g, ' ')} ({tx.reference_id})
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-black ${
                      tx.type === 'credit' || tx.type === 'refund'
                        ? 'text-green-650'
                        : 'text-red-650'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'} ₹{Number(tx.amount).toFixed(2)}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">
                      {new Date(tx.created_at || tx.used_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
