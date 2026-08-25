import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import { FiShoppingBag, FiCalendar, FiMapPin, FiCreditCard, FiTag } from 'react-icons/fi';

export default function BookService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeSlot, setTimeSlot] = useState('morning');
  const [customTime, setCustomTime] = useState('08:00');
  
  // Cleaning bookings property intake details
  const [cleaningDetails, setCleaningDetails] = useState({
    rooms: 1,
    bathrooms: 1,
    kitchens: 1,
    floor: 1,
    instructions: '',
  });

  // Slots availability for Cleaning bookings
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Wallet
  const [wallet, setWallet] = useState(null);
  const [useWallet, setUseWallet] = useState(false);

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load basic service details, user addresses, wallet balance
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const svcRes = await customerApi.getServiceDetails(serviceId);
        if (svcRes?.success && svcRes.data) {
          setService(svcRes.data);
          
          if (svcRes.data.type === 'subscription' || svcRes.data.type === 'both') {
            // Load subscription plans
            // Note: service.plans might already be loaded or we list plans
            if (svcRes.data.plans) {
              setPlans(svcRes.data.plans);
              if (svcRes.data.plans.length > 0) {
                setSelectedPlanId(svcRes.data.plans[0].id);
              }
            }
          }
        }

        const addrRes = await customerApi.getAddresses();
        if (addrRes?.success) {
          setAddresses(addrRes.data || []);
          const defaultAddr = addrRes.data?.find(a => a.is_default);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else if (addrRes.data?.length > 0) {
            setSelectedAddressId(addrRes.data[0].id);
          }
        }

        const walletRes = await customerApi.getWallet();
        if (walletRes?.success) {
          setWallet(walletRes.data);
        }
      } catch (err) {
        console.error('Failed to initialize checkout page:', err);
        setError('Failed to initialize checkout page. Please log in first.');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [serviceId]);

  // Load provider availability slots for Cleaning
  useEffect(() => {
    const fetchSlots = async () => {
      if (service && service.category?.slug === 'cleaning' && selectedAddressId) {
        try {
          const res = await customerApi.getProviderAvailability(service.provider_id, startDate);
          if (res?.success) {
            setAvailableSlots(res.data || []);
            if (res.data && res.data.length > 0) {
              setSelectedTimeSlot(res.data[0].start_time);
            } else {
              setSelectedTimeSlot('');
            }
          }
        } catch (err) {
          console.error('Failed to load slots:', err);
        }
      }
    };
    fetchSlots();
  }, [service, selectedAddressId, startDate]);

  const handleValidateCoupon = async () => {
    setCouponError(null);
    setCouponDiscount(0);
    setAppliedCoupon(null);
    try {
      const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId));
      const price = selectedPlan ? Number(selectedPlan.price) : Number(service.base_price);
      const grossAmount = price * quantity;

      const res = await customerApi.validateCoupon({
        code: couponCode,
        amount: grossAmount,
        category_id: service.category_id,
        order_id: null,
      });

      if (res?.success && res.data) {
        setAppliedCoupon(res.data);
        setCouponDiscount(Number(res.data.discount_applied || 0));
      }
    } catch (err) {
      console.error(err);
      setCouponError(err.message || 'Invalid coupon code or requirements not met.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }

    if (service && service.type !== 'subscription' && service.category?.slug === 'cleaning' && !selectedTimeSlot) {
      setError('Please select an available timeslot for your cleaning service.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let createdEntityId = null;
      let referenceType = '';

      if (service.type === 'subscription') {
        // 1. Create Subscription
        const subPayload = {
          provider_id: service.provider_id,
          service_id: service.id,
          service_plan_id: selectedPlanId,
          address_id: selectedAddressId,
          quantity,
          delivery_time_slot: timeSlot,
          custom_time: timeSlot === 'custom' ? customTime : null,
          start_date: startDate,
        };
        const subRes = await customerApi.createSubscription(subPayload);
        if (subRes?.success && subRes.data) {
          createdEntityId = subRes.data.id;
          referenceType = 'subscription_payment';
        }
      } else {
        // 2. Create One-Time Order
        const orderPayload = {
          provider_id: service.provider_id,
          address_id: selectedAddressId,
          items: [{ service_id: service.id, quantity }],
          scheduled_date: startDate,
          scheduled_time: selectedTimeSlot || '10:00:00', // slot time
          type: service.category?.slug === 'cleaning' ? 'cleaning' : 'water',
          notes: cleaningDetails.instructions,
          cleaning_details: service.category?.slug === 'cleaning' ? cleaningDetails : null,
        };
        const orderRes = await customerApi.createOrder(orderPayload);
        if (orderRes?.success && orderRes.data) {
          createdEntityId = orderRes.data.id;
          referenceType = 'order';
        }
      }

      if (!createdEntityId) {
        throw new Error('Failed to record subscription/order details on server.');
      }

      // 3. Process Payment Order
      const idempotencyKey = `PAY-${Date.now()}-${createdEntityId}`;
      const paymentMethod = useWallet ? 'wallet' : 'razorpay';

      const payRes = await customerApi.createPaymentOrder({
        reference_type: referenceType,
        reference_id: createdEntityId,
        idempotency_key: idempotencyKey,
        payment_method: paymentMethod,
      });

      if (payRes?.success) {
        if (paymentMethod === 'wallet') {
          // Complete payment covered fully by wallet balance
          navigate(service.type === 'subscription' ? '/customer/subscriptions' : '/customer/bookings');
          return;
        }

        // Open Razorpay Checkout for remainder
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: payRes.data.amount,
          currency: payRes.data.currency || 'INR',
          name: 'ServiceHub Platform',
          description: `Checkout payment for ${service.name}`,
          order_id: payRes.data.razorpay_order_id,
          handler: async function (response) {
            try {
              const verifyRes = await customerApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (verifyRes?.success) {
                navigate(service.type === 'subscription' ? '/customer/subscriptions' : '/customer/bookings');
              }
            } catch (err) {
              console.error('Signature verification failed:', err);
              setError('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: user?.full_name,
            email: user?.email,
            contact: user?.phone,
          },
          theme: {
            color: '#2563eb',
          },
        };

        // Load script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton type="card" count={3} />;
  if (!service) return <div className="text-center py-10">Service not found.</div>;

  const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId));
  const price = selectedPlan ? Number(selectedPlan.price) : Number(service.base_price);
  const totalAmount = price * quantity - couponDiscount;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-black text-gray-900 border-b border-gray-100 pb-4">
        Checkout Booking Details
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Settings */}
        <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-6">
          {/* Address selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-gray-800 flex items-center">
              <FiMapPin className="w-5 h-5 mr-2 text-blue-500" />
              Select Address
            </h3>
            {addresses.length === 0 ? (
              <div className="text-sm text-gray-500">
                No addresses found. Add an address in your{' '}
                <Link to="/customer/profile" className="text-blue-600 hover:underline">
                  Profile
                </Link>{' '}
                first.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-blue-600 bg-blue-50/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-800 uppercase tracking-wider">{addr.label}</span>
                      <p className="text-gray-500 mt-1">
                        {addr.house_no}, {addr.building}, {addr.street}, {addr.area}, {addr.city}, {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Plan & Schedule Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-gray-800 flex items-center">
              <FiCalendar className="w-5 h-5 mr-2 text-blue-500" />
              Configure Service Schedule
            </h3>

            {service.type === 'subscription' && plans.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Subscription Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map((p) => (
                    <label
                      key={p.id}
                      className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPlanId === p.id
                          ? 'border-blue-600 bg-blue-50/20'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800 capitalize">{p.frequency}</span>
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlanId === p.id}
                          onChange={() => setSelectedPlanId(p.id)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-lg font-black text-gray-900 mt-2">₹{p.price}</span>
                      <span className="text-[10px] text-gray-400 mt-1">Min Qty: {p.min_quantity}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {service.type === 'subscription' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Delivery Time Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="morning">Morning (6:00 AM - 9:00 AM)</option>
                    <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
                    <option value="custom">Custom Time</option>
                  </select>
                </div>

                {timeSlot === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Custom Time
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              service.category?.slug === 'cleaning' && (
                <div className="space-y-4">
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Available Booking Timeslots
                    </label>
                    {availableSlots.length === 0 ? (
                      <div className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg font-semibold">
                        ⚠️ No availability slots found for this date. Please select another date.
                      </div>
                    ) : (
                      <select
                        value={selectedTimeSlot}
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-gray-800 bg-white"
                      >
                        {availableSlots.map((slot) => (
                          <option key={slot.id} value={slot.start_time}>
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-t border-gray-100 pt-4">
                    Property Configuration Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rooms</label>
                      <input
                        type="number"
                        min="1"
                        value={cleaningDetails.rooms}
                        onChange={(e) => setCleaningDetails({ ...cleaningDetails, rooms: parseInt(e.target.value) || 1 })}
                        className="w-full mt-1 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bathrooms</label>
                      <input
                        type="number"
                        min="1"
                        value={cleaningDetails.bathrooms}
                        onChange={(e) => setCleaningDetails({ ...cleaningDetails, bathrooms: parseInt(e.target.value) || 1 })}
                        className="w-full mt-1 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kitchens</label>
                      <input
                        type="number"
                        min="1"
                        value={cleaningDetails.kitchens}
                        onChange={(e) => setCleaningDetails({ ...cleaningDetails, kitchens: parseInt(e.target.value) || 1 })}
                        className="w-full mt-1 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Floor</label>
                      <input
                        type="number"
                        min="1"
                        value={cleaningDetails.floor}
                        onChange={(e) => setCleaningDetails({ ...cleaningDetails, floor: parseInt(e.target.value) || 1 })}
                        className="w-full mt-1 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Instructions</label>
                    <textarea
                      value={cleaningDetails.instructions}
                      onChange={(e) => setCleaningDetails({ ...cleaningDetails, instructions: e.target.value })}
                      placeholder="Special instructions for cleaning staff..."
                      rows="2"
                      className="w-full mt-1 border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </form>

        {/* Pricing Summary Card */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-gray-800 flex items-center">
              <FiShoppingBag className="w-5 h-5 mr-2 text-blue-500" />
              Order Summary
            </h3>
            
            <div className="text-xs space-y-2 border-b border-gray-100 pb-4">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">{service.name}</span>
                <span className="text-gray-800 font-bold">Qty {quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Base Price</span>
                <span className="text-gray-800 font-bold">₹{price.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-gray-900">
              <span className="text-sm font-bold">Total Bill</span>
              <span className="text-2xl font-black">₹{totalAmount.toFixed(2)}</span>
            </div>

            {/* Coupon Application Panel */}
            <div className="space-y-2 pt-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Discount Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="COUPON50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-slate-800"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-[10px] text-red-500 font-medium">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-[10px] text-green-600 font-bold flex items-center">
                  <FiTag className="w-3.5 h-3.5 mr-1" />
                  Coupon Applied successfully!
                </p>
              )}
            </div>

            {/* Wallet Integration Toggle */}
            {wallet && Number(wallet.balance) > 0 && (
              <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={() => setUseWallet(!useWallet)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-800">Use Wallet Balance</span>
                  <p className="text-gray-500 mt-0.5">Available: ₹{Number(wallet.balance).toFixed(2)}</p>
                </div>
              </label>
            )}

            {/* Pay and Submit */}
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-50"
            >
              <FiCreditCard className="w-5 h-5 mr-2" />
              {submitting ? 'Processing Payment...' : 'Authorize Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
