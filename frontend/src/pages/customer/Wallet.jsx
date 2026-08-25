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
      setError('Failed to fetch wallet information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-6 shadow-lg shadow-blue-500/10">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">Available Wallet Balance</span>
          <h2 className="text-4xl font-black">₹{Number(wallet?.balance || 0).toFixed(2)}</h2>
          <p className="text-xs text-blue-100 max-w-sm">
            Wallet credits are automatically applied at checkout as a partial payment method.
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl border border-white/20">
          <FiDollarSign className="w-12 h-12 text-blue-200" />
        </div>
      </div>

      {/* Transactions History */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>

        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Your wallet transaction history will appear here once you receive refunds, promotional credits, or bonuses."
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-full ${
                      tx.type === 'credit' || tx.type === 'refund'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'refund' ? (
                        <FiTrendingUp className="w-5 h-5" />
                      ) : (
                        <FiTrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-gray-800 capitalize">{tx.type}</span>
                      <p className="text-gray-400 mt-0.5">
                        Ref: {tx.reference_type?.replace(/_/g, ' ')} ({tx.reference_id})
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-black ${
                      tx.type === 'credit' || tx.type === 'refund'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}
                      ₹{Number(tx.amount).toFixed(2)}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
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
