import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.MODE === 'development' ? "http://localhost:5001/api" : "/api",
    withCredentials: true, 
});

//gắn accesstoken vào req header
api.interceptors.request.use(async (config) => {
    // Sử dụng dynamic import để tránh circular dependency
    const { useAuthStore } = await import('@/stores/useAuthStore');
    const { accessToken } = useAuthStore.getState();

    if(accessToken){
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;  
})

export default api;