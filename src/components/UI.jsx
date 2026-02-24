import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/helpers";

export function Avatar({ src, alt, size = "md", className }) {
  const sizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    "2xl": "w-28 h-28",
  };

  return (
    <div
      className={cn(
        sizes[size],
        "rounded-full overflow-hidden bg-dark-border flex-shrink-0",
        className,
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
    </div>
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
        className,
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
            theme === "dark" ? "text-dark-muted" : "text-light-muted",
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
          className,
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
            theme === "dark" ? "text-dark-muted" : "text-light-muted",
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
          className,
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
            : "bg-light-card border border-light-border shadow-xl",
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className={cn(
                "p-1 rounded-lg transition-colors",
                theme === "dark"
                  ? "hover:bg-dark-hover"
                  : "hover:bg-light-hover",
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
        "border-2 border-primary border-t-transparent rounded-full animate-spin",
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
          theme === "dark" ? "text-dark-muted" : "text-light-muted",
        )}
      >
        {description}
      </p>
      {action}
    </div>
  );
}
