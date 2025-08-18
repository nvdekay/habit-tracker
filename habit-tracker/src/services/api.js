// api.js - Production ready version
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Tạo axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor để tự động thêm token vào header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth API functions
export const authAPI = {
    // Login user
    login: async (username, password) => {
        try {
            const response = await api.get(`/users?username=${username}&password=${password}`);
            let user = response.data[0];

            if (!user) {
                const emailResponse = await api.get(`/users?email=${username}&password=${password}`);
                user = emailResponse.data[0];
            }

            if (!user) {
                throw new Error('Username or password is incorrect.');
            }

            const token = btoa(JSON.stringify({
                userId: user.id,
                username: user.username,
                email: user.email,
                timestamp: Date.now()
            }));

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    preferences: user.preferences
                },
                token,
                message: 'Login successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    },

    // Register user
    register: async (userData) => {
        try {
            const existingUsername = await api.get(`/users?username=${userData.username}`);
            if (existingUsername.data.length > 0) {
                throw new Error('Username has already been used.');
            }

            const existingEmail = await api.get(`/users?email=${userData.email}`);
            if (existingEmail.data.length > 0) {
                throw new Error('Email has already been used.');
            }

            const newUser = {
                id: Math.random().toString(36).substr(2, 9), // Tạo ID ngẫu nhiên
                username: userData.username,
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName,
                createdAt: new Date().toISOString(),
                preferences: {
                    darkMode: false,
                    notifications: true,
                    language: "en"
                }
            };

            const response = await api.post('/users', newUser);

            return {
                success: true,
                user: response.data,
                message: 'Đăng ký thành công'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Đăng ký thất bại'
            };
        }
    },

    // Verify token - PRODUCTION VERSION
    verifyToken: async (token) => {
        try {
            if (!token || token.trim() === '') {
                throw new Error('Token is empty');
            }

            // Decode token
            let decoded;
            try {
                decoded = JSON.parse(atob(token));
            } catch (decodeError) {
                throw new Error('Invalid token format');
            }

            if (!decoded.userId) {
                throw new Error('Token missing userId');
            }

            // Kiểm tra token có quá cũ không (7 ngày)
            const tokenAge = Date.now() - decoded.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 ngày
            if (tokenAge > maxAge) {
                throw new Error('Token expired');
            }

            // Sử dụng query parameter thay vì direct endpoint
            // Vì JSON Server có issue với ID lớn trong URL path
            const response = await api.get(`/users?id=${decoded.userId}`);
            const user = response.data[0];

            if (!user) {
                throw new Error('User not found');
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    preferences: user.preferences
                }
            };
        } catch (error) {
            console.error('verifyToken error:', error.message);
            return {
                success: false,
                message: error.message || 'Token verification failed'
            };
        }
    },
};

export default api;