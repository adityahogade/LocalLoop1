import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providerApi } from '../../api/provider';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import { FiStar, FiShoppingBag, FiCalendar, FiMapPin, FiMessageSquare, FiAward } from 'react-icons/fi';

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const providersRes = await customerApi.getProviders();
        if (providersRes?.success) {
          const matched = providersRes.data?.find(p => String(p.id) === String(id));
          if (matched) {
            setProvider(matched);
          } else {
            const singleSvcRes = await customerApi.getServices({ provider_id: id });
            if (singleSvcRes?.success && singleSvcRes.data?.items?.length > 0) {
              setProvider({
                ...singleSvcRes.data.items[0].provider,
                services: singleSvcRes.data.items,
              });
            } else {
              throw new Error('Provider profile not found');
            }
          }
        }

        const reviewsRes = await customerApi.getReviewsByProvider(id);
        if (reviewsRes?.success) {
          setReviews(reviewsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Failed to load provider profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndReviews();
  }, [id]);

  const handleBook = (serviceId) => {
    navigate(`/customer/book/${serviceId}`);
  };

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold shadow-sm">⚠️ {error}</div>;
  if (!provider) return <div className="text-center py-12 text-xs text-slate-500 font-semibold">Provider profile not found</div>;

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* 1. PROVIDER DETAILS PROFILE CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 shrink-0 shadow-inner">
          {provider.logo_url ? (
            <img src={provider.logo_url} alt={provider.business_name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="text-4xl">🏢</span>
          )}
        </div>
        
        <div className="space-y-4 flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">{provider.business_name}</h2>
            <div className="w-fit mx-auto md:mx-0">
              <StatusBadge status={provider.kyc_status === 'approved' ? 'approved' : 'pending'} />
            </div>
          </div>

          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-2xl">
            {provider.business_description || 'No business description provided.'}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[10px] font-black uppercase tracking-wider text-slate-600 pt-1">
            {Number(provider.average_rating) > 0 && (
              <div className="flex items-center text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-xl border border-yellow-100">
                <FiStar className="fill-current w-3.5 h-3.5 mr-1" />
                Rating {Number(provider.average_rating).toFixed(1)} / 5.0
              </div>
            )}
            <div className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
              <FiMessageSquare className="w-3.5 h-3.5 mr-1 text-blue-500" />
              {reviews.length} Reviews
            </div>
            {provider.service_radius_km && (
              <div className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                <FiAward className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Radius: {Number(provider.service_radius_km).toFixed(0)} KM
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SERVICES LIST GRID */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2">Services Offered</h3>
        {provider.services?.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 font-semibold">No active services offered by this provider.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {provider.services?.map((svc) => (
              <div
                key={svc.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-start hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-2 max-w-[70%] text-left">
                  <span className="bg-slate-900 text-white text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                    {svc.type}
                  </span>
                  <h4 className="text-sm font-black text-slate-800 leading-snug">{svc.name}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">{svc.description}</p>
                  <div className="text-base font-black text-slate-900 pt-1">
                    ₹{Number(svc.base_price).toFixed(2)}
                    <span className="text-[10px] font-bold text-slate-400"> / {svc.unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBook(svc.id)}
                  className="inline-flex items-center px-4 py-2.5 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-all uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  {svc.type === 'subscription' ? (
                    <>
                      <FiCalendar className="w-3.5 h-3.5 mr-1" />
                      Subscribe
                    </>
                  ) : (
                    <>
                      <FiShoppingBag className="w-3.5 h-3.5 mr-1" />
                      Book Now
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. REVIEWS FEEDBACK SECTION */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2">Customer Feedback</h3>
        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold">
            No reviews yet for this provider.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Verified Customer</h5>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 text-[10px] font-black">
                    <FiStar className="fill-current w-3.5 h-3.5 mr-1" />
                    {rev.rating} / 5
                  </div>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed italic font-medium">
                  "{rev.comment || 'No comment left.'}"
                </p>

                {rev.provider_reply && (
                  <div className="bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Provider Response</span>
                      <span className="text-[9px] text-slate-400 font-semibold">
                        {rev.provider_replied_at ? new Date(rev.provider_replied_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-normal font-semibold">
                      {rev.provider_reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
