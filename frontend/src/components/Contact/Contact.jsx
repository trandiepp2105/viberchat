import React from "react";
import "./Contact.scss";

const Contact = ({ contact, isSelected, onClick }) => {
  return (
    <div
      className={`contact ${isSelected ? "contact--selected" : ""}`}
      onClick={() => onClick(contact)}
    >
      <div className="contact__avatar">
        <img src={contact.avatar} alt={contact.name} />
        {contact.status === "online" && (
          <span className="contact__status"></span>
        )}
      </div>
      <div className="contact__info">
        <h3 className="contact__name">{contact.name}</h3>
        <p className="contact__message">{contact.lastMessage}</p>
      </div>
      <div className="contact__meta">
        <span className="contact__time">{contact.lastMessageTime}</span>
        {contact.unreadCount > 0 && (
          <span className="contact__badge">{contact.unreadCount}</span>
        )}
      </div>
    </div>
  );
};

export default Contact;
