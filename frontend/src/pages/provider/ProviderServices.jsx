import React, { useState, useEffect } from 'react';
import { providerApi } from '../../api/provider';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { FiPlus, FiTrash2, FiEdit2, FiGrid, FiList, FiTag } from 'react-icons/fi';

export default function ProviderServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active service selection for Plans management
  const [selectedService, setSelectedService] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Service form modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editServiceId, setEditServiceId] = useState(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('subscription');
  const [basePrice, setBasePrice] = useState('');
  const [unit, setUnit] = useState('liter');
  const [attributesJson, setAttributesJson] = useState({});
  const [submittingService, setSubmittingService] = useState(false);

  // Plan form modals
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editPlanId, setEditPlanId] = useState(null);
  const [frequency, setFrequency] = useState('daily');
  const [price, setPrice] = useState('');
  const [minQuantity, setMinQuantity] = useState(1);
  const [billingCycleDays, setBillingCycleDays] = useState(1);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const fetchServicesAndCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const catRes = await customerApi.getCategories();
      if (catRes?.success) {
        setCategories(catRes.data || []);
      }
      
      const res = await providerApi.getServices();
      if (res?.success) {
        setServices(res.data || []);
        if (res.data?.length > 0) {
          // Auto select first service to list plans
          handleSelectService(res.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load services listing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndCategories();
  }, []);

  const handleSelectService = async (svc) => {
    setSelectedService(svc);
    setLoadingPlans(true);
    try {
      const res = await providerApi.getPlans(svc.id);
      if (res?.success) {
        setPlans(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleOpenAddService = () => {
    setEditServiceId(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setType('subscription');
    setBasePrice('');
    setUnit('liter');
    setAttributesJson({});
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (svc) => {
    setEditServiceId(svc.id);
    setName(svc.name);
    setCategoryId(svc.category_id);
    setDescription(svc.description);
    setType(svc.type);
    setBasePrice(svc.base_price);
    setUnit(svc.unit);
    setAttributesJson(svc.attributes_json || {});
    setServiceModalOpen(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setSubmittingService(true);

    const payload = {
      category_id: categoryId,
      name,
      description,
      type,
      base_price: Number(basePrice),
      unit,
      attributes_json: attributesJson,
    };

    try {
      if (editServiceId) {
        await providerApi.updateService(editServiceId, payload);
        alert('Service updated successfully!');
      } else {
        await providerApi.createService(payload);
        alert('Service created successfully!');
      }
      setServiceModalOpen(false);
      fetchServicesAndCategories();
    } catch (err) {
      alert(err.message || 'Failed to save service.');
    } finally {
      setSubmittingService(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service? This will delete all linked pricing plans.')) return;
    try {
      await providerApi.deleteService(id);
      fetchServicesAndCategories();
    } catch (err) {
      alert(err.message || 'Failed to delete service.');
    }
  };

  const handleOpenAddPlan = () => {
    setEditPlanId(null);
    setFrequency('daily');
    setPrice('');
    setMinQuantity(1);
    setBillingCycleDays(1);
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditPlanId(plan.id);
    setFrequency(plan.frequency);
    setPrice(plan.price);
    setMinQuantity(plan.min_quantity);
    setBillingCycleDays(plan.billing_cycle_days);
    setPlanModalOpen(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return;

    setSubmittingPlan(true);
    const payload = {
      frequency,
      price: Number(price),
      min_quantity: Number(minQuantity),
      billing_cycle_days: Number(billingCycleDays),
    };

    try {
      if (editPlanId) {
        await providerApi.updatePlan(selectedService.id, editPlanId, payload);
        alert('Pricing plan updated successfully!');
      } else {
        await providerApi.createPlan(selectedService.id, payload);
        alert('Pricing plan created successfully!');
      }
      setPlanModalOpen(false);
      handleSelectService(selectedService);
    } catch (err) {
      alert(err.message || 'Failed to save plan.');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await providerApi.deletePlan(selectedService.id, planId);
      handleSelectService(selectedService);
    } catch (err) {
      alert(err.message || 'Failed to delete plan.');
    }
  };

  if (loading && services.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Services List Panel */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-full">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <FiGrid className="w-5 h-5 mr-2 text-blue-500" />
            My Services Catalog
          </h3>
          <button
            onClick={handleOpenAddService}
            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            Add New
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[500px]">
          {services.length === 0 ? (
            <EmptyState
              title="No services configured"
              description="Define services you offer (like Buffalo Milk or Dinner Tiffin plans) and publish them to local area codes."
            />
          ) : (
            services.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectService(item)}
                className={`p-4 border rounded-xl flex justify-between items-start cursor-pointer transition-all ${
                  selectedService?.id === item.id ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200'
                }`}
              >
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                    <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-gray-500 leading-normal line-clamp-2">{item.description}</p>
                  <div className="text-sm font-black text-gray-900 pt-1">
                    ₹{Number(item.base_price).toFixed(2)}
                    <span className="text-xs font-medium text-gray-400"> / {item.unit}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditService(item);
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteService(item.id);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pricing Plans Sidepanel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-full">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <FiList className="w-5 h-5 mr-2 text-blue-500" />
            Pricing Plans Setup
          </h3>
          {selectedService && selectedService.type !== 'one_time' && (
            <button
              onClick={handleOpenAddPlan}
              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center"
            >
              <FiPlus className="w-4 h-4 mr-1" />
              Add Plan
            </button>
          )}
        </div>

        {!selectedService ? (
          <p className="text-xs text-gray-400 text-center py-6">Select a service to configure plans.</p>
        ) : selectedService.type === 'one_time' ? (
          <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-lg p-4">
            One-time services (like cleaning) use the storefront Base Price directly. Price plans are only for recurring subscriptions (Milk/Tiffin/Water).
          </p>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Active Plans for: {selectedService.name}
            </span>
            {loadingPlans ? (
              <Skeleton count={2} />
            ) : plans.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No pricing plans configured. Add a plan to enable subscriptions.</p>
            ) : (
              plans.map((p) => (
                <div key={p.id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center text-xs font-semibold text-gray-700">
                  <div className="space-y-1">
                    <span className="capitalize font-bold text-gray-800 block">{p.frequency}</span>
                    <span className="text-sm font-black text-gray-900 block">₹{Number(p.price).toFixed(2)}</span>
                    <span className="text-[9px] text-gray-400">Cycle: {p.billing_cycle_days} Days | Min Qty: {p.min_quantity}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditPlan(p)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editServiceId ? 'Edit Service Details' : 'Configure New Service SKU'}
            </h3>
            <form onSubmit={handleServiceSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Buffalo Milk, Dinner Tiffin Veg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Description</label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Service Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  >
                    <option value="subscription">Subscription Only</option>
                    <option value="one_time">One-time Order Only</option>
                    <option value="both">Both Supported</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Billing Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. liter, plate, can"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Base Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingService}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {planModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editPlanId ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
            </h3>
            <form onSubmit={handlePlanSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Min Quantity requirement</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2">Billing Cycle (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={billingCycleDays}
                    onChange={(e) => setBillingCycleDays(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Cycle Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
