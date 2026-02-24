import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, UserPlus } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { getUserById } from "../services/firebase";
import { Avatar } from "./UI";
import { cn, formatDate } from "../utils/helpers";

export default function NotificationDropdown({ onClose }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const handleClick = async (notif) => {
    await markAsRead(notif.id);
    if (notif.type === "follow") {
      navigate(`/profile/${notif.senderUsername || notif.senderId}`);
    } else if (notif.postId) {
      navigate(`/post/${notif.postId}`);
    }
    onClose();
  };

  const iconMap = {
    like: <Heart size={14} className="text-danger" />,
    comment: <MessageSquare size={14} className="text-primary" />,
    follow: <UserPlus size={14} className="text-success" />,
  };

  const textMap = {
    like: "liked your post",
    comment: "commented on your post",
    follow: "started following you",
  };

  return (
    <div
      className={cn(
        "absolute left-full ml-2 top-0 w-80 max-h-96 overflow-y-auto rounded-2xl animate-scale-in z-50",
        dark
          ? "bg-dark-card border border-dark-border"
          : "bg-light-card border border-light-border shadow-xl",
        "md:left-full md:ml-2",
        "max-md:fixed max-md:right-4 max-md:left-4 max-md:top-14 max-md:w-auto",
      )}
    >
      <div
        className={cn(
          "sticky top-0 flex items-center justify-between p-4 border-b",
          dark
            ? "bg-dark-card border-dark-border"
            : "bg-light-card border-light-border",
        )}
      >
        <h3 className="font-semibold">Notifications</h3>
        <button
          onClick={markAllAsRead}
          className="text-xs text-primary font-medium hover:underline cursor-pointer"
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <p
            className={cn(
              "text-sm",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            No notifications yet
          </p>
        </div>
      ) : (
        <div>
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              dark={dark}
              onClick={() => handleClick(notif)}
              icon={iconMap[notif.type]}
              text={textMap[notif.type]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notif, dark, onClick, icon, text }) {
  const [sender, setSender] = useState(null);

  useEffect(() => {
    getUserById(notif.senderId).then(setSender);
  }, [notif.senderId]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 text-left transition-colors cursor-pointer",
        !notif.read && (dark ? "bg-primary/5" : "bg-primary/5"),
        dark ? "hover:bg-dark-hover" : "hover:bg-light-hover",
      )}
    >
      <Avatar src={sender?.photoURL} alt={sender?.displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">
            {sender?.displayName || "Someone"}
          </span>{" "}
          <span className={dark ? "text-dark-muted" : "text-light-muted"}>
            {text}
          </span>
        </p>
        <p
          className={cn(
            "text-xs mt-0.5",
            dark ? "text-dark-muted" : "text-light-muted",
          )}
        >
          {formatDate(notif.createdAt)}
        </p>
      </div>
      <div className="flex-shrink-0">{icon}</div>
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  );
}
