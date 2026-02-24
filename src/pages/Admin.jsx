import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Navigate } from "react-router-dom";
import {
  getAllUsers,
  getReports,
  resolveReport,
  banUser,
  unbanUser,
} from "../services/firebase";
import { Avatar, Button, Spinner } from "../components/UI";
import { cn, formatDate } from "../utils/helpers";
import {
  Users,
  Flag,
  ShieldCheck,
  ShieldOff,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";

export default function Admin() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [usersData, reportsData] = await Promise.all([
      getAllUsers(),
      getReports(),
    ]);
    setUsers(usersData);
    setReports(reportsData);
    setLoading(false);
  }

  if (userProfile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "reports", label: "Reports", icon: Flag },
  ];

  const stats = {
    totalUsers: users.length,
    bannedUsers: users.filter((u) => u.banned).length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    totalPosts: users.reduce((acc, u) => acc + (u.postsCount || 0), 0),
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldCheck size={24} className="text-primary" />
        Admin Dashboard
      </h1>

      {/* Tabs */}
      <div
        className={cn(
          "flex gap-1 p-1 rounded-xl",
          dark ? "bg-dark-card border border-dark-border" : "bg-light-hover",
        )}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
              tab === id
                ? "gradient-primary text-white"
                : dark
                  ? "text-dark-muted hover:text-dark-text"
                  : "text-light-muted hover:text-light-text",
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Users",
              value: stats.totalUsers,
              color: "text-primary",
            },
            {
              label: "Banned Users",
              value: stats.bannedUsers,
              color: "text-danger",
            },
            {
              label: "Pending Reports",
              value: stats.pendingReports,
              color: "text-warning",
            },
            {
              label: "Total Posts",
              value: stats.totalPosts,
              color: "text-success",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-2xl p-4 text-center",
                dark
                  ? "bg-dark-card border border-dark-border"
                  : "bg-light-card border border-light-border shadow-sm",
              )}
            >
              <p className={cn("text-2xl font-bold", stat.color)}>
                {stat.value}
              </p>
              <p
                className={cn(
                  "text-xs mt-1",
                  dark ? "text-dark-muted" : "text-light-muted",
                )}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div
          className={cn(
            "rounded-2xl overflow-hidden",
            dark
              ? "bg-dark-card border border-dark-border"
              : "bg-light-card border border-light-border shadow-sm",
          )}
        >
          {users.map((user, i) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center justify-between p-4",
                i > 0 &&
                  (dark
                    ? "border-t border-dark-border"
                    : "border-t border-light-border"),
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={user.photoURL} alt={user.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user.displayName}
                  </p>
                  <p
                    className={cn(
                      "text-xs truncate",
                      dark ? "text-dark-muted" : "text-light-muted",
                    )}
                  >
                    @{user.username} · {user.role}
                    {user.banned && (
                      <span className="text-danger ml-2">• Banned</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {user.banned ? (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={async () => {
                      await unbanUser(user.id);
                      setUsers((prev) =>
                        prev.map((u) =>
                          u.id === user.id ? { ...u, banned: false } : u,
                        ),
                      );
                    }}
                  >
                    <ShieldCheck size={14} className="mr-1" />
                    Unban
                  </Button>
                ) : user.role !== "admin" ? (
                  <Button
                    size="xs"
                    variant="danger"
                    onClick={async () => {
                      if (confirm(`Ban ${user.displayName}?`)) {
                        await banUser(user.id);
                        setUsers((prev) =>
                          prev.map((u) =>
                            u.id === user.id ? { ...u, banned: true } : u,
                          ),
                        );
                      }
                    }}
                  >
                    <ShieldOff size={14} className="mr-1" />
                    Ban
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div
          className={cn(
            "rounded-2xl overflow-hidden",
            dark
              ? "bg-dark-card border border-dark-border"
              : "bg-light-card border border-light-border shadow-sm",
          )}
        >
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <p
                className={cn(
                  "text-sm",
                  dark ? "text-dark-muted" : "text-light-muted",
                )}
              >
                No reports
              </p>
            </div>
          ) : (
            reports.map((report, i) => (
              <div
                key={report.id}
                className={cn(
                  "p-4",
                  i > 0 &&
                    (dark
                      ? "border-t border-dark-border"
                      : "border-t border-light-border"),
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          report.status === "pending"
                            ? "bg-warning/10 text-warning"
                            : report.status === "resolved"
                              ? "bg-success/10 text-success"
                              : "bg-danger/10 text-danger",
                        )}
                      >
                        {report.status}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          dark ? "text-dark-muted" : "text-light-muted",
                        )}
                      >
                        {report.type} · {formatDate(report.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{report.reason}</p>
                  </div>
                  {report.status === "pending" && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={async () => {
                          await resolveReport(report.id, "resolved");
                          setReports((prev) =>
                            prev.map((r) =>
                              r.id === report.id
                                ? { ...r, status: "resolved" }
                                : r,
                            ),
                          );
                        }}
                      >
                        <CheckCircle size={14} />
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={async () => {
                          await resolveReport(report.id, "dismissed");
                          setReports((prev) =>
                            prev.map((r) =>
                              r.id === report.id
                                ? { ...r, status: "dismissed" }
                                : r,
                            ),
                          );
                        }}
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
