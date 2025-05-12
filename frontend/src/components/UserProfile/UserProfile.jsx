import React from "react";
import "./UserProfile.scss";

const UserProfile = ({ name, avatar, status, isEditable = false }) => {
  return (
    <div className="user-profile">
      <div className="user-profile__avatar">
        <img src={avatar} alt={name} />
        <span
          className={`user-profile__status user-profile__status--${status}`}
        ></span>
      </div>
      <div className="user-profile__info">
        <h3 className="user-profile__name">{name}</h3>
        <p className="user-profile__status-text">{status}</p>
      </div>
      {isEditable && (
        <button className="user-profile__edit-btn">
          <i className="fas fa-ellipsis-v"></i>
        </button>
      )}
    </div>
  );
};

export default UserProfile;
