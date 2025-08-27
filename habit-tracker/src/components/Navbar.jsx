import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Target, Calendar, LogOut, ListChecks, User } from "lucide-react";
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

          {/* User Info + Logout */}
          <div className="d-flex align-items-center">
            <User size={18} className="me-1" />
            <span className="me-3">{user.fullName}</span>
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
