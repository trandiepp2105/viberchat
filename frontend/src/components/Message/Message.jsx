import React, { useState } from "react";
import "./Message.scss";

const Message = ({
  id,
  text,
  isMe,
  timestamp,
  isDeleted,
  isEdited,
  onEdit,
  onDelete,
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

  return (
    <div
      className={`message ${isMe ? "message--mine" : "message--other"}`}
      onMouseEnter={() => isMe && setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
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

      {isMe && showOptions && !isDeleted && !isEditing && (
        <div className="message__options">
          <button onClick={handleEdit} className="message__option-btn">
            <i className="fas fa-edit"></i>
          </button>
          <button onClick={handleDelete} className="message__option-btn">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default Message;
