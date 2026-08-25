import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providerApi } from '../../api/provider';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import { FiStar, FiShoppingBag, FiCalendar, FiMapPin, FiMessageSquare } from 'react-icons/fi';

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
        // Use public service endpoint to fetch all details or catalog providers
        const providersRes = await customerApi.getProviders();
        if (providersRes?.success) {
          const matched = providersRes.data?.find(p => String(p.id) === String(id));
          if (matched) {
            setProvider(matched);
          } else {
            // Try fetching via admin/provider specific details endpoint if authenticated
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

        // Fetch reviews
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
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  if (!provider) return <div className="text-center py-10">Provider profile not found</div>;

  return (
    <div className="space-y-8">
      {/* Provider Hero Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
        <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 shrink-0 shadow-inner">
          {provider.logo_url ? (
            <img src={provider.logo_url} alt={provider.business_name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-4xl text-gray-300">🏢</span>
          )}
        </div>
        
        <div className="space-y-3 flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl font-black text-gray-900">{provider.business_name}</h2>
            <div>
              <StatusBadge status={provider.kyc_status === 'approved' ? 'approved' : 'pending'} />
            </div>
          </div>

          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
            {provider.business_description || 'No business description provided.'}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-gray-600 pt-1">
            {Number(provider.average_rating) > 0 && (
              <div className="flex items-center text-yellow-500 bg-yellow-50 px-2.5 py-1 rounded-md border border-yellow-100">
                <FiStar className="fill-current w-4 h-4 mr-1" />
                Rating {Number(provider.average_rating).toFixed(1)} / 5.0
              </div>
            )}
            <div className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              <FiMessageSquare className="w-4 h-4 mr-1 text-blue-500" />
              {reviews.length} Reviews
            </div>
          </div>
        </div>
      </div>

      {/* Services List Grid */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Services Offered</h3>
        {provider.services?.length === 0 ? (
          <p className="text-sm text-gray-500">No active services offered by this provider.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {provider.services?.map((svc) => (
              <div
                key={svc.id}
                className="bg-white border border-gray-200 rounded-xl p-5 flex justify-between items-start hover:shadow-md transition-shadow"
              >
                <div className="space-y-2 max-w-[70%]">
                  <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {svc.type}
                  </span>
                  <h4 className="text-base font-extrabold text-gray-900 leading-snug">{svc.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{svc.description}</p>
                  <div className="text-base font-black text-gray-900 pt-1">
                    ₹{Number(svc.base_price).toFixed(2)}
                    <span className="text-xs font-medium text-gray-400"> / {svc.unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBook(svc.id)}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors uppercase tracking-wider shrink-0"
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

      {/* Customer Reviews Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Customer Feedback</h3>
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-white border border-gray-200 rounded-xl text-sm text-gray-400">
            No reviews yet for this provider.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-bold text-gray-800">Verified Customer</h5>
                    <p className="text-[10px] text-gray-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 text-xs font-bold">
                    <FiStar className="fill-current w-3.5 h-3.5 mr-1" />
                    {rev.rating} / 5
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed italic">
                  "{rev.comment || 'No comment left.'}"
                </p>

                {/* Provider Reply */}
                {rev.provider_reply && (
                  <div className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded-r-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700">Provider Response</span>
                      <span className="text-[10px] text-gray-400">
                        {rev.provider_replied_at ? new Date(rev.provider_replied_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-normal">
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
