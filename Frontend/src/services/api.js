import useAuthStore from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

const customFetch = async (url, options = {}) => {
  const token = useAuthStore.getState().accessToken;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge options
  const config = {
    ...options,
    headers,
    credentials: 'include', // Crucial to send and receive httpOnly cookies (like the refresh token)
  };

  try {
    let response = await fetch(`${API_BASE}${url}`, config);

    // Auto-refresh mechanism — skip for auth endpoints (they don't use Bearer tokens)
    const isAuthEndpoint = url.startsWith('/auth/');
    if (response.status === 401 && !options._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            config.headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(`${API_BASE}${url}`, config).then(res => handleResponse(res));
          })
          .catch(err => Promise.reject(err));
      }

      options._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Must send cookies to refresh token
        });

        if (!refreshResponse.ok) throw new Error('Refresh failed');
        
        const refreshData = await refreshResponse.json();
        const newToken = refreshData.accessToken;
        
        useAuthStore.getState().updateToken(newToken);
        processQueue(null, newToken);
        
        config.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE}${url}`, config);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'API Error');
    error.response = { data, status: response.status };
    throw error;
  }
  return { data, status: response.status };
};

const postMultipart = async (url, formData) => {
  const token = useAuthStore.getState().accessToken;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });
  return handleResponse(response);
};

// Export an axios-like interface
const api = {
  get: (url, config) => customFetch(url, { ...config, method: 'GET' }),
  post: (url, data, config) => customFetch(url, { ...config, method: 'POST', body: JSON.stringify(data) }),
  put: (url, data, config) => customFetch(url, { ...config, method: 'PUT', body: JSON.stringify(data) }),
  patch: (url, data, config) => customFetch(url, { ...config, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url, config) => customFetch(url, { ...config, method: 'DELETE' }),
  postMultipart,
};

export default api;
