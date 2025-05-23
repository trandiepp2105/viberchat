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
            src={
              user?.avatar ||
              "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA"
            }
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
