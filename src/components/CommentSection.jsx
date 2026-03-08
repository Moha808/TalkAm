import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  addComment,
  getComments,
  deleteComment,
  getUserById,
} from "../services/firebase";
import { Avatar, Button } from "./UI";
import { cn, formatDate } from "../utils/helpers";
import { Trash2, Send } from "lucide-react";

export default function CommentSection({ postId, postOwnerId, onCommentAdded, onCommentDeleted }) {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();
  const dark = theme === "dark";

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    const data = await getComments(postId);
    setComments(data);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    await addComment(postId, userProfile.id, text.trim(), postOwnerId);
    setText("");
    await loadComments();
    onCommentAdded?.();
    setPosting(false);
    toast.success("Comment posted");
  };

  const handleDelete = async (commentId) => {
    await deleteComment(commentId, postId);
    setComments(comments.filter((c) => c.id !== commentId));
    onCommentDeleted?.();
    toast.info("Comment deleted");
  };

  return (
    <div
      className={cn(
        "border-t px-4 py-3",
        dark ? "border-dark-border" : "border-light-border",
      )}
    >
      {loading ? (
        <p
          className={cn(
            "text-sm text-center py-2",
            dark ? "text-dark-muted" : "text-light-muted",
          )}
        >
          Loading comments...
        </p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              dark={dark}
              canDelete={
                comment.userId === userProfile?.id ||
                postOwnerId === userProfile?.id
              }
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Avatar
          src={userProfile?.photoURL}
          alt={userProfile?.displayName}
          size="xs"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className={cn(
            "flex-1 text-sm py-1.5 px-3 rounded-full outline-none",
            dark
              ? "bg-dark-bg border border-dark-border text-dark-text placeholder:text-dark-muted/50"
              : "bg-light-bg border border-light-border text-light-text placeholder:text-light-muted/50",
          )}
        />
        <button
          type="submit"
          disabled={!text.trim() || posting}
          className="text-primary disabled:opacity-30 cursor-pointer"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function CommentItem({ comment, dark, canDelete, onDelete }) {
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    getUserById(comment.userId).then(setAuthor);
  }, [comment.userId]);

  return (
    <div className="flex items-start gap-2 group">
      <Avatar src={author?.photoURL} alt={author?.displayName} size="xs" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{author?.displayName || "..."}</span>{" "}
          <span className={dark ? "text-dark-text" : "text-light-text"}>
            {comment.text}
          </span>
        </p>
        <p
          className={cn(
            "text-xs",
            dark ? "text-dark-muted" : "text-light-muted",
          )}
        >
          {formatDate(comment.createdAt)}
        </p>
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-danger/60 hover:text-danger transition-opacity cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
