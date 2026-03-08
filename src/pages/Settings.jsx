import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/UI";
import { cn } from "../utils/helpers";
import { Sun, Moon, LogOut, Shield, User, ChevronRight } from "lucide-react";

export default function Settings() {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sections = [
    {
      title: "Appearance",
      items: [
        {
          icon: dark ? Sun : Moon,
          label: dark ? "Switch to Light Mode" : "Switch to Dark Mode",
          onClick: toggleTheme,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          onClick: () => navigate(`/profile/${userProfile?.username}`),
        },
      ],
    },
  ];

  if (userProfile?.role === "admin") {
    sections.push({
      title: "Management",
      items: [
        {
          icon: Shield,
          label: "Admin Panel",
          onClick: () => navigate("/admin"),
        },
      ],
    });
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {sections.map((section) => (
        <div key={section.title}>
          <h3
            className={cn(
              "text-sm font-medium mb-2",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            {section.title}
          </h3>
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              dark
                ? "bg-dark-card border border-dark-border"
                : "bg-light-card border border-light-border shadow-sm",
            )}
          >
            {section.items.map(({ icon: Icon, label, onClick }, i) => (
              <button
                key={label}
                onClick={onClick}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors cursor-pointer",
                  dark ? "hover:bg-dark-hover" : "hover:bg-light-hover",
                  i > 0 &&
                    (dark
                      ? "border-t border-dark-border"
                      : "border-t border-light-border"),
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {label}
                </span>
                <ChevronRight
                  size={16}
                  className={dark ? "text-dark-muted" : "text-light-muted"}
                />
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <Button variant="danger" className="w-full" onClick={handleLogout}>
          <LogOut size={16} className="mr-2 inline" />
          Sign Out
        </Button>
      </div>

      <p
        className={cn(
          "text-center text-xs",
          dark ? "text-dark-muted" : "text-light-muted",
        )}
      >
        TalkAm v1.0.0 — Built by Mohadapwa Igal
      </p>
    </div>
  );
}
