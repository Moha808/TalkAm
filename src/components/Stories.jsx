import { useState, useEffect, useRef } from "react";
import { Plus, X, Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { getActiveStories, createStory, markStoryViewed, getUserById } from "../services/firebase";
import { Avatar, Button, Spinner, Modal } from "./UI";
import { cn, formatDate } from "../utils/helpers";

export default function Stories() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();
  const dark = theme === "dark";

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Viewing state
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  
  // Creation state
  const [showCreateStory, setShowCreateStory] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    setLoading(true);
    try {
      // Get all active stories
      const activeStories = await getActiveStories();
      
      // Group stories by user and fetch user info
      const groupedStories = {};
      for (const story of activeStories) {
        if (!groupedStories[story.userId]) {
          const user = await getUserById(story.userId);
          groupedStories[story.userId] = {
            user,
            items: [],
          };
        }
        groupedStories[story.userId].items.push(story);
      }
      
      // Convert to array and sort:
      // 1. My stories first
      // 2. Unviewed stories next
      // 3. Viewed stories last
      let formattedStories = Object.values(groupedStories)
        .filter(group => group.user) // Filter out deleted users
        .map(group => {
          // Sort items chronologically
          group.items.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
          
          const allViewed = group.items.every(item => item.viewedBy?.includes(userProfile?.id));
          return {
            ...group,
            allViewed,
            isMe: group.user.id === userProfile?.id
          };
        });

      // Sort
      formattedStories.sort((a, b) => {
        if (a.isMe) return -1;
        if (b.isMe) return 1;
        if (a.allViewed === b.allViewed) {
          // Both viewed or both unviewed, sort by latest story
          const aLatest = a.items[a.items.length - 1].createdAt?.seconds || 0;
          const bLatest = b.items[b.items.length - 1].createdAt?.seconds || 0;
          return bLatest - aLatest;
        }
        return a.allViewed ? 1 : -1;
      });

      setStories(formattedStories);
    } catch (err) {
      console.error("Failed to load stories:", err);
    }
    setLoading(false);
  }

  const handleStoryCreated = () => {
    setShowCreateStory(false);
    toast.success("Story posted!");
    loadStories();
  };

  const hasMyStory = stories.some(s => s.isMe);

  return (
    <>
      <div className={cn(
        "rounded-2xl p-4 mb-6 relative overflow-hidden",
        dark ? "bg-dark-card border border-dark-border" : "bg-light-card border border-light-border shadow-sm"
      )}>
        {/* Story Bar Container */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
          
          {/* Create Story Button */}
          {!hasMyStory && (
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer snap-start flex-shrink-0"
              onClick={() => setShowCreateStory(true)}
            >
              <div className="w-16 h-16 rounded-full p-[2px] gradient-primary relative">
                <div className={cn("w-full h-full rounded-full flex items-center justify-center relative overflow-hidden", dark ? "bg-dark-bg" : "bg-light-bg")}>
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Your story" className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <Avatar alt={userProfile?.displayName} size="full" className="opacity-60" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Plus size={24} className="text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
              <p className={cn("text-xs font-medium w-16 truncate text-center", dark ? "text-dark-text" : "text-light-text")}>
                Your Story
              </p>
            </div>
          )}

          {/* Skeletons */}
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 snap-start flex-shrink-0">
                <div className="skeleton w-16 h-16 rounded-full" />
                <div className="skeleton h-3 w-12 rounded" />
              </div>
            ))
          ) : stories.length === 0 && hasMyStory === false ? (
             <div className="flex items-center justify-center w-full min-h-[5rem]">
               <p className={cn("text-sm", dark ? "text-dark-muted" : "text-light-muted")}>
                 No recent stories. Be the first!
               </p>
             </div>
          ) : (
            /* Story Items */
            stories.map((storyGroup, index) => (
              <div 
                key={storyGroup.user.id}
                className="flex flex-col items-center gap-2 cursor-pointer snap-start flex-shrink-0 group"
                onClick={() => setActiveStoryIndex(index)}
              >
                {/* Ring */}
                <div className={cn(
                  "w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105",
                  storyGroup.allViewed ? "bg-dark-border" : "gradient-primary"
                )}>
                  <div className={cn("w-full h-full rounded-full overflow-hidden border-2", dark ? "border-dark-card" : "border-light-card")}>
                    <img 
                      src={storyGroup.user.photoURL} 
                      alt={storyGroup.user.displayName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className={cn(
                  "text-xs w-16 truncate text-center transition-colors",
                  storyGroup.allViewed 
                    ? (dark ? "text-dark-muted" : "text-light-muted")
                    : (dark ? "text-dark-text font-medium" : "text-light-text font-medium")
                )}>
                  {storyGroup.isMe ? "Your Story" : storyGroup.user.displayName?.split(" ")[0]}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Story Lightbox */}
      {activeStoryIndex !== null && (
        <StoryViewer 
          stories={stories} 
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)} 
          currentUser={userProfile}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal onClose={() => setShowCreateStory(false)} onSuccess={handleStoryCreated} />
      )}
    </>
  );
}

// ============================================
// STORY VIEWER (LIGHTBOX)
// ============================================

