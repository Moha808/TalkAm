import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { searchUsers, getSuggestedUsers } from "../services/firebase";
import { subscribeToPosts } from "../services/firebase";
import PostCard from "../components/PostCard";
import { Avatar, Spinner, EmptyState, Input } from "../components/UI";
import { cn } from "../utils/helpers";
import { Search, TrendingUp } from "lucide-react";

export default function Explore() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setSearching(true);
        const results = await searchUsers(searchTerm.trim(), userProfile?.id);
        setSearchResults(results);
        setSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, userProfile?.id]);

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6">
      <div className="relative">
        <Search
          size={18}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2",
            dark ? "text-dark-muted" : "text-light-muted",
          )}
        />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          className={cn(
            "w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all",
            dark
              ? "bg-dark-card border border-dark-border text-dark-text placeholder:text-dark-muted/50 focus:border-primary"
              : "bg-light-card border border-light-border text-light-text placeholder:text-light-muted/50 focus:border-primary",
          )}
        />
      </div>

      {searchTerm.trim().length >= 2 ? (
        <div
          className={cn(
            "rounded-2xl overflow-hidden",
            dark
              ? "bg-dark-card border border-dark-border"
              : "bg-light-card border border-light-border shadow-sm",
          )}
        >
          {searching ? (
            <div className="flex justify-center p-8">
              <Spinner size="sm" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <p
                className={cn(
                  "text-sm",
                  dark ? "text-dark-muted" : "text-light-muted",
                )}
              >
                No users found
              </p>
            </div>
          ) : (
            searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => navigate(`/profile/${user.username}`)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 text-left transition-colors cursor-pointer",
                  dark ? "hover:bg-dark-hover" : "hover:bg-light-hover",
                )}
              >
                <Avatar src={user.photoURL} alt={user.displayName} />
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
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="text-lg font-bold">Discover</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Nothing here yet"
              description="No posts to discover"
            />
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
