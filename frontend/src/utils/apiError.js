export const normalizeApiError = (error) => {
  const response = error?.response;
  const payload = response?.data ?? error?.data ?? {};
  const backendError = payload.error ?? {};
  const status = response?.status ?? error?.status ?? 0;
  const code = backendError.code ?? payload.code ?? 'UNKNOWN_ERROR';
  const message = backendError.message ?? payload.message ?? error?.message ?? 'Something went wrong.';
  const fieldErrors = backendError.details ?? payload.details ?? [];

  if (status === 0 && backendError.message) {
    return {
      status,
      code,
      type: 'validation',
      message,
      fieldErrors,
    };
  }

  if (status === 400) {
    return {
      status,
      code,
      type: 'validation',
      message,
      fieldErrors,
    };
  }

  if (status === 401) {
    return {
      status,
      code,
      type: 'unauthorized',
      message,
      fieldErrors,
    };
  }

  if (status === 403) {
    return {
      status,
      code,
      type: 'forbidden',
      message,
      fieldErrors,
    };
  }

  if (status === 404) {
    return {
      status,
      code,
      type: 'not-found',
      message,
      fieldErrors,
    };
  }

  if (status === 409) {
    return {
      status,
      code,
      type: 'conflict',
      message,
      fieldErrors,
    };
  }

  if (status === 422) {
    return {
      status,
      code,
      type: 'validation',
      message,
      fieldErrors,
    };
  }

  if (status >= 500) {
    return {
      status,
      code,
      type: 'server',
      message: 'The server encountered an unexpected error. Please try again later.',
      fieldErrors,
    };
  }

  return {
    status,
    code,
    type: 'network',
    message: backendError.message || payload.message || error?.message || 'Network error. Please check your connection and try again.',
    fieldErrors,
  };
};

export const getErrorMessage = (error) => {
  const normalized = normalizeApiError(error);
  return normalized.message;
};
