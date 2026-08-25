import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Skeleton from '../../components/common/Skeleton';
import { FiUser, FiMapPin, FiPlus, FiTrash2, FiEdit2, FiCheck } from 'react-icons/fi';

export default function CustomerProfile() {
  const { user, refreshUser } = useAuth();
  const { changeLanguage } = useLanguage();

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
      setError('Failed to load profile details.');
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
        // Sync global i18n
        await changeLanguage(preferredLang);
        // Refresh auth state
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
    setIsDefault(addr.is_default);
    setAddressModalOpen(true);
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
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6 h-fit">
        <h3 className="text-md font-bold text-gray-800 flex items-center border-b border-gray-100 pb-3">
          <FiUser className="w-5 h-5 mr-2 text-blue-500" />
          Personal Profile
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-gray-500 mb-2">Email Address</label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-2">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-2">Preferred Language</label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow disabled:opacity-50"
          >
            {updatingProfile ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Address management */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-md font-bold text-gray-800 flex items-center">
            <FiMapPin className="w-5 h-5 mr-2 text-blue-500" />
            Manage Delivery Addresses
          </h3>
          <button
            onClick={handleOpenAddAddress}
            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            Add New
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {addresses.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No delivery addresses logged.</p>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-4 border rounded-xl flex justify-between items-start transition-all ${
                  addr.is_default ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 uppercase tracking-wider">{addr.label}</span>
                    {addr.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-[9px] px-2 py-0.5 rounded font-bold border border-blue-200 uppercase">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 leading-normal">
                    {addr.house_no}, {addr.building}, {addr.street}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-[10px] text-blue-600 hover:underline font-bold mt-2 flex items-center"
                    >
                      <FiCheck className="w-3.5 h-3.5 mr-0.5" /> Set as Default
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditAddress(addr)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100"
                    title="Edit"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editAddressId ? 'Edit Address Details' : 'Add New Delivery Address'}
            </h3>
            <form onSubmit={handleAddressSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Label (e.g. Home, Work)</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Flat / House No.</label>
                  <input
                    type="text"
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-2">Building / Society</label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Street / Road name</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">Area / Locality</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-2">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-2">Pincode</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 411001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={() => setIsDefault(!isDefault)}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-xs text-gray-700">Set as default delivery address</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddress}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
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
