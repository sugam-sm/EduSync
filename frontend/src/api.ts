import axios from 'axios';
import { store } from './store';
import { logout } from './features/login/loginSlice';

// creating a reuseable axios instance.
const api = axios.create({
    // The url below will be prepended in every request calls.
    baseURL: 'http://localhost:8000',
});

// request interceptor.
api.interceptors.request.use(
    (config) => {
        // get the accessToken from the storage.
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            // attaching the accessToken to the headers part of config.
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
    return config;
    }, 
    (error) => Promise.reject(error)
);

// response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // save the original request that failed.
        const originalRequest = error.config;

        // if 401 (unauthorized) due to invalid tokens, and if retry fails
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url.includes('api/token/')) {
                return Promise.reject(error);
            }
            originalRequest._retry = true;

            // Logic for refresh token.
            const refreshToken = localStorage.getItem('refreshToken');
            const userData = localStorage.getItem('user');

            if (refreshToken) {
                try {
                    // Call the refresh endpoint
                    const response = await api.post('/api/token/refresh/', {
                        refresh: refreshToken,
                    });

                    // getting a new access token
                    const newAccessToken = response.data.access;                    

                    localStorage.setItem('accessToken', newAccessToken);

                    if (userData) {
                        localStorage.setItem('user', userData);
                    }
                    // Update the original request with the new token and retry
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    store.dispatch(logout());
                    window.location.href = "/login";
                    return Promise.reject(refreshError);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;