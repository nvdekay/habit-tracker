import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <h2>Dashboard</h2>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Đăng Xuất
                </button>
            </div>

            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <h3>Thông tin người dùng</h3>
                <p><strong>ID:</strong> {user?.id}</p>
                <p><strong>Tên:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Vai trò:</strong> {user?.role}</p>
            </div>

            <div style={{ marginTop: '30px' }}>
                <h3>Chức năng</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <h4>Quản lý Profile</h4>
                        <p>Cập nhật thông tin cá nhân</p>
                    </div>
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f3e5f5',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <h4>Cài đặt</h4>
                        <p>Thay đổi mật khẩu và cài đặt</p>
                    </div>
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#e8f5e8',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <h4>Báo cáo</h4>
                        <p>Xem các báo cáo và thống kê</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;