import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { providerApi } from '../../api/provider';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import { FiSettings, FiCheckSquare, FiAlertCircle, FiPlus, FiTrash2, FiFileText } from 'react-icons/fi';

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
      }

      const kycRes = await providerApi.getKycDocuments();
      if (kycRes?.success) {
        setKycDocs(kycRes.data || []);
      }

      const bankRes = await providerApi.getBankAccount();
      if (bankRes?.success) {
        setBank(bankRes.data);
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

  useEffect(() => {
    fetchOnboardingDetails();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await providerApi.updateProfile({
        business_name: businessName,
        business_description: businessDescription,
        logo_url: logoUrl || null,
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
      account_number: accountNumber,
      ifsc_code: ifscCode,
      bank_name: bankName,
    };

    try {
      let res;
      if (bank) {
        res = await providerApi.updateBankAccount(payload);
        alert('Bank details updated successfully!');
      } else {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left side - Profile & Bank details */}
      <div className="space-y-6">
        {/* Profile Details Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-gray-800 flex items-center border-b border-gray-100 pb-3">
            <FiSettings className="w-5 h-5 mr-2 text-blue-500" />
            Storefront Settings
          </h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-500 mb-2">Business Store Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Business Description</label>
              <textarea
                rows="4"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow disabled:opacity-50"
            >
              {updatingProfile ? 'Saving Storefront...' : 'Update Storefront'}
            </button>
          </form>
        </div>

        {/* Bank Account Linking Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-md font-bold text-gray-800 flex items-center">
              <FiCheckSquare className="w-5 h-5 mr-2 text-blue-500" />
              Settlement Bank Account
            </h3>
            {!bank ? (
              <button
                onClick={() => setBankModalOpen(true)}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center"
              >
                <FiPlus className="w-4 h-4 mr-1" />
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
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Edit details
                </button>
                <button
                  onClick={handleDeleteBank}
                  className="text-slate-400 hover:text-red-500"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {!bank ? (
            <p className="text-xs text-gray-400 leading-normal">
              No bank account linked. Link your bank details to enable payouts request settlements for earnings.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-xs leading-normal">
              <div>
                <span className="text-gray-400 block mb-0.5">Account Holder</span>
                <span className="font-bold text-gray-800">{bank.account_holder_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Bank Name</span>
                <span className="font-bold text-gray-800">{bank.bank_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Account Number</span>
                <span className="font-bold text-gray-800">•••• {bank.account_number_last4}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">IFSC Code</span>
                <span className="font-bold text-gray-800 uppercase">{bank.ifsc_code}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - KYC upload & list */}
      <div className="space-y-6">
        {/* Upload KYC form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-gray-800 flex items-center border-b border-gray-100 pb-3">
            <FiFileText className="w-5 h-5 mr-2 text-blue-500" />
            Upload KYC Documents
          </h3>

          <form onSubmit={handleKycSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-500 mb-2">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
              >
                <option value="id_proof">Government ID (Aadhaar/PAN/Passport)</option>
                <option value="address_proof">Address Proof (Utility Bill/Rent Agreement)</option>
                <option value="bank_proof">Bank Passbook / Cancelled Cheque</option>
                <option value="business_license">GST / FSSAI / Business License</option>
                <option value="other">Other Supporting Documents</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Select File (PDF or Image, max 5MB)</label>
              <input
                id="kycFileInput"
                type="file"
                required
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleKycFileChange}
                className="w-full text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={uploadingKyc || !selectedFile}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow disabled:opacity-50"
            >
              {uploadingKyc ? 'Uploading...' : 'Submit Document'}
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-3">
            KYC Verification Log
          </h3>

          <div className="space-y-3">
            {kycDocs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No documents submitted yet.</p>
            ) : (
              kycDocs.map((doc) => (
                <div key={doc.id} className="p-3 border border-gray-150 rounded-lg flex justify-between items-center text-xs font-semibold text-gray-700">
                  <div>
                    <span className="capitalize font-bold text-gray-800 block mb-1">
                      {doc.document_type?.replace(/_/g, ' ')}
                    </span>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">
                      View uploaded file
                    </a>
                    {doc.kyc_rejection_reason && (
                      <span className="block text-[10px] text-red-500 font-medium mt-1">
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
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Link Bank Details</h3>
            <form onSubmit={handleBankSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">IFSC Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Bank Account Number</label>
                <input
                  type="password"
                  required
                  placeholder="Linked account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBank}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
