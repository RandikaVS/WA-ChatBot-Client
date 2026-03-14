import axios from "axios";

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: "http://localhost:8080" });

// Setup mock API for testing

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) =>
    Promise.reject(
      (error.response && error.response.data) || "Something went wrong",
    ),
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args:any) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

// utils/axios.ts — make sure these match your FastAPI router prefixes exactly

export const endpoints = {
  auth: {
    // Change this from '/api/auth/signin' to the tenant auth endpoint.
    // This is the only URL change needed — everything else stays the same.
    login:   '/api/tenant/auth/signin',
    me:      '/api/tenant/auth/me',
    refresh: '/api/tenant/auth/refresh',
  },
  agent: {
    config: '/api/agent/config',
    test:   '/api/agent/test',
    stats:  '/api/agent/stats',
  },
  conversations: {
    list:     '/api/conversations',
    takeover: (id: string) => `/api/conversations/${id}/takeover`,
  },
};