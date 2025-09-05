// auth/GoogleLogin.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Chrome, User, Shield } from "lucide-react";

const GoogleLogin = () => {
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const { loginWithGoogle, loading, error, isAuthenticated, clearError } =
        useAuth();

    // Clear error khi unmount hoặc login mới
    useEffect(() => {
        return () => {
            if (clearError) clearError();
        };
    }, [clearError]);

    const handleGoogleLogin = async () => {
        setMessage("");
        setMessageType("");

        try {
            const result = await loginWithGoogle();

            if (result.success) {
                setMessage("Redirecting to Google...");
                setMessageType("success");
            } else {
                setMessage(result.message || "Google sign-in failed");
                setMessageType("danger");
            }
        } catch (err) {
            setMessage("An unexpected error occurred. Please try again.");
            setMessageType("danger");
        }
    };

    // Clear local messages khi có error từ context
    useEffect(() => {
        if (error) {
            setMessage("");
            setMessageType("");
        }
    }, [error]);

    // Nếu đã login thì show màn hình redirect
    if (isAuthenticated) {
        return (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient">
                <div className="card shadow-lg border-0 text-center p-5">
                    <div className="spinner-border text-primary mb-3" role="status" />
                    <h5 className="mb-2">Login Successful!</h5>
                    <p className="text-muted mb-0">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-body p-5">
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3 shadow-sm"
                                        style={{ width: "80px", height: "80px" }}>
                                        <User size={40} />
                                    </div>
                                    <h2 className="fw-bold text-dark">Habit Tracker</h2>
                                    <p className="text-muted">
                                        Sign in with your Google account to continue
                                    </p>
                                </div>

                                {/* Alerts */}
                                {(error || (message && messageType === "danger")) && (
                                    <div className="alert alert-danger d-flex align-items-center mb-4">
                                        <Shield size={18} className="me-2" />
                                        <div>{error || message}</div>
                                    </div>
                                )}

                                {message && messageType === "success" && (
                                    <div className="alert alert-success d-flex align-items-center mb-4">
                                        <Chrome size={18} className="me-2" />
                                        <div>{message}</div>
                                    </div>
                                )}

                                {/* Google Login Button */}
                                <button
                                    type="button"
                                    className="btn btn-light w-100 d-flex align-items-center justify-content-center py-3 shadow-sm"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>
                                            Connecting to Google...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="me-2"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    fill="#4285F4"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                />
                                                <path
                                                    fill="#EA4335"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                />
                                            </svg>
                                            <span className="fw-medium">Continue with Google</span>
                                        </>
                                    )}
                                </button>

                                {/* Features */}
                                <div className="text-center mt-5">
                                    <h6 className="text-muted mb-3">Why use Habit Tracker?</h6>
                                    <div className="row g-3">
                                        <div className="col-4">
                                            <div className="p-2">
                                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                                                    style={{ width: "40px", height: "40px" }}>
                                                    <User size={20} className="text-primary" />
                                                </div>
                                                <small className="text-muted">Track Habits</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="p-2">
                                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                                                    style={{ width: "40px", height: "40px" }}>
                                                    <Shield size={20} className="text-success" />
                                                </div>
                                                <small className="text-muted">Set Goals</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="p-2">
                                                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                                                    style={{ width: "40px", height: "40px" }}>
                                                    <Chrome size={20} className="text-warning" />
                                                </div>
                                                <small className="text-muted">Stay Motivated</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleLogin;
