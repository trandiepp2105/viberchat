import React from "react";
import "./Header.scss";

const Header = ({ title, subtitle, avatar }) => {
  return (
    <div className="header">
      {avatar && (
        <div className="header__avatar">
          <img src={avatar} alt="Avatar" />
        </div>
      )}
      <div className="header__info">
        <h2 className="header__title">{title}</h2>
        {subtitle && <p className="header__subtitle">{subtitle}</p>}
      </div>
      <div className="header__actions">
        <button className="header__action-btn">
          <i className="fas fa-phone"></i>
        </button>
        <button className="header__action-btn">
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </div>
  );
};

export default Header;
