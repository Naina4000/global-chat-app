"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

let socket;

export default function ChatPage() {

const [chats, setChats] = useState([]);
const [selectedChat, setSelectedChat] = useState(null);
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState("");
const [onlineUsers, setOnlineUsers] = useState([]);
const [unreadMessages, setUnreadMessages] = useState({});
const [editingMessageId, setEditingMessageId] = useState(null);
const [editedText, setEditedText] = useState("");
const [search, setSearch] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [typing, setTyping] = useState(false);
const [isTyping, setIsTyping] = useState(false);
const messagesEndRef = useRef(null);

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;

let currentUserId = null;

if (token) {
try {
currentUserId = JSON.parse(atob(token.split(".")[1])).id;
} catch {
console.log("Token decode failed");
}
}

/* ================= AUTH ================= */

useEffect(() => {
if (!token) {
window.location.href = "/login";
}
}, []);

/* ================= SOCKET ================= */

useEffect(() => {

if (!token || !currentUserId) return;

socket = io("http://localhost:5000");

socket.emit("setup", { _id: currentUserId });

socket.on("connected", () => {
console.log("Socket connected");
});

socket.on("online users", (users) => {
setOnlineUsers(users);
});

/* ================= TYPING ================= */

socket.on("typing", () => {
  setIsTyping(true);
});

socket.on("stop typing", () => {
  setIsTyping(false);
});

/* ================= NEW MESSAGE ================= */

socket.on("message received", (message) => {

setChats((prevChats) => {

const updated = prevChats.map((chat) => {

if (chat._id === message.chat._id) {
return {
...chat,
lastMessage: message
};
}

return chat;

});

updated.sort((a, b) =>
new Date(b.updatedAt) - new Date(a.updatedAt)
);

return updated;

});

setMessages((prevMessages) => {

if (selectedChat && selectedChat._id === message.chat._id) {
return [...prevMessages, message];
}

return prevMessages;

});

if (!selectedChat || selectedChat._id !== message.chat._id) {

setUnreadMessages((prev) => ({
...prev,
[message.chat._id]: (prev[message.chat._id] || 0) + 1
}));

}

});

/* ================= EDIT MESSAGE ================= */

socket.on("message edited", (updatedMessage) => {

setMessages((prev) =>
prev.map((msg) =>
msg._id === updatedMessage._id ? updatedMessage : msg
)
);

setChats((prevChats) =>
prevChats.map((chat) =>
chat._id === updatedMessage.chat._id
? { ...chat, lastMessage: updatedMessage }
: chat
)
);

});

/* ================= DELETE MESSAGE ================= */

socket.on("message deleted", ({ messageId, chatId }) => {

setMessages((prev) =>
prev.map((msg) =>
msg._id === messageId
? { ...msg, content: "🚫 This message was deleted", deleted: true }
: msg
)
);

setChats((prevChats) =>
prevChats.map((chat) =>
chat._id === chatId
? {
...chat,
lastMessage: {
...chat.lastMessage,
content: "🚫 Message deleted"
}
}
: chat
)
);

});

return () => {
socket.disconnect();
};

}, [selectedChat]);

/* ================= AUTO SCROLL ================= */

useEffect(() => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

/* ================= FETCH CHATS ================= */

const fetchChats = async () => {

try {

const res = await fetch("http://localhost:5000/api/chats", {
headers: {
Authorization: "Bearer " + token
}
});

const data = await res.json();

if (Array.isArray(data)) {
setChats(data);
}

} catch (error) {
console.error(error);
}

};

useEffect(() => {
fetchChats();
}, []);

/* ================= FETCH MESSAGES ================= */

const fetchMessages = async (chatId) => {

try {

const res = await fetch(
"http://localhost:5000/api/messages/" + chatId,
{
headers: {
Authorization: "Bearer " + token
}
}
);

const data = await res.json();

if (Array.isArray(data)) {
setMessages(data);
}

if (socket) {
socket.emit("join chat", chatId);
}

} catch (error) {
console.error(error);
}

};

/* ================= USER SEARCH ================= */

const searchUsers = async (query) => {

setSearch(query);

if (!query) {
setSearchResults([]);
return;
}

try {

const res = await fetch(
"http://localhost:5000/api/auth/search?search=" + query,
{
headers: {
Authorization: "Bearer " + token
}
}
);

const data = await res.json();

setSearchResults(data);

} catch (error) {
console.error(error);
}

};

/* ================= START CHAT ================= */

const startChat = async (userId) => {

try {

const res = await fetch(
"http://localhost:5000/api/chats",
{
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: "Bearer " + token
},
body: JSON.stringify({ userId })
}
);

const data = await res.json();

setSelectedChat(data);

fetchChats();

setSearch("");
setSearchResults([]);

fetchMessages(data._id);

} catch (error) {
console.error(error);
}

};

/* ================= SEND MESSAGE ================= */

const sendMessage = async () => {

if (!newMessage || !selectedChat) return;

try {

const res = await fetch(
"http://localhost:5000/api/messages",
{
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: "Bearer " + token
},
body: JSON.stringify({
content: newMessage,
chatId: selectedChat._id
})
}
);

const data = await res.json();

setMessages((prev) => [...prev, data]);
setNewMessage("");

if (socket) {
socket.emit("new message", data);
}

fetchChats();

} catch (error) {
console.error(error);
}

};

/* ================= EDIT MESSAGE ================= */

