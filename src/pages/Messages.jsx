import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  subscribeToChats,
  subscribeToMessages,
  sendMessage,
  getOrCreateChat,
  getUserById,
  markMessagesSeen,
  setTypingStatus,
  searchUsers,
  markChatRead,
} from "../services/firebase";
import { uploadImage, cn, formatDate } from "../utils/helpers";
import { Avatar, Spinner, EmptyState, Button, ChatSkeleton } from "../components/UI";
import {
  Send,
  Image,
  ArrowLeft,
  Check,
  CheckCheck,
  PenSquare,
  Search,
  X,
} from "lucide-react";

export default function Messages() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const dark = theme === "dark";

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToChats(userProfile.id, (data) => {
      setChats(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [userProfile?.id]);

  // Handle incoming chat request from profile page
  useEffect(() => {
    async function initChat() {
      if (location.state?.chatUserId && userProfile?.id) {
        try {
          const chatId = await getOrCreateChat(
            userProfile.id,
            location.state.chatUserId,
          );
          const otherUser = await getUserById(location.state.chatUserId);
          setSelectedChat({ id: chatId, otherUser });
          markChatRead(chatId, userProfile.id).catch(() => {});
        } catch (err) {
          console.error("Failed to init chat:", err);
        }
      }
    }
    initChat();
  }, [location.state, userProfile?.id]);

  if (loading) {
    return (
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col h-screen border-r border-dark-border/20">
        <div className="p-4 border-b border-dark-border/20">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <ChatSkeleton />
      </div>
    );
  }

  const handleStartChat = async (user) => {
    try {
      const chatId = await getOrCreateChat(userProfile.id, user.id);
      setSelectedChat({ id: chatId, otherUser: user });
      setShowNewMessage(false);
      markChatRead(chatId, userProfile.id).catch(() => {});
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  return (
    <div className="flex h-screen max-h-screen md:h-[calc(100vh)] overflow-hidden">
      {/* Chat List */}
      <div
        className={cn(
          "w-full md:w-80 flex-shrink-0 flex flex-col overflow-hidden",
          dark ? "border-r border-dark-border" : "border-r border-light-border",
          selectedChat && "hidden md:flex",
        )}
      >
        <div
          className={cn(
            "p-4 border-b flex-shrink-0 flex items-center justify-between",
            dark ? "border-dark-border" : "border-light-border",
          )}
        >
          <h2 className="text-lg font-bold">Messages</h2>
          <button
            onClick={() => setShowNewMessage(true)}
            title="New message"
            className={cn(
              "p-2 rounded-xl transition-all duration-200 cursor-pointer",
              dark
                ? "text-dark-muted hover:text-primary hover:bg-dark-hover"
                : "text-light-muted hover:text-primary hover:bg-light-hover",
            )}
          >
            <PenSquare size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No messages yet"
              description="Search for someone to start chatting"
              action={
                <Button size="sm" onClick={() => setShowNewMessage(true)}>
                  <PenSquare size={14} className="mr-1.5 inline" />
                  New Message
                </Button>
              }
            />
          ) : (
            chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={userProfile.id}
                dark={dark}
                onSelect={async () => {
                  const otherId = chat.participants.find(
                    (p) => p !== userProfile.id,
                  );
                  const otherUser = await getUserById(otherId);
                  setSelectedChat({ id: chat.id, otherUser });
                  markChatRead(chat.id, userProfile.id).catch(() => {});
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <ChatWindow
          chatId={selectedChat.id}
          otherUser={selectedChat.otherUser}
          currentUserId={userProfile.id}
          dark={dark}
          onBack={() => setSelectedChat(null)}
        />
      ) : (
        <div
          className={cn(
            "hidden md:flex flex-1 items-center justify-center",
            dark ? "bg-dark-bg" : "bg-light-bg",
          )}
        >
          <EmptyState
            icon="💬"
            title="Select a conversation"
            description="Choose a chat or start a new one"
            action={
              <Button size="sm" onClick={() => setShowNewMessage(true)}>
                <PenSquare size={14} className="mr-1.5 inline" />
                New Message
              </Button>
            }
          />
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          dark={dark}
          currentUserId={userProfile.id}
          onSelect={handleStartChat}
          onClose={() => setShowNewMessage(false)}
        />
      )}
    </div>
  );
}

function ChatListItem({ chat, currentUserId, dark, onSelect }) {
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    const otherId = chat.participants.find((p) => p !== currentUserId);
    getUserById(otherId).then(setOtherUser);
  }, [chat, currentUserId]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-4 text-left transition-colors cursor-pointer",
        dark ? "hover:bg-dark-hover" : "hover:bg-light-hover",
      )}
    >
      <Avatar src={otherUser?.photoURL} alt={otherUser?.displayName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {otherUser?.displayName || "..."}
        </p>
        <p
          className={cn(
            "text-xs truncate",
            dark ? "text-dark-muted" : "text-light-muted",
          )}
        >
          {chat.lastMessage || "Start chatting"}
        </p>
      </div>
      <span
        className={cn(
          "text-xs flex-shrink-0",
          dark ? "text-dark-muted" : "text-light-muted",
        )}
      >
        {formatDate(chat.lastMessageTime)}
      </span>
    </button>
  );
}

function ChatWindow({ chatId, otherUser, currentUserId, dark, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      // Mark unseen messages as seen
      const unseen = msgs.filter(
        (m) => m.senderId !== currentUserId && !m.seen,
      );
      if (unseen.length)
        markMessagesSeen(
          chatId,
          unseen.map((m) => m.id),
        );
    });
    return unsubscribe;
  }, [chatId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(chatId, currentUserId, text.trim());
    setText("");
    setTypingStatus(chatId, currentUserId, false);
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (value) => {
    setText(value);
    setTypingStatus(chatId, currentUserId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(chatId, currentUserId, false);
    }, 2000);
  };

  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    const url = await uploadImage(file);
    await sendMessage(chatId, currentUserId, "", url);
    setSending(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 border-b flex-shrink-0",
          dark
            ? "border-dark-border bg-dark-card"
            : "border-light-border bg-light-card",
        )}
      >
        <button onClick={onBack} className="md:hidden p-1 cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <Avatar
          src={otherUser?.photoURL}
          alt={otherUser?.displayName}
          size="sm"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {otherUser?.displayName}
          </p>
          <p
            className={cn(
              "text-xs",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            @{otherUser?.username}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.senderId === currentUserId ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2.5",
                msg.senderId === currentUserId
                  ? "gradient-primary text-white rounded-br-sm"
                  : dark
                    ? "bg-dark-hover text-dark-text rounded-bl-sm"
                    : "bg-light-hover text-light-text rounded-bl-sm",
              )}
            >
              {msg.mediaURL && (
                <img
                  src={msg.mediaURL}
                  alt="Shared"
                  className="rounded-lg mb-2 max-w-full"
                />
              )}
              {msg.text && (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              )}
              <div
                className={cn(
                  "flex items-center justify-end gap-1 mt-1",
                  msg.senderId === currentUserId
                    ? "text-white/60"
                    : dark
                      ? "text-dark-muted"
                      : "text-light-muted",
                )}
              >
                <span className="text-[10px]">{formatDate(msg.createdAt)}</span>
                {msg.senderId === currentUserId &&
                  (msg.seen ? <CheckCheck size={12} /> : <Check size={12} />)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className={cn(
          "p-4 border-t flex items-center gap-2 flex-shrink-0",
          dark
            ? "border-dark-border bg-dark-card"
            : "border-light-border bg-light-card",
        )}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-2 rounded-lg cursor-pointer",
            dark
              ? "text-dark-muted hover:text-primary hover:bg-dark-hover"
              : "text-light-muted hover:text-primary hover:bg-light-hover",
          )}
        >
          <Image size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSend}
          className="hidden"
        />

        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={cn(
            "flex-1 px-4 py-2.5 rounded-full text-sm outline-none",
            dark
              ? "bg-dark-bg border border-dark-border text-dark-text placeholder:text-dark-muted/50 focus:border-primary"
              : "bg-light-bg border border-light-border text-light-text placeholder:text-light-muted/50 focus:border-primary",
          )}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-full gradient-primary text-white disabled:opacity-50 cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function NewMessageModal({ dark, currentUserId, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const users = await searchUsers(value.trim(), currentUserId);
        setResults(users);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      }
      setSearching(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden animate-fade-in",
          dark
            ? "bg-dark-card border border-dark-border"
            : "bg-light-card border border-light-border",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between p-4 border-b",
            dark ? "border-dark-border" : "border-light-border",
          )}
        >
          <h3 className="text-base font-bold">New Message</h3>
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-lg cursor-pointer transition-colors",
              dark
                ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                : "text-light-muted hover:text-light-text hover:bg-light-hover",
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b",
            dark ? "border-dark-border" : "border-light-border",
          )}
        >
          <Search
            size={18}
            className={dark ? "text-dark-muted" : "text-light-muted"}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by username..."
            className={cn(
              "flex-1 bg-transparent text-sm outline-none",
              dark
                ? "text-dark-text placeholder:text-dark-muted/50"
                : "text-light-text placeholder:text-light-muted/50",
            )}
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelect(user)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer",
                  dark ? "hover:bg-dark-hover" : "hover:bg-light-hover",
                )}
              >
                <Avatar src={user.photoURL} alt={user.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user.displayName}
                  </p>
                  <p
                    className={cn(
                      "text-xs truncate",
                      dark ? "text-dark-muted" : "text-light-muted",
                    )}
                  >
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          ) : query.trim() ? (
            <div className="py-8 text-center">
              <p
                className={cn(
                  "text-sm",
                  dark ? "text-dark-muted" : "text-light-muted",
                )}
              >
                No users found
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p
                className={cn(
                  "text-sm",
                  dark ? "text-dark-muted" : "text-light-muted",
                )}
              >
                Type a username to search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
