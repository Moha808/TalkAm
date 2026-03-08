import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/helpers";
import { useState } from "react";
import { X, BadgeCheck } from "lucide-react";

export function Avatar({ src, alt, size = "md", className, online }) {
  const sizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    "2xl": "w-28 h-28",
  };

  const dotSizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
    "2xl": "w-4 h-4",
  };

  return (
    <div
      className={cn(
        sizes[size],
        "rounded-full overflow-hidden bg-dark-border flex-shrink-0 relative",
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || "avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold">
          {alt?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      {online && (
        <div
          className={cn(
            dotSizes[size],
            "absolute bottom-0 right-0 bg-success rounded-full border-2 border-dark-card animate-pulse-soft"
          )}
        />
      )}
    </div>
  );
}

export function VerifiedBadge({ size = 14, className }) {
  return (
    <BadgeCheck
      size={size}
      className={cn("text-primary inline-block ml-0.5 flex-shrink-0", className)}
      fill="currentColor"
      strokeWidth={0}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}) {
  const { theme } = useTheme();

  const variants = {
    primary: "gradient-primary text-white hover:opacity-90",
    secondary:
      theme === "dark"
        ? "bg-dark-card border border-dark-border text-dark-text hover:bg-dark-hover"
        : "bg-light-card border border-light-border text-light-text hover:bg-light-hover",
    ghost:
      theme === "dark"
        ? "text-dark-muted hover:text-dark-text hover:bg-dark-hover"
        : "text-light-muted hover:text-light-text hover:bg-light-hover",
    danger: "bg-danger/10 text-danger hover:bg-danger/20",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return (
    <button
      className={cn(
        "rounded-xl font-medium transition-all duration-200 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, className, ...props }) {
  const { theme } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={cn(
            "text-sm font-medium",
            theme === "dark" ? "text-dark-muted" : "text-light-muted"
          )}
        >
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200",
          theme === "dark"
            ? "bg-dark-card border border-dark-border text-dark-text placeholder:text-dark-muted/50 focus:border-primary"
            : "bg-light-card border border-light-border text-light-text placeholder:text-light-muted/50 focus:border-primary",
          error && "border-danger",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function TextArea({ label, error, className, ...props }) {
  const { theme } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={cn(
            "text-sm font-medium",
            theme === "dark" ? "text-dark-muted" : "text-light-muted"
          )}
        >
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 resize-none",
          theme === "dark"
            ? "bg-dark-card border border-dark-border text-dark-text placeholder:text-dark-muted/50 focus:border-primary"
            : "bg-light-card border border-light-border text-light-text placeholder:text-light-muted/50 focus:border-primary",
          error && "border-danger",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 animate-scale-in",
          theme === "dark"
            ? "bg-dark-card border border-dark-border"
            : "bg-light-card border border-light-border shadow-xl"
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className={cn(
                "p-1 rounded-lg transition-colors cursor-pointer",
                theme === "dark"
                  ? "hover:bg-dark-hover"
                  : "hover:bg-light-hover"
              )}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Spinner({ size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div
      className={cn(
        sizes[size],
        "border-2 border-primary border-t-transparent rounded-full animate-spin"
      )}
    />
  );
}

export function EmptyState({ icon, title, description, action }) {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-4xl mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p
        className={cn(
          "text-sm max-w-sm mb-4",
          theme === "dark" ? "text-dark-muted" : "text-light-muted"
        )}
      >
        {description}
      </p>
      {action}
    </div>
  );
}

// ==================== SKELETON LOADERS ====================

export function PostSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-dark-border/20 p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-2.5 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-3/4" />
      </div>
      <div className="skeleton h-52 w-full rounded-xl" />
      <div className="flex gap-4">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-dark-border/20 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="skeleton w-28 h-28 rounded-full" />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="skeleton h-5 w-36 mx-auto sm:mx-0" />
          <div className="skeleton h-3 w-24 mx-auto sm:mx-0" />
          <div className="skeleton h-3 w-48 mx-auto sm:mx-0" />
          <div className="flex gap-6 justify-center sm:justify-start">
            <div className="skeleton h-10 w-16 rounded-lg" />
            <div className="skeleton h-10 w-16 rounded-lg" />
            <div className="skeleton h-10 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-1">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-2.5 w-40" />
          </div>
          <div className="skeleton h-2.5 w-10" />
        </div>
      ))}
    </div>
  );
}

// ==================== IMAGE LIGHTBOX ====================

export function ImageLightbox({ src, alt, onClose }) {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
      >
        <X size={24} />
      </button>
      <img
        src={src}
        alt={alt || "Full-size image"}
        className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

