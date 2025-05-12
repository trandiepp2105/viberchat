import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.scss";

const Home = () => {
  const navigate = useNavigate();

  // Automatically redirect to the Chat page
  useEffect(() => {
    navigate("/chat");
  }, [navigate]);

  return (
    <div className="home-page">
      <div className="home-page__content">
        <div className="home-page__logo">
          <i className="fas fa-comments"></i>
          <h1>ViberChat</h1>
        </div>

        <h2 className="home-page__title">Welcome to ViberChat</h2>
        <p className="home-page__description">
          Connect with friends and family through instant messages, voice calls,
          and video chats.
        </p>

        <div className="home-page__features">
          <div className="feature">
            <div className="feature__icon">
              <i className="fas fa-comment-dots"></i>
            </div>
            <h3 className="feature__title">Chat Messaging</h3>
            <p className="feature__description">
              Send messages, photos, videos, and more to your contacts.
            </p>
          </div>

          <div className="feature">
            <div className="feature__icon">
              <i className="fas fa-phone-alt"></i>
            </div>
            <h3 className="feature__title">Voice Calls</h3>
            <p className="feature__description">
              Make crystal-clear voice calls to anyone, anywhere.
            </p>
          </div>

          <div className="feature">
            <div className="feature__icon">
              <i className="fas fa-video"></i>
            </div>
            <h3 className="feature__title">Video Chats</h3>
            <p className="feature__description">
              Face-to-face video calls bring conversations to life.
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary home-page__cta"
          onClick={() => navigate("/chat")}
        >
          Start Chatting
        </button>
      </div>
    </div>
  );
};

export default Home;
