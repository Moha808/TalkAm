import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  MoreHorizontal,
  Flag,
  Bookmark,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  likePost,
  unlikePost,
  hasUserLikedPost,
  deletePost,
  getUserById,
  reportContent,
  bookmarkPost,
  unbookmarkPost,
  hasBookmarkedPost,
} from "../services/firebase";
import { Avatar, Modal, Button, ImageLightbox, VerifiedBadge } from "./UI";
import { cn, formatDate, formatNumber } from "../utils/helpers";
import CommentSection from "./CommentSection";

export default function PostCard({ post, onDelete }) {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const dark = theme === "dark";

  const [author, setAuthor] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    getUserById(post.userId).then(setAuthor);
    if (userProfile?.id) {
      hasUserLikedPost(post.id, userProfile.id).then(setLiked);
      hasBookmarkedPost(userProfile.id, post.id).then(setBookmarked);
    }
  }, [post.userId, post.id, userProfile?.id]);

  const handleLike = async () => {
    if (!userProfile) return;
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
      await unlikePost(post.id, userProfile.id);
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
      await likePost(post.id, userProfile.id, post.userId);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this post?")) {
      await deletePost(post.id, userProfile.id);
      onDelete?.(post.id);
      toast.success("Post deleted");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: "Check out this post", url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleBookmark = async () => {
    if (bookmarked) {
      setBookmarked(false);
      await unbookmarkPost(userProfile.id, post.id);
      toast.info("Removed from saved");
    } else {
      setBookmarked(true);
      await bookmarkPost(userProfile.id, post.id);
      toast.success("Post saved!");
    }
  };

  const handleReport = async () => {
    await reportContent({
      type: "post",
      contentId: post.id,
      reporterId: userProfile.id,
      reason: reportReason,
      contentOwnerId: post.userId,
    });
    setShowReport(false);
    setReportReason("");
    toast.success("Report submitted. Thank you.");
  };

  // Parse hashtags in text
  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={i}
            className="text-primary font-medium cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/explore?tag=${part.slice(1)}`);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article
      className={cn(
        "rounded-2xl overflow-hidden animate-fade-in",
        dark
          ? "bg-dark-card border border-dark-border"
          : "bg-light-card border border-light-border shadow-sm"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${author?.username}`)}
        >
          <Avatar src={author?.photoURL} alt={author?.displayName} size="md" />
          <div>
            <p className="text-sm font-semibold flex items-center gap-0.5">
              {author?.displayName}
              {author?.verified && <VerifiedBadge size={14} />}
            </p>
            <p
              className={cn(
                "text-xs",
                dark ? "text-dark-muted" : "text-light-muted"
              )}
            >
              @{author?.username} · {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              dark ? "hover:bg-dark-hover" : "hover:bg-light-hover"
            )}
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <div
              className={cn(
                "absolute right-0 top-full mt-1 w-48 rounded-xl p-1 z-20 animate-scale-in",
                dark
                  ? "bg-dark-card border border-dark-border"
                  : "bg-light-card border border-light-border shadow-lg"
              )}
            >
              {post.userId === userProfile?.id ? (
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger rounded-lg hover:bg-danger/10 cursor-pointer"
                >
                  <Trash2 size={16} />
                  Delete Post
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowReport(true);
                    setShowMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer",
                    dark ? "hover:bg-dark-hover" : "hover:bg-light-hover"
                  )}
                >
                  <Flag size={16} />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderText(post.text)}
          </p>
        </div>
      )}

      {/* Image */}
      {post.imageURL && (
        <div
          className="w-full cursor-pointer"
          onClick={() => setLightboxImage(post.imageURL)}
        >
          <img
            src={post.imageURL}
            alt="Post content"
            className="w-full object-cover max-h-[600px] hover:opacity-95 transition-opacity"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 transition-all duration-200 cursor-pointer",
                liked
                  ? "text-danger"
                  : dark
                    ? "text-dark-muted hover:text-danger"
                    : "text-light-muted hover:text-danger"
              )}
            >
              <Heart
                size={22}
                fill={liked ? "currentColor" : "none"}
                className={liked ? "animate-scale-in" : ""}
              />
              {likesCount > 0 && (
                <span className="text-sm font-semibold">
                  {formatNumber(likesCount)}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "flex items-center gap-1.5 transition-colors cursor-pointer",
                dark
                  ? "text-dark-muted hover:text-primary"
                  : "text-light-muted hover:text-primary"
              )}
            >
              <MessageSquare size={22} />
              {commentsCount > 0 && (
                <span className="text-sm font-semibold">
                  {formatNumber(commentsCount)}
                </span>
              )}
            </button>
            <button
              onClick={handleShare}
              className={cn(
                "flex items-center gap-1.5 transition-colors cursor-pointer",
                dark
                  ? "text-dark-muted hover:text-dark-text"
                  : "text-light-muted hover:text-light-text"
              )}
            >
              <Share2 size={22} />
            </button>
          </div>
          <button
            onClick={handleBookmark}
            className={cn(
              "transition-all duration-200 cursor-pointer",
              bookmarked
                ? "text-warning"
                : dark
                  ? "text-dark-muted hover:text-warning"
                  : "text-light-muted hover:text-warning"
            )}
          >
            <Bookmark
              size={22}
              fill={bookmarked ? "currentColor" : "none"}
              className={bookmarked ? "animate-scale-in" : ""}
            />
          </button>
        </div>

        {commentsCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className={cn(
              "text-sm cursor-pointer",
              dark ? "text-dark-muted" : "text-light-muted"
            )}
          >
            View all {formatNumber(commentsCount)} comments
          </button>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection
          postId={post.id}
          postOwnerId={post.userId}
          onCommentAdded={() => setCommentsCount((c) => c + 1)}
          onCommentDeleted={() => setCommentsCount((c) => Math.max(0, c - 1))}
        />
      )}

      {/* Report Modal */}
      <Modal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title="Report Post"
      >
        <div className="space-y-4">
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Why are you reporting this post?"
            className={cn(
              "w-full px-4 py-3 rounded-xl text-sm resize-none h-24 outline-none",
              dark
                ? "bg-dark-bg border border-dark-border text-dark-text"
                : "bg-light-bg border border-light-border text-light-text"
            )}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowReport(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReport}
              disabled={!reportReason.trim()}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage}
          alt="Post image"
          onClose={() => setLightboxImage(null)}
        />
      )}
    </article>
  );
}
