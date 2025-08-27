import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// Tạo Context cho Authentication
const AuthContext = createContext();

// REDUCER - Quản lý state mutations theo Redux pattern
const authReducer = (state, action) => {
    switch (action.type) {
        // Set trạng thái loading (khi đang xử lý API calls)
        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        // Xử lý đăng nhập thành công
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,    // Đánh dấu đã đăng nhập
                user: action.payload.user, // Lưu thông tin user
                token: action.payload.token, // Lưu JWT token
                loading: false,           // Tắt loading
                error: null              // Clear errors
            };

        // Xử lý đăng xuất
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,  // Đánh dấu chưa đăng nhập
                user: null,             // Clear user data
                token: null,            // Clear token
                loading: false,
                error: null
            };

        // Set error message
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false          // Tắt loading khi có lỗi
            };

        // Clear error message
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };

        // Update thông tin user (không cần re-authenticate)
        case 'UPDATE_USER':
            return {
                ...state,
                user: { ...state.user, ...action.payload }
            };

        default:
            return state; // Return unchanged state for unknown actions
    }
};

// INITIAL STATE - Trạng thái ban đầu
const initialState = {
    isAuthenticated: false, // Chưa đăng nhập
    user: null,            // Không có thông tin user  
    token: null,           // Không có token
    loading: true,         // Loading = true để check existing token
    error: null            // Không có lỗi
};

// PROVIDER COMPONENT - Wrap toàn bộ app
export const AuthProvider = ({ children }) => {
    // sử dụng useReducer để quản lý complex state
    const [state, dispatch] = useReducer(authReducer, initialState);

    // EFFECT - Chạy khi component mount để check existing authentication
    useEffect(() => {
        // Lấy token từ localStorage (persistent storage)
        const token = localStorage.getItem('token');

        if (token) {
            // Nếu có token, verify với server
            verifyToken(token);
        } else {
            // Nếu không có token, tắt loading
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []); // Empty dependency array = chạy 1 lần khi mount

    // FUNCTION - Verify token với server
    const verifyToken = async (token) => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            // Gọi API verify token
            const result = await authAPI.verifyToken(token);

            if (result.success) {
                // Token hợp lệ, login user
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: { user: result.user, token }
                });
            } else {
                // Token không hợp lệ, logout và xóa khỏi storage
                localStorage.removeItem('token');
                dispatch({ type: 'LOGOUT' });
            }
        } catch (error) {
            // Network error hoặc server error
            // Xóa token và logout để safety
            localStorage.removeItem('token');
            dispatch({ type: 'LOGOUT' });
        }
    };

    // FUNCTION - Xử lý đăng nhập
    const login = async (username, password) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' }); // Clear previous errors

        // Gọi API login
        const result = await authAPI.login(username, password);

        if (result.success) {
            // Lưu token vào localStorage để persist qua browser sessions
            localStorage.setItem('token', result.token);

            // Update state với user info và token
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: result.user, token: result.token }
            });

            // Return success để component có thể handle
            return { success: true, message: result.message };
        } else {
            // Set error message từ server
            dispatch({ type: 'SET_ERROR', payload: result.message });
            return { success: false, message: result.message };
        }
    };

    // FUNCTION - Xử lý đăng ký
    const register = async (userData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });

        // Gọi API register
        const result = await authAPI.register(userData);

        // Tắt loading
        dispatch({ type: 'SET_LOADING', payload: false });

        if (!result.success) {
            // Set error nếu đăng ký thất bại
            dispatch({ type: 'SET_ERROR', payload: result.message });
        }

        // Return result để component xử lý (redirect, etc.)
        return result;
    };

    // FUNCTION - Xử lý đăng xuất
    const logout = async () => {
        // Xóa token khỏi localStorage
        localStorage.removeItem('token');

        // Update state thành logged out
        dispatch({ type: 'LOGOUT' });

        // Có thể thêm API call để invalidate token trên server (optional)
    };

    // FUNCTION - Update thông tin user
    const updateUser = (userData) => {
        dispatch({ type: 'UPDATE_USER', payload: userData });
    };

    // VALUE - Tất cả data và functions được expose ra ngoài
    const value = {
        // State values
        ...state, // isAuthenticated, user, token, loading, error

        // Action functions  
        login,
        register,
        logout,
        updateUser,
        clearError: () => dispatch({ type: 'CLEAR_ERROR' })
    };

    // Provider component cung cấp context cho toàn bộ app
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// CUSTOM HOOK - Để sử dụng AuthContext dễ dàng hơn
export const useAuth = () => {
    const context = useContext(AuthContext);

    // Kiểm tra hook được sử dụng trong Provider chưa
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

/*
FLOW AUTHENTICATION:

1. App khởi động → AuthProvider check localStorage token
2. Nếu có token → verify với server → set authenticated state
3. User access protected route → ProtectedRoute check isAuthenticated
4. User login → save token → update state → redirect
5. User logout → clear token → update state → redirect to login

*/