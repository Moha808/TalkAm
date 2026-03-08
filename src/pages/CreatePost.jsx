import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { createPost } from "../services/firebase";
import { Avatar, Button } from "../components/UI";
import { cn } from "../utils/helpers";
import { Image, X, Send } from "lucide-react";

export default function CreatePost() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const dark = theme === "dark";
  const fileInputRef = useRef(null);

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB");
        return;
      }
      setImageFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewURL("");
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageFile) {
      setError("Add some text or an image");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createPost({
        userId: userProfile.id,
        text: text.trim(),
        imageFile,
      });
      toast.success("Post created successfully!");
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <div
        className={cn(
          "rounded-2xl p-6 animate-fade-in",
          dark
            ? "bg-dark-card border border-dark-border"
            : "bg-light-card border border-light-border shadow-sm",
        )}
      >
        <h2 className="text-xl font-bold mb-6">Create Post</h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Avatar src={userProfile?.photoURL} alt={userProfile?.displayName} />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={500}
              className={cn(
                "w-full resize-none outline-none text-sm leading-relaxed",
                dark
                  ? "bg-transparent text-dark-text placeholder:text-dark-muted/50"
                  : "bg-transparent text-light-text placeholder:text-light-muted/50",
              )}
            />
            <p
              className={cn(
                "text-xs text-right",
                dark ? "text-dark-muted" : "text-light-muted",
              )}
            >
              {text.length}/500
            </p>
          </div>
        </div>

        {previewURL && (
          <div className="relative mt-4 rounded-xl overflow-hidden">
            <img
              src={previewURL}
              alt="Preview"
              className="w-full max-h-80 object-cover rounded-xl"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div
          className={cn(
            "flex items-center justify-between mt-4 pt-4 border-t",
            dark ? "border-dark-border" : "border-light-border",
          )}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
              dark
                ? "text-dark-muted hover:text-primary hover:bg-dark-hover"
                : "text-light-muted hover:text-primary hover:bg-light-hover",
            )}
          >
            <Image size={20} />
            Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <Button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !imageFile)}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>Posting...</>
            ) : (
              <>
                <Send size={16} />
                Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
