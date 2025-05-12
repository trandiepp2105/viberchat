import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.scss";

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <div className="not-found__icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <h1 className="not-found__title">404</h1>
        <h2 className="not-found__subtitle">Page Not Found</h2>
        <p className="not-found__message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary not-found__link">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
