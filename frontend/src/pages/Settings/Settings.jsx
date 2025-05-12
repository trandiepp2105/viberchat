import React, { useState } from "react";
import "./Settings.scss";
import UserProfile from "../../components/UserProfile/UserProfile";

const Settings = () => {
  const [userData, setUserData] = useState({
    name: "Your Name",
    avatar: "https://i.pravatar.cc/150?img=1",
    status: "online",
    email: "your.email@example.com",
    phone: "+1234567890",
    darkMode: false,
    notifications: true,
    soundEffects: true,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="settings-page">
      <div className="settings-page__container">
        <h1 className="settings-page__title">Settings</h1>

        <div className="settings-section">
          <h2 className="settings-section__title">Profile</h2>

          <div className="settings-section__content">
            <div className="profile-preview">
              <UserProfile
                name={userData.name}
                avatar={userData.avatar}
                status={userData.status}
                isEditable={true}
              />
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={userData.status}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section__title">Preferences</h2>

          <div className="settings-section__content">
            <div className="preference-item">
              <div className="preference-item__info">
                <h3 className="preference-item__title">Dark Mode</h3>
                <p className="preference-item__description">
                  Enable dark mode for the application
                </p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="darkMode"
                  name="darkMode"
                  checked={userData.darkMode}
                  onChange={handleInputChange}
                />
                <label htmlFor="darkMode"></label>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-item__info">
                <h3 className="preference-item__title">Notifications</h3>
                <p className="preference-item__description">
                  Enable notifications for new messages
                </p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="notifications"
                  name="notifications"
                  checked={userData.notifications}
                  onChange={handleInputChange}
                />
                <label htmlFor="notifications"></label>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-item__info">
                <h3 className="preference-item__title">Sound Effects</h3>
                <p className="preference-item__description">
                  Enable sound effects for notifications
                </p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="soundEffects"
                  name="soundEffects"
                  checked={userData.soundEffects}
                  onChange={handleInputChange}
                />
                <label htmlFor="soundEffects"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-secondary">Cancel</button>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
