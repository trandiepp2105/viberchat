import React, { useState } from "react";
import "./MessengerLayout.scss"; // Main layout styles

// Helper function to determine file icon based on file type
const getFileIcon = (fileType) => {
  if (!fileType) return "file";
  const type = fileType.toLowerCase();
  if (type.includes("pdf")) return "file-pdf";
  if (type.includes("doc")) return "file-word";
  if (type.includes("xls")) return "file-excel";
  if (type.includes("ppt")) return "file-powerpoint";
  if (
    type.includes("jpg") ||
    type.includes("jpeg") ||
    type.includes("png") ||
    type.includes("gif")
  )
    return "file-image";
  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("tar") ||
    type.includes("gz")
  )
    return "file-archive";
  return "file";
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ContextualInfoColumn = ({
  selectedChat,
  pinnedMessages = [],
  onClose,
  className,
}) => {
  const [showPinned, setShowPinned] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showMedia, setShowMedia] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showLinks, setShowLinks] = useState(true);

  // Sample data for demonstration (should be replaced with real data)
  const sampleMediaFiles = [
    { id: 1, url: "https://via.placeholder.com/150", type: "image/jpeg" },
    { id: 2, url: "https://via.placeholder.com/150", type: "image/png" },
    { id: 3, url: "https://via.placeholder.com/150", type: "image/jpeg" },
    { id: 4, url: "https://via.placeholder.com/150", type: "image/gif" },
    { id: 5, url: "https://via.placeholder.com/150", type: "image/jpeg" },
    { id: 6, url: "https://via.placeholder.com/150", type: "image/png" },
  ];

  const sampleFiles = [
    {
      id: 1,
      name: "Document.pdf",
      type: "application/pdf",
      size: 1024 * 1024 * 2.5,
      url: "#",
    },
    {
      id: 2,
      name: "Presentation.pptx",
      type: "application/vnd.ms-powerpoint",
      size: 1024 * 1024 * 5,
      url: "#",
    },
    {
      id: 3,
      name: "Spreadsheet.xlsx",
      type: "application/vnd.ms-excel",
      size: 1024 * 1024 * 1.2,
      url: "#",
    },
  ];

  const sampleLinks = [
    {
      id: 1,
      url: "https://example.com",
      title: "Example Website",
      preview: "This is a sample website for demonstration",
    },
    {
      id: 2,
      url: "https://github.com",
      title: "GitHub",
      preview:
        "GitHub is where over 100 million developers shape the future of software",
    },
  ];
  // Get chat info for display
  const getChatInfo = () => {
    if (!selectedChat)
      return { name: "", avatar: "", isGroup: false, members: [] };

    const isGroup =
      selectedChat.name ||
      (selectedChat.participants && selectedChat.participants.length > 2);

    // For group chats: if no group name is set, display member names
    // For direct chats: if no nickname, display the person's name
    let name = "";
    if (isGroup) {
      name =
        selectedChat.name ||
        (selectedChat.participants
          ? selectedChat.participants
              .filter((p) => !p.is_self)
              .map((p) => p.username || p.nickname || p.name || "User")
              .join(", ")
          : "Group Chat");
    } else {
      // For direct chat, just show the other person's name
      name = selectedChat.participants
        ? selectedChat.participants.find((p) => !p.is_self)?.nickname ||
          selectedChat.participants.find((p) => !p.is_self)?.username ||
          selectedChat.participants.find((p) => !p.is_self)?.name ||
          "User"
        : "Chat";
    }

    const avatar = isGroup
      ? selectedChat.avatar ||
        "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA"
      : selectedChat.participants && selectedChat.participants.length > 0
      ? selectedChat.participants.find((p) => !p.is_self)?.avatar ||
        "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA"
      : "https://scontent.fsgn19-1.fna.fbcdn.net/v/t1.30497-1/453178253_471506465671661_2781666950760530985_n.png?stp=dst-png_s100x100&_nc_cat=1&ccb=1-7&_nc_sid=136b72&_nc_ohc=duGw32spGhUQ7kNvwFzBlL2&_nc_oc=Adn1Mg19a5yaVuZdzuTIlhVO_1HVCiWk80ndOZxSB4wjjm03hCXhpIW0dRugQTGWEgU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent.fsgn19-1.fna&oh=00_AfKLjwFqWH1pIRG5HLU8eAE4rQGLDdseO_vyja-jEYN5Pg&oe=6852B6FA";

    const members = selectedChat.participants || [];

    return { name, avatar, isGroup, members };
  };

  const chatInfo = getChatInfo();

  // Toggle section visibility
  const toggleSection = (section) => {
    switch (section) {
      case "pinned":
        setShowPinned(!showPinned);
        break;
      case "members":
        setShowMembers(!showMembers);
        break;
      case "media":
        setShowMedia(!showMedia);
        break;
      case "files":
        setShowFiles(!showFiles);
        break;
      case "links":
        setShowLinks(!showLinks);
        break;
      default:
        break;
    }
  };
  return (
    <div
      className={`messenger-column contextual-info-column ${className || ""}`}
    >
      <div className="contextual-info-column__header">
        {/* <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button> */}
        <h3>Conversation Details</h3>
      </div>

      {/* Profile section */}
      <div className="contextual-info-column__profile">
        <div className="contextual-info-column__profile-avatar">
          <img src={chatInfo.avatar} alt={chatInfo.name} />
        </div>
        <div className="contextual-info-column__profile-name">
          {chatInfo.name}
        </div>
        <div className="contextual-info-column__profile-status">
          {chatInfo.isGroup
            ? `${chatInfo.members.length} thành viên · Nhóm Messenger`
            : "Online"}
        </div>

        <div className="contextual-info-column__profile-actions">
          <button className="action-btn" title="Bắt đầu gọi thoại">
            <i className="fas fa-phone-alt"></i>
          </button>
          <button className="action-btn" title="Bắt đầu gọi video">
            <i className="fas fa-video"></i>
          </button>
          <button className="action-btn" title="Xem trang cá nhân">
            <i className="fas fa-user"></i>
          </button>
        </div>
      </div>

      {/* Pinned messages section */}
      <div className="contextual-info-column__section">
        <div
          className="contextual-info-column__section-header"
          onClick={() => toggleSection("pinned")}
        >
          <div className="section-title">
            <i className="fas fa-thumbtack"></i>
            <h4>Pinned Messages</h4>
          </div>
          <div className="section-actions">
            <span className="item-count">{pinnedMessages.length}</span>
            <button>
              <i className={`fas fa-chevron-${showPinned ? "up" : "down"}`}></i>
            </button>
          </div>
        </div>

        {showPinned && (
          <div className="contextual-info-column__section-content pinned-messages">
            {pinnedMessages.length > 0 ? (
              pinnedMessages.map((msg) => (
                <div className="item" key={msg.id}>
                  <div className="item__content">{msg.text || msg.content}</div>
                  <div className="item__meta">
                    Được ghim bởi {msg.pinned_by?.username || "User"} •{" "}
                    {new Date(
                      msg.pinned_at || msg.timestamp
                    ).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No pinned messages</div>
            )}
          </div>
        )}
      </div>

      {/* Members section - only shown for groups */}
      {chatInfo.isGroup && (
        <div className="contextual-info-column__section">
          <div
            className="contextual-info-column__section-header"
            onClick={() => toggleSection("members")}
          >
            <div className="section-title">
              <i className="fas fa-users"></i>
              <h4>Thành viên trong đoạn chat</h4>
            </div>
            <div className="section-actions">
              <span className="item-count">{chatInfo.members.length}</span>
              <button>
                <i
                  className={`fas fa-chevron-${showMembers ? "up" : "down"}`}
                ></i>
              </button>
            </div>
          </div>

          {showMembers && (
            <div className="contextual-info-column__members-list">
              {chatInfo.members.map((member, index) => (
                <div key={index} className="member-item">
                  <div className="member-avatar">
                    <img
                      src={member.avatar || "https://via.placeholder.com/40"}
                      alt={member.username || "User"}
                    />
                    <div
                      className={`status-indicator ${
                        member.is_online ? "online" : "offline"
                      }`}
                    ></div>
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.username || "User"}
                      {member.is_admin && (
                        <span className="admin-badge">Admin</span>
                      )}
                    </div>
                    <div className="member-status">
                      {member.is_online ? "Online" : "Không hoạt động"}
                    </div>
                  </div>
                  <div className="member-actions">
                    <button title="Chat riêng">
                      <i className="fas fa-comment"></i>
                    </button>
                  </div>
                </div>
              ))}

              <div className="add-members">
                <button>
                  <i className="fas fa-user-plus"></i>
                  <span>Thêm người</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Media section */}
      <div className="contextual-info-column__section">
        <div
          className="contextual-info-column__section-header"
          onClick={() => toggleSection("media")}
        >
          <div className="section-title">
            <i className="fas fa-images"></i>
            <h4>Media shared</h4>
          </div>
          <div className="section-actions">
            <span className="item-count">{sampleMediaFiles.length}</span>
            <button>
              <i className={`fas fa-chevron-${showMedia ? "up" : "down"}`}></i>
            </button>
          </div>
        </div>

        {showMedia && (
          <div className="contextual-info-column__media-grid">
            {sampleMediaFiles.map((media) => (
              <div key={media.id} className="media-item">
                <img src={media.url} alt="Shared media" />
              </div>
            ))}
            <div className="view-all-media">
              <button>
                <i className="fas fa-external-link-alt"></i>
                <span>Xem tất cả</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Files section */}
      <div className="contextual-info-column__section">
        <div
          className="contextual-info-column__section-header"
          onClick={() => toggleSection("files")}
        >
          <div className="section-title">
            <i className="fas fa-file-alt"></i>
            <h4>Files shared</h4>
          </div>
          <div className="section-actions">
            <span className="item-count">{sampleFiles.length}</span>
            <button>
              <i className={`fas fa-chevron-${showFiles ? "up" : "down"}`}></i>
            </button>
          </div>
        </div>

        {showFiles && (
          <div className="contextual-info-column__files-list">
            {sampleFiles.map((file) => (
              <a
                key={file.id}
                href={file.url}
                className="file-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="file-icon">
                  <i className={`fas fa-${getFileIcon(file.type)}`}></i>
                </div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
              </a>
            ))}
            <div className="view-all-files">
              <button>
                <i className="fas fa-external-link-alt"></i>
                <span>Xem tất cả</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Links section */}
      <div className="contextual-info-column__section">
        <div
          className="contextual-info-column__section-header"
          onClick={() => toggleSection("links")}
        >
          <div className="section-title">
            <i className="fas fa-link"></i>
            <h4>Links shared</h4>
          </div>
          <div className="section-actions">
            <span className="item-count">{sampleLinks.length}</span>
            <button>
              <i className={`fas fa-chevron-${showLinks ? "up" : "down"}`}></i>
            </button>
          </div>
        </div>

        {showLinks && (
          <div className="contextual-info-column__links-list">
            {sampleLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                className="link-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="link-preview">
                  <div className="link-title">{link.title}</div>
                  <div className="link-description">{link.preview}</div>
                  <div className="link-url">{link.url}</div>
                </div>
              </a>
            ))}
            <div className="view-all-links">
              <button>
                <i className="fas fa-external-link-alt"></i>
                <span>Xem tất cả</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy & Support section */}
      <div className="contextual-info-column__section privacy-section">
        <div className="contextual-info-column__section-header">
          <div className="section-title">
            <i className="fas fa-shield-alt"></i>
            <h4>Privacy & Support</h4>
          </div>
        </div>

        <div className="privacy-options">
          <div className="privacy-option">
            <i className="fas fa-ban"></i>
            <span>Block</span>
          </div>
          <div className="privacy-option">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Report</span>
          </div>
        </div>
      </div>

      {/* Customize section */}
      <div className="contextual-info-column__section customize-section">
        <div className="contextual-info-column__section-header">
          <h4>
            <i className="fas fa-paint-brush"></i> Customize chat
          </h4>
        </div>
        <div className="contextual-info-column__section-customize-options">
          <div className="option theme-option">
            <div
              className="color-dot"
              style={{ backgroundColor: "#0084ff" }}
            ></div>
            <span>Chủ đề</span>
          </div>
          <div className="option emoji-option">
            <div className="emoji-icon">👍</div>
            <span>Biểu tượng cảm xúc</span>
          </div>
          <div className="option nickname-option">
            <i className="fas fa-user-edit"></i>
            <span>Biệt danh</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextualInfoColumn;
