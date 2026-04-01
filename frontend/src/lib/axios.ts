import { useAuthStore } from '@/stores/useAuthStore';
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
});

//tự động gọi refresh api khi access token hết hạn
api.interceptors.response.use((res) => res, async (error) =>{
    const originalResquest = error.config;

    //những api k cần check
    if(originalResquest.url.includes("/auth/signin") || 
    originalResquest.url.includes("/auth/signup") || 
    originalResquest.url.includes("/auth/refresh") 
) {
    return Promise.reject(error);
}

originalResquest._retryCount = originalResquest._retryCount || 0;

if(error.response?.status === 403 && originalResquest._retryCount < 4){

    originalResquest._retryCount += 1;
    // console.log("refresh", originalResquest._retryCount );

    try {
        const res = await api.post("/auth/refresh", {},{withCredentials: true});
        const newAccessToken = res.data.accesstoken;

        useAuthStore.getState().setAccessToken(newAccessToken);

        originalResquest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalResquest);
    } catch (refreshError) {
            useAuthStore.getState().clearState();
            return Promise.reject(refreshError);
    }
}

    return Promise.reject(error);

} ) 
export default api;