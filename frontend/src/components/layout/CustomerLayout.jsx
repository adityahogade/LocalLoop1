import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from '../common/NotificationBell';
import { FiLogOut, FiMenu, FiX, FiUser, FiMap, FiHeart, FiMapPin, FiNavigation } from 'react-icons/fi';

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { location, setLocation, detectLocation, loading: geoLoading, error: geoError, setError: setGeoError } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [manualError, setManualError] = useState('');
  const [tempLocation, setTempLocation] = useState(null);

  // Sync pincode input with current location pincode
  useEffect(() => {
    if (location?.pincode) {
      setPincodeInput(location.pincode);
    }
  }, [location]);

  const handleManualPincodeSubmit = async (e) => {
    e.preventDefault();
    setManualError('');
    const code = pincodeInput.trim();
    if (!/^\d{6,10}$/.test(code)) {
      setManualError('Please enter a valid 6-10 digit pincode.');
      return;
    }

    try {
      setGeoError(null);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${code}&country=India&format=json`, {
        headers: { 'User-Agent': 'LocalLoop-ServiceHub' }
      });
      let details = { pincode: code, city: 'India', state: '', area: '', lat: null, lon: null, formatted_address: `Pincode: ${code}, India` };
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const match = data[0];
          const parts = match.display_name.split(', ');
          details = {
            pincode: code,
            city: parts[0] || 'Detected',
            state: parts[parts.length - 3] || '',
            area: parts[1] || '',
            lat: parseFloat(match.lat),
            lon: parseFloat(match.lon),
            formatted_address: match.display_name
          };
        }
      }
      setLocation(details);
      setLocationModalOpen(false);
    } catch (err) {
      setLocation({ pincode: code, city: 'India', state: '', area: '', lat: null, lon: null, formatted_address: `Pincode: ${code}, India` });
      setLocationModalOpen(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setManualError('');
    setTempLocation(null);
    try {
      const detected = await detectLocation();
      setTempLocation(detected);
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/catalog', label: t('browse_services', { ns: 'customer' }) },
    { to: '/customer/subscriptions', label: t('my_subscriptions', { ns: 'customer' }) },
    { to: '/customer/bookings', label: t('my_bookings', { ns: 'customer' }) },
    { to: '/customer/wallet', label: t('wallet_balance', { ns: 'customer' }) },
    { to: '/customer/invoices', label: t('invoices', { ns: 'customer' }) },
    { to: '/customer/support', label: t('support_tickets', { ns: 'customer' }) },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Header Navbar */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo / Brand */}
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <FiMap className="w-5 h-5" />
                </div>
                <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Local<span className="text-blue-600">Loop</span>
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:ml-8 md:flex md:space-x-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'text-blue-600 bg-blue-50/60'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right Nav Utilities */}
            <div className="flex items-center space-x-1 sm:space-x-2.5 min-w-0">
              {/* Location Selector Badge */}
              <div 
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center text-xs text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-150 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl hover:border-slate-350 cursor-pointer select-none transition-all duration-200 shrink min-w-0"
              >
                <span className="text-blue-600 mr-1 sm:mr-1.5 shrink-0 text-xs">📍</span>
                <div className="max-w-[70px] xs:max-w-[100px] sm:max-w-[160px] md:max-w-[200px] min-w-0">
                  <span className="text-[7px] sm:text-[9px] text-slate-400 block font-black uppercase tracking-wider leading-none mb-0.5 truncate">Service Area</span>
                  <span className="font-extrabold text-slate-800 leading-none truncate block text-[10px] sm:text-xs">
                    {location ? `${location.city || location.area || 'Detected'} · ${location.pincode}` : 'Location'}
                  </span>
                </div>
                <span className="text-[9px] text-blue-600 font-black uppercase tracking-wider ml-1 sm:ml-2 hover:underline hidden sm:inline shrink-0">Change</span>
              </div>

              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              
              <NotificationBell />

              {/* Profile Link & Logout */}
              {user ? (
                <div className="flex items-center space-x-1.5 sm:space-x-3 border-l border-slate-150 pl-1.5 sm:pl-3 shrink-0">
                  <Link
                    to="/customer/profile"
                    className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-all duration-200"
                  >
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 font-bold text-xs text-slate-600 uppercase">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-bold hidden lg:inline max-w-[120px] truncate">
                      {user.full_name}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200 focus:outline-none"
                    title={t('logout', { ns: 'common' })}
                  >
                    <FiLogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                  <Link
                    to="/login"
                    className="text-xs font-bold text-slate-600 hover:text-blue-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors"
                  >
                    {t('login', { ns: 'common' })}
                  </Link>
                  <Link
                    to="/register"
                    className="hidden xs:inline-flex text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all active:scale-[0.98]"
                  >
                    {t('signup', { ns: 'common' })}
                  </Link>
                </div>
              )}

              {/* Mobile Burger Menu Button */}
              <div className="flex items-center md:hidden shrink-0">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 focus:outline-none transition-colors"
                >
                  {mobileMenuOpen ? <FiX className="w-5.5 h-5.5" /> : <FiMenu className="w-5.5 h-5.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-100 bg-white px-3 pt-2 pb-4 space-y-1 shadow-inner">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="border-t border-slate-100 pt-3 px-3 flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Language:</span>
              <LanguageSwitcher />
            </div>
            {user ? (
              <div className="border-t border-slate-100 pt-3 px-3 flex justify-between items-center">
                <Link
                  to="/customer/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-700"
                >
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-600 uppercase border border-slate-200">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  {user.full_name}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg"
                >
                  <FiLogOut className="w-3.5 h-3.5 mr-1" />
                  {t('logout', { ns: 'common' })}
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-100 pt-3 px-3 flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  {t('login', { ns: 'common' })}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {t('signup', { ns: 'common' })}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 sm:py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800 tracking-tight">
                Local<span className="text-blue-600">Loop</span>
              </span>
              <span className="text-slate-300">|</span>
              <p>&copy; {new Date().getFullYear()} LocalLoop. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              Made with <FiHeart className="fill-red-500 text-red-500 w-3 h-3 mx-0.5 inline" /> for better neighborhoods
            </div>
          </div>
        </div>
      </footer>

      {/* Location Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4 sm:space-y-5 text-left transform scale-100 transition-all">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiMapPin className="text-blue-600 w-4 h-4" />
                Choose service location
              </h3>
              <button onClick={() => setLocationModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
                <FiX className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              {tempLocation ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl space-y-2.5">
                    <span className="block text-[9px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
                      <span className="animate-ping w-1.5 h-1.5 rounded-full bg-blue-500 inline-block mr-1"></span>
                      📍 Confirm your service location
                    </span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                      {tempLocation.formatted_address || `${tempLocation.city}, ${tempLocation.state}`}
                    </p>
                    <div className="text-[10px] text-slate-500 font-bold block">
                      Accuracy: {tempLocation.accuracy} meters
                    </div>
                    <div className="text-[9px] text-slate-400 font-semibold block">
                      Coordinates: {Number(tempLocation.lat).toFixed(5)}, {Number(tempLocation.lon).toFixed(5)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLocation(tempLocation);
                        setTempLocation(null);
                        setLocationModalOpen(false);
                      }}
                      className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/10 text-center"
                    >
                      Confirm Location
                    </button>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors text-center"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempLocation(null)}
                      className="py-3 px-4 border border-slate-205 rounded-xl hover:bg-slate-50 text-slate-650 text-xs font-bold uppercase tracking-wider transition-colors text-center"
                    >
                      Change Manually
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Current Location Detect Button */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={geoLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-xl font-bold text-xs uppercase tracking-wider border border-blue-100 transition-all duration-200 disabled:opacity-50"
                  >
                    <FiNavigation className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`} />
                    {geoLoading ? 'Detecting Location...' : 'Use Current Location'}
                  </button>

                  {geoError && (
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3.5 rounded-xl text-[11px] leading-normal font-semibold">
                      ⚠️ {geoError}
                    </div>
                  )}

                  <div className="relative flex py-2 items-center">
                    <div className="relative flex py-2 items-center w-full">
                      <div className="flex-grow border-t border-slate-150"></div>
                      <span className="flex-shrink mx-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">or</span>
                      <div className="flex-grow border-t border-slate-150"></div>
                    </div>
                  </div>

                  {/* Manual Pincode Input */}
                  <form onSubmit={handleManualPincodeSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                        Enter Pincode
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="e.g. 411001"
                          value={pincodeInput}
                          onChange={(e) => setPincodeInput(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-805"
                        />
                      </div>
                    </div>

                    {manualError && (
                      <p className="text-[10px] font-bold text-red-600">{manualError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-colors"
                    >
                      Confirm Pincode
                    </button>
                  </form>
                </>
              )}

              {/* Display Current Selection */}
              {location && (
                <div className="mt-2 bg-slate-50 border border-slate-150 p-4 rounded-xl text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Current Service Location
                  </span>
                  <div className="text-xs font-semibold text-slate-700 leading-normal">
                    {location.city && <span>{location.city}, {location.state}</span>}
                    {location.area && <span className="block text-[10px] text-slate-400">{location.area}</span>}
                    <span className="block font-black text-blue-600 mt-1">📍 {location.pincode}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
