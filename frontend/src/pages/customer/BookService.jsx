import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerApi } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import { FiShoppingBag, FiCalendar, FiMapPin, FiCreditCard, FiTag, FiAlertTriangle, FiSliders, FiClock, FiGrid } from 'react-icons/fi';

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
  const [mockPaymentMode, setMockPaymentMode] = useState('success');
  const [hasExistingSubscription, setHasExistingSubscription] = useState(false);

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
            if (svcRes.data.plans) {
              setPlans(svcRes.data.plans);
              if (svcRes.data.plans.length > 0) {
                setSelectedPlanId(svcRes.data.plans[0].id);
                setQuantity(Math.max(1, Number(svcRes.data.plans[0].min_quantity || 1)));
              }
            }

            // Check if there is an active subscription for this service
            const activeSubsRes = await customerApi.getSubscriptions();
            if (activeSubsRes?.success && activeSubsRes.data) {
              const overlap = activeSubsRes.data.some(sub => 
                String(sub.service_id || sub.service?.id) === String(serviceId) &&
                ['active', 'paused', 'vacation'].includes(sub.status)
              );
              setHasExistingSubscription(overlap);
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
        console.error(err);
        setError('Failed to fetch checkout details.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [serviceId]);

  // Load slots when date changes for cleaning
  useEffect(() => {
    const fetchSlots = async () => {
      if (service?.category?.slug === 'cleaning' && startDate) {
        try {
          const res = await customerApi.getAvailabilitySlots({
            provider_id: service.provider_id,
            date: startDate,
          });
          if (res?.success) {
            setAvailableSlots(res.data || []);
            if (res.data?.length > 0) {
              setSelectedTimeSlot(res.data[0].start_time);
            } else {
              setSelectedTimeSlot('');
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchSlots();
  }, [service, startDate]);

  // Handle plan change updates minimum quantity constraints
  useEffect(() => {
    const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId));
    if (selectedPlan) {
      setQuantity(prev => Math.max(prev, Number(selectedPlan.min_quantity || 1)));
    }
  }, [selectedPlanId, plans]);

  const handleValidateCoupon = async () => {
    setCouponError(null);
    setAppliedCoupon(null);
    setCouponDiscount(0);

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    try {
      const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId));
      const price = selectedPlan ? Number(selectedPlan.price) : Number(service.base_price);
      const subtotal = price * quantity;

      const res = await customerApi.validateCoupon({
        code: couponCode.trim(),
        service_id: serviceId,
        amount: subtotal,
      });

      if (res?.success && res.data) {
        setAppliedCoupon(res.data);
        setCouponDiscount(Number(res.data.discount_amount || 0));
      } else {
        setCouponError('Invalid or expired coupon.');
      }
    } catch (err) {
      setCouponError(err.message || 'Failed to validate coupon.');
    }
  };

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isSubscription = service.type === 'subscription';
      const referenceType = isSubscription ? 'subscription_payment' : 'order';
      const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId));
      const basePrice = selectedPlan ? Number(selectedPlan.price) : Number(service.base_price || 0);
      const providerAmount = basePrice * quantity;
      const commissionPercent = Number(selectedPlan?.commission_percent || service?.commission_percent || 10);
      const serviceFee = Math.round(providerAmount * commissionPercent) / 100;
      const totalAmount = Math.max(0, Number((providerAmount + serviceFee - couponDiscount).toFixed(2)));

      // 1. If mock payment is active and fails/cancels, initialize and verify payment first, then exit without creating subscription/order
      if (import.meta.env.VITE_PAYMENT_PROVIDER === 'mock' && (mockPaymentMode === 'fail' || mockPaymentMode === 'cancel')) {
        const idempotencyKey = `PAY-${Date.now()}-mock-checkout`;
        const payRes = await customerApi.initiatePayment({
          reference_type: referenceType,
          reference_id: 1, // positive dummy reference placeholder
          idempotency_key: idempotencyKey,
          payment_method: 'razorpay',
          amount: totalAmount,
        });

        if (!payRes?.success || !payRes.data) {
          throw new Error('Failed to initialize payment transaction.');
        }

        // Verify the payment as failed/cancelled
        await customerApi.verifyPayment({
          razorpay_order_id: payRes.data.razorpay_order_id,
          mock_status: mockPaymentMode === 'fail' ? 'failed' : 'cancelled',
        });
        return;
      }

      // 2. Otherwise (Razorpay or successful mock payment):
      let createdEntityId = null;

      if (isSubscription) {
        const cycleDays = Number(selectedPlan?.billing_cycle_days || 30);
        const nextBillingDateObj = new Date(`${startDate}T00:00:00`);
        nextBillingDateObj.setDate(nextBillingDateObj.getDate() + cycleDays);
        const nextBillingDate = nextBillingDateObj.toISOString().slice(0, 10);

        const subPayload = {
          provider_id: service.provider_id,
          service_id: service.id,
          service_plan_id: selectedPlanId,
          address_id: selectedAddressId,
          quantity,
          delivery_time_slot: timeSlot,
          custom_time: timeSlot === 'custom' ? customTime : null,
          start_date: startDate,
          next_billing_date: nextBillingDate,
        };
        const subRes = await customerApi.createSubscription(subPayload);
        if (subRes?.success && subRes.data) {
          const subPaymentId = subRes.data.payments?.[0]?.id;
          createdEntityId = subPaymentId || subRes.data.id;
        }
      } else {
        const orderPayload = {
          provider_id: service.provider_id,
          address_id: selectedAddressId,
          items: [{ service_id: service.id, quantity }],
          scheduled_date: startDate,
          scheduled_time: selectedTimeSlot || '10:00:00',
          type: service.category?.slug === 'cleaning' ? 'cleaning' : 'water',
          notes: cleaningDetails.instructions,
          cleaning_details: service.category?.slug === 'cleaning' ? cleaningDetails : null,
        };
        const orderRes = await customerApi.createOrder(orderPayload);
        if (orderRes?.success && orderRes.data) {
          createdEntityId = orderRes.data.id;
        }
      }

      if (!createdEntityId) {
        throw new Error('Failed to record checkout entity.');
      }

      // 3. Initiate Payment
      const idempotencyKey = `PAY-${Date.now()}-${createdEntityId}`;
      const paymentMethod = useWallet ? 'wallet' : 'razorpay';

      const payPayload = {
        reference_type: referenceType,
        reference_id: createdEntityId,
        idempotency_key: idempotencyKey,
        payment_method: paymentMethod,
        use_wallet: useWallet,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
      };

      const payRes = await customerApi.initiatePayment(payPayload);
      if (!payRes?.success || !payRes.data) {
        throw new Error('Failed to initialize payment transaction.');
      }

      if (payRes.data.gateway === 'wallet' || payRes.data.status === 'paid') {
        navigate(service.type === 'subscription' ? '/customer/subscriptions' : '/customer/bookings');
        return;
      }

      // Execute payment under MOCK or Razorpay provider flows
      if (import.meta.env.VITE_PAYMENT_PROVIDER === 'mock') {
        try {
          const verifyRes = await customerApi.verifyPayment({
            razorpay_order_id: payRes.data.razorpay_order_id,
            mock_status: 'paid',
            ...(isSubscription ? { subscription_payment_id: createdEntityId } : { order_id: createdEntityId })
          });
          if (verifyRes?.success) {
            navigate(service.type === 'subscription' ? '/customer/subscriptions' : '/customer/bookings');
          }
        } catch (err) {
          setError(err.message || 'Payment processing failed.');
        }
      } else {
        // Razorpay Checkout
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: payRes.data.amount,
          currency: payRes.data.currency || 'INR',
          name: 'LocalLoop Marketplace',
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
  if (!service) return <div className="text-center py-12 text-slate-500 font-semibold">Service details not found.</div>;

  if (hasExistingSubscription) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100">
          <FiAlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">
            Active Subscription Exists
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            You already have an active subscription for this service.<br />
            You cannot create another active subscription for the same service.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link
            to="/customer/subscriptions"
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all text-center uppercase tracking-widest active:scale-[0.98]"
          >
            View My Subscription
          </Link>
          <Link
            to="/catalog"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all text-center uppercase tracking-widest active:scale-[0.98]"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId));
  const basePrice = selectedPlan ? Number(selectedPlan.price) : Number(service?.base_price || 0);
  const providerAmount = basePrice * quantity;
  const commissionPercent = Number(selectedPlan?.commission_percent || service?.commission_percent || 10);
  const serviceFee = Math.round(providerAmount * commissionPercent) / 100;
  const totalAmount = Math.max(0, Number((providerAmount + serviceFee - couponDiscount).toFixed(2)));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="text-left space-y-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Secure Service Checkout</h2>
        <p className="text-xs text-slate-400 font-semibold">Confirm delivery address, schedule timing, and apply discounts to complete booking.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-150 text-red-700 px-4 py-3.5 rounded-xl text-xs font-bold shadow-sm text-left">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Settings */}
        <form onSubmit={handleCheckout} className="lg:col-span-8 space-y-6">
          {/* Address selection */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
            <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest">
              <FiMapPin className="w-4 h-4 mr-2 text-blue-600 animate-bounce" />
              Delivery Address
            </h3>
            {addresses.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-semibold">
                No addresses found. Add an address in your{' '}
                <Link to="/customer/profile" className="text-blue-600 font-bold hover:underline">
                  Profile
                </Link>{' '}
                first.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                      selectedAddressId === addr.id
                        ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs space-y-1">
                      <span className="font-black text-slate-800 uppercase tracking-widest text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {addr.label}
                      </span>
                      <p className="text-slate-500 font-semibold mt-1">
                        {addr.house_no}, {addr.building}, {addr.street}, {addr.area}, {addr.city}, {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Plan & Schedule Settings */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-left">
            <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest">
              <FiCalendar className="w-4 h-4 mr-2 text-blue-600" />
              Schedule Details
            </h3>

            {service.type === 'subscription' && plans.length > 0 && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Subscription Duration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map((p) => (
                    <label
                      key={p.id}
                      className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                        selectedPlanId === p.id
                          ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider capitalize">{p.frequency} Plan</span>
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlanId === p.id}
                          onChange={() => setSelectedPlanId(p.id)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-lg font-black text-slate-900 mt-2">₹{p.price}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1">Min Qty: {p.min_quantity} unit(s)</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min={selectedPlan ? Number(selectedPlan.min_quantity) : 1}
                  value={quantity}
                  onChange={(e) => {
                    const minVal = selectedPlan ? Number(selectedPlan.min_quantity) : 1;
                    setQuantity(Math.max(minVal, parseInt(e.target.value) || minVal));
                  }}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-650 text-xs font-semibold text-slate-850"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-650 text-xs font-semibold text-slate-855"
                />
              </div>
            </div>

            {service.type === 'subscription' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Delivery Time Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-650 text-xs font-semibold text-slate-850 bg-white"
                  >
                    <option value="morning">Morning (6:00 AM - 9:00 AM)</option>
                    <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
                    <option value="custom">Custom Time</option>
                  </select>
                </div>

                {timeSlot === 'custom' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Custom Time
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-650 text-xs font-semibold text-slate-855"
                    />
                  </div>
                )}
              </div>
            ) : (
              service.category?.slug === 'cleaning' && (
                <div className="space-y-6 border-t border-slate-100 pt-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Available Booking Timeslots
                    </label>
                    {availableSlots.length === 0 ? (
                      <div className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl font-bold">
                        ⚠️ No availability slots found for this date. Please select another date.
                      </div>
                    ) : (
                      <select
                        value={selectedTimeSlot}
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-650 text-xs font-semibold text-slate-800 bg-white"
                      >
                        {availableSlots.map((slot) => (
                          <option key={slot.id} value={slot.start_time}>
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FiGrid className="text-blue-600" /> Property Configuration Details
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rooms</label>
                        <input
                          type="number"
                          min="1"
                          value={cleaningDetails.rooms}
                          onChange={(e) => setCleaningDetails({ ...cleaningDetails, rooms: parseInt(e.target.value) || 1 })}
                          className="w-full mt-1 border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bathrooms</label>
                        <input
                          type="number"
                          min="1"
                          value={cleaningDetails.bathrooms}
                          onChange={(e) => setCleaningDetails({ ...cleaningDetails, bathrooms: parseInt(e.target.value) || 1 })}
                          className="w-full mt-1 border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kitchens</label>
                        <input
                          type="number"
                          min="1"
                          value={cleaningDetails.kitchens}
                          onChange={(e) => setCleaningDetails({ ...cleaningDetails, kitchens: parseInt(e.target.value) || 1 })}
                          className="w-full mt-1 border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Floor</label>
                        <input
                          type="number"
                          min="1"
                          value={cleaningDetails.floor}
                          onChange={(e) => setCleaningDetails({ ...cleaningDetails, floor: parseInt(e.target.value) || 1 })}
                          className="w-full mt-1 border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Special Instructions</label>
                    <textarea
                      value={cleaningDetails.instructions}
                      onChange={(e) => setCleaningDetails({ ...cleaningDetails, instructions: e.target.value })}
                      placeholder="Special instructions for cleaning staff..."
                      rows="2"
                      className="w-full mt-1 border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 placeholder-slate-400"
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </form>

        {/* Pricing Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-left">
            <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest border-b border-slate-100 pb-3">
              <FiShoppingBag className="w-4 h-4 mr-2 text-blue-600" />
              Order Summary
            </h3>
            
            <div className="text-xs space-y-3.5 border-b border-slate-100 pb-4">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-bold max-w-[150px]">{service.name}</span>
                <span className="text-slate-800 font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-150">Qty {quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Provider Price</span>
                <span className="text-slate-805 font-black">₹{providerAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Service Fee ({commissionPercent}%)</span>
                <span className="text-slate-805 font-black">₹{serviceFee.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold bg-green-50 px-2.5 py-1.5 rounded-xl border border-green-100">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-slate-805">
              <span className="text-[10px] font-black uppercase tracking-wider">You Pay</span>
              <span className="text-xl font-black text-blue-600">₹{totalAmount.toFixed(2)}</span>
            </div>

            {/* Coupon Application Panel */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                Promo Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="COUPON50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-blue-500 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider active:scale-[0.98] cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-[9px] text-red-500 font-bold">⚠️ {couponError}</p>}
              {appliedCoupon && (
                <p className="text-[9px] text-green-600 font-black flex items-center bg-green-50 px-2.5 py-1 rounded-xl border border-green-150">
                  <FiTag className="w-3.5 h-3.5 mr-1" />
                  Code Applied: {appliedCoupon.code}
                </p>
              )}
            </div>

            {/* Wallet Integration Toggle */}
            {service.type !== 'subscription' && wallet && Number(wallet.balance) > 0 && (
              <label className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 cursor-pointer pt-2 select-none hover:bg-slate-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={() => setUseWallet(!useWallet)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="text-[10px]">
                  <span className="font-black text-slate-800 uppercase tracking-wider block">Apply Wallet Balance</span>
                  <p className="text-slate-500 font-semibold mt-0.5">Balance: ₹{Number(wallet.balance).toFixed(2)}</p>
                </div>
              </label>
            )}

            {/* Mock Payment Selector */}
            {import.meta.env.VITE_PAYMENT_PROVIDER === 'mock' && !useWallet && (
              <div className="bg-amber-50/50 border border-amber-205 rounded-2xl p-4 text-left space-y-3.5 mt-2">
                <span className="block text-[10px] text-amber-800 font-black uppercase tracking-wider">
                  🛠️ Mock Payment Gate (Dev-Only)
                </span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="mockPaymentMode"
                      value="success"
                      checked={mockPaymentMode === 'success'}
                      onChange={() => setMockPaymentMode('success')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Successful Payment</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="mockPaymentMode"
                      value="fail"
                      checked={mockPaymentMode === 'fail'}
                      onChange={() => setMockPaymentMode('fail')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Failed Payment</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="mockPaymentMode"
                      value="cancel"
                      checked={mockPaymentMode === 'cancel'}
                      onChange={() => setMockPaymentMode('cancel')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Cancel Payment</span>
                  </label>
                </div>
              </div>
            )}

            {/* Pay and Submit */}
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50 uppercase tracking-widest active:scale-[0.98] cursor-pointer"
            >
              <FiCreditCard className="w-4 h-4 mr-2" />
              {submitting ? 'Processing Payment...' : 'Authorize Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
