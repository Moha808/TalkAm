import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { followUser, isFollowing } from "../services/firebase";
import { Avatar, Button } from "./UI";
import { cn } from "../utils/helpers";

export default function SuggestedUsers({ users }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        dark
          ? "bg-dark-card border border-dark-border"
          : "bg-light-card border border-light-border shadow-sm",
      )}
    >
      <h3 className="text-sm font-semibold mb-3">Suggested for you</h3>
      <div className="space-y-3">
        {users.map((user) => (
          <SuggestedUserItem key={user.id} user={user} dark={dark} />
        ))}
      </div>
    </div>
  );
}

function SuggestedUserItem({ user, dark }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    await followUser(userProfile.id, user.id);
    setFollowed(true);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div
        className="flex items-center gap-2 cursor-pointer min-w-0"
        onClick={() => navigate(`/profile/${user.username}`)}
      >
        <Avatar src={user.photoURL} alt={user.displayName} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.displayName}</p>
          <p
            className={cn(
              "text-xs truncate",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            @{user.username}
          </p>
        </div>
      </div>
      {!followed ? (
        <Button size="xs" onClick={handleFollow} disabled={loading}>
          Follow
        </Button>
      ) : (
        <span className="text-xs text-success font-medium">Following</span>
      )}
    </div>
  );
}
