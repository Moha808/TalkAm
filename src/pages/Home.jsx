import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { subscribeToPosts, getSuggestedUsers } from "../services/firebase";
import PostCard from "../components/PostCard";
import SuggestedUsers from "../components/SuggestedUsers";
import { Spinner, EmptyState } from "../components/UI";
import { cn } from "../utils/helpers";

export default function Home() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [posts, setPosts] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((newPosts, newLastDoc) => {
      setPosts(newPosts);
      setLastDoc(newLastDoc);
      setHasMore(newPosts.length >= 10);
      setLoading(false);
    });

    if (userProfile?.id) {
      getSuggestedUsers(userProfile.id, 5).then(setSuggested);
    }

    return unsubscribe;
  }, [userProfile?.id]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);

    const unsubscribe = subscribeToPosts(
      (morePosts, newLastDoc) => {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const unique = morePosts.filter((p) => !ids.has(p.id));
          return [...prev, ...unique];
        });
        setLastDoc(newLastDoc);
        setHasMore(morePosts.length >= 10);
        setLoadingMore(false);
        unsubscribe();
      },
      lastDoc,
      10,
    );
  }, [hasMore, loadingMore, lastDoc]);

  // Infinite scroll
  const lastPostRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadMore, loadingMore, hasMore],
  );

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex gap-8 p-4 md:p-6">
      {/* Feed */}
      <div className="flex-1 max-w-xl mx-auto w-full space-y-6">
        {/* Stories / Quick Actions */}
        <div
          className={cn(
            "rounded-2xl p-4",
            dark
              ? "bg-dark-card border border-dark-border"
              : "bg-light-card border border-light-border shadow-sm",
          )}
        >
          <h2 className="text-lg font-bold mb-1">
            Welcome back,{" "}
            <span className="gradient-text">
              {userProfile?.displayName?.split(" ")[0]}
            </span>{" "}
            👋
          </h2>
          <p
            className={cn(
              "text-sm",
              dark ? "text-dark-muted" : "text-light-muted",
            )}
          >
            Here's what's happening in your feed.
          </p>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No Posts Yet"
            description="Follow some people or create your first post to get started!"
          />
        ) : (
          posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <PostCard post={post} onDelete={handleDeletePost} />
            </div>
          ))
        )}

        {loadingMore && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden xl:block w-72 flex-shrink-0">
        <div className="sticky top-6 space-y-6">
          {suggested.length > 0 && <SuggestedUsers users={suggested} />}

          <div
            className={cn(
              "rounded-2xl p-4",
              dark
                ? "bg-dark-card border border-dark-border"
                : "bg-light-card border border-light-border shadow-sm",
            )}
          >
            <p
              className={cn(
                "text-xs",
                dark ? "text-dark-muted" : "text-light-muted",
              )}
            >
              © 2026 TalkAm. All rights reserved.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
