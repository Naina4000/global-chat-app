import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ChatUI({
  chats,
  selectedChat,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  search,
  searchUsers,
  startChat,
  getChatName,
  getOtherUser,
  fetchMessages,
  setSelectedChat,
  unreadMessages,
  setUnreadMessages,
  onlineUsers,
  currentUserId,
  editingMessageId,
  setEditingMessageId,
  editedText,
  setEditedText,
  editMessage,
  deleteMessage,
  isTyping,
  typing,
  setTyping,
  socket,
  messagesEndRef
}) {
  const router = useRouter();

  const [openMenuId, setOpenMenuId] = useState(null);

  // ✅ CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ MARK MESSAGES AS SEEN
  useEffect(() => {
    if (selectedChat && socket) {
      socket.emit("message seen", selectedChat._id);
    }
  }, [selectedChat, socket]);

  return (
    <div className="chat-container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-top">

          <h2 className="logo">⚡ ChatApp</h2>

          <input
            className="search-input"
            placeholder="Search users..."
            value={search}
            onChange={(e) => searchUsers(e.target.value)}
          />

          <h3 className="chat-heading">Chats</h3>

          {chats.map((chat) => {
            const otherUser = getOtherUser(chat);
            const isOnline = onlineUsers.includes(otherUser?._id);

            return (
              <div
                key={chat._id}
                className="chat-item"
                onClick={() => {
                  setSelectedChat(chat);
                  fetchMessages(chat._id);
                  setUnreadMessages((prev) => ({
                    ...prev,
                    [chat._id]: 0
                  }));
                }}
              >
                <img
                  className="avatar"
                  src={
                    chat.isGroupChat
                      ? "https://cdn-icons-png.flaticon.com/512/194/194938.png"
                      : otherUser?.profilePic || "https://i.pravatar.cc/40"
                  }
                />

                <div className="chat-info">
                  <div className="chat-name">
                    {getChatName(chat)}
                    {isOnline && <span className="online-dot">●</span>}
                  </div>
                  <div className="chat-last">
                    {chat.lastMessage?.content || ""}
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        <div className="sidebar-bottom">
          <button
            className="settings-btn"
            onClick={() => router.push("/settings")}
          >
            ⚙ Settings
          </button>
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="chat-window">

        {selectedChat ? (
          <>
            {/* HEADER */}
            <div className="chat-header">
              <img
                src={getOtherUser(selectedChat)?.profilePic || "https://i.pravatar.cc/40"}
                className="header-avatar"
              />

              <div>
                <div className="chat-title">{getChatName(selectedChat)}</div>
                <div className="chat-status">
                  {isTyping ? "Typing..." : "Active now"}
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="messages">

              {messages.map((msg) => {
                const isMe = msg.sender?._id === currentUserId;

                return (
                  <div
                    key={msg._id}
                    className={`message-row ${isMe ? "me" : "other"}`}
                  >

                    {!isMe && (
                      <img
                        src={msg.sender?.profilePic || "https://i.pravatar.cc/40"}
                        className="message-avatar"
                      />
                    )}

                    <div className="message-wrapper">

                      <div className={`message ${isMe ? "me" : "other"}`}>

                        {/* MENU */}
                        {isMe && !msg.deleted && (
                          <div
                            className="menu-container"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="menu-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(
                                  openMenuId === msg._id ? null : msg._id
                                );
                              }}
                            >
                              ⋮
                            </button>

                            {openMenuId === msg._id && (
                              <div
                                className="dropdown-menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="dropdown-item"
                                  onClick={() => {
                                    setEditingMessageId(msg._id);
                                    setEditedText(msg.content);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  Edit
                                </div>

                                <div
                                  className="dropdown-item delete"
                                  onClick={() => {
                                    deleteMessage(msg._id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  Delete
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CONTENT */}
                        {editingMessageId === msg._id ? (
                          <div className="edit-box">
                            <input
                              className="edit-input"
                              value={editedText}
                              onChange={(e) =>
                                setEditedText(e.target.value)
                              }
                            />
                            <button
                              className="save-btn"
                              onClick={() => editMessage(msg._id)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="message-content">
                            <div
                              className={`message-text ${
                                msg.deleted ? "deleted" : ""
                              }`}
                            >
                              {msg.deleted
                                ? "🚫 This message was deleted"
                                : msg.content}
                            </div>

                            {/* ✅ TIME + STATUS */}
                            <div className="time-status">
                              <span className="time">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>

                              {isMe && (
                                <span
                                  className={`status ${
                                    msg.status === "seen" ? "seen" : ""
                                  }`}
                                >
                                  {msg.status === "sent" && "✓"}
                                  {msg.status === "delivered" && "✓✓"}
                                  {msg.status === "seen" && "✓✓"}
                                </span>
                              )}
                            </div>

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}

              <div ref={messagesEndRef} />

            </div>

            {/* TYPING */}
            {isTyping && (
              <div className="typing-indicator">
                typing...
              </div>
            )}

            {/* INPUT */}
            <div className="input-box">

              <input
                className="message-input"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);

                  if (!socket) return;

                  if (!typing) {
                    setTyping(true);
                    socket.emit("typing", selectedChat._id);
                  }

                  let lastTypingTime = new Date().getTime();
                  const timerLength = 3000;

                  setTimeout(() => {
                    const timeNow = new Date().getTime();
                    const timeDiff = timeNow - lastTypingTime;

                    if (timeDiff >= timerLength && typing) {
                      socket.emit("stop typing", selectedChat._id);
                      setTyping(false);
                    }
                  }, timerLength);
                }}
                placeholder="Type a message..."
              />

              <button
                className="send-btn"
                onClick={sendMessage}
              >
                ➤
              </button>

            </div>

          </>
        ) : (
          <div className="empty-chat">
            <h2>Select a chat</h2>
          </div>
        )}

      </div>
    </div>
  );
}