function StoryViewer({ stories, initialIndex, onClose, currentUser }) {
  const [groupIndex, setGroupIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentGroup = stories[groupIndex];
  const currentItem = currentGroup?.items[itemIndex];
  
  const timerRef = useRef(null);
  const STORY_DURATION = 5000; // 5 seconds per story piece

  useEffect(() => {
    // When changing story item, mark as viewed
    if (currentItem && !currentItem.viewedBy?.includes(currentUser?.id)) {
      markStoryViewed(currentItem.id, currentUser?.id).catch(console.error);
    }
  }, [currentItem, currentUser?.id]);

  useEffect(() => {
    setProgress(0);
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [groupIndex, itemIndex, isPaused]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    if (isPaused) return;

    const interval = 50; // Update progress every 50ms
    const increment = (interval / STORY_DURATION) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNext();
          return 100;
        }
        return prev + increment;
      });
    }, interval);
  };

  const handleNext = () => {
    if (itemIndex < currentGroup.items.length - 1) {
      setItemIndex(prev => prev + 1);
    } else if (groupIndex < stories.length - 1) {
      setGroupIndex(prev => prev + 1);
      setItemIndex(0);
    } else {
      onClose(); // End of all stories
    }
  };

  const handlePrev = () => {
    if (itemIndex > 0) {
      setItemIndex(prev => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setItemIndex(stories[groupIndex - 1].items.length - 1);
    } else {
      setItemIndex(0); // Restart first story
      setProgress(0);
    }
  };

  if (!currentGroup || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in sm:p-4">
      {/* Container */}
      <div className="w-full h-full sm:max-w-md sm:h-[85vh] sm:rounded-3xl overflow-hidden relative shadow-2xl bg-dark-bg flex flex-col isolation-auto">
        
        {/* Progress Bars */}
        <div className="absolute top-0 inset-x-0 p-4 pt-6 z-20 flex gap-1">
          {currentGroup.items.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width: `${idx < itemIndex ? 100 : idx === itemIndex ? progress : 0}%`
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 inset-x-0 px-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={currentGroup.user.photoURL} alt={currentGroup.user.displayName} size="sm" />
            <div className="drop-shadow-md">
              <p className="text-white text-sm font-semibold">{currentGroup.user.displayName}</p>
              <p className="text-white/70 text-xs">
                {formatDate(currentItem.createdAt)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Media Content */}
        <div className="flex-1 w-full relative flex flex-col justify-center items-center" style={{ backgroundColor: currentItem.backgroundColor }}>
          {currentItem.imageURL && (
            <img 
              src={currentItem.imageURL} 
              alt="Story" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          )}

          {/* Gradient Overlay for better text readability */}
          {(currentItem.text || currentItem.imageURL) && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
          )}

          {currentItem.text && (
            <div className="relative z-10 p-8 w-full text-center">
              <p className="text-white text-2xl font-bold leading-tight drop-shadow-lg whitespace-pre-wrap">
                {currentItem.text}
              </p>
            </div>
          )}
        </div>

        {/* Tap areas for interaction */}
        <div 
          className="absolute inset-y-0 left-0 w-1/3 z-10"
          onClick={handlePrev}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        />
        <div 
          className="absolute inset-y-0 right-0 w-2/3 z-10"
          onClick={handleNext}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        />
      </div>
    </div>
  );
}

// ============================================
// CREATE STORY MODAL
// ============================================

const PRESET_COLORS = [
  "#0ea5e9", // Primary blue
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#1e293b", // Slate
];

function CreateStoryModal({ onClose, onSuccess }) {
  const { userProfile } = useAuth();
  
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [bgColor, setBgColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewURL("");
  };

  const handlePost = async () => {
    if (!text.trim() && !imageFile) return;
    setLoading(true);
    
    try {
      await createStory({
        userId: userProfile.id,
        text: text.trim(),
        imageFile: imageFile,
        backgroundColor: bgColor
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to post story");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/90 backdrop-blur-sm">
      <div className="w-full h-full sm:max-w-md sm:h-[80vh] bg-dark-bg sm:rounded-3xl overflow-hidden flex flex-col relative animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/20 absolute top-0 inset-x-0 z-20">
          <button onClick={onClose} className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 cursor-pointer">
            <X size={20} />
          </button>
          <Button 
            size="sm" 
            onClick={handlePost} 
            disabled={(!text.trim() && !imageFile) || loading}
            className="shadow-lg"
          >
            {loading ? "Posting..." : "Share to Story"}
          </Button>
        </div>

        {/* Creative Canvas */}
        <div 
          className="flex-1 w-full relative flex flex-col items-center justify-center p-8 transition-colors duration-300"
          style={{ backgroundColor: bgColor }}
        >
          {previewURL ? (
            <>
              <img src={previewURL} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" /> {/* Overlay for text */}
              <button 
                onClick={handleRemoveImage}
                className="absolute top-20 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full z-20 transition-colors"
                title="Remove photo"
              >
                <X size={16} />
              </button>
            </>
          ) : null}

          {/* Text Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something..."
            className="w-full text-center text-3xl font-bold bg-transparent text-white placeholder-white/50 outline-none resize-none z-10 overflow-hidden drop-shadow-md"
            rows={4}
            autoFocus
          />
        </div>

        {/* Tools Palette (Bottom) */}
        <div className="bg-dark-card border-t border-dark-border p-4 absolute bottom-0 inset-x-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center w-12 h-12 bg-dark-hover rounded-full text-dark-text hover:text-white transition-colors cursor-pointer"
            >
              <Camera size={24} />
            </button>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleImage} className="hidden" />
            
            <div className="h-8 w-px bg-dark-border mx-2" />
            
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setBgColor(color)}
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full border-2 transition-transform cursor-pointer",
                    bgColor === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-80"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
