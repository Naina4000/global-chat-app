"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import "./chat.css";
import ChatUI from "./ChatUI";

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
const selectedChatRef = useRef();
const messagesEndRef = useRef(null);

useEffect(() => {
  selectedChatRef.current = selectedChat;
}, [selectedChat]);

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

if (selectedChatRef.current && selectedChatRef.current._id === message.chat._id) {
return [...prevMessages, message];
}

return prevMessages;

});

if (!selectedChatRef.current || selectedChatRef.current._id !== message.chat._id) {

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

}, []);

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

/* HELPERS */
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

/* UI */
return (
  <ChatUI
    chats={chats}
    selectedChat={selectedChat}
    messages={messages}
    newMessage={newMessage}
    setNewMessage={setNewMessage}
    sendMessage={sendMessage}
    search={search}
    searchUsers={searchUsers}
    searchResults={searchResults}
    startChat={startChat}
    getChatName={getChatName}
    getOtherUser={getOtherUser}
    fetchMessages={fetchMessages}
    setSelectedChat={setSelectedChat}
    unreadMessages={unreadMessages}
    setUnreadMessages={setUnreadMessages}
    onlineUsers={onlineUsers}
    currentUserId={currentUserId}
    editingMessageId={editingMessageId}
    setEditingMessageId={setEditingMessageId}
    editedText={editedText}
    setEditedText={setEditedText}
    editMessage={editMessage}
    deleteMessage={deleteMessage}
    isTyping={isTyping}
    typing={typing}
    setTyping={setTyping}
    socket={socket}
    messagesEndRef={messagesEndRef}
  />
);
}
