import apiClient from './client';

export const http = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, payload, config) => apiClient.post(url, payload, config),
  put: (url, payload, config) => apiClient.put(url, payload, config),
  patch: (url, payload, config) => apiClient.patch(url, payload, config),
  delete: (url, config) => apiClient.delete(url, config),
};

export default http;
