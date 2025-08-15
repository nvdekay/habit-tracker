import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Target, TrendingUp } from 'lucide-react';

const Home = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <>
            {/* Hero Section */}
            <section className="bg-gradient text-white py-5"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="container">
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-8">
                            <h1 className="display-3 fw-bold mb-4">Habit Tracker</h1>
                            <p className="lead mb-5">
                                Xây dựng thói quen tốt, đạt được mục tiêu và theo dõi tiến trình của bạn
                            </p>

                            {isAuthenticated ? (
                                <div>
                                    <p className="fs-5 mb-4">
                                        Chào mừng trở lại, <strong>{user?.fullName}</strong>!
                                    </p>
                                    <Link to="/dashboard" className="btn btn-light btn-lg px-5 py-3">
                                        Vào Dashboard
                                    </Link>
                                </div>
                            ) : (
                                <div className="d-flex gap-3 justify-content-center flex-wrap">
                                    <Link to="/register" className="btn btn-light btn-lg px-5 py-3">
                                        Bắt đầu ngay
                                    </Link>
                                    <Link to="/login" className="btn btn-outline-light btn-lg px-5 py-3">
                                        Đăng nhập
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-12 text-center mb-5">
                            <h2 className="display-5 fw-bold mb-4">Tính năng nổi bật</h2>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="text-center p-4">
                                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                                    style={{ width: '80px', height: '80px' }}>
                                    <CheckCircle size={40} className="text-success" />
                                </div>
                                <h4 className="mb-3">Theo dõi thói quen</h4>
                                <p className="text-muted">
                                    Dễ dàng tạo và theo dõi các thói quen hàng ngày, hàng tuần, hàng tháng.
                                    Xem được tiến trình và streak của bạn.
                                </p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-center p-4">
                                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                                    style={{ width: '80px', height: '80px' }}>
                                    <Target size={40} className="text-info" />
                                </div>
                                <h4 className="mb-3">Đặt mục tiêu</h4>
                                <p className="text-muted">
                                    Đặt mục tiêu cụ thể và theo dõi tiến trình. Liên kết mục tiêu với
                                    thói quen để tạo động lực.
                                </p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-center p-4">
                                <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                                    style={{ width: '80px', height: '80px' }}>
                                    <TrendingUp size={40} className="text-warning" />
                                </div>
                                <h4 className="mb-3">Thống kê chi tiết</h4>
                                <p className="text-muted">
                                    Xem thống kê chi tiết về hiệu suất, tỷ lệ hoàn thành và xu hướng
                                    phát triển của bạn.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!isAuthenticated && (
                <section className="bg-light py-5">
                    <div className="container">
                        <div className="row justify-content-center text-center">
                            <div className="col-lg-6">
                                <h2 className="display-6 fw-bold mb-4">Sẵn sàng bắt đầu?</h2>
                                <p className="lead mb-4">
                                    Tham gia cùng hàng nghìn người dùng đã thay đổi cuộc sống của họ
                                </p>
                                <Link to="/register" className="btn btn-primary btn-lg px-5 py-3">
                                    Đăng ký miễn phí
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default Home;