const editMessage = async (id) => {

try {

const res = await fetch(
"http://localhost:5000/api/messages/edit/" + id,
{
method: "PUT",
headers: {
"Content-Type": "application/json",
Authorization: "Bearer " + token
},
body: JSON.stringify({
content: editedText
})
}
);

const updated = await res.json();

setMessages((prev) =>
prev.map((msg) =>
msg._id === id ? { ...msg, content: updated.content } : msg
)
);

if (socket) {
socket.emit("edit message", {
...updated,
chat: selectedChat
});
}

setEditingMessageId(null);

} catch (error) {
console.error(error);
}

};

/* ================= DELETE MESSAGE ================= */

const deleteMessage = async (id) => {

try {

await fetch(
"http://localhost:5000/api/messages/" + id,
{
method: "DELETE",
headers: {
Authorization: "Bearer " + token
}
}
);

setMessages((prev) =>
prev.map((msg) =>
msg._id === id
? { ...msg, content: "🚫 This message was deleted", deleted: true }
: msg
)
);

if (socket) {
socket.emit("delete message", {
messageId: id,
chatId: selectedChat._id
});
}

} catch (error) {
console.error(error);
}

};

/* ================= HELPERS ================= */

const getChatName = (chat) => {

if (chat.isGroupChat) return chat.chatName;

const otherUser = chat.users.find(
(user) => user._id !== currentUserId
);

return otherUser?.username || "Private Chat";

};

const getOtherUser = (chat) => {

if (chat.isGroupChat) return null;

return chat.users.find(
(user) => user._id !== currentUserId
);

};

return (
<div style={{ display: "flex", height: "100vh" }}>

<div style={{ width: "300px", borderRight: "1px solid #444", padding: "20px" }}>

<button
onClick={() => {
localStorage.removeItem("token");
window.location.href = "/login";
}}
style={{
padding: "8px",
background: "red",
border: "none",
color: "white",
cursor: "pointer",
marginBottom: "20px"
}}
>
Logout
</button>

<input
placeholder="Search users..."
value={search}
onChange={(e) => searchUsers(e.target.value)}
style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
/>

{searchResults.map((user) => (
<div
key={user._id}
onClick={() => startChat(user._id)}
style={{
padding: "8px",
borderBottom: "1px solid #444",
cursor: "pointer"
}}
>
{user.username}
</div>
))}

<h2>Chats</h2>

{chats.map((chat) => {

const otherUser = getOtherUser(chat);
const isOnline = onlineUsers.includes(otherUser?._id);

return (

<div
key={chat._id}
onClick={() => {

setSelectedChat(chat);

if (socket) {
socket.emit("join chat", chat._id);
}

fetchMessages(chat._id);

setUnreadMessages((prev) => ({
...prev,
[chat._id]: 0
}));

}}
style={{
padding: "10px",
marginBottom: "10px",
border: "1px solid #555",
cursor: "pointer",
display: "flex",
alignItems: "center"
}}
>

<img
src={
chat.isGroupChat
? "https://cdn-icons-png.flaticon.com/512/194/194938.png"
: otherUser?.profilePic || "https://i.pravatar.cc/40"
}
style={{
width: "35px",
height: "35px",
borderRadius: "50%",
marginRight: "10px"
}}
/>

<div style={{ flex: 1 }}>

<div style={{ fontWeight: "bold" }}>
{getChatName(chat)}

{isOnline && (
<span style={{ color: "lime", marginLeft: "6px" }}>●</span>
)}

{unreadMessages[chat._id] > 0 && (
<span
style={{
background: "red",
color: "white",
borderRadius: "12px",
padding: "2px 6px",
fontSize: "12px",
marginLeft: "8px"
}}
>
{unreadMessages[chat._id]}
</span>
)}

</div>

<div style={{ fontSize: "12px", opacity: 0.7 }}>
{chat.lastMessage?.content || ""}
</div>

</div>

</div>

);

})}

</div>

{/* CHAT WINDOW */}

<div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>

{selectedChat ? (
<>
<h2>{getChatName(selectedChat)}</h2>

<div
style={{
flex: 1,
border: "1px solid #444",
padding: "15px",
overflowY: "scroll",
marginBottom: "10px",
background: "#111"
}}
>

{messages.map((msg) => {

const isMe = msg.sender?._id === currentUserId;

return (

<div
key={msg._id}
style={{
display: "flex",
justifyContent: isMe ? "flex-end" : "flex-start",
marginBottom: "12px"
}}
>

<div
style={{
background: isMe ? "#4CAF50" : "#333",
color: "white",
padding: "10px",
borderRadius: "10px",
maxWidth: "60%"
}}
>

{editingMessageId === msg._id ? (
<>
<input
value={editedText}
onChange={(e) => setEditedText(e.target.value)}
/>

<button onClick={() => editMessage(msg._id)}>
Save
</button>
</>
) : (

<div
style={{
fontStyle: msg.deleted ? "italic" : "normal",
opacity: msg.deleted ? 0.6 : 1
}}
>
{msg.content}
</div>

)}

{isMe && !msg.deleted && editingMessageId !== msg._id && (

<div style={{ fontSize: "10px", marginTop: "4px" }}>

<button
onClick={() => {
setEditingMessageId(msg._id);
setEditedText(msg.content);
}}
>
Edit
</button>

<button
onClick={() => deleteMessage(msg._id)}
style={{ marginLeft: "5px" }}
>
Delete
</button>

</div>

)}

<div
style={{
fontSize: "10px",
opacity: 0.7,
marginTop: "4px",
textAlign: "right"
}}
>
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

{isTyping && (
<div style={{ fontSize: "12px", color: "#aaa", marginBottom: "5px" }}>
typing...
</div>
)}
<div style={{ display: "flex" }}>

<input
style={{ flex: 1 }}
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
placeholder="Type message..."
/>

<button onClick={sendMessage}>
Send
</button>

</div>

</>
) : (
<h2>Select a chat</h2>
)}

</div>

</div>
);
}
