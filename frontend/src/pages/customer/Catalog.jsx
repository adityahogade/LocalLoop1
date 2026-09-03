import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../api/customer';
import Skeleton from '../../components/common/Skeleton';
import { FiSearch, FiMapPin, FiStar, FiShoppingBag, FiCalendar, FiArrowRight, FiCheckCircle, FiSliders, FiX } from 'react-icons/fi';
import { useLocation } from '../../context/LocationContext';

export default function Catalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location, setLocation, detectLocation } = useLocation();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pincodeInput, setPincodeInput] = useState(location?.pincode || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempLocation, setTempLocation] = useState(null);
  const [detecting, setDetecting] = useState(false);

  // Sync parameters from landing page redirect
  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    if (cat) setSelectedCategory(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Sync pincode input with global location
  useEffect(() => {
    setPincodeInput(location?.pincode || '');
  }, [location]);

  // Fallback high-quality realistic image mapping for services
  const getServiceImage = (categorySlug, serviceName) => {
    const slug = (categorySlug || '').toLowerCase();
    const name = (serviceName || '').toLowerCase();
    if (slug.includes('milk') || name.includes('milk')) {
      return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'; // Milk bottles
    }
    if (slug.includes('tiffin') || slug.includes('mess') || name.includes('tiffin') || name.includes('mess') || name.includes('food') || name.includes('meal')) {
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; // Homemade Tiffin
    }
    if (slug.includes('water') || name.includes('water')) {
      return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80'; // Water delivery
    }
    if (slug.includes('cleaning') || name.includes('clean') || name.includes('housekeep')) {
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'; // Home deep cleaning
    }
    if (slug.includes('ac') || slug.includes('repair') || name.includes('ac') || name.includes('air conditioner') || name.includes('cooling') || name.includes('technician')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'; // AC Repair
    }
    return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80'; // Default tech service
  };

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
      const activePincode = location?.pincode || '';
      if (activePincode && activePincode.trim()) {
        params.pincode = activePincode.trim();
      }
      if (location?.lat !== undefined && location?.lat !== null && location?.lon !== undefined && location?.lon !== null) {
        params.latitude = location.lat;
        params.longitude = location.lon;
      }
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

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
  }, [selectedCategory, location]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    const pin = pincodeInput.trim();
    if (pin) {
      if (!/^\d{6,10}$/.test(pin)) {
        alert('Please enter a valid 6-10 digit pincode.');
        return;
      }
      setLocation({
        pincode: pin,
        city: 'India',
        state: '',
        area: '',
        lat: null,
        lon: null,
        formatted_address: `Pincode: ${pin}, India`
      });
    } else {
      setLocation(null);
    }
  };

  const handleGPSDetect = async () => {
    setDetecting(true);
    try {
      const detected = await detectLocation();
      setTempLocation(detected);
    } catch (e) {
      alert(e.message || "Failed to detect location.");
    } finally {
      setDetecting(false);
    }
  };

  const handleBook = (serviceId) => {
    navigate(`/customer/book/${serviceId}`);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    fetchServices();
  };

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* 1. LOCATION AND SEARCH BAR SECTION */}
      <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
        {/* Dynamic GPS confirmation inline bar */}
        {tempLocation && (
          <div className="bg-blue-50 border border-blue-150 p-4 rounded-2xl space-y-3.5 animate-fade-in">
            <span className="block text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
              📍 Confirm Detected GPS Location
            </span>
            <p className="text-xs font-black text-slate-800 leading-snug">
              {tempLocation.formatted_address || `${tempLocation.city}, ${tempLocation.state}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setLocation(tempLocation);
                  setTempLocation(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Confirm Location
              </button>
              <button
                onClick={handleGPSDetect}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => setTempLocation(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-grow max-w-4xl w-full min-w-0">
            {/* Location selector toggle */}
            <div className="w-full sm:w-auto shrink-0 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between sm:justify-start gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <FiMapPin className="text-blue-600 w-5 h-5 shrink-0" />
                <div className="text-left leading-tight min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Service Location</span>
                  <span className="text-xs font-black text-slate-700 block truncate max-w-[150px] sm:max-w-[200px]">
                    {location ? (location.formatted_address || `${location.city} · ${location.pincode}`) : 'No location configured'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setLocation(null)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest ml-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0"
              >
                Change
              </button>
            </div>

            {/* Manual input / fallback form if no location is configured */}
            {!location && !tempLocation && (
              <form onSubmit={handleLocationSubmit} className="w-full sm:flex-grow flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  placeholder="Enter pincode or address"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs font-semibold border border-slate-250 rounded-xl focus:outline-none focus:border-blue-600 bg-white min-w-0"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleGPSDetect}
                  className="p-2 border border-slate-250 hover:bg-slate-50 text-blue-600 rounded-xl shrink-0"
                  title="Detect GPS"
                >
                  <FiNavigation className={detecting ? 'animate-spin' : ''} />
                </button>
              </form>
            )}

            {/* Keyword search bar */}
            <form onSubmit={handleSearchSubmit} className="w-full sm:flex-grow flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 min-w-0">
              <FiSearch className="text-slate-400 w-5 h-5 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search services or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold focus:outline-none placeholder-slate-400 text-slate-800 min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); }}
                  className="text-slate-400 hover:text-slate-650 ml-1 shrink-0"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* 2. CATALOG LAYOUT: SIDEBAR FILTERS AND LISTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Category Filter Panel Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <FiSliders className="text-blue-600 w-4 h-4" /> Categories
            </h3>
            {(selectedCategory || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-[9px] text-red-500 font-bold uppercase hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all duration-200 shrink-0 border border-transparent ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white hover:bg-slate-50 text-slate-650'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all duration-200 shrink-0 border border-transparent ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white hover:bg-slate-50 text-slate-650'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Listings Section */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Available Listings</h3>
            {location?.pincode && (
              <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-150 px-2.5 py-1 rounded-full font-bold">
                📍 Pincode: {location.pincode}
              </span>
            )}
          </div>

          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold">⚠️ {error}</div>}

          {loading ? (
            <Skeleton type="card" count={6} />
          ) : services.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-sm mx-auto shadow-sm space-y-4">
              <span className="text-4xl block">🔍</span>
              <h4 className="text-sm font-bold text-slate-800">No services available in this area</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Try another location, clear your search keyword, or explore another service category.
              </p>
              <button
                onClick={() => { setLocation(null); }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
              >
                Change Location
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((item) => {
                const hasSub = item.type === 'subscription' || item.type === 'both';
                const distanceKm = item.distance;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                  >
                    {/* Visual header */}
                    <div className="h-44 bg-slate-100 overflow-hidden relative border-b border-slate-100 shrink-0">
                      <img
                        src={item.image_url ? item.image_url : getServiceImage(item.category?.slug, item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {hasSub && (
                        <span className="absolute top-3 left-3 bg-green-600 border border-green-500 text-white text-[9px] px-2.5 py-1 rounded shadow-sm font-black uppercase tracking-widest">
                          🔄 Subscription Available
                        </span>
                      )}
                      <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] px-2.5 py-1 rounded-full border border-white/10 font-bold uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>

                    {/* Content Panel */}
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span
                            onClick={() => navigate(`/providers/${item.provider_id}`)}
                            className="text-[10px] text-slate-500 font-bold hover:text-blue-600 hover:underline cursor-pointer"
                          >
                            {item.provider?.business_name}
                          </span>
                          {Number(item.provider?.average_rating) > 0 && (
                            <div className="flex items-center text-yellow-500 text-[10px] font-bold bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
                              <FiStar className="fill-current w-3.5 h-3.5 mr-0.5" />
                              {Number(item.provider.average_rating).toFixed(1)}
                            </div>
                          )}
                        </div>

                        <h4
                          onClick={() => handleBook(item.id)}
                          className="text-sm font-extrabold text-slate-800 leading-snug hover:text-blue-600 cursor-pointer mb-2 line-clamp-1"
                        >
                          {item.name}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description || 'No description available for this service.'}
                        </p>

                        <div className="mt-3 flex items-center text-[10px] text-slate-550 font-semibold bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg w-fit">
                          <FiMapPin className="text-blue-600 w-3.5 h-3.5 mr-1 shrink-0" />
                          <span>
                            {distanceKm !== undefined && distanceKm !== null ? (
                              <span className="font-bold text-blue-600">{Number(distanceKm).toFixed(1)} km away</span>
                            ) : (
                              <span>Available within location</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Pricing row */}
                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Price</span>
                          <div className="text-sm font-black text-slate-800">
                            ₹{Number(item.base_price).toFixed(2)}
                            <span className="text-[10px] font-bold text-slate-450"> / {item.unit}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBook(item.id)}
                          className="inline-flex items-center px-4 py-2.5 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-all uppercase tracking-wider active:scale-[0.97]"
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
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
