import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import { FiSettings, FiCheckSquare, FiAlertCircle, FiPlus, FiTrash2, FiFileText, FiX, FiMapPin } from 'react-icons/fi';

export default function ProviderOnboarding() {
  const { fetchProfile } = useOutletContext() || {};

  const [profile, setProfile] = useState(null);
  const [kycDocs, setKycDocs] = useState([]);
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Business Profile Form
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Bank Form
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [submittingBank, setSubmittingBank] = useState(false);

  // KYC Form
  const [documentType, setDocumentType] = useState('id_proof');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);

  // Service Areas Form
  const [serviceAreas, setServiceAreas] = useState([]);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [areaPincode, setAreaPincode] = useState('');
  const [areaState, setAreaState] = useState('Maharashtra');
  const [areaCity, setAreaCity] = useState('Pune');
  const [areaName, setAreaName] = useState('');
  const [submittingArea, setSubmittingArea] = useState(false);

  // Location Fields
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [locationAddress, setLocationAddress] = useState('');
  const [detectingProviderLoc, setDetectingProviderLoc] = useState(false);

  // Reverse geocode saved provider coordinates
  useEffect(() => {
    const reverseGeocodeProvider = async () => {
      if (latitude && longitude) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: { 'User-Agent': 'LocalLoop-ServiceHub-Provider' }
          });
          if (res.ok) {
            const data = await res.json();
            setLocationAddress(data.display_name || `${latitude}, ${longitude}`);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setLocationAddress('');
      }
    };
    reverseGeocodeProvider();
  }, [latitude, longitude]);

  const handleUseProviderLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingProviderLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(String(lat.toFixed(6)));
        setLongitude(String(lon.toFixed(6)));
        setDetectingProviderLoc(false);
      },
      (err) => {
        console.error(err);
        alert("Failed to access your current location.");
        setDetectingProviderLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getFullFileUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const serverBase = apiBase.replace(/\/api$/, '');
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const separator = cleanPath.includes('?') ? '&' : '?';
    return token ? `${serverBase}/${cleanPath}${separator}token=${token}` : `${serverBase}/${cleanPath}`;
  };

  const fetchOnboardingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await providerApi.getProfile();
      if (profileRes?.success && profileRes.data) {
        setProfile(profileRes.data);
        setBusinessName(profileRes.data.business_name || '');
        setBusinessDescription(profileRes.data.business_description || '');
        setLogoUrl(profileRes.data.logo_url || '');
        setLatitude(profileRes.data.latitude !== null && profileRes.data.latitude !== undefined ? String(profileRes.data.latitude) : '');
        setLongitude(profileRes.data.longitude !== null && profileRes.data.longitude !== undefined ? String(profileRes.data.longitude) : '');
        setServiceRadius(profileRes.data.service_radius_km !== null && profileRes.data.service_radius_km !== undefined ? Number(profileRes.data.service_radius_km) : 10);
      }

      const kycRes = await providerApi.getKycDocuments();
      if (kycRes?.success) {
        setKycDocs(kycRes.data || []);
      }

      const bankRes = await providerApi.getBankAccount();
      if (bankRes?.success) {
        setBank(bankRes.data);
      }

      const areasRes = await providerApi.getServiceAreas();
      if (areasRes?.success) {
        setServiceAreas(areasRes.data || []);
      }
    } catch (err) {
      console.error(err);
      // Suppress 404 for bank account since it means none exists yet
      if (err.code !== 'BANK_ACCOUNT_NOT_FOUND') {
        setError('Failed to fetch store configuration details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAreaSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6,10}$/.test(areaPincode.trim())) {
      alert('Please enter a valid 6-10 digit pincode.');
      return;
    }
    setSubmittingArea(true);
    try {
      const res = await providerApi.createServiceArea({
        state: areaState,
        city: areaCity,
        area: areaName || 'All Area',
        pincode: areaPincode.trim()
      });
      if (res?.success) {
        alert('Service area added successfully!');
        setAreaModalOpen(false);
        setAreaPincode('');
        setAreaName('');
        // Reload areas
        const areasRes = await providerApi.getServiceAreas();
        if (areasRes?.success) {
          setServiceAreas(areasRes.data || []);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to add service area.');
    } finally {
      setSubmittingArea(false);
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('Are you sure you want to remove this service area?')) return;
    try {
      const res = await providerApi.deleteServiceArea(id);
      if (res?.success) {
        // Reload areas
        const areasRes = await providerApi.getServiceAreas();
        if (areasRes?.success) {
          setServiceAreas(areasRes.data || []);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to remove service area.');
    }
  };

  useEffect(() => {
    fetchOnboardingDetails();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    const radiusVal = parseFloat(serviceRadius);
    if (isNaN(radiusVal) || radiusVal <= 0) {
      alert('Service radius must be greater than zero.');
      setUpdatingProfile(false);
      return;
    }
    const latVal = latitude.trim() !== '' ? parseFloat(latitude) : null;
    const lonVal = longitude.trim() !== '' ? parseFloat(longitude) : null;
    if (latVal !== null && (isNaN(latVal) || latVal < -90 || latVal > 90)) {
      alert('Latitude must be between -90 and 90.');
      setUpdatingProfile(false);
      return;
    }
    if (lonVal !== null && (isNaN(lonVal) || lonVal < -180 || lonVal > 180)) {
      alert('Longitude must be between -180 and 180.');
      setUpdatingProfile(false);
      return;
    }

    try {
      const res = await providerApi.updateProfile({
        business_name: businessName,
        business_description: businessDescription,
        logo_url: logoUrl || null,
        latitude: latVal,
        longitude: lonVal,
        service_radius_km: radiusVal,
      });

      if (res?.success) {
        alert('Business profile updated successfully!');
        if (fetchProfile) fetchProfile(); // trigger layout check
        fetchOnboardingDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to update store details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBank(true);
    
    const payload = {
      account_holder_name: accountHolder,
      ifsc_code: ifscCode,
      bank_name: bankName,
    };
    if (accountNumber.trim()) {
      payload.account_number = accountNumber;
    }

    try {
      let res;
      if (bank) {
        res = await providerApi.updateBankAccount(payload);
        alert('Bank details updated successfully!');
      } else {
        if (!accountNumber.trim()) {
          alert('Account number is required to link a new bank account.');
          setSubmittingBank(false);
          return;
        }
        res = await providerApi.createBankAccount(payload);
        alert('Bank account linked successfully!');
      }
      setBankModalOpen(false);
      setAccountNumber('');
      fetchOnboardingDetails();
    } catch (err) {
      alert(err.message || 'Failed to save bank information.');
    } finally {
      setSubmittingBank(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!window.confirm('Delete linked bank details?')) return;
    try {
      await providerApi.deleteBankAccount();
      setBank(null);
      fetchOnboardingDetails();
    } catch (err) {
      alert(err.message || 'Failed to remove bank account.');
    }
  };

  const handleKycFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadingKyc(true);
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('document_type', documentType);

    try {
      const res = await providerApi.uploadKyc(formData);
      if (res?.success) {
        alert('KYC Document uploaded successfully for verification review.');
        setSelectedFile(null);
        // Clear input element
        document.getElementById('kycFileInput').value = '';
        fetchOnboardingDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit KYC document.');
    } finally {
      setUploadingKyc(false);
    }
  };

  if (loading && !profile) return <Skeleton type="table" count={5} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
      {/* Left side - Profile & Bank details */}
      <div className="space-y-6">
        {/* Profile Details Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center border-b border-slate-100 pb-3 uppercase tracking-wider">
            <FiSettings className="w-4.5 h-4.5 mr-2 text-blue-600" />
            Storefront Settings
          </h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Business Store Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Business Description</label>
              <textarea
                rows="4"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800 placeholder-slate-450"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800 placeholder-slate-450"
              />
            </div>

            {/* Service Location coordinates */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                📍 Service Location
              </span>
              
              <button
                type="button"
                onClick={handleUseProviderLocation}
                disabled={detectingProviderLoc}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-lg font-bold text-[10px] uppercase tracking-wider border border-blue-100 transition-colors disabled:opacity-50"
              >
                {detectingProviderLoc ? 'Locating...' : 'Use Current Location'}
              </button>

              {locationAddress && (
                <div className="text-[10px] leading-normal font-semibold text-slate-650">
                  <span className="block text-[9px] text-slate-400 uppercase font-black">Address</span>
                  {locationAddress}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 18.5204"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 73.8567"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Service Radius */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Service Radius (KM)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={serviceRadius}
                onChange={(e) => setServiceRadius(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
            >
              {updatingProfile ? 'Saving Storefront...' : 'Update Storefront'}
            </button>
          </form>
        </div>

        {/* Bank Account Linking Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center uppercase tracking-wider">
              <FiCheckSquare className="w-4.5 h-4.5 mr-2 text-blue-600" />
              Settlement Bank Account
            </h3>
            {!bank ? (
              <button
                onClick={() => setBankModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100/50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center transition-colors"
              >
                <FiPlus className="w-4.5 h-4.5 mr-1" />
                Link Account
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAccountHolder(bank.account_holder_name);
                    setAccountNumber('');
                    setIfscCode(bank.ifsc_code);
                    setBankName(bank.bank_name);
                    setBankModalOpen(true);
                  }}
                  className="text-[10px] font-black uppercase tracking-wider text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-xl"
                >
                  Edit details
                </button>
                <button
                  onClick={handleDeleteBank}
                  className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FiTrash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </div>

          {!bank ? (
            <p className="text-xs text-slate-500 leading-normal font-semibold">
              No bank account linked. Link your bank details to enable payouts request settlements for earnings.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl text-[10px] font-bold leading-normal">
              <div>
                <span className="text-slate-400 block mb-1 uppercase tracking-wider">Account Holder</span>
                <span className="font-extrabold text-slate-800">{bank.account_holder_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 uppercase tracking-wider">Bank Name</span>
                <span className="font-extrabold text-slate-800">{bank.bank_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 uppercase tracking-wider">Account Number</span>
                <span className="font-extrabold text-slate-800">•••• {bank.account_number_last4}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 uppercase tracking-wider">IFSC Code</span>
                <span className="font-extrabold text-slate-800 uppercase tracking-widest">{bank.ifsc_code}</span>
              </div>
            </div>
          )}
        </div>

        {/* Service Areas Configuration Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center uppercase tracking-wider">
              <FiMapPin className="w-4.5 h-4.5 mr-2 text-blue-600" />
              Service Delivery Areas
            </h3>
            <button
              onClick={() => setAreaModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100/50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center transition-colors"
            >
              <FiPlus className="w-4.5 h-4.5 mr-1" />
              Add Area
            </button>
          </div>

          <div className="space-y-2.5">
            {serviceAreas.length === 0 ? (
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                No service areas configured. Configure the pincodes you serve so customers can find your listings.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {serviceAreas.map((area) => (
                  <div key={area.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/50 transition-colors">
                    <div>
                      <span className="font-extrabold text-slate-850 block text-xs mb-0.5">
                        {area.city}, {area.state}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Area: {area.area || 'All'} · Pincode: <span className="text-blue-600 font-black">{area.pincode}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteArea(area.id)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <FiTrash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - KYC upload & list */}
      <div className="space-y-6">
        {/* Upload KYC form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center border-b border-slate-100 pb-3 uppercase tracking-wider">
            <FiFileText className="w-4.5 h-4.5 mr-2 text-blue-600" />
            Upload KYC Documents
          </h3>

          <form onSubmit={handleKycSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-bold bg-white text-slate-800"
              >
                <option value="id_proof">Government ID (Aadhaar/PAN/Passport)</option>
                <option value="address_proof">Address Proof (Utility Bill/Rent Agreement)</option>
                <option value="bank_proof">Bank Passbook / Cancelled Cheque</option>
                <option value="business_license">GST / FSSAI / Business License</option>
                <option value="other">Other Supporting Documents</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Select File (PDF or Image, max 5MB)</label>
              <input
                id="kycFileInput"
                type="file"
                required
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleKycFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={uploadingKyc || !selectedFile}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
            >
              {uploadingKyc ? 'Uploading...' : 'Submit Document'}
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
            KYC Verification Log
          </h3>

          <div className="space-y-3">
            {kycDocs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No documents submitted yet.</p>
            ) : (
              kycDocs.map((doc) => (
                <div key={doc.id} className="p-4 border border-slate-150 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50/20 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <span className="capitalize font-extrabold text-slate-800 block text-xs">
                      {doc.document_type?.replace(/_/g, ' ')}
                    </span>
                    <a href={getFullFileUrl(doc.file_url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">
                      View uploaded file
                    </a>
                    {doc.kyc_rejection_reason && (
                      <span className="block text-[10px] text-red-500 font-bold mt-1 bg-red-50 p-2 border border-red-100 rounded">
                        Reason: {doc.kyc_rejection_reason}
                      </span>
                    )}
                  </div>
                  <div>
                    <StatusBadge status={doc.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bank Linking Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Link Bank Details</h3>
              <button onClick={() => setBankModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBankSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">IFSC Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Bank Account Number</label>
                <input
                  type="password"
                  required={!bank}
                  placeholder={bank ? "Leave blank to keep existing account" : "Enter account number"}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBank}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 transition-colors disabled:opacity-50"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Service Area Add Modal */}
      {areaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Add Service Area</h3>
              <button onClick={() => setAreaModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAreaSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">State</label>
                <input
                  type="text"
                  required
                  value={areaState}
                  onChange={(e) => setAreaState(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">City</label>
                <input
                  type="text"
                  required
                  value={areaCity}
                  onChange={(e) => setAreaCity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Area / Locality Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acceptance Area"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 411001"
                  value={areaPincode}
                  onChange={(e) => setAreaPincode(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-[10px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setAreaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingArea}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 transition-colors disabled:opacity-50"
                >
                  {submittingArea ? 'Saving...' : 'Add Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
