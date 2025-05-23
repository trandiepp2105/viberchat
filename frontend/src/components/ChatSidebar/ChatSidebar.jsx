import React, { useState, useEffect } from "react";
import "./ChatSidebar.scss";

const ChatSidebar = ({ chat, onClose }) => {
  // State for collapsible sections
  const [showPinned, setShowPinned] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showMedia, setShowMedia] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showLinks, setShowLinks] = useState(true);

  // State for loading data
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [fileItems, setFileItems] = useState([]);
  const [linkItems, setLinkItems] = useState([]);
  const [loading, setLoading] = useState({
    pinned: false,
    media: false,
    files: false,
    links: false,
  });

  const isGroupChat = chat?.is_group_chat;
  // Helper function to determine file icon based on file type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "pdf":
        return "file-pdf";
      case "doc":
      case "docx":
        return "file-word";
      case "xls":
      case "xlsx":
        return "file-excel";
      case "ppt":
      case "pptx":
        return "file-powerpoint";
      case "jpg":
      case "jpeg":
      case "png":
        return "file-image";
      case "zip":
      case "rar":
        return "file-archive";
      default:
        return "file";
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Load data when chat changes
  useEffect(() => {
    if (!chat?.id) return;

    // Create sample pinned messages
    setLoading((prev) => ({
      ...prev,
      pinned: true,
      media: true,
      files: true,
      links: true,
    }));

    // Sample data timeouts (using different timeouts to avoid race conditions)
    // Create sample pinned messages
    setTimeout(() => {
      const samplePinnedMessages = [
        {
          id: 1,
          text: "This is an important message about our project deadline",
          sender: {
            id: 1,
            name: "Jane Smith",
            avatar: "https://i.pravatar.cc/150?img=5",
          },
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          id: 2,
          text: "Here's the link to our shared document: https://docs.example.com/shared",
          sender: {
            id: 2,
            name: "John Doe",
            avatar: "https://i.pravatar.cc/150?img=3",
          },
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
      ];

      setPinnedMessages(samplePinnedMessages);
      setLoading((prev) => ({ ...prev, pinned: false }));
    }, 500);

    // Create sample media items
    setTimeout(() => {
      const sampleMediaItems = [
        {
          id: 1,
          url: "https://source.unsplash.com/random/300x300?sig=1",
          type: "image",
        },
        {
          id: 2,
          url: "https://source.unsplash.com/random/300x300?sig=2",
          type: "image",
        },
        {
          id: 3,
          url: "https://source.unsplash.com/random/300x300?sig=3",
          type: "image",
        },
        {
          id: 4,
          url: "https://source.unsplash.com/random/300x300?sig=4",
          type: "image",
        },
        {
          id: 5,
          url: "https://source.unsplash.com/random/300x300?sig=5",
          type: "image",
        },
        {
          id: 6,
          url: "https://source.unsplash.com/random/300x300?sig=6",
          type: "image",
        },
      ];

      setMediaItems(sampleMediaItems);
      setLoading((prev) => ({ ...prev, media: false }));
    }, 600);

    // Create sample file items
    setTimeout(() => {
      const sampleFileItems = [
        {
          id: 1,
          name: "Project_Report.pdf",
          type: "pdf",
          size: 2456000,
          url: "#",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          name: "Meeting_Notes.docx",
          type: "docx",
          size: 345000,
          url: "#",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 3,
          name: "Budget_2023.xlsx",
          type: "xlsx",
          size: 1250000,
          url: "#",
          timestamp: new Date(Date.now() - 259200000).toISOString(),
        },
      ];

      setFileItems(sampleFileItems);
      setLoading((prev) => ({ ...prev, files: false }));
    }, 700);

    // Create sample link items
    setTimeout(() => {
      const sampleLinkItems = [
        {
          id: 1,
          url: "https://example.com/shared-document",
          title: "Shared Document",
          sender: {
            id: 1,
            name: "Jane Smith",
          },
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          url: "https://example.com/meeting-notes",
          title: "Meeting Notes",
          sender: {
            id: 2,
            name: "John Doe",
          },
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 3,
          url: "https://example.com/project-timeline",
          title: "Project Timeline",
          sender: {
            id: 3,
            name: "Robert Johnson",
          },
          timestamp: new Date(Date.now() - 259200000).toISOString(),
        },
      ];

      setLinkItems(sampleLinkItems);
      setLoading((prev) => ({ ...prev, links: false }));
    }, 800);
  }, [chat?.id]);

  return (
    <div className="chat-sidebar">
      {" "}
      <div className="chat-sidebar__header">
        <h3>Chat Info</h3>
        <button className="chat-sidebar__close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>{" "}
      <div className="chat-sidebar__content">
        {/* Chat Info Section */}
        <div className="chat-sidebar__section chat-sidebar__info-section">
          <div className="chat-sidebar__chat-title">
            <h3>
              {chat.name
                ? chat.name
                : chat.is_group_chat
                ? chat.participants?.map((p) => p.username).join(", ")
                : // For direct chats, find the other user
                  chat.participants?.find((p) => p.id !== chat.user_id)
                    ?.username || "Chat"}
            </h3>
            {chat.is_group_chat && (
              <p>{chat.participants?.length || 0} participants</p>
            )}
          </div>
        </div>

        {/* Pinned Messages Section */}
        <div className="chat-sidebar__section">
          <div
            className="chat-sidebar__section-header"
            onClick={() => setShowPinned(!showPinned)}
          >
            <h4>
              <i className="fas fa-thumbtack"></i>
              Pinned Messages
            </h4>
            <i className={`fas fa-chevron-${showPinned ? "up" : "down"}`}></i>
          </div>{" "}
          {showPinned && (
            <div className="chat-sidebar__section-content">
              {loading.pinned ? (
                <div className="chat-sidebar__loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading pinned messages...</p>
                </div>
              ) : pinnedMessages.length > 0 ? (
                pinnedMessages.map((message) => (
                  <div
                    className="chat-sidebar__pinned-message"
                    key={message.id}
                  >
                    <div className="chat-sidebar__pinned-message-header">
                      <img
                        src={
                          message.sender.avatar ||
                          "https://i.pravatar.cc/150?img=1"
                        }
                        alt={message.sender.name}
                      />
                      <div>
                        <h5>{message.sender.name}</h5>
                        <span>
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p>{message.text}</p>
                  </div>
                ))
              ) : (
                <div className="chat-sidebar__empty">
                  <i className="fas fa-thumbtack"></i>
                  <p>No pinned messages</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Members Section (only for group chats) */}
        {isGroupChat && (
          <div className="chat-sidebar__section">
            <div
              className="chat-sidebar__section-header"
              onClick={() => setShowMembers(!showMembers)}
            >
              <h4>
                <i className="fas fa-users"></i>
                Members
              </h4>
              <i
                className={`fas fa-chevron-${showMembers ? "up" : "down"}`}
              ></i>
            </div>

            {showMembers && (
              <div className="chat-sidebar__section-content">
                {chat?.participants?.map((member) => (
                  <div className="chat-sidebar__member" key={member.id}>
                    <img
                      src={member.avatar || "https://i.pravatar.cc/150?img=1"}
                      alt={member.name}
                    />
                    <div className="chat-sidebar__member-info">
                      <h5>{member.name}</h5>
                      <p>{member.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Section */}
        <div className="chat-sidebar__section">
          <div
            className="chat-sidebar__section-header"
            onClick={() => setShowMedia(!showMedia)}
          >
            <h4>
              <i className="fas fa-images"></i>
              Media
            </h4>
            <i className={`fas fa-chevron-${showMedia ? "up" : "down"}`}></i>
          </div>{" "}
          {showMedia && (
            <div className="chat-sidebar__section-content">
              {loading.media ? (
                <div className="chat-sidebar__loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading media...</p>
                </div>
              ) : mediaItems.length > 0 ? (
                <div className="chat-sidebar__media-grid">
                  {mediaItems.map((item) => (
                    <div className="chat-sidebar__media-item" key={item.id}>
                      <img src={item.url} alt="Media" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="chat-sidebar__empty">
                  <i className="fas fa-images"></i>
                  <p>No media files</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className="chat-sidebar__section">
          <div
            className="chat-sidebar__section-header"
            onClick={() => setShowFiles(!showFiles)}
          >
            <h4>
              <i className="fas fa-file-alt"></i>
              Files
            </h4>
            <i className={`fas fa-chevron-${showFiles ? "up" : "down"}`}></i>
          </div>{" "}
          {showFiles && (
            <div className="chat-sidebar__section-content">
              {loading.files ? (
                <div className="chat-sidebar__loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading files...</p>
                </div>
              ) : fileItems.length > 0 ? (
                fileItems.map((file) => (
                  <div className="chat-sidebar__file-item" key={file.id}>
                    <i className={`fas fa-${getFileIcon(file.type)}`}></i>
                    <div className="chat-sidebar__file-info">
                      <h5>{file.name}</h5>
                      <p>
                        {formatFileSize(file.size)} •{" "}
                        {new Date(file.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={file.url}
                      download
                      className="chat-sidebar__file-download"
                    >
                      <i className="fas fa-download"></i>
                    </a>
                  </div>
                ))
              ) : (
                <div className="chat-sidebar__empty">
                  <i className="fas fa-file-alt"></i>
                  <p>No files</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Links Section */}
        <div className="chat-sidebar__section">
          <div
            className="chat-sidebar__section-header"
            onClick={() => setShowLinks(!showLinks)}
          >
            <h4>
              <i className="fas fa-link"></i>
              Links
            </h4>
            <i className={`fas fa-chevron-${showLinks ? "up" : "down"}`}></i>
          </div>{" "}
          {showLinks && (
            <div className="chat-sidebar__section-content">
              {loading.links ? (
                <div className="chat-sidebar__loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading links...</p>
                </div>
              ) : linkItems.length > 0 ? (
                linkItems.map((link) => (
                  <div className="chat-sidebar__link-item" key={link.id}>
                    <div className="chat-sidebar__link-icon">
                      <i className="fas fa-link"></i>
                    </div>
                    <div className="chat-sidebar__link-info">
                      <h5>{link.title || link.url}</h5>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.url}
                      </a>
                      <p>
                        Shared by {link.sender.name} •{" "}
                        {new Date(link.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-sidebar__empty">
                  <i className="fas fa-link"></i>
                  <p>No links</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
