import axios from 'axios';

const api = axios.create({
    baseUrl: import.meta.env.MODE === 'development' ? "http://localhost:5001/api" : "/api",
    withCredentials: true, 
});

export default api;