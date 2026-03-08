import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { subscribeToChats } from "../services/firebase";
import { Avatar } from "./UI";
import NotificationDropdown from "./NotificationDropdown";
import { cn } from "../utils/helpers";

export default function Layout({ children }) {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const notifRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Subscribe to chats and count ones with unread messages
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsubscribe = subscribeToChats(userProfile.id, (chats) => {
      // Count chats where the last message wasn't sent by the current user
      // and has activity (simple approach: any chat with a lastMessage counts
      // as potentially unread; for true unread we'd need per-user read markers)
      let count = 0;
      chats.forEach((chat) => {
        if (
          chat.lastMessage &&
          chat.lastSenderId &&
          chat.lastSenderId !== userProfile.id &&
          !chat[`read_${userProfile.id}`]
        ) {
          count++;
        }
      });
      setUnreadMessages(count);
    });
    return unsubscribe;
  }, [userProfile?.id]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Search, label: "Explore" },
    { to: "/create", icon: PlusSquare, label: "Create" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: `/profile/${userProfile?.username}`, icon: User, label: "Profile" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const dark = theme === "dark";

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 z-40 p-4",
          dark
            ? "bg-dark-bg border-r border-dark-border"
            : "bg-light-bg border-r border-light-border",
        )}
      >
        <div className="mb-8 px-3 pt-4">
          <h1
            className="text-2xl font-extrabold gradient-text cursor-pointer"
            onClick={() => navigate("/")}
          >
            TalkAm
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive(to)
                  ? "gradient-primary text-white"
                  : dark
                    ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                    : "text-light-muted hover:text-light-text hover:bg-light-hover",
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {label === "Messages" && unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                showNotifs
                  ? "gradient-primary text-white"
                  : dark
                    ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                    : "text-light-muted hover:text-light-text hover:bg-light-hover",
              )}
            >
              <Heart size={20} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-danger text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <NotificationDropdown onClose={() => setShowNotifs(false)} />
            )}
          </div>

          {userProfile?.role === "admin" && (
            <NavLink
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive("/admin")
                  ? "gradient-primary text-white"
                  : dark
                    ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                    : "text-light-muted hover:text-light-text hover:bg-light-hover",
              )}
            >
              <Shield size={20} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div
          className={cn(
            "space-y-1 pt-4 border-t",
            dark ? "border-dark-border" : "border-light-border",
          )}
        >
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
              dark
                ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                : "text-light-muted hover:text-light-text hover:bg-light-hover",
            )}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
            <span>{dark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <NavLink
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              dark
                ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                : "text-light-muted hover:text-light-text hover:bg-light-hover",
            )}
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-danger hover:bg-danger/10 cursor-pointer",
            )}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>

          <div
            className={cn(
              "flex items-center gap-3 px-3 py-3 mt-2 rounded-xl",
              dark ? "bg-dark-card" : "bg-light-hover",
            )}
          >
            <Avatar
              src={userProfile?.photoURL}
              alt={userProfile?.displayName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {userProfile?.displayName}
              </p>
              <p
                className={cn(
                  "text-xs truncate",
                  dark ? "text-dark-muted" : "text-light-muted",
                )}
              >
                @{userProfile?.username}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Tablet Sidebar (icons only) */}
      <aside
        className={cn(
          "hidden md:flex lg:hidden flex-col fixed left-0 top-0 h-full w-16 z-40 items-center py-4",
          dark
            ? "bg-dark-bg border-r border-dark-border"
            : "bg-light-bg border-r border-light-border",
        )}
      >
        <div className="mb-8 pt-4">
          <h1
            className="text-xl font-extrabold gradient-text cursor-pointer"
            onClick={() => navigate("/")}
          >
            T
          </h1>
        </div>

        <nav className="flex-1 flex flex-col items-center space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 relative",
                isActive(to)
                  ? "gradient-primary text-white"
                  : dark
                    ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                    : "text-light-muted hover:text-light-text hover:bg-light-hover",
              )}
            >
              <Icon size={22} />
              {label === "Messages" && unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </NavLink>
          ))}

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              title="Notifications"
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 relative cursor-pointer",
                dark
                  ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                  : "text-light-muted hover:text-light-text hover:bg-light-hover",
              )}
            >
              <Heart size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <NotificationDropdown onClose={() => setShowNotifs(false)} />
            )}
          </div>
        </nav>

        <div className="space-y-2">
          <button
            onClick={toggleTheme}
            title={dark ? "Light Mode" : "Dark Mode"}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
              dark
                ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                : "text-light-muted hover:text-light-text hover:bg-light-hover",
            )}
          >
            {dark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <NavLink to={`/profile/${userProfile?.username}`}>
            <Avatar
              src={userProfile?.photoURL}
              alt={userProfile?.displayName}
              size="sm"
            />
          </NavLink>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header
        className={cn(
          "md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4",
          dark ? "glass-dark" : "glass-light",
        )}
      >
        <h1
          className="text-xl font-extrabold gradient-text cursor-pointer"
          onClick={() => navigate("/")}
        >
          TalkAm
        </h1>
        <div className="flex items-center gap-1">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className={cn(
                "p-2 rounded-lg cursor-pointer",
                dark ? "text-dark-text" : "text-light-text",
              )}
            >
              <Heart size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-danger text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <NotificationDropdown onClose={() => setShowNotifs(false)} />
            )}
          </div>
          <NavLink
            to="/messages"
            className={cn(
              "p-2 rounded-lg relative",
              dark ? "text-dark-text" : "text-light-text",
            )}
          >
            <MessageCircle size={22} />
            {unreadMessages > 0 && (
              <span className="absolute top-0 right-0 bg-danger text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </NavLink>

          {/* Mobile Menu Button */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={cn(
                "p-2 rounded-lg cursor-pointer",
                dark ? "text-dark-text" : "text-light-text",
              )}
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
            {showMobileMenu && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-2 w-52 rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in",
                  dark
                    ? "bg-dark-card border border-dark-border"
                    : "bg-light-card border border-light-border shadow-md",
                )}
              >
                <button
                  onClick={() => {
                    toggleTheme();
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors cursor-pointer",
                    dark
                      ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                      : "text-light-muted hover:text-light-text hover:bg-light-hover",
                  )}
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{dark ? "Light Mode" : "Dark Mode"}</span>
                </button>
                <NavLink
                  to="/settings"
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                    dark
                      ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                      : "text-light-muted hover:text-light-text hover:bg-light-hover",
                  )}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </NavLink>
                {userProfile?.role === "admin" && (
                  <NavLink
                    to="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                      dark
                        ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
                        : "text-light-muted hover:text-light-text hover:bg-light-hover",
                    )}
                  >
                    <Shield size={18} />
                    <span>Admin</span>
                  </NavLink>
                )}
                <div
                  className={cn(
                    "border-t",
                    dark ? "border-dark-border" : "border-light-border",
                  )}
                />
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around",
          dark ? "glass-dark" : "glass-light",
        )}
      >
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={cn(
              "p-2 rounded-xl transition-all relative",
              isActive(to)
                ? "text-primary"
                : dark
                  ? "text-dark-muted"
                  : "text-light-muted",
            )}
          >
            <Icon size={24} />
            {label === "Messages" && unreadMessages > 0 && (
              <span className="absolute top-0 right-0 bg-danger text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-h-screen",
          "md:ml-16 lg:ml-64",
          "pt-14 pb-16 md:pt-0 md:pb-0",
        )}
      >
        {children}
      </main>
    </div>
  );
}
