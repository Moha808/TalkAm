import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return <Navigate to="/setup-profile" replace />;
  }

  if (userProfile.banned) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-danger mb-2">
            Account Suspended
          </h2>
          <p className="text-dark-muted dark:text-dark-muted">
            Your account has been suspended for violating our community
            guidelines.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
