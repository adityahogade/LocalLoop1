import axiosClient, { getServerBaseUrl } from '../api/axiosClient';

/**
 * Returns a complete URL for a document pointing to the active backend.
 * Uses centralized getServerBaseUrl() to ensure proper production or local routing.
 */
export const getFullFileUrl = (url, token = null) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverBase = getServerBaseUrl();
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  const activeToken = token || localStorage.getItem('accessToken') || localStorage.getItem('token');
  const separator = cleanPath.includes('?') ? '&' : '?';
  return activeToken ? `${serverBase}/${cleanPath}${separator}token=${activeToken}` : `${serverBase}/${cleanPath}`;
};

/**
 * Securely opens and displays a KYC document with temporary token and graceful error handling.
 * Prevents broken tabs, ERR_CONNECTION_REFUSED, and unhandled 404/401/403 errors.
 *
 * @param {string} fileUrl - The document path or URL
 * @param {string} role - 'admin' | 'provider'
 */
export const viewKycDocument = async (fileUrl, role = 'admin') => {
  if (!fileUrl) {
    alert('KYC document path is not available.');
    return;
  }

  const cleanFilename = fileUrl.split('/').pop().split('?')[0];
  if (!cleanFilename) {
    alert('Invalid document filename.');
    return;
  }

  try {
    let viewUrl = null;

    // 1. Fetch short-lived signed view token (15-min expiration, bound to filename)
    try {
      const endpoint = role === 'admin'
        ? `/admin/kyc/documents/${cleanFilename}/view-token`
        : `/providers/kyc/documents/${cleanFilename}/view-token`;

      const res = await axiosClient.get(endpoint);
      if (res?.success && res?.data?.viewUrl) {
        viewUrl = res.data.viewUrl;
      }
    } catch (tokenErr) {
      // Try global view-token endpoint
      try {
        const generalRes = await axiosClient.get(`/api/kyc/documents/${cleanFilename}/view-token`);
        if (generalRes?.success && generalRes?.data?.viewUrl) {
          viewUrl = generalRes.data.viewUrl;
        }
      } catch (_) {
        // If view-token endpoint failed with 404/403/401, rethrow to trigger friendly message
        if (tokenErr.status === 404 || tokenErr.status === 403 || tokenErr.status === 401) {
          throw tokenErr;
        }
        // Otherwise fall back to direct file URL
        viewUrl = getFullFileUrl(fileUrl);
      }
    }

    if (viewUrl) {
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Failed to view KYC document:', error);
    const status = error.status || error.response?.status;
    const code = error.code || error.response?.data?.error?.code;

    if (code === 'KYC_FILE_NOT_FOUND' || status === 404) {
      alert('Document Not Found: The KYC document file is missing on the server storage. The provider may need to re-upload it.');
    } else if (code === 'FORBIDDEN' || status === 403) {
      alert('Access Denied: You do not have permission to view this KYC document.');
    } else if (code === 'INVALID_OR_EXPIRED_TOKEN' || status === 401) {
      alert('Session Expired: Your session has expired. Please log in again to view documents.');
    } else {
      alert(`Unable to open KYC document: ${error.message || 'Network connection issue occurred.'}`);
    }
  }
};
