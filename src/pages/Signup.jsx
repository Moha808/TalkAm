import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button, Input } from "../components/UI";
import { cn } from "../utils/helpers";
import { Eye, EyeOff, MessageCircle } from "lucide-react";

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await signup(email, password);
      navigate("/setup-profile");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists");
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.isNewUser) {
        navigate("/setup-profile");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl p-8 animate-slide-up",
          dark
            ? "bg-dark-card/80 border border-dark-border backdrop-blur-xl shadow-2xl shadow-primary/5"
            : "bg-light-card/80 border border-light-border backdrop-blur-xl shadow-2xl shadow-primary/10",
        )}
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg shadow-primary/25">
            <MessageCircle size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold gradient-text mb-1">TalkAm</h1>
          <p
            className={cn(
              "text-sm",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            Create your account and get started.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute right-3 top-8 cursor-pointer transition-colors",
                dark
                  ? "text-dark-muted hover:text-dark-text"
                  : "text-light-muted hover:text-light-text",
              )}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
          <Button className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div
            className={cn(
              "flex-1 h-px",
              dark ? "bg-dark-border" : "bg-light-border",
            )}
          />
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            or
          </span>
          <div
            className={cn(
              "flex-1 h-px",
              dark ? "bg-dark-border" : "bg-light-border",
            )}
          />
        </div>

        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p
          className={cn(
            "text-center text-sm mt-6",
            dark ? "text-dark-muted" : "text-light-muted",
          )}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
