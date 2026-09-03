import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { FiSliders, FiPlus, FiTrash2, FiEdit2, FiTag } from 'react-icons/fi';

export default function AdminCommissions() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Commission Rule Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editRuleId, setEditRuleId] = useState(null);
  const [scope, setScope] = useState('global');
  const [targetId, setTargetId] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [priority, setPriority] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const fetchCommissionsAndTargets = async () => {
    setLoading(true);
    setError(null);
    try {
      const rulesRes = await adminApi.getCommissionRules();
      if (rulesRes?.success) {
        setRules(rulesRes.data || []);
      }

      const catRes = await customerApi.getCategories();
      if (catRes?.success) {
        setCategories(catRes.data || []);
      }

      const provRes = await adminApi.getProviders();
      if (provRes?.success) {
        setProviders(provRes.data || []);
      }

      const svcRes = await adminApi.getServices();
      if (svcRes?.success) {
        setServices(svcRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch commission rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionsAndTargets();
  }, []);

  const handleOpenAdd = () => {
    setEditRuleId(null);
    setScope('global');
    setTargetId('');
    setCommissionRate('');
    setPriority(1);
    setModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditRuleId(rule.id);
    setScope(rule.scope);
    setTargetId(rule.target_id || '');
    setCommissionRate(rule.commission_rate);
    setPriority(rule.priority);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commissionRate || Number(commissionRate) < 0 || Number(commissionRate) > 100) {
      alert('Please enter a valid commission rate percentage (0 - 100).');
      return;
    }

    setSubmitting(true);
    const payload = {
      scope,
      target_id: scope === 'global' ? null : Number(targetId) || null,
      commission_rate: Number(commissionRate),
      priority: Number(priority),
    };

    try {
      if (editRuleId) {
        await adminApi.updateCommissionRule(editRuleId, payload);
        alert('Commission rule updated successfully!');
      } else {
        await adminApi.createCommissionRule(payload);
        alert('Commission rule created successfully!');
      }
      setModalOpen(false);
      fetchCommissionsAndTargets();
    } catch (err) {
      alert(err.message || 'Failed to save commission rule.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && rules.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Platform Commission Rules</h2>
          <p className="text-xs text-gray-500 mt-1">Define platform commission percentage fees. Specific rules take priority over global settings.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-1" />
          Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <EmptyState title="No commission rules configured" description="A global rule (scope = global) should be configured first to set the default platform fee." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Scope Rule</th>
                  <th className="px-6 py-3">Target Details</th>
                  <th className="px-6 py-3">Fee Rate</th>
                  <th className="px-6 py-3">Rule Priority</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-bold text-gray-800 capitalize">
                      <FiSliders className="w-4 h-4 mr-2 text-slate-400" />
                      {rule.scope}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500">
                      {rule.scope === 'global' && 'All Platform Sales'}
                      {rule.scope === 'category' && `Category ID: ${rule.target_id}`}
                      {rule.scope === 'provider' && `Provider ID: ${rule.target_id}`}
                      {rule.scope === 'service' && `Service ID: ${rule.target_id}`}
                    </td>
                    <td className="px-6 py-4 text-blue-600 font-black text-sm">{rule.commission_rate}%</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">Priority {rule.priority}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(rule)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Edit"
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

      {/* Commission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editRuleId ? 'Edit Commission Rule' : 'Create Commission Rule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Scope Scope</label>
                <select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    setTargetId('');
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                >
                  <option value="global">Global (System default)</option>
                  <option value="category">Category-specific</option>
                  <option value="provider">Provider-specific</option>
                  <option value="service">Service SKU-specific</option>
                </select>
              </div>

              {scope !== 'global' && (
                <div>
                  <label className="block text-gray-500 mb-2">Select Target</label>
                  <select
                    value={targetId}
                    required
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                  >
                    <option value="">-- Choose Target Option --</option>
                    {scope === 'category' && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {scope === 'provider' && providers.map(p => <option key={p.id} value={p.id}>{p.business_name} (ID: {p.id})</option>)}
                    {scope === 'service' && services.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Rule Priority (Higher is applied first)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
