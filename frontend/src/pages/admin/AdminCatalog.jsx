import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiPlus, FiTrash2, FiEdit2, FiFolder, FiGrid, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function AdminCatalog() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category Form Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Service Moderation Modal
  const [selectedService, setSelectedService] = useState(null);
  const [modStatus, setModStatus] = useState('approved');
  const [modNotes, setModNotes] = useState('');
  const [submittingMod, setSubmittingMod] = useState(false);
  const [modModalOpen, setModModalOpen] = useState(false);

  const fetchCatalogData = async () => {
    setLoading(true);
    setError(null);
    try {
      const catRes = await customerApi.getCategories();
      if (catRes?.success) {
        setCategories(catRes.data || []);
      }
      const svcRes = await adminApi.getServices();
      if (svcRes?.success) {
        setServices(svcRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch catalog configuration logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const handleOpenAddCategory = () => {
    setEditCategoryId(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditCategoryId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || '');
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmittingCategory(true);

    const payload = {
      name: catName,
      slug: catSlug || catName.toLowerCase().replace(/ /g, '-'),
      description: catDescription,
    };

    try {
      if (editCategoryId) {
        await adminApi.updateCategory(editCategoryId, payload);
        alert('Category updated successfully!');
      } else {
        await adminApi.createCategory(payload);
        alert('Category added successfully!');
      }
      setCategoryModalOpen(false);
      fetchCatalogData();
    } catch (err) {
      alert(err.message || 'Failed to save category.');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? This might fail if services are configured under this category SKU.')) return;
    try {
      await adminApi.deleteCategory(id);
      fetchCatalogData();
    } catch (err) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  const handleModerateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return;

    setSubmittingMod(true);
    try {
      const res = await adminApi.moderateService(selectedService.id, modStatus, modNotes);
      if (res?.success) {
        alert('Service moderation outcome applied successfully!');
        setModModalOpen(false);
        setModNotes('');
        setSelectedService(null);
        fetchCatalogData();
      }
    } catch (err) {
      alert(err.message || 'Failed to moderate service.');
    } finally {
      setSubmittingMod(false);
    }
  };

  if (loading && categories.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Category CRUD sidepanel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-fit">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <FiFolder className="w-5 h-5 mr-2 text-blue-500" />
            Service Categories
          </h3>
          <button
            onClick={handleOpenAddCategory}
            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No categories defined.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center text-xs font-semibold text-gray-700">
                <div>
                  <span className="font-bold text-gray-800 block mb-0.5">{cat.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">Slug: {cat.slug}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Services Moderation Panel */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-full">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <FiGrid className="w-5 h-5 mr-2 text-blue-500" />
            Moderate Services SKU List
          </h3>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[500px]">
          {services.length === 0 ? (
            <EmptyState title="No services listed" description="When providers list new services, they will appear here for review." />
          ) : (
            services.map((svc) => (
              <div key={svc.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-start">
                <div className="space-y-1.5 text-xs font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{svc.name}</span>
                    <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                      {svc.type}
                    </span>
                    <StatusBadge status={svc.moderation_status || 'pending'} />
                  </div>
                  <p className="text-gray-400 font-medium text-[10px]">
                    Provider: {svc.provider?.business_name} | Category: {svc.category?.name}
                  </p>
                  <p className="text-gray-500 leading-normal font-medium">{svc.description}</p>
                  <div className="text-sm font-black text-gray-900 pt-1">
                    ₹{Number(svc.base_price).toFixed(2)}
                    <span className="text-xs font-medium text-gray-400"> / {svc.unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedService(svc);
                    setModStatus(svc.moderation_status === 'rejected' ? 'rejected' : 'approved');
                    setModNotes(svc.moderation_notes || '');
                    setModModalOpen(true);
                  }}
                  className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold shrink-0"
                >
                  Moderate
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editCategoryId ? 'Edit Category' : 'Create Category SKU'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Household Cleaning"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">URL Slug (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. cleaning"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Description</label>
                <textarea
                  rows="3"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {modModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Moderate Service Listing</h3>
            <form onSubmit={handleModerateSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Moderation Outcome</label>
                <select
                  value={modStatus}
                  onChange={(e) => setModStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                >
                  <option value="approved">Approved (Publish to Catalog)</option>
                  <option value="rejected">Rejected (Hide from Catalog)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Review Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Approved listing. / Rejected due to pricing rules description mismatch."
                  value={modNotes}
                  onChange={(e) => setModNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setModModalOpen(false);
                    setModNotes('');
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMod}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
