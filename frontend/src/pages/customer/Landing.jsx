import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../api/customer';
import { useLocation } from '../../context/LocationContext';
import { FiSearch, FiMapPin, FiNavigation, FiArrowRight, FiCheckCircle, FiStar, FiCalendar, FiShield, FiHeart } from 'react-icons/fi';

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { location, setLocation, detectLocation } = useLocation();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pincodeInput, setPincodeInput] = useState(location?.pincode || '');
  const [detecting, setDetecting] = useState(false);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Sync pincode input with global location
  useEffect(() => {
    setPincodeInput(location?.pincode || '');
  }, [location]);

  // Load categories
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

  // Load popular services near you
  useEffect(() => {
    const loadFeatured = async () => {
      setLoadingFeatured(true);
      try {
        const params = { page: 1, limit: 6 };
        if (location?.pincode) params.pincode = location.pincode;
        if (location?.lat) {
          params.latitude = location.lat;
          params.longitude = location.lon;
        }
        const res = await customerApi.getServices(params);
        if (res?.success) {
          setFeaturedServices(res.data?.items || []);
        }
      } catch (err) {
        console.error('Failed to load featured services:', err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    loadFeatured();
  }, [location]);

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
        lon: null
      });
    } else {
      setLocation(null);
    }
  };

  const handleGPSDetect = async () => {
    setDetecting(true);
    try {
      const detected = await detectLocation();
      setLocation(detected);
    } catch (e) {
      alert(e.message || "Failed to detect location.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/catalog?category=${category.id}`);
  };

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

  const coreCategoriesList = [
    { key: 'milk', label: 'Milk Delivery', icon: '🥛', desc: 'Fresh daily milk delivered straight to your doorstep', bg: 'bg-sky-50/50 hover:bg-sky-50 border-sky-100 hover:border-sky-300 text-sky-800' },
    { key: 'mess', label: 'Mess / Tiffin', icon: '🍱', desc: 'Healthy home-style tiffin plans for daily meals', bg: 'bg-amber-50/50 hover:bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-800' },
    { key: 'water', label: 'Water Delivery', icon: '💧', desc: 'Purified mineral 20L water cans on recurring schedule', bg: 'bg-blue-50/50 hover:bg-blue-50 border-blue-100 hover:border-blue-300 text-blue-800' },
    { key: 'cleaning', label: 'Home Cleaning', icon: '🧹', desc: 'Deep cleaning, sanitization & regular housekeeping', bg: 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-300 text-emerald-800' },
    { key: 'ac', label: 'AC Repairing', icon: '❄️', desc: 'Expert air conditioner servicing, gas fills & repairs', bg: 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-800' },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-12 w-full max-w-full min-w-0">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl py-8 sm:py-12 md:py-20 px-4 sm:px-6 md:px-12 shadow-2xl overflow-hidden text-left w-full max-w-full min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 w-full min-w-0">
          <div className="lg:col-span-7 space-y-5 md:space-y-8 w-full min-w-0">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
              ⚡ Direct Marketplace · No Commissions
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight break-words">
              Find Trusted <span className="text-blue-500">Local Services</span> & Daily Deliveries
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-slate-400 font-semibold leading-relaxed max-w-xl">
              Get dairy, home tiffin, drinking water jars, deep housekeeping, and skilled appliance technicians from verified neighborhood providers.
            </p>

            {/* Direct search & location inputs bar */}
            <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-2xl md:rounded-full shadow-lg flex flex-col md:flex-row gap-2 max-w-2xl text-slate-800 w-full min-w-0">
              <div className="flex items-center px-3 border-b md:border-b-0 md:border-r border-slate-100 py-2 md:py-1 min-w-0 flex-1">
                <FiSearch className="text-slate-400 w-5 h-5 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="What service are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold focus:outline-none placeholder-slate-400 text-slate-800 min-w-0 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-b md:border-b-0 border-slate-100 py-2 md:py-1 min-w-0">
                <FiMapPin className="text-slate-400 w-5 h-5 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  className="w-full md:w-28 text-xs sm:text-sm font-semibold focus:outline-none placeholder-slate-400 text-slate-800 min-w-0 bg-transparent"
                />
                <button
                  type="button"
                  onClick={handleGPSDetect}
                  disabled={detecting}
                  className="text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                  title="Detect GPS Location"
                >
                  <FiNavigation className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl md:rounded-full transition-all active:scale-[0.98] shrink-0 w-full md:w-auto"
              >
                Search
              </button>
            </form>

            {/* Popular search tags */}
            <div className="text-[10px] text-slate-400 font-bold flex flex-wrap items-center gap-2">
              <span className="uppercase tracking-wider">Popular searches:</span>
              {['Milk', 'Tiffin', 'Water Cans', 'House Cleaning', 'AC Service'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    navigate(`/catalog?search=${encodeURIComponent(term)}`);
                  }}
                  className="bg-slate-800/40 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700/50 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-3xl filter blur-xl transform translate-x-4 translate-y-4" />
              <img
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80"
                alt="Local service professionals"
                className="rounded-3xl object-cover h-[400px] w-full border border-slate-800 shadow-2xl grayscale-[20%] hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOCATION STATUS HEADER BANNER */}
      {location && (
        <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
              <FiMapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Your Selected Location</span>
              <p className="text-xs font-black text-slate-800 mt-0.5 truncate">
                {location.formatted_address || `${location.city || 'India'} · ${location.pincode}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/catalog')}
            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 active:translate-x-0.5 transition-transform shrink-0"
          >
            Change Location <FiArrowRight />
          </button>
        </section>
      )}

      {/* 3. CORE SERVICE SECTION ("What do you need today?") */}
      <section className="space-y-6 text-left w-full min-w-0">
        <div className="flex justify-between items-end border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">What do you need today?</h2>
            <p className="text-xs text-slate-400 font-semibold">Explore our core service lines supporting one-time jobs and recurring subscription deliveries.</p>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider hidden sm:block shrink-0"
          >
            Explore Catalog &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 w-full min-w-0">
          {coreCategoriesList.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                const matched = categories.find(c => 
                  c.slug?.toLowerCase().includes(cat.key) || 
                  c.name?.toLowerCase().includes(cat.key)
                );
                if (matched) {
                  navigate(`/catalog?category=${matched.id}`);
                } else {
                  navigate('/catalog');
                }
              }}
              className={`flex flex-col p-5 sm:p-6 border rounded-2xl shadow-sm text-left transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer w-full min-w-0 ${cat.bg}`}
            >
              <span className="text-3xl block mb-4">{cat.icon}</span>
              <h4 className="text-sm font-black uppercase tracking-wider mb-2">{cat.label}</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-auto">{cat.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. TRUSTED PROVIDERS NEAR YOU (POPULAR SERVICES) */}
      <section className="space-y-6 text-left w-full min-w-0">
        <div className="flex justify-between items-end border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Popular Listings Near You</h2>
            <p className="text-xs text-slate-400 font-semibold">Direct orders and subscriber listings matching your radius criteria.</p>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider shrink-0"
          >
            See All Listings &rarr;
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
          </div>
        ) : featuredServices.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center text-xs text-slate-500 font-semibold w-full">
            No active listings found in this region. Try changing your pincode area or mapping boundaries.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
            {featuredServices.map((svc) => {
              const hasSub = svc.type === 'subscription' || svc.type === 'both';
              const distanceKm = svc.distance_km;
              return (
                <div
                  key={svc.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col text-left group w-full min-w-0"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
                    <img
                      src={getServiceImage(svc.category?.slug, svc.name)}
                      alt={svc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {hasSub && (
                      <span className="absolute top-3 left-3 bg-green-600 border border-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
                        🔄 Subscription Available
                      </span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex-grow flex flex-col space-y-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">
                        {svc.category?.name || 'Category'}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                        {svc.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold">
                        by {svc.provider?.business_name || 'Verified Provider'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
                      <span className="flex items-center text-amber-500 gap-0.5">
                        <FiStar className="fill-amber-500" />
                        {Number(svc.provider?.average_rating || 5.0).toFixed(1)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-blue-600">
                        📍 {distanceKm ? `${Number(distanceKm).toFixed(1)} km` : 'Available within location'}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between items-center mt-auto">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Starting From</span>
                        <span className="text-sm font-black text-slate-900">₹{svc.base_price} <span className="text-[10px] font-bold text-slate-400">/{svc.unit || 'unit'}</span></span>
                      </div>
                      <button
                        onClick={() => navigate(`/customer/book/${svc.id}`)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer shrink-0"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-xl text-left space-y-6 sm:space-y-8 relative overflow-hidden w-full min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
        
        <div className="space-y-2 relative z-10 max-w-xl">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">How LocalLoop Works</h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Our marketplace connects you directly with neighborhood service providers. No hidden fees or automated dispatcher markup.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10 w-full min-w-0">
          {[
            { step: '01', title: 'Choose a Service', desc: 'Browse curated categories like dairy delivery, tiffins, water cans, or deep home cleaning.' },
            { step: '02', title: 'Compare Providers', desc: 'Inspect provider ratings, coverage distance radius limits, and real customer reviews.' },
            { step: '03', title: 'Book or Subscribe', desc: 'Setup one-time cleaning slots or schedule daily deliveries with our modular billing cycles.' },
            { step: '04', title: 'Direct Delivery', desc: 'Get services delivered straight to your door by your selected service technician.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-850/50 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 sm:space-y-4 w-full min-w-0">
              <span className="text-2xl font-black text-blue-500 font-mono block">{item.step}</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">{item.title}</h4>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. DEV MOCK CONTROLS NOTICE */}
      <section className="bg-amber-50/50 border border-amber-200 rounded-3xl p-4 sm:p-6 text-left flex items-start gap-3 w-full min-w-0">
        <FiShield className="text-amber-600 w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1.5 text-xs font-semibold text-amber-900 leading-relaxed">
          <span className="block font-black uppercase tracking-wider text-amber-800">🔒 Secure Dev Environment Notice</span>
          <p>
            LocalLoop does not collect real payment credentials, card pins, OTPs, or CVVs. All subscription order billing transactions are executed under mock gateway modes.
          </p>
        </div>
      </section>
    </div>
  );
}
