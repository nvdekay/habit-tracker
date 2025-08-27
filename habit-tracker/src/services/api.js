import axios from 'axios'; // HTTP client library

const API_BASE_URL = 'http://localhost:8080';

// Tạo axios instance với config mặc định
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json' // Mặc định gửi JSON
    }
});

// Tự động thêm Authorization header vào mọi request
api.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');

        if (token) {
            // Thêm Bearer token vào Authorization header
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config; // Trả về config đã được modify
    },
    (error) => Promise.reject(error) // Forward error nếu có
);

// AUTH API FUNCTIONS - Tất cả functions liên quan đến authentication
export const authAPI = {

    // FUNCTION: LOGIN USER
    login: async (username, password) => {
        try {
            // Tìm user theo username
            const response = await api.get(`/users?username=${username}&password=${password}`);
            let user = response.data[0]; // JSON Server trả về array

            // Nếu không tìm thấy theo username, thử tìm theo email
            if (!user) {
                const emailResponse = await api.get(`/users?email=${username}&password=${password}`);
                user = emailResponse.data[0];
            }

            // Nếu vẫn không tìm thấy → login failed
            if (!user) {
                throw new Error('Username or password is incorrect.');
            }

            // Tạo JWT token (trong demo này dùng base64 encode)
            // Production: Server sẽ tạo signed JWT token
            const token = btoa(JSON.stringify({
                userId: user.id,
                username: user.username,
                email: user.email,
                timestamp: Date.now() // Để check expiry
            }));

            // Return success response
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    preferences: user.preferences // User settings
                },
                token,
                message: 'Login successfully'
            };

        } catch (error) {
            // Xử lý mọi loại lỗi (network, validation, etc.)
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    },

    // FUNCTION: REGISTER USER
    register: async (userData) => {
        try {
            //Kiểm tra username đã tồn tại chưa
            const existingUsername = await api.get(`/users?username=${userData.username}`);
            if (existingUsername.data.length > 0) {
                throw new Error('Username has already been used.');
            }

            // Kiểm tra email đã tồn tại chưa
            const existingEmail = await api.get(`/users?email=${userData.email}`);
            if (existingEmail.data.length > 0) {
                throw new Error('Email has already been used.');
            }

            // Tạo user object với data bổ sung
            const newUser = {
                id: Math.random().toString(36).substr(2, 9), // Generate random ID
                username: userData.username,
                email: userData.email,
                password: userData.password, // Production: hash password trước khi lưu
                fullName: userData.fullName,
                createdAt: new Date().toISOString(), // Timestamp tạo account
                preferences: {
                    // Default preferences cho user mới
                    darkMode: false,
                    notifications: true,
                    language: "en"
                }
            };

            // Tạo user trong database
            const response = await api.post('/users', newUser);

            // Return success
            return {
                success: true,
                user: response.data,
                message: 'Đăng ký thành công'
            };

        } catch (error) {
            // Xử lý lỗi validation hoặc network
            return {
                success: false,
                message: error.message || 'Đăng ký thất bại'
            };
        }
    },

    // Kiểm tra token còn hợp lệ không
    verifyToken: async (token) => {
        try {
            // Validation cơ bản
            if (!token || token.trim() === '') {
                throw new Error('Token is empty');
            }

            // Decode token (trong production sẽ verify signature)
            let decoded;
            try {
                decoded = JSON.parse(atob(token)); // Decode base64
            } catch (decodeError) {
                throw new Error('Invalid token format');
            }

            // Kiểm tra token có userId không
            if (!decoded.userId) {
                throw new Error('Token missing userId');
            }

            // Kiểm tra token expiry (7 ngày)
            const tokenAge = Date.now() - decoded.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

            if (tokenAge > maxAge) {
                throw new Error('Token expired');
            }

            // Verify user vẫn tồn tại trong database
            // Sử dụng query parameter vì JSON Server có issue với ID lớn trong URL path
            const response = await api.get(`/users?id=${decoded.userId}`);
            const user = response.data[0];

            // User không tồn tại → token invalid
            if (!user) {
                throw new Error('User not found');
            }

            // Return success với user data
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
            // Log error cho debugging
            console.error('verifyToken error:', error.message);

            return {
                success: false,
                message: error.message || 'Token verification failed'
            };
        }
    },
};

export default api;
