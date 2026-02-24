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
import {
  likePost,
  unlikePost,
  hasUserLikedPost,
  deletePost,
  getUserById,
  reportContent,
} from "../services/firebase";
import { Avatar, Modal, Button } from "./UI";
import { cn, formatDate, formatNumber } from "../utils/helpers";
import CommentSection from "./CommentSection";

export default function PostCard({ post, onDelete }) {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const [author, setAuthor] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    getUserById(post.userId).then(setAuthor);
    if (userProfile?.id) {
      hasUserLikedPost(post.id, userProfile.id).then(setLiked);
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
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: "Check out this post", url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
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
    alert("Report submitted. Thank you.");
  };

  return (
    <article
      className={cn(
        "rounded-2xl overflow-hidden animate-fade-in",
        dark
          ? "bg-dark-card border border-dark-border"
          : "bg-light-card border border-light-border shadow-sm",
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
            <p className="text-sm font-semibold">{author?.displayName}</p>
            <p
              className={cn(
                "text-xs",
                dark ? "text-dark-muted" : "text-light-muted",
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
              dark ? "hover:bg-dark-hover" : "hover:bg-light-hover",
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
                  : "bg-light-card border border-light-border shadow-lg",
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
                    dark ? "hover:bg-dark-hover" : "hover:bg-light-hover",
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
            {post.text}
          </p>
        </div>
      )}

      {/* Image */}
      {post.imageURL && (
        <div className="w-full">
          <img
            src={post.imageURL}
            alt="Post content"
            className="w-full object-cover max-h-[600px]"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-all duration-200 cursor-pointer",
              liked
                ? "text-danger"
                : dark
                  ? "text-dark-muted hover:text-danger"
                  : "text-light-muted hover:text-danger",
            )}
          >
            <Heart
              size={22}
              fill={liked ? "currentColor" : "none"}
              className={liked ? "animate-scale-in" : ""}
            />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "flex items-center gap-1.5 transition-colors cursor-pointer",
              dark
                ? "text-dark-muted hover:text-primary"
                : "text-light-muted hover:text-primary",
            )}
          >
            <MessageSquare size={22} />
          </button>
          <button
            onClick={handleShare}
            className={cn(
              "flex items-center gap-1.5 transition-colors cursor-pointer",
              dark
                ? "text-dark-muted hover:text-dark-text"
                : "text-light-muted hover:text-light-text",
            )}
          >
            <Share2 size={22} />
          </button>
        </div>

        {likesCount > 0 && (
          <p className="text-sm font-semibold">
            {formatNumber(likesCount)} {likesCount === 1 ? "like" : "likes"}
          </p>
        )}

        {post.commentsCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className={cn(
              "text-sm cursor-pointer",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            View all {post.commentsCount} comments
          </button>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection postId={post.id} postOwnerId={post.userId} />
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
                : "bg-light-bg border border-light-border text-light-text",
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
    </article>
  );
}
