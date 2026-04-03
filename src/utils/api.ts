import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { setGlobalLoading, setGlobalColdStartMessage } from '../contexts/UIContext';

// Extend Axios request config for custom metadata
interface CustomRequestConfig extends InternalAxiosRequestConfig {
    _startTime?: number;
    _retry?: number;
}

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

const MAX_RETRIES = 2;
const COLD_START_THRESHOLD = 1500; // 1.5s

// Request interceptor
api.interceptors.request.use(
    (config: CustomRequestConfig) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        config._startTime = performance.now();
        setGlobalLoading(true);

        // Development logging
        if (import.meta.env.DEV) {
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        setGlobalLoading(false);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        setGlobalLoading(false);
        setGlobalColdStartMessage(null);
        return response;
    },
    async (error: AxiosError) => {
        const config = error.config as CustomRequestConfig;
        
        setGlobalLoading(false);

        // Cold start detection (Slow response or 503/504)
        const duration = config?._startTime ? (performance.now() - config._startTime) : 0;
        const isSlow = duration > COLD_START_THRESHOLD;
        const isServerError = error.response?.status && error.response.status >= 500;

        if (isSlow || isServerError) {
            setGlobalColdStartMessage("Server is starting... this may take a few seconds.");
            
            // Auto-retry for server errors (likely cold starts)
            if (isServerError && (!config._retry || config._retry < MAX_RETRIES)) {
                config._retry = (config._retry || 0) + 1;
                
                if (import.meta.env.DEV) {
                    console.warn(`[API] Retrying ${config.url} (${config._retry}/${MAX_RETRIES})`);
                }
                
                // Wait 1s before retrying
                await new Promise(res => setTimeout(res, 1000));
                return api(config);
            }
        } else {
            setGlobalColdStartMessage(null);
        }

        // Handle 401s (Token expired)
        const isLoginRequest = config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            toast.error("Session expired. Please sign in again.");
            window.location.href = '/login';
        }

        // Standard error toast for non-auth errors
        if (!isLoginRequest && error.response?.status !== 404) {
            toast.error(error.message || "An unexpected error occurred.");
        }

        return Promise.reject(error);
    }
);

export default api;
