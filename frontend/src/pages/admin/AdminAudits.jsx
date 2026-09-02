import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { FiShield } from 'react-icons/fi';

export default function AdminAudits() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs();
      if (res?.success) {
        setLogs(res.data?.rows || res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform security audit trails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (loading && logs.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Security Audit Trails</h2>
          <p className="text-xs text-gray-500 mt-1">Platform moderation logs and administrative actions history.</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No audit logs recorded" description="Security audit logs will appear here once actions occur." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Logged Date</th>
                  <th className="px-6 py-3">Actor ID</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target SKU / Entity</th>
                  <th className="px-6 py-3">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-mono font-bold text-gray-400">
                      <FiShield className="w-4 h-4 mr-2 text-slate-400" />
                      {new Date(log.created_at || log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">User ID: {log.user_id}</td>
                    <td className="px-6 py-4 capitalize text-gray-800 font-bold">{log.action?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 font-mono text-gray-500 font-bold uppercase">{log.entity_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-700">#{log.entity_id}</td>
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
