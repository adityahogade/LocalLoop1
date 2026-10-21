import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import Skeleton from '../../components/common/Skeleton';
import { FiUser, FiMapPin, FiPlus, FiTrash2, FiEdit2, FiCheck, FiNavigation, FiX, FiCheckCircle } from 'react-icons/fi';

export default function CustomerProfile() {
  const { user, refreshUser } = useAuth();
  const { changeLanguage } = useLanguage();
  const { detectLocation, loading: geoLoading } = useLocation();

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Address Form Modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);
  const [label, setLabel] = useState('Home');
  const [houseNo, setHouseNo] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [geoAccuracy, setGeoAccuracy] = useState(null);
  const [geoSuccessMessage, setGeoSuccessMessage] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Profile Edit fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLang, setPreferredLang] = useState('en');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const fetchProfileAndAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await customerApi.getMyProfile();
      if (profileRes?.success && profileRes.data) {
        setProfile(profileRes.data);
        setFullName(profileRes.data.full_name || '');
        setPhone(profileRes.data.phone || '');
        setPreferredLang(profileRes.data.preferred_language || 'en');
      }

      const addrRes = await customerApi.getAddresses();
      if (addrRes?.success) {
        setAddresses(addrRes.data || []);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'CUSTOMER_NOT_FOUND') {
        setError('Customer profile not found in database. Please register a new customer account using the Sign Up page.');
      } else {
        setError('Failed to load profile details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndAddresses();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await customerApi.updateMyProfile({
        full_name: fullName,
        phone,
        preferred_language: preferredLang,
      });

      if (res?.success) {
        alert('Profile updated successfully!');
        await changeLanguage(preferredLang);
        await refreshUser();
        fetchProfileAndAddresses();
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleOpenAddAddress = () => {
    setEditAddressId(null);
    setLabel('Home');
    setHouseNo('');
    setBuilding('');
    setStreet('');
    setArea('');
    setCity('');
    setState('Maharashtra');
    setPincode('');
    setLatitude(null);
    setLongitude(null);
    setGeoError(null);
    setGeoAccuracy(null);
    setGeoSuccessMessage('');
    setIsDefault(false);
    setAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditAddressId(addr.id);
    setLabel(addr.label);
    setHouseNo(addr.house_no);
    setBuilding(addr.building);
    setStreet(addr.street);
    setArea(addr.area);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setLatitude(addr.latitude);
    setLongitude(addr.longitude);
    setGeoError(null);
    setGeoAccuracy(null);
    setGeoSuccessMessage('');
    setIsDefault(addr.is_default);
    setAddressModalOpen(true);
  };

  const handleUseCurrentLocation = async () => {
    setGeoError(null);
    setGeoSuccessMessage('');
    setGeoAccuracy(null);
    try {
      const detected = await detectLocation();
      if (detected) {
        setLatitude(detected.lat);
        setLongitude(detected.lon);
        setGeoAccuracy(detected.accuracy);
        
        setArea(detected.area || detected.city || '');
        setCity(detected.city || '');
        setState(detected.state || 'Maharashtra');
        setPincode(detected.pincode || '');
        setStreet(detected.formatted_address.split(',')[0] || '');
        setGeoSuccessMessage(detected.formatted_address);
      }
    } catch (err) {
      console.error(err);
      setGeoError(err.message || 'Failed to detect location. Please enter manually.');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAddress(true);

    const payload = {
      label,
      house_no: houseNo,
      building,
      street,
      area,
      city,
      state,
      pincode,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      is_default: isDefault,
    };

    try {
      if (editAddressId) {
        await customerApi.updateAddress(editAddressId, payload);
        alert('Address updated successfully!');
      } else {
        await customerApi.createAddress(payload);
        alert('Address added successfully!');
      }
      setAddressModalOpen(false);
      fetchProfileAndAddresses();
    } catch (err) {
      alert(err.message || 'Failed to save address details.');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await customerApi.deleteAddress(id);
      fetchProfileAndAddresses();
    } catch (err) {
      alert(err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await customerApi.updateMyProfile({
        default_address_id: addressId,
      });
      alert('Default address set!');
      fetchProfileAndAddresses();
    } catch (err) {
      alert(err.message || 'Failed to update default address.');
    }
  };

  if (loading) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold shadow-sm">⚠️ {error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 text-left pb-12">
      {/* Profile Details Edit */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-105 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-sm">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{profile?.full_name || 'My Profile'}</h3>
            <p className="text-[10px] text-slate-400 font-semibold">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-400 uppercase tracking-wider text-[9px] mb-2 font-black">Email Address</label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-450 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase tracking-wider text-[9px] mb-2 font-black">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase tracking-wider text-[9px] mb-2 font-black">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase tracking-wider text-[9px] mb-2 font-black">Preferred Language</label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-55"
          >
            {updatingProfile ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Address management */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-105 pb-3">
          <h3 className="text-sm font-black text-slate-800 flex items-center uppercase tracking-wider">
            <FiMapPin className="w-5 h-5 mr-2 text-blue-600" />
            Manage Delivery Addresses
          </h3>
          <button
            onClick={handleOpenAddAddress}
            className="px-3.5 py-2 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100/50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            Add New
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {addresses.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 font-semibold">No delivery addresses logged.</p>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-3.5 sm:p-4 border rounded-2xl flex justify-between items-start transition-all ${
                  addr.is_default ? 'border-blue-650 bg-blue-50/15 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2 text-xs min-w-0 flex-grow pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800 uppercase tracking-widest text-[9px] bg-slate-100 border border-slate-150 px-2.5 py-0.5 rounded-full">{addr.label}</span>
                    {addr.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-[8px] px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider font-black">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-semibold leading-relaxed break-words">
                    {addr.house_no}, {addr.building}, {addr.street}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-[9px] text-blue-600 hover:underline font-black mt-2 flex items-center uppercase tracking-widest"
                    >
                      <FiCheck className="w-3.5 h-3.5 mr-0.5 text-blue-600" /> Set as Default
                    </button>
                  )}
                </div>

                <div className="flex gap-1 sm:gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditAddress(addr)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-50"
                    title="Edit"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-red-650 rounded-xl hover:bg-slate-50"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Address Form Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {editAddressId ? 'Edit Address Details' : 'Add New Delivery Address'}
              </h3>
              <button onClick={() => setAddressModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddressSubmit} className="space-y-4 text-xs font-semibold text-left">
              {/* GPS Detection Button block */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-xl font-bold text-xs uppercase tracking-wider border border-blue-100 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <FiNavigation className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`} />
                  {geoLoading ? 'Detecting location...' : 'Use Current Location'}
                </button>

                {geoError && (
                  <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl text-[10px] leading-normal font-semibold">
                    ⚠️ {geoError}
                  </div>
                )}

                {geoSuccessMessage && (
                  <div className="bg-green-50 border border-green-100 text-green-800 p-3 rounded-xl text-[10px] leading-normal font-semibold">
                    <div className="flex items-center gap-1 font-black text-green-700"><FiCheckCircle /> GPS Location detected:</div>
                    <div className="mt-1 font-bold">{geoSuccessMessage}</div>
                    {geoAccuracy && <div className="mt-1 text-slate-500 font-bold">Accuracy: {geoAccuracy} m</div>}
                  </div>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-150"></div>
                  <span className="flex-shrink mx-2 text-[9px] font-black text-slate-400 uppercase tracking-wider">or manually input below</span>
                  <div className="flex-grow border-t border-slate-150"></div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">Label (e.g. Home, Work)</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">Flat / House No.</label>
                  <input
                    type="text"
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">Building / Society</label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">Street / Road name</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">Area / Locality</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[9px] font-black mb-1.5">Pincode</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 411001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-xs text-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={() => setIsDefault(!isDefault)}
                  className="text-blue-600 focus:ring-blue-500 rounded border-slate-300"
                />
                <span className="text-xs text-slate-650 font-bold">Set as default delivery address</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddress}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
