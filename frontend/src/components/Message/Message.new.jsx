import React, { useState } from "react";
import "./Message.scss";

const Message = ({
  id,
  text,
  isMe,
  timestamp,
  isDeleted,
  isEdited,
  isPinned,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  sender,
  isGroupChat,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [showOptions, setShowOptions] = useState(false);

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedText.trim() !== text && editedText.trim() !== "") {
      onEdit(id, editedText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      onDelete(id);
    }
  };

  const handlePin = () => {
    onPin(id);
    setShowOptions(false);
  };

  const handleUnpin = () => {
    onUnpin(id);
    setShowOptions(false);
  };

  return (
    <div
      className={`message ${isMe ? "message--mine" : "message--other"} ${
        isPinned ? "message--pinned" : ""
      }`}
      onMouseEnter={() => isMe && setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {isPinned && (
        <div className="message__pin-indicator">
          <i className="fas fa-thumbtack"></i>
          <span>Pinned</span>
        </div>
      )}
      <div className="message__avatar">
        {!isMe && (
          <div className="message__avatar-img">
            <i className="fas fa-user"></i>
          </div>
        )}
      </div>
      <div className="message__content">
        {isGroupChat && !isMe && sender && (
          <div className="message__sender">{sender}</div>
        )}
        <div className="message__bubble">
          {isDeleted ? (
            <p className="message__text message__text--deleted">
              <i>This message has been deleted</i>
            </p>
          ) : isEditing ? (
            <div className="message__edit">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                autoFocus
              />
              <div className="message__edit-actions">
                <button onClick={handleSaveEdit}>Save</button>
                <button onClick={handleCancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="message__text">{text}</p>
              {isEdited && <span className="message__edited">(edited)</span>}
            </>
          )}
          <span className="message__time">{formattedTime}</span>
        </div>
      </div>

      {isMe && showOptions && !isDeleted && !isEditing && (
        <div className="message__options">
          <button
            onClick={handleEdit}
            className="message__option-btn"
            title="Edit"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={handleDelete}
            className="message__option-btn"
            title="Delete"
          >
            <i className="fas fa-trash"></i>
          </button>
          {isPinned ? (
            <button
              onClick={handleUnpin}
              className="message__option-btn"
              title="Unpin"
            >
              <i className="fas fa-thumbtack message__icon-pinned"></i>
            </button>
          ) : (
            <button
              onClick={handlePin}
              className="message__option-btn"
              title="Pin"
            >
              <i className="fas fa-thumbtack"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Message;
