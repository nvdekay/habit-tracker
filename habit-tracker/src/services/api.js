import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; // Địa chỉ của JSON Server

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
      // Có thể login bằng username hoặc email
      const response = await api.get(`/users?username=${username}&password=${password}`);
      let user = response.data[0];
      
      // Nếu không tìm thấy bằng username, thử email
      if (!user) {
        const emailResponse = await api.get(`/users?email=${username}&password=${password}`);
        user = emailResponse.data[0];
      }
      
      if (!user) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }

      // Tạo fake token
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
        message: 'Đăng nhập thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Đăng nhập thất bại'
      };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      // Kiểm tra username đã tồn tại
      const existingUsername = await api.get(`/users?username=${userData.username}`);
      if (existingUsername.data.length > 0) {
        throw new Error('Tên đăng nhập đã được sử dụng');
      }

      // Kiểm tra email đã tồn tại
      const existingEmail = await api.get(`/users?email=${userData.email}`);
      if (existingEmail.data.length > 0) {
        throw new Error('Email đã được sử dụng');
      }

      // Tạo user mới
      const newUser = {
        id: Date.now(),
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

  // Verify token
  verifyToken: async (token) => {
    try {
      const decoded = JSON.parse(atob(token));
      const user = await api.get(`/users/${decoded.userId}`);
      
      return {
        success: true,
        user: {
          id: user.data.id,
          username: user.data.username,
          email: user.data.email,
          fullName: user.data.fullName,
          preferences: user.data.preferences
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token không hợp lệ'
      };
    }
  },
};

export default api;