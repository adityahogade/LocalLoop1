import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { FiCpu, FiEdit2 } from 'react-icons/fi';

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit settings form
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSettings();
      if (res?.success) {
        setSettings(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system variables settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedSetting) return;

    setSubmitting(true);
    try {
      const res = await adminApi.updateSetting(selectedSetting.key, value);
      if (res?.success) {
        alert('System variable updated successfully!');
        setModalOpen(false);
        setValue('');
        setSelectedSetting(null);
        fetchSettings();
      }
    } catch (err) {
      alert(err.message || 'Failed to update system setting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && settings.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Platform Settings</h2>
          <p className="text-xs text-gray-500 mt-1">Configure global variables, billing buffers, and Razorpay API secrets.</p>
        </div>
      </div>

      {settings.length === 0 ? (
        <EmptyState title="No system settings logged" description="Platform default parameters will appear here." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Configuration Parameter</th>
                  <th className="px-6 py-3">Active Value</th>
                  <th className="px-6 py-3">System Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs">
                {settings.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-mono font-bold text-gray-800">
                      <FiCpu className="w-4 h-4 mr-2 text-slate-400" />
                      {item.key}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 max-w-xs truncate">{item.value}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs leading-normal">{item.description}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSetting(item);
                          setValue(item.value);
                          setModalOpen(true);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Edit setting"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Setting Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Modify Platform Variable</h3>
            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-semibold">
              <div>
                <span className="block text-gray-400 mb-1">Setting Key:</span>
                <span className="font-mono text-gray-800 font-bold block">{selectedSetting?.key}</span>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Parameter Value</label>
                <input
                  type="text"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedSetting(null);
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
                  Save Setting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
