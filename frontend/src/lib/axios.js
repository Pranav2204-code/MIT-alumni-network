import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,          // send httpOnly JWT cookie
  headers: { 'Content-Type': 'application/json' },
});

// Attach server-side error message to error.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    err.message = msg;
    return Promise.reject(err);
  }
);

export default api;
