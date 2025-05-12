import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Navigation.scss";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navigation">
      <div className="navigation__logo">
        <Link to="/chat">
          <i className="fas fa-comments"></i>
          <span>ViberChat</span>
        </Link>
      </div>

      <div className="navigation__profile" ref={profileMenuRef}>
        <div
          className="navigation__avatar"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <img
            src={user?.avatar || "https://i.pravatar.cc/150?img=1"}
            alt="Profile"
          />
        </div>

        {showProfileMenu && (
          <div className="navigation__profile-menu">
            <div className="navigation__profile-info">
              <img
                src={user?.avatar || "https://i.pravatar.cc/150?img=1"}
                alt="Profile"
              />
              <div>
                <h4>{user?.username || "User"}</h4>
                <p>{user?.status || "Online"}</p>
              </div>
            </div>
            <div className="navigation__profile-actions">
              <Link to="/settings" className="navigation__profile-link">
                <i className="fas fa-user-cog"></i>
                <span>My Account</span>
              </Link>
              <button
                onClick={handleLogout}
                className="navigation__profile-link"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
