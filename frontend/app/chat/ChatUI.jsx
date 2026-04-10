export default function ChatUI({
  chats,
  selectedChat,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  search,
  searchUsers,
  searchResults,
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

return (
<div className="chat-container">

  {/* ICON BAR */}
  <div className="icon-bar">
    <div className="icon">⚡</div>
    <div className="icon">💬</div>
    <div className="icon">📞</div>
  </div>

  {/* SIDEBAR */}
  <div className="sidebar">

    <button className="logout-btn"
    onClick={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }}>
    Logout
  </button>


     <input
    className="search-input"
    placeholder="Search users..."
    value={search}
    onChange={(e) => searchUsers(e.target.value)}
  />


    {searchResults.map((user) => (
      <div
        key={user._id}
        onClick={() => startChat(user._id)}
        className="search-item"
      >
        {user.username}
      </div>
    ))}

    <h2>Chats</h2>

    {chats.map((chat) => {

      const otherUser = getOtherUser(chat);
      const isOnline =
        otherUser && onlineUsers.includes(otherUser._id);

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

              {unreadMessages[chat._id] > 0 && (
                <span className="unread">
                  {unreadMessages[chat._id]}
                </span>
              )}

            </div>

            <div className="chat-last">
              {chat.lastMessage?.content || ""}
            </div>

          </div>

        </div>
      );
    })}

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

                <div className={`message ${isMe ? "me" : "other"}`}>

                  {/* EDIT MODE */}
                  {editingMessageId === msg._id ? (
                    <>
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
                    </>
                  ) : (
                    <div
                      className={`message-text ${
                        msg.deleted ? "deleted" : ""
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {/* ACTIONS */}
                  {isMe &&
                    !msg.deleted &&
                    editingMessageId !== msg._id && (

                      <div className="message-actions">

                        <button
                          className="edit-btn"
                          onClick={() => {
                            setEditingMessageId(msg._id);
                            setEditedText(msg.content);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => deleteMessage(msg._id)}
                        >
                          Delete
                        </button>

                      </div>
                  )}

                  {/* TIME */}
                  <div className="time">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
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
            <span></span>
            <span></span>
            <span></span>
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
