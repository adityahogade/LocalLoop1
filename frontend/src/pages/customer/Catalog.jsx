import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import { FiSearch, FiMapPin, FiStar, FiShoppingBag, FiCalendar } from 'react-icons/fi';

export default function Catalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pincode, setPincode] = useState(localStorage.getItem('searchPincode') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await customerApi.getCategories();
        if (res?.success) {
          setCategories(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: 1,
        limit: 50,
      };
      if (selectedCategory) params.category_id = selectedCategory;
      if (pincode) {
        params.pincode = pincode;
        localStorage.setItem('searchPincode', pincode);
      } else {
        localStorage.removeItem('searchPincode');
      }
      if (searchQuery) params.search = searchQuery;

      const res = await customerApi.getServices(params);
      if (res?.success) {
        setServices(res.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Unable to load services at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  const handleBook = (serviceId) => {
    navigate(`/customer/book/${serviceId}`);
  };

  return (
    <div className="space-y-8">
      {/* Search & Pincode Hero Panel */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl py-12 px-6 sm:px-12 text-white shadow-lg shadow-blue-500/10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Daily Essentials Delivered to Your Doorstep
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Subscribe to daily Milk, Tiffin, Water, and Cleaning plans from verified local providers in your neighborhood.
          </p>

          <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-xl shadow-xl flex flex-col md:flex-row gap-2 text-gray-700">
            <div className="flex items-center flex-grow px-3 py-2 border-b md:border-b-0 md:border-r border-gray-100">
              <FiSearch className="text-gray-400 w-5 h-5 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder', { ns: 'customer' })}
                className="w-full text-sm font-medium focus:outline-none placeholder-gray-400"
              />
            </div>
            
            <div className="flex items-center w-full md:w-56 px-3 py-2 shrink-0">
              <FiMapPin className="text-blue-500 w-5 h-5 shrink-0 mr-2" />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder={t('pincode_placeholder', { ns: 'customer' })}
                className="w-full text-sm font-medium focus:outline-none placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-colors text-sm"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Browse by Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all border ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-500 hover:text-blue-500'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all border ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-500 hover:text-blue-500'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Services List Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Available Services</h3>
          {pincode && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded font-medium">
              Serving: Pincode {pincode}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <Skeleton type="card" count={6} />
        ) : services.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-8 max-w-md mx-auto">
            <span className="text-4xl">🔍</span>
            <h4 className="text-md font-bold text-gray-800 mt-4 mb-2">No services found</h4>
            <p className="text-sm text-gray-500 leading-normal mb-0">
              Try adjusting your search criteria, clearing your pincode, or browsing a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Image Placeholder */}
                <div className="h-44 bg-gray-100 flex items-center justify-center border-b border-gray-100 relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-300">📦</span>
                  )}
                  
                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200 uppercase tracking-wider">
                    {item.category?.name}
                  </span>

                  {/* Type Badge */}
                  <span className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {item.type}
                  </span>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div>
                    {/* Provider Info */}
                    <div className="flex justify-between items-center mb-1">
                      <span
                        onClick={() => navigate(`/providers/${item.provider_id}`)}
                        className="text-xs text-gray-500 font-bold hover:text-blue-600 cursor-pointer"
                      >
                        {item.provider?.business_name}
                      </span>
                      {Number(item.provider?.average_rating) > 0 && (
                        <div className="flex items-center text-yellow-500 text-xs font-semibold">
                          <FiStar className="fill-current w-3.5 h-3.5 mr-0.5" />
                          {Number(item.provider.average_rating).toFixed(1)}
                        </div>
                      )}
                    </div>

                    <h4
                      onClick={() => navigate(`/providers/${item.provider_id}`)}
                      className="text-base font-extrabold text-gray-800 leading-snug hover:text-blue-600 cursor-pointer mb-2"
                    >
                      {item.name}
                    </h4>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description || 'No description available for this service.'}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-400">Price</span>
                      <div className="text-lg font-black text-gray-900">
                        ₹{Number(item.base_price).toFixed(2)}
                        <span className="text-xs font-medium text-gray-400"> / {item.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBook(item.id)}
                      className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors uppercase tracking-wider"
                    >
                      {item.type === 'subscription' ? (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
