import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  getUserByUsername,
  getUserPosts,
  isFollowing,
  followUser,
  unfollowUser,
  updateUserProfile,
  getFollowers,
  getFollowing,
  getUserById,
  getUserBookmarks,
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
  ProfileSkeleton,
  PostSkeleton,
  VerifiedBadge
} from "../components/UI";
import { Settings, Grid3x3, Camera, MessageCircle, Bookmark, ImageIcon } from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const { userProfile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const dark = theme === "dark";

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid | list | saved
  const [showFollowList, setShowFollowList] = useState(null); // 'followers' | 'following' | null

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

      if (userProfile?.id && user.id === userProfile.id) {
        try {
          const bookmarks = await getUserBookmarks(userProfile.id);
          setSavedPosts(bookmarks);
        } catch (bookmarkErr) {
          console.error("Failed to load bookmarks:", bookmarkErr);
          // Don't fail the whole profile load
          setSavedPosts([]);
        }
      } else if (userProfile?.id) {
        const isFollowingUser = await isFollowing(userProfile.id, user.id);
        setFollowing(isFollowingUser);
      }
    } catch (err) {
      console.error("Failed to load profile details:", err);
      // Only set profile to null if the actual user fetch failed, but since we already check 
      // `if (!user)` at the top, any error here shouldn't nuke an existing profile.
      if (!profile) {
        setProfile(null);
      }
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
        followersCount: Math.max(0, (p.followersCount || 1) - 1),
      }));
      toast.info(`Unfollowed @${profile.username}`);
    } else {
      await followUser(userProfile.id, profile.id);
      setFollowing(true);
      setProfile((p) => ({
        ...p,
        followersCount: (p.followersCount || 0) + 1,
      }));
      toast.success(`Following @${profile.username}`);
    }
    setFollowLoading(false);
  };

  const handleMessage = () => {
    navigate("/messages", { state: { chatUserId: profile.id } });
  };

  const handleDeletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePostDeletedFromSaved = (id) => {
    setSavedPosts((prev) => prev.filter((p) => p.id !== id));
    // It shouldn't happen that a user deletes a post from the saved view unless they own it,
    // but just in case, we also update the posts list if needed.
    handleDeletePost(id); 
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <ProfileSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
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
      {/* Profile Header Card */}
      <div
        className={cn(
          "rounded-2xl overflow-hidden animate-fade-in relative",
          dark
            ? "bg-dark-card border border-dark-border"
            : "bg-light-card border border-light-border shadow-sm",
        )}
      >
        {/* Cover Photo */}
        <div className="h-32 sm:h-48 w-full bg-primary/20 relative">
          {profile.coverURL ? (
            <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-primary opacity-50" />
          )}
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 relative">
          
          {/* Avatar overlapping cover photo */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            <div className="p-1 rounded-full bg-inherit">
              <Avatar 
                src={profile.photoURL} 
                alt={profile.displayName} 
                className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white dark:border-[#1e293b]" 
              />
            </div>

            {/* Actions for Desktop */}
            <div className="hidden sm:flex items-center gap-2 mb-2">
              {isOwnProfile ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEdit(true)}
                >
                  <Settings size={14} className="mr-1.5 inline" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={handleMessage}>
                    <MessageCircle size={14} className="mr-1.5 inline" />
                    Message
                  </Button>
                  <Button
                    variant={following ? "secondary" : "primary"}
                    size="sm"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {following ? "Following" : "Follow"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-1.5">
                {profile.displayName}
                {profile.verified && <VerifiedBadge size={20} />}
              </h1>
              <p
                className={cn(
                  "text-sm mb-3",
                  dark ? "text-dark-muted" : "text-light-muted",
                )}
              >
                @{profile.username}
              </p>

              {profile.bio && (
                <p className="text-sm mb-4 whitespace-pre-wrap max-w-xl">{profile.bio}</p>
              )}

              {/* Mobile Actions */}
              <div className="flex sm:hidden items-center gap-2 w-full mb-4">
                {isOwnProfile ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowEdit(true)}
                  >
                    <Settings size={14} className="mr-1.5 inline" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={handleMessage}>
                      Message
                    </Button>
                    <Button
                      variant={following ? "secondary" : "primary"}
                      size="sm"
                      className="flex-1"
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {following ? "Following" : "Follow"}
                    </Button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-left">
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
                <div
                  className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowList("followers")}
                >
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
                <div
                  className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowList("following")}
                >
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
      </div>

      {/* Posts/Saved Tabs Toggle */}
      <div
        className={cn(
          "flex items-center justify-center gap-8 border-b",
          dark ? "border-dark-border" : "border-light-border",
        )}
      >
        <button
          onClick={() => setViewMode(viewMode === "saved" ? "grid" : viewMode)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
            viewMode !== "saved"
              ? "border-primary text-primary"
              : "border-transparent " +
                  (dark ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"),
          )}
        >
          <Grid3x3 size={16} />
          Posts
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setViewMode("saved")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
              viewMode === "saved"
                ? "border-primary text-primary"
                : "border-transparent " +
                    (dark ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"),
            )}
          >
            <Bookmark size={16} />
            Saved
          </button>
        )}
      </div>

      {/* Tab Content */}
      {viewMode === "saved" ? (
        // Saved Posts Tab
        savedPosts.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={32} className="opacity-50" />}
            title="No Saved Posts"
            description="When you save a post, it will appear here."
          />
        ) : (
          <div className="space-y-6">
            {savedPosts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handlePostDeletedFromSaved} />
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        // Empty Posts
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
        // Grid View
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setViewMode("list")}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative bg-black/5"
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
                    "w-full h-full flex items-center justify-center p-2 text-xs text-center",
                    dark ? "bg-dark-hover" : "bg-light-hover",
                  )}
                >
                  <p className="line-clamp-4 px-2">{post.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // List View
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

      {/* Modals */}
      {showFollowList && (
        <FollowListModal
          userId={profile.id}
          type={showFollowList}
          onClose={() => setShowFollowList(null)}
        />
      )}

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
  const toast = useToast();
  const dark = theme === "dark";

  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [imageFile, setImageFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(profile.photoURL || "");
  const [coverPreviewURL, setCoverPreviewURL] = useState(profile.coverURL || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) return setError("Display name is required");
    setLoading(true);
    setError("");
    try {
      let photoURL = profile.photoURL;
      let coverURL = profile.coverURL;

      // Upload profile picture if changed
      if (imageFile) {
        photoURL = await uploadImage(imageFile);
      }
      // Upload cover picture if changed
      if (coverFile) {
        coverURL = await uploadImage(coverFile);
      }

      await updateUserProfile(profile.id, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL,
        coverURL,
      });
      toast.success("Profile updated");
      onUpdate();
    } catch (err) {
      setError(err.message);
      toast.error("Failed to update profile");
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Profile">
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Cover Photo Upload */}
        <div className="relative h-32 w-full rounded-xl overflow-hidden bg-primary/20 group cursor-pointer">
          {coverPreviewURL ? (
            <img src={coverPreviewURL} alt="Cover Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-primary opacity-50" />
          )}
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <ImageIcon size={24} className="text-white mb-1" />
            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </label>
        </div>

        {/* Profile Avatar Upload */}
        <div className="flex justify-center -mt-12 relative z-10">
          <label className="relative cursor-pointer group">
            <div className="p-1 rounded-full bg-inherit bg-dark-card border-4 border-white dark:border-[#1e293b]">
              <Avatar src={previewURL} alt={displayName} size="xl" />
            </div>
            <div className="absolute inset-1 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
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

function FollowListModal({ userId, type, onClose }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ids =
          type === "followers"
            ? await getFollowers(userId)
            : await getFollowing(userId);

        const userProfiles = await Promise.all(
          ids.map((id) => getUserById(id))
        );
        setUsers(userProfiles.filter(Boolean));
      } catch (err) {
        console.error("Failed to load follow list:", err);
      }
      setLoading(false);
    }
    load();
  }, [userId, type]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={type === "followers" ? "Followers" : "Following"}
    >
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <p
            className={cn(
              "text-sm text-center py-4",
              dark ? "text-dark-muted" : "text-light-muted"
            )}
          >
            {type === "followers" ? "No followers yet." : "Not following anyone yet."}
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors",
                dark ? "hover:bg-dark-hover" : "hover:bg-light-hover"
              )}
              onClick={() => {
                onClose();
                navigate(`/profile/${user.username}`);
              }}
            >
              <Avatar src={user.photoURL} alt={user.displayName} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1 truncate">
                  {user.displayName}
                  {user.verified && <VerifiedBadge />}
                </p>
                <p
                  className={cn(
                    "text-xs truncate",
                    dark ? "text-dark-muted" : "text-light-muted"
                  )}
                >
                  @{user.username}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
