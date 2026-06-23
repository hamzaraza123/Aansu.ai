import { useState, useRef, useEffect } from "react";
import { Generator } from "./components/Generator";
import { Feed, type FeedItem } from "./components/Feed";
import { INITIAL_MOCK_FEED } from "./utils/mockFeed";
import { ShareCard } from "./components/ShareCard";
import { toPng } from "html-to-image";
import { 
  getMehfilFeed, 
  publishTragedyToMehfil, 
  toggleReactionOnBackend,
  deleteTragedyFromMehfil,
  type DatabaseTragedy 
} from "./utils/api";
import { 
  Flame, 
  Users, 
  Download,
  Share2,
  Volume2,
  VolumeX
} from "lucide-react";

// Set background sitar music volume here (0.0 to 1.0)
const BACKGROUND_VOLUME = 0.02;

function App() {
  const [activeTab, setActiveTab] = useState<"gham" | "mehfil">("gham");
  const [feedItems, setFeedItems] = useState<FeedItem[]>(INITIAL_MOCK_FEED);
  const [weptPostIds, setWeptPostIds] = useState<string[]>([]);
  // User reactions state tracking { [postId]: ["laughing", "sad", etc] }
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});
  const [myPostIds, setMyPostIds] = useState<string[]>(() => {
    const stored = localStorage.getItem("my_published_post_ids");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored user post IDs:", e);
      }
    }
    return [];
  });

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Fetch Feed from Backend Database when activeTab switches to "mehfil"
  useEffect(() => {
    if (activeTab === "mehfil") {
      const loadInitialFeed = async () => {
        const result = await getMehfilFeed(1, 15);
        const mappedItems = result.feed.map((item: DatabaseTragedy) => ({
          ...item,
          id: item._id || item.id || "",
          createdTime: item.createdAt 
            ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : "Just now"
        }));
        setFeedItems(mappedItems);
        setHasMore(result.hasMore);
        setPage(1);
      };
      loadInitialFeed();
    }
  }, [activeTab]);

  const loadMoreTragedies = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const result = await getMehfilFeed(nextPage, 15);
    if (result.feed && result.feed.length > 0) {
      const mappedItems = result.feed.map((item: DatabaseTragedy) => ({
        ...item,
        id: item._id || item.id || "",
        createdTime: item.createdAt 
          ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : "Just now"
      }));
      setFeedItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const unique = mappedItems.filter((x) => !seen.has(x.id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setHasMore(result.hasMore);
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  };

  // App-level share state (for items clicked from Feed)
  const [feedShareItem, setFeedShareItem] = useState<{ inconvenience: string; poem: string } | null>(null);
  const [feedShareImage, setFeedShareImage] = useState<string | null>(null);
  const [feedShareLoading, setFeedShareLoading] = useState(false);
  const appShareCardRef = useRef<HTMLDivElement>(null);

  // Background Audio loop logic
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    let active = true;

    const handleGesture = () => {
      if (!active || isMuted) return;
      if (audio) {
        audio.play().catch((e) => {
          console.warn("Background audio playback failed on user gesture:", e);
        });
      }
      cleanupGesture();
    };

    const cleanupGesture = () => {
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("touchend", handleGesture);
      document.removeEventListener("keydown", handleGesture);
    };

    if (!isMuted) {
      // Recreate a new Audio element
      audio = new Audio("/sitar.mp3");
      audio.loop = true;
      audio.volume = BACKGROUND_VOLUME;
      audioRef.current = audio;

      const playAudio = () => {
        if (audio) {
          audio.play().catch(() => {
            // Listen on the document to capture gestures across all elements on mobile/desktop
            document.addEventListener("click", handleGesture);
            document.addEventListener("touchend", handleGesture);
            document.addEventListener("keydown", handleGesture);
          });
        }
      };

      if (audio) {
        audio.currentTime = 0; // Restart from start
      }
      playAudio();
    } else {
      // Muted: stop and completely delete/release current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    }

    return () => {
      active = false;
      cleanupGesture();
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const switchTab = (tab: "gham" | "mehfil") => {
    setActiveTab(tab);
    if (tab === "gham") {
      setPage(1);
      setHasMore(false);
      setIsLoadingMore(false);
    }
  };

  // Callback to append generated poems to the Mehfil feed state
  const handlePublishToMehfil = async (item: { 
    inconvenience: string; 
    poem: string; 
    poetName: string; 
  }) => {
    let publishedId = `user-${Date.now()}`;
    try {
      const savedPost = await publishTragedyToMehfil(item.inconvenience, item.poem, item.poetName);
      if (savedPost) {
        const newItem: FeedItem = {
          ...savedPost,
          id: savedPost._id || savedPost.id || "",
          createdTime: "Just now"
        };
        publishedId = newItem.id;
        setFeedItems((prev) => [newItem, ...prev]);
      } else {
        const newItem: FeedItem = {
          id: publishedId,
          inconvenience: item.inconvenience,
          poem: item.poem,
          poetName: item.poetName,
          weepsCount: 0,
          createdTime: "Just now",
          reactions: { laughing: 0, sad: 0, hands: 0, heart: 0 }
        };
        setFeedItems((prev) => [newItem, ...prev]);
      }
    } catch (err) {
      console.warn("Failed to publish to server, fallback to local state:", err);
      const newItem: FeedItem = {
        id: publishedId,
        inconvenience: item.inconvenience,
        poem: item.poem,
        poetName: item.poetName,
        weepsCount: 0,
        createdTime: "Just now",
        reactions: { laughing: 0, sad: 0, hands: 0, heart: 0 }
      };
      setFeedItems((prev) => [newItem, ...prev]);
    }

    // Save published ID locally to enable deletion capability
    setMyPostIds((prev) => {
      const updated = [...prev, publishedId];
      localStorage.setItem("my_published_post_ids", JSON.stringify(updated));
      return updated;
    });

    switchTab("mehfil"); // switch tabs to view the Mehfil immediately!
  };

  // Callback to delete a post that belongs to the current user
  const handleDeletePost = async (postId: string) => {
    try {
      // If it is a local fallback dummy ID, we don't call server
      if (!postId.startsWith("user-")) {
        const success = await deleteTragedyFromMehfil(postId);
        if (!success) {
          throw new Error("Server rejected post deletion.");
        }
      }
      // Clean from UI feed state
      setFeedItems((prev) => prev.filter((x) => x.id !== postId));
      // Clean from user owned list
      setMyPostIds((prev) => {
        const updated = prev.filter((id) => id !== postId);
        localStorage.setItem("my_published_post_ids", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Sitam ki had ho gayi! (Failed to delete the post. Details: " + (err as Error).message + ")");
    }
  };

  const handleReactToggle = (id: string, reactionType: "laughing" | "sad" | "hands" | "heart") => {
    const postReactions = userReactions[id] || [];
    const hasReacted = postReactions.includes(reactionType);
    const hasWept = weptPostIds.includes(id);

    let updatedWeptPostIds = [...weptPostIds];
    let updatedFeedItems = [...feedItems];

    // 1. Untoggle wept if it was active
    if (hasWept) {
      updatedWeptPostIds = weptPostIds.filter((pId) => pId !== id);
      updatedFeedItems = updatedFeedItems.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            weepsCount: Math.max(0, item.weepsCount - 1),
          };
        }
        return item;
      });
      // Sync decrement wept on server
      toggleReactionOnBackend(id, "weeps", false);
    }

    // 2. Untoggle other active reactions (at most one)
    const activeReaction = postReactions[0] as "laughing" | "sad" | "hands" | "heart" | undefined;
    if (activeReaction && activeReaction !== reactionType) {
      updatedFeedItems = updatedFeedItems.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            reactions: {
              ...item.reactions,
              [activeReaction]: Math.max(0, (item.reactions?.[activeReaction] || 0) - 1),
            },
          };
        }
        return item;
      });
      // Sync decrement previous reaction on server
      toggleReactionOnBackend(id, activeReaction, false);
    }

    // 3. Toggle the target reaction
    if (hasReacted) {
      setUserReactions((prev) => ({
        ...prev,
        [id]: [],
      }));
      setFeedItems(() =>
        updatedFeedItems.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              reactions: {
                ...item.reactions,
                [reactionType]: Math.max(0, (item.reactions?.[reactionType] || 0) - 1),
              },
            };
          }
          return item;
        })
      );
      // Sync decrement target reaction on server
      toggleReactionOnBackend(id, reactionType, false);
    } else {
      setUserReactions((prev) => ({
        ...prev,
        [id]: [reactionType],
      }));
      setFeedItems(() =>
        updatedFeedItems.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              reactions: {
                ...item.reactions,
                [reactionType]: (item.reactions?.[reactionType] || 0) + 1,
              },
            };
          }
          return item;
        })
      );
      // Sync increment target reaction on server
      toggleReactionOnBackend(id, reactionType, true);
    }

    setWeptPostIds(updatedWeptPostIds);
  };

  const handleWeepIncrement = (id: string) => {
    const hasWept = weptPostIds.includes(id);
    const postReactions = userReactions[id] || [];
    const activeReaction = postReactions[0] as "laughing" | "sad" | "hands" | "heart" | undefined;

    const updatedReactions = { ...userReactions };
    let updatedFeedItems = [...feedItems];

    // 1. Untoggle any active other reaction if we are toggling wept
    if (activeReaction) {
      updatedReactions[id] = [];
      updatedFeedItems = updatedFeedItems.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            reactions: {
              ...item.reactions,
              [activeReaction]: Math.max(0, (item.reactions?.[activeReaction] || 0) - 1),
            },
          };
        }
        return item;
      });
      // Sync decrement reaction on backend
      toggleReactionOnBackend(id, activeReaction, false);
    }

    // 2. Toggle wept status
    if (hasWept) {
      setWeptPostIds((prev) => prev.filter((pId) => pId !== id));
      setFeedItems(() =>
        updatedFeedItems.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              weepsCount: Math.max(0, item.weepsCount - 1),
            };
          }
          return item;
        })
      );
      // Sync decrement wept on backend
      toggleReactionOnBackend(id, "weeps", false);
    } else {
      setWeptPostIds((prev) => [...prev, id]);
      setFeedItems(() =>
        updatedFeedItems.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              weepsCount: item.weepsCount + 1,
            };
          }
          return item;
        })
      );
      // Sync increment wept on backend
      toggleReactionOnBackend(id, "weeps", true);
    }

    setUserReactions(updatedReactions);
  };

  // Helper to trigger direct image download
  const downloadFeedImage = (dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `mehfil-tragedy-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to trigger native Web Share API
  const shareFeedNatively = async (dataUrl: string, item: { inconvenience: string }) => {
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], "mehfil-tragedy.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Tragedy shared from Mehfil - Aansu.ai",
            text: `Ro lo thoda! Here's a tragic Marsiya about "${item.inconvenience}" 😭`,
          });
        }
      } catch (err) {
        console.warn("Web Share API failed:", err);
      }
    }
  };

  // Generate screenshot and open share panel for elements clicked in the Feed
  const handleTriggerFeedShare = async (item: { inconvenience: string; poem: string }) => {
    setFeedShareItem(item);
    setFeedShareImage(null);
    setFeedShareLoading(true);

    // Wait for the ref to render
    setTimeout(async () => {
      if (appShareCardRef.current) {
        try {
          const dataUrl = await toPng(appShareCardRef.current, { cacheBust: true });
          setFeedShareImage(dataUrl);

          const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
          
          if (isMobile) {
            await shareFeedNatively(dataUrl, item);
          } else {
            downloadFeedImage(dataUrl);
          }
        } catch (err) {
          console.error("Feed image rendering failed:", err);
        } finally {
          setFeedShareLoading(false);
        }
      }
    }, 300);
  };

  return (
    <>
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: -10 }}
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <div className="min-h-screen bg-mourn-black text-white flex flex-col justify-between max-w-lg mx-auto relative border-x border-white/20 shadow-2xl z-10">
      
      {/* App Level hidden element for feed post share screenshots */}
      {feedShareItem && (
        <div className="absolute left-[-9999px] top-[-9999px]">
          <ShareCard ref={appShareCardRef} inconvenience={feedShareItem.inconvenience} poem={feedShareItem.poem} />
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-stone-300 px-4 py-3 flex justify-between items-center shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        
        {/* Decorative candle left */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-6 bg-stone-850 rounded-t relative overflow-hidden flex flex-col justify-end border border-stone-300 shadow-sm">
            <div className="w-full h-1/2 bg-stone-500" />
            {/* flame */}
            <div className="absolute -top-1 left-0.5 w-1 h-2 bg-yellow-500 rounded-full candle-glow" />
          </div>
          <div>
            <h1 className="font-heading-vintage text-md tracking-wider text-stone-900">
              AANSU.AI
            </h1>
            <p className="text-[9px] text-stone-500 uppercase tracking-widest font-gothic">
              Hazar gham ka ek mehfil
            </p>
          </div>
        </div>

        {/* Audio Mute/Unmute toggle */}
        <button
          onClick={toggleMute}
          className="p-2.5 rounded-full border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-black transition-all cursor-pointer shadow-sm flex items-center justify-center"
          title={isMuted ? "Unmute Sitar" : "Mute Sitar"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </header>

      {/* Main Container Viewport (scrollable content area) */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        
        {/* Logo and Intro Section (only on Generator view) */}
        {activeTab === "gham" && (
          <div className="text-center mb-6 space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#074B88] border border-white/40 flex items-center justify-center shadow-xl animate-pulse">
              <span className="text-2xl">😭</span>
            </div>
            <p className="text-white font-serif text-sm italic font-medium leading-relaxed max-w-sm mx-auto">
              "Dil-e-naadaan tujhe hua kya hai, <br/>
              Aakhir is dard ki dawa kya hai?"
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/80 font-gothic uppercase">
              <span>A 19th-Century Marsiya (Elegy) Generator</span>
            </div>
          </div>
        )}

        {/* Toggle dynamic view depending on active bottom tab */}
        {activeTab === "gham" ? (
          <Generator onPublish={handlePublishToMehfil} />
        ) : (
          <Feed 
            feedItems={feedItems} 
            weptPostIds={weptPostIds} 
            onWeep={handleWeepIncrement} 
            userReactions={userReactions}
            onReactToggle={handleReactToggle}
            onShareItem={handleTriggerFeedShare}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreTragedies}
            myPostIds={myPostIds}
            onDeletePost={handleDeletePost}
          />
        )}
      </main>

      {/* Bottom Nav Bar (fixed position for mobile feel) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t-4 border-stone-300 px-6 py-2 grid grid-cols-[1fr_auto_1fr] items-center shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-40 h-16 rounded-t-2xl">
        
        {/* Tab 1: Gham (Generator) */}
        <button
          onClick={() => switchTab("gham")}
          className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === "gham"
              ? "bg-[#074B88]/10 text-black font-bold"
              : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
          }`}
        >
          <Flame
            size={18}
            className={`transition-transform ${activeTab === "gham" ? "animate-pulse text-black" : "text-stone-400"}`}
          />
          <span className="text-[10px] font-heading-vintage uppercase tracking-wider mt-1">
            Gham (Generator)
          </span>
        </button>

        {/* Sleek Vertical Divider */}
        <div className="w-[1px] h-8 bg-black opacity-80" />

        {/* Tab 2: Mehfil (Community Feed) */}
        <button
          onClick={() => switchTab("mehfil")}
          className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === "mehfil"
              ? "bg-[#074B88]/10 text-black font-bold"
              : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
          }`}
        >
          <Users size={18} className={activeTab === "mehfil" ? "text-black" : "text-stone-400"} />
          <span className="text-[10px] font-heading-vintage uppercase tracking-wider mt-1">
            Mehfil (Feed)
          </span>
        </button>
      </nav>

      {/* Feed Share Detail Overlay Modal */}
      {feedShareItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-lg p-5 max-w-md w-full text-center space-y-4 shadow-2xl relative text-black">
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setFeedShareItem(null)}
                className="text-white hover:bg-red-700 text-xs p-1.5 px-3 rounded bg-red-600 border border-red-700 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <h3 className="font-heading-vintage text-sm text-stone-900 tracking-widest pt-2">
              {/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) 
                ? "SHARE FROM MEHFIL 📱" 
                : "TRAGEDY CARD DOWNLOADED 💾"}
            </h3>

            <p className="text-[11px] text-stone-600 leading-relaxed font-serif">
              {/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ? (
                "Tap 'Share Natively' to post directly to your WhatsApp Status, Instagram Stories, Chats, or DMs. You can also save the image to your gallery."
              ) : (
                "The card has been downloaded to your device. Open WhatsApp Web or Instagram below to share it in a Chat, Status, DM, or Story!"
              )}
            </p>

            <div className="border border-stone-200 rounded overflow-hidden max-h-[350px] overflow-y-auto bg-stone-50 flex items-center justify-center">
              {feedShareLoading ? (
                <div className="py-20 flex flex-col items-center gap-2">
                  <div className="animate-spin text-blue-600 text-xs">🌀 Render...</div>
                  <span className="text-xs text-stone-500">Engraving woodblocks...</span>
                </div>
              ) : feedShareImage ? (
                <img
                  src={feedShareImage}
                  alt="Tragic Feed Marsiya Card"
                  className="w-full max-w-[260px] h-auto rounded border border-stone-200 my-2"
                />
              ) : (
                <div className="py-20 text-stone-500 text-xs">No image available</div>
              )}
            </div>

            {feedShareImage && (
              <div className="flex flex-col gap-2.5 pt-1">
                {/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ? (
                  // Mobile buttons
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => shareFeedNatively(feedShareImage, feedShareItem)}
                      style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold" }}
                      className="w-full bg-green-800 hover:bg-green-700 border border-green-600 text-white text-xs py-2.5 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 size={13} className="text-white" />
                      Share Natively 📱
                    </button>
                    <a
                      href={feedShareImage}
                      download="mehfil-tragedy.png"
                      style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold" }}
                      className="w-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-850 text-xs py-2.5 rounded flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download size={13} />
                      Save to Gallery 💾
                    </a>
                  </div>
                ) : (
                  // PC/Desktop buttons
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2 w-full">
                      <a
                        href="https://web.whatsapp.com/"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold" }}
                        className="flex-1 bg-green-800 hover:bg-green-700 border border-green-600 text-white text-xs py-2.5 rounded flex items-center justify-center gap-1.5 transition-colors"
                      >
                        WhatsApp Web 💬
                      </a>
                      <a
                        href="https://www.instagram.com/"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold" }}
                        className="flex-1 bg-gradient-to-r from-purple-800 to-pink-800 hover:from-purple-700 hover:to-pink-700 border border-purple-600 text-white text-xs py-2.5 rounded flex items-center justify-center gap-1.5 transition-colors"
                      >
                        Instagram Web 📸
                      </a>
                    </div>
                    <button
                      onClick={() => downloadFeedImage(feedShareImage)}
                      className="w-full bg-black hover:bg-stone-900 border border-stone-850 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      Re-download PNG
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
    </>
  );
}

export default App;
