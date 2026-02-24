import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  getUserByUsername,
  getUserPosts,
  isFollowing,
  followUser,
  unfollowUser,
  updateUserProfile,
} from "../services/firebase";
import { uploadImage, cn, formatNumber } from "../utils/helpers";
import PostCard from "../components/PostCard";
import {
  Avatar,
  Button,
  Modal,
  Input,
  Spinner,
  EmptyState,
} from "../components/UI";
import { Settings, Grid3x3, Camera, MessageCircle } from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const { userProfile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const isOwnProfile = profile?.id === userProfile?.id;

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(user);
      const userPosts = await getUserPosts(user.id);
      setPosts(userPosts);

      if (userProfile?.id && user.id !== userProfile.id) {
        const isFollowingUser = await isFollowing(userProfile.id, user.id);
        setFollowing(isFollowingUser);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setProfile(null);
    }
    setLoading(false);
  }

  const handleFollow = async () => {
    setFollowLoading(true);
    if (following) {
      await unfollowUser(userProfile.id, profile.id);
      setFollowing(false);
      setProfile((p) => ({
        ...p,
        followersCount: (p.followersCount || 1) - 1,
      }));
    } else {
      await followUser(userProfile.id, profile.id);
      setFollowing(true);
      setProfile((p) => ({
        ...p,
        followersCount: (p.followersCount || 0) + 1,
      }));
    }
    setFollowLoading(false);
  };

  const handleMessage = async () => {
    navigate("/messages", { state: { chatUserId: profile.id } });
  };

  const handleDeletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <EmptyState
          icon="👤"
          title="User not found"
          description="This profile doesn't exist."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Profile Header */}
      <div
        className={cn(
          "rounded-2xl p-6 animate-fade-in",
          dark
            ? "bg-dark-card border border-dark-border"
            : "bg-light-card border border-light-border shadow-sm",
        )}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar src={profile.photoURL} alt={profile.displayName} size="2xl" />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <h1 className="text-xl font-bold">{profile.displayName}</h1>
              {isOwnProfile ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEdit(true)}
                >
                  <Settings size={14} className="mr-1 inline" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant={following ? "secondary" : "primary"}
                    size="sm"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {following ? "Unfollow" : "Follow"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleMessage}>
                    <MessageCircle size={14} />
                  </Button>
                </div>
              )}
            </div>

            <p
              className={cn(
                "text-sm mb-3",
                dark ? "text-dark-muted" : "text-light-muted",
              )}
            >
              @{profile.username}
            </p>

            {profile.bio && (
              <p className="text-sm mb-4 whitespace-pre-wrap">{profile.bio}</p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-6">
              <div className="text-center">
                <p className="text-lg font-bold">
                  {formatNumber(profile.postsCount)}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    dark ? "text-dark-muted" : "text-light-muted",
                  )}
                >
                  Posts
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {formatNumber(profile.followersCount)}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    dark ? "text-dark-muted" : "text-light-muted",
                  )}
                >
                  Followers
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {formatNumber(profile.followingCount)}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    dark ? "text-dark-muted" : "text-light-muted",
                  )}
                >
                  Following
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Toggle */}
      <div
        className={cn(
          "flex items-center justify-center gap-8 border-b pb-2",
          dark ? "border-dark-border" : "border-light-border",
        )}
      >
        <button
          onClick={() => setViewMode("grid")}
          className={cn(
            "flex items-center gap-1 pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer",
            viewMode === "grid"
              ? "border-primary text-primary"
              : "border-transparent " +
                  (dark ? "text-dark-muted" : "text-light-muted"),
          )}
        >
          <Grid3x3 size={16} />
          Posts
        </button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <EmptyState
          icon="📷"
          title="No Posts Yet"
          description={
            isOwnProfile
              ? "Share your first post!"
              : "This user hasn't posted yet."
          }
          action={
            isOwnProfile ? (
              <Button onClick={() => navigate("/create")}>Create Post</Button>
            ) : null
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setViewMode("list")}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
            >
              {post.imageURL ? (
                <img
                  src={post.imageURL}
                  alt=""
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div
                  className={cn(
                    "w-full h-full flex items-center justify-center p-2 text-xs",
                    dark ? "bg-dark-hover" : "bg-light-hover",
                  )}
                >
                  <p className="line-clamp-4">{post.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setViewMode("grid")}
            className="text-sm text-primary font-medium cursor-pointer"
          >
            ← Back to grid
          </button>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onUpdate={async () => {
            await refreshProfile();
            await loadProfile();
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onUpdate }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(profile.photoURL || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) return setError("Display name is required");
    setLoading(true);
    setError("");
    try {
      let photoURL = profile.photoURL;
      if (imageFile) {
        photoURL = await uploadImage(imageFile);
      }
      await updateUserProfile(profile.id, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL,
      });
      onUpdate();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <label className="relative cursor-pointer group">
            <Avatar src={previewURL} alt={displayName} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <div className="space-y-1">
          <label
            className={cn(
              "text-sm font-medium",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none",
              dark
                ? "bg-dark-bg border border-dark-border text-dark-text focus:border-primary"
                : "bg-light-bg border border-light-border text-light-text focus:border-primary",
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
