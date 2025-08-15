import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom"; 

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
        await logout();
    };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top shadow-sm border-bottom">
      <div className="container">
        {/* Logo */}
        <Link className="navbar-brand fw-bold text-primary" to="/dashboard">
          HabitTracker
        </Link>

        {/* Toggle button for mobile */}
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
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/habits">Habits</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/goals">Goals</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/checkin">Check-in</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/settings">Settings</Link>
            </li>
          </ul>

          {/* User Info + Logout */}
          <div className="d-flex align-items-center">
            <span className="me-3 fw-medium">{user.name}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
