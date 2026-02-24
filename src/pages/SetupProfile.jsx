import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { isUsernameAvailable } from "../services/firebase";
import { uploadImage, cn } from "../utils/helpers";
import { Button, Input, Avatar } from "../components/UI";
import { Camera, Check, X } from "lucide-react";

export default function SetupProfile() {
  const { currentUser, createProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || "",
  );
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(currentUser?.photoURL || "");
  const [usernameAvail, setUsernameAvail] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = async (value) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._]/g, "");
    setUsername(cleaned);
    setUsernameAvail(null);

    if (cleaned.length < 3) {
      setUsernameAvail(null);
      return;
    }

    setChecking(true);
    const available = await isUsernameAvailable(cleaned);
    setUsernameAvail(available);
    setChecking(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) return setError("Display name is required");
    if (username.length < 3)
      return setError("Username must be at least 3 characters");
    if (!usernameAvail) return setError("Username is not available");

    setLoading(true);
    try {
      let photoURL = currentUser?.photoURL || "";
      if (profileImage) {
        photoURL = await uploadImage(profileImage);
      }

      await createProfile(currentUser.uid, {
        displayName: displayName.trim(),
        username,
        bio: bio.trim(),
        photoURL,
        email: currentUser.email,
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl p-8 animate-fade-in",
          dark
            ? "bg-dark-card border border-dark-border"
            : "bg-light-card border border-light-border shadow-xl",
        )}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Set Up Your Profile</h1>
          <p
            className={cn(
              "text-sm",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            Let people know who you are.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 text-danger text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <Avatar src={previewURL} alt={displayName} size="2xl" />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
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
            placeholder="Your full name"
            required
          />

          <div>
            <Input
              label="Username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your_username"
              required
            />
            {username.length >= 3 && (
              <div className="flex items-center gap-1 mt-1">
                {checking ? (
                  <span
                    className={cn(
                      "text-xs",
                      dark ? "text-dark-muted" : "text-light-muted",
                    )}
                  >
                    Checking...
                  </span>
                ) : usernameAvail ? (
                  <span className="text-xs text-success flex items-center gap-1">
                    <Check size={12} /> Available
                  </span>
                ) : (
                  <span className="text-xs text-danger flex items-center gap-1">
                    <X size={12} /> Taken
                  </span>
                )}
              </div>
            )}
          </div>

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
              placeholder="Tell us about yourself..."
              maxLength={160}
              rows={3}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all",
                dark
                  ? "bg-dark-bg border border-dark-border text-dark-text placeholder:text-dark-muted/50 focus:border-primary"
                  : "bg-light-bg border border-light-border text-light-text placeholder:text-light-muted/50 focus:border-primary",
              )}
            />
            <p
              className={cn(
                "text-xs text-right",
                dark ? "text-dark-muted" : "text-light-muted",
              )}
            >
              {bio.length}/160
            </p>
          </div>

          <Button className="w-full" disabled={loading || !usernameAvail}>
            {loading ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
}
