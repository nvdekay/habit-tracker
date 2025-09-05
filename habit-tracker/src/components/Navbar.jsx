import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Target, Calendar, LogOut, ListChecks, User } from "lucide-react";
import NotificationBell from "./NotificationBell";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!isAuthenticated || !user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom sticky-top">
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand fw-bold" to="/dashboard">
          HabitTracker
        </Link>

        {/* Toggle button cho mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu items */}
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" to="/dashboard">
                <Home size={18} className="me-1" /> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" to="/habits">
                <ListChecks size={18} className="me-1" /> Habits
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" to="/goals">
                <Target size={18} className="me-1" /> Goals
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" to="/checkin">
                <Calendar size={18} className="me-1" /> Check-in
              </Link>
            </li>
          </ul>

          {/* Notification Bell and User Info */}
          <div className="d-flex align-items-center">
            {/* Notification Bell */}
            <div className="me-3">
              <NotificationBell />
            </div>

            {/* User Avatar and Info */}
            <div className="d-flex align-items-center me-3">
              {/* User Avatar */}
              <div className="me-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName || user.username}
                    className="rounded-circle"
                    style={{
                      width: '32px',
                      height: '32px',
                      objectFit: 'cover',
                      border: '2px solid #e9ecef'
                    }}
                    onError={(e) => {
                      // Fallback to User icon if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'inline-block';
                    }}
                  />
                ) : (
                  <User
                    size={32}
                    className="rounded-circle"
                    style={{ border: '2px solid #e9ecef' }}
                  />
                )}
              </div>

              {/* User Name */}
              <span className="text-dark fw-medium">
                {user.fullName || user.username}
              </span>
            </div>

            {/* Logout Button */}
            <button
              className="btn btn-outline-danger btn-sm d-flex align-items-center"
              onClick={handleLogout}
            >
              <LogOut size={16} className="me-1" /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}