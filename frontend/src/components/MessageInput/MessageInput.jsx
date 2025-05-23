import React, { useState, useEffect, useRef } from "react";
import "./MessageInput.scss";

const MessageInput = ({ onSendMessage, onInputChange }) => {
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    // Send typing indicator when user starts typing
    if (onInputChange) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Notify that user is typing
      onInputChange(text);

      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onInputChange("");
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");

      // Clear typing indicator when message is sent
      if (onInputChange) {
        onInputChange("");
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  // Clean up timeout when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className="message-input">
      <form className="message-input__form" onSubmit={handleSubmit}>
        <div className="message-input__buttons-left">
          <button type="button" className="message-input__action-btn">
            <i className="fas fa-plus"></i>
          </button>
          <button type="button" className="message-input__action-btn">
            <i className="fas fa-image"></i>
          </button>
          <button type="button" className="message-input__action-btn">
            <i className="fas fa-file-alt"></i>
          </button>
          <button type="button" className="message-input__action-btn">
            <i className="fas fa-film"></i>
          </button>
        </div>

        <div className="message-input__field-container">
          <button type="button" className="message-input__emoji-btn">
            <i className="fas fa-smile"></i>
          </button>

          <input
            type="text"
            className="message-input__field"
            placeholder="Aa"
            value={message}
            onChange={handleChange}
          />

          <button type="button" className="message-input__mic-btn">
            <i className="fas fa-microphone"></i>
          </button>
        </div>

        <button
          type="submit"
          className="message-input__send-btn"
          disabled={!message.trim()}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
