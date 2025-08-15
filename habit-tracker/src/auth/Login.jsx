import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      setMessage(result.message);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  const demoAccounts = [
    { username: 'admin', password: 'admin', name: 'Admin User' },
    { username: 'john_doe', password: '123', name: 'John Doe' },
    { username: 'jane_smith', password: '123', name: 'Jane Smith' }
  ];

  const loginDemo = (account) => {
    setFormData({
      username: account.username,
      password: account.password
    });
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient" 
         style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <LogIn size={48} className="text-primary mb-3" />
                  <h2 className="card-title text-dark mb-2">Đăng Nhập</h2>
                  <p className="text-muted">Chào mừng bạn trở lại!</p>
                </div>
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="alert alert-success" role="alert">
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Tên đăng nhập hoặc Email
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="admin hoặc admin@email.com"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Mật khẩu
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-lg"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang đăng nhập...
                      </>
                    ) : (
                      'Đăng Nhập'
                    )}
                  </button>
                </form>

                <div className="mb-3">
                  <p className="text-center text-muted mb-2 small">
                    Tài khoản demo:
                  </p>
                  <div className="d-grid gap-2">
                    {demoAccounts.map((account, index) => (
                      <button
                        key={index}
                        onClick={() => loginDemo(account)}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        {account.name} - {account.username}
                      </button>
                    ))}
                  </div>
                </div>

                <hr />
                <p className="text-center mb-0">
                  Chưa có tài khoản? {' '}
                  <Link to="/register" className="text-decoration-none fw-bold">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;