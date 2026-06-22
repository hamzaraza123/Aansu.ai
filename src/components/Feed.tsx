import React, { useState, useEffect } from "react";
import { Share2, Award } from "lucide-react";

export interface FeedItem {
  id: string;
  inconvenience: string;
  poem: string;
  poetName: string;
  weepsCount: number;
  createdTime: string;
  reactions: {
    laughing: number;
    sad: number;
    hands: number;
    heart: number;
  };
}


interface FeedProps {
  feedItems: FeedItem[];
  weptPostIds: string[];
  onWeep: (id: string) => void;
  userReactions: Record<string, string[]>;
  onReactToggle: (id: string, reactionType: "laughing" | "sad" | "hands" | "heart") => void;
  onShareItem: (item: { inconvenience: string; poem: string }) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  myPostIds?: string[];
  onDeletePost?: (postId: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ 
  feedItems, 
  weptPostIds, 
  onWeep, 
  userReactions,
  onReactToggle,
  onShareItem,
  hasMore,
  isLoadingMore,
  onLoadMore,
  myPostIds = [],
  onDeletePost
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(" ");
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);

  // Trim and check query
  const trimmedQuery = searchQuery.trim();

  // Global click-out listener to close More Reactions popover
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".menu-container")) {
        setActiveMenuPostId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Handles clicking "Weep" (analogous to 'Like' or 'Upvote')
  const handleWeep = (id: string) => {
    onWeep(id);
  };

  const handleReactClick = (id: string, reactionType: "laughing" | "sad" | "hands" | "heart") => {
    onReactToggle(id, reactionType);
  };

  const hasReacted = (id: string, reactionType: string) => {
    const postReactions = userReactions[id] || [];
    return postReactions.includes(reactionType);
  };

  const hasZeroCountReactions = (item: FeedItem) => {
    return (
      (item.reactions?.laughing ?? 0) === 0 ||
      (item.reactions?.sad ?? 0) === 0 ||
      (item.reactions?.hands ?? 0) === 0 ||
      (item.reactions?.heart ?? 0) === 0
    );
  };

  // Filter feed items based on search query
  const filteredItems = feedItems.filter(item => {
    if (!trimmedQuery) return true;
    return (
      item.inconvenience.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      item.poem.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      item.poetName.toLowerCase().includes(trimmedQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white border border-stone-200 p-4 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.15)] space-y-2 text-black">
        <h3 className="text-stone-900 font-heading-vintage tracking-widest text-xs text-center font-bold">
          Dard Ki Mehfil Search
        </h3>
        
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search through tragedies..."
          value={searchQuery === " " ? "" : searchQuery}
          onChange={(e) => setSearchQuery(e.target.value || " ")}
          className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded px-3 py-2.5 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition-all font-sans"
        />
      </div>

      {/* Feed Scroll List */}
      <div 
        className="space-y-6 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar scroll-smooth"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const hasWept = weptPostIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200 p-6 rounded-lg relative overflow-hidden transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.1)] text-black group"
              >
                {/* Ornate corner bracket */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-stone-400 group-hover:border-stone-600 transition-colors" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-stone-400 group-hover:border-stone-600 transition-colors" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-stone-400 group-hover:border-stone-600 transition-colors" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-stone-400 group-hover:border-stone-600 transition-colors" />

                {/* Feed Card Top Header */}
                <div className="flex justify-between items-start mb-4 pb-2 border-b border-stone-200">
                  <div>
                    <span className="font-heading-vintage text-xs text-stone-900 tracking-widest font-bold block">
                      {item.poetName}
                    </span>
                    <span className="text-[9px] text-stone-600 block font-gothic mt-0.5">
                      {item.createdTime}
                    </span>
                  </div>
                  <div className="bg-[#074B88]/10 border border-[#074B88]/30 text-[9px] text-[#074B88] px-2 py-0.5 rounded flex items-center gap-1 font-gothic">
                    <Award size={9} className="text-[#074B88]" />
                    Mourner
                  </div>
                </div>

                {/* Minor Inconvenience */}
                <div className="bg-stone-50 border-l-2 border-[#074B88] px-3.5 py-2.5 mb-4 rounded-r shadow-inner">
                  <p className="text-[10px] uppercase tracking-wider text-stone-500 font-sans font-semibold mb-1">
                    Saneha (Tragedy):
                  </p>
                  <p className="text-[13px] italic text-stone-800 font-serif leading-relaxed">
                    "{item.inconvenience}"
                  </p>
                </div>

                {/* Poem Content */}
                <div className="text-center py-4 bg-stone-50 rounded border border-stone-200 my-4 relative">
                  {/* Subtle gothic divider lines */}
                  <div className="w-12 h-[1px] bg-stone-300 mx-auto mb-3" />
                  <div className="font-serif-vintage text-[15px] leading-loose text-stone-900 italic whitespace-pre-line tracking-wide font-medium">
                    {item.poem}
                  </div>
                  <div className="w-12 h-[1px] bg-stone-300 mx-auto mt-3" />
                </div>

                {/* Feed Card Action Buttons */}
                <div className="flex flex-col gap-3 pt-3 mt-2 border-t border-stone-200">
                  <div className="flex flex-col gap-2.5 text-stone-600">
                    
                    {/* Reactions Group (Left aligned) */}
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Main Weept Reaction */}
                      <button
                        onClick={() => handleWeep(item.id)}
                        className={`flex items-center gap-2 transition-all cursor-pointer px-3.5 py-1.5 rounded-full border text-sm select-none ${
                          hasWept
                            ? "bg-[#074B88]/10 border-[#074B88]/30 text-[#074B88] font-bold hover:bg-[#074B88]/20"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-[#074B88]/5 hover:border-[#074B88]/20 hover:text-[#074B88]"
                        }`}
                      >
                        <span className="text-base">😭</span>
                        <span>
                          Wept <strong className="font-sans">{item.weepsCount}</strong> times
                        </span>
                      </button>

                      {/* Dynamic Other Reactions */}
                      {item.reactions && (
                        <>
                          {item.reactions.laughing > 0 && (
                            <button
                              onClick={() => handleReactClick(item.id, "laughing")}
                              className={`flex items-center gap-1.5 transition-all cursor-pointer px-3 py-1.5 rounded-full border text-sm hover:bg-stone-50 select-none ${
                                hasReacted(item.id, "laughing")
                                  ? "bg-[#074B88]/10 border-[#074B88]/30 text-[#074B88] font-bold"
                                  : "bg-stone-50 border-stone-200 text-stone-700"
                              }`}
                            >
                              <span className="text-base">😂</span>
                              <span className="font-sans font-bold">{item.reactions.laughing}</span>
                            </button>
                          )}

                          {item.reactions.sad > 0 && (
                            <button
                              onClick={() => handleReactClick(item.id, "sad")}
                              className={`flex items-center gap-1.5 transition-all cursor-pointer px-3 py-1.5 rounded-full border text-sm hover:bg-stone-50 select-none ${
                                hasReacted(item.id, "sad")
                                  ? "bg-[#074B88]/10 border-[#074B88]/30 text-[#074B88] font-bold"
                                  : "bg-stone-50 border-stone-200 text-stone-700"
                              }`}
                            >
                              <span className="text-base">😢</span>
                              <span className="font-sans font-bold">{item.reactions.sad}</span>
                            </button>
                          )}

                          {item.reactions.hands > 0 && (
                            <button
                              onClick={() => handleReactClick(item.id, "hands")}
                              className={`flex items-center gap-1.5 transition-all cursor-pointer px-3 py-1.5 rounded-full border text-sm hover:bg-stone-50 select-none ${
                                hasReacted(item.id, "hands")
                                  ? "bg-[#074B88]/10 border-[#074B88]/30 text-[#074B88] font-bold"
                                  : "bg-stone-50 border-stone-200 text-stone-700"
                              }`}
                            >
                              <span className="text-base">🙏</span>
                              <span className="font-sans font-bold">{item.reactions.hands}</span>
                            </button>
                          )}

                          {item.reactions.heart > 0 && (
                            <button
                              onClick={() => handleReactClick(item.id, "heart")}
                              className={`flex items-center gap-1.5 transition-all cursor-pointer px-3 py-1.5 rounded-full border text-sm hover:bg-stone-50 select-none ${
                                hasReacted(item.id, "heart")
                                  ? "bg-[#074B88]/10 border-[#074B88]/30 text-[#074B88] font-bold"
                                  : "bg-stone-50 border-stone-200 text-stone-700"
                              }`}
                            >
                              <span className="text-base">❤️</span>
                              <span className="font-sans font-bold">{item.reactions.heart}</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* More Reactions Toggle and Menu */}
                      {hasZeroCountReactions(item) && (
                        <div className="relative menu-container">
                          <button
                            onClick={() => setActiveMenuPostId(activeMenuPostId === item.id ? null : item.id)}
                            className="text-stone-600 hover:text-stone-900 text-sm border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 px-3.5 py-1.5 rounded-full cursor-pointer transition-all flex items-center gap-1.5 select-none"
                          >
                            <span className="font-bold text-sm">+</span>
                            <span className="text-xs font-sans">More Reactions</span>
                          </button>

                          {activeMenuPostId === item.id && (
                            <div className="absolute bottom-8 left-0 bg-white border border-stone-300 rounded-lg p-1.5 shadow-xl flex gap-2 z-30 animate-fade-in">
                              {(item.reactions.laughing ?? 0) === 0 && (
                                <button
                                  onClick={() => {
                                    handleReactClick(item.id, "laughing");
                                    setActiveMenuPostId(null);
                                  }}
                                  className={`hover:scale-125 transition-all text-lg p-2 rounded cursor-pointer ${
                                    hasReacted(item.id, "laughing") ? "bg-stone-100" : ""
                                  }`}
                                  title="Laughing"
                                >
                                  😂
                                </button>
                              )}
                              {(item.reactions.sad ?? 0) === 0 && (
                                <button
                                  onClick={() => {
                                    handleReactClick(item.id, "sad");
                                    setActiveMenuPostId(null);
                                  }}
                                  className={`hover:scale-125 transition-all text-lg p-2 rounded cursor-pointer ${
                                    hasReacted(item.id, "sad") ? "bg-stone-100" : ""
                                  }`}
                                  title="Sad"
                                >
                                  😢
                                </button>
                              )}
                              {(item.reactions.hands ?? 0) === 0 && (
                                <button
                                  onClick={() => {
                                    handleReactClick(item.id, "hands");
                                    setActiveMenuPostId(null);
                                  }}
                                  className={`hover:scale-125 transition-all text-lg p-2 rounded cursor-pointer ${
                                    hasReacted(item.id, "hands") ? "bg-stone-100" : ""
                                  }`}
                                  title="Hands Together"
                                >
                                  🙏
                                </button>
                              )}
                              {(item.reactions.heart ?? 0) === 0 && (
                                <button
                                  onClick={() => {
                                    handleReactClick(item.id, "heart");
                                    setActiveMenuPostId(null);
                                  }}
                                  className={`hover:scale-125 transition-all text-lg p-2 rounded cursor-pointer ${
                                    hasReacted(item.id, "heart") ? "bg-stone-100" : ""
                                  }`}
                                  title="Heart"
                                >
                                  ❤️
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Share & Delete Buttons */}
                    <div className="flex justify-start items-center gap-2">
                      <button
                        onClick={() => onShareItem({ inconvenience: item.inconvenience, poem: item.poem })}
                        className="flex items-center gap-1.5 hover:text-[#074B88] hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm text-stone-600 select-none bg-stone-50 border border-stone-250 px-3.5 py-1.5 rounded-full"
                      >
                        <Share2 size={13} className="text-[#074B88]" />
                        <span className="font-sans text-xs">Share Gham</span>
                      </button>

                      {myPostIds.includes(item.id) && onDeletePost && (
                        <button
                          onClick={() => setDeleteConfirmPostId(item.id)}
                          className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm select-none bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full font-semibold"
                        >
                          <span>🗑️</span>
                          <span className="font-sans text-xs">Delete</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-stone-500 font-serif border border-dashed border-stone-300 rounded-lg bg-white/20 shadow-inner">
            <p className="text-3xl mb-2">😭</p>
            <p className="font-semibold text-stone-850 mb-1 text-sm tracking-wide">
              Mehfil is silent...
            </p>
            <p className="text-[11px] text-stone-600">
              No matching tragedies have been wept about yet.
            </p>
          </div>
        )}

        {/* Show More Button (Only visible at bottom when there are more items and not loading) */}
        {hasMore && !isLoadingMore && (
          <div className="pt-4 pb-8 text-center animate-fade-in">
            <button
              onClick={() => {
                onLoadMore();
              }}
              className="bg-white hover:bg-stone-100 text-black font-normal tracking-wide text-xs py-3 px-8 rounded border border-stone-300 cursor-pointer shadow transition-all duration-300 transform active:scale-95"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Show More
            </button>
          </div>
        )}

        {/* Loading spinner if loading more in background */}
        {isLoadingMore && (
          <div className="py-4 text-center text-xs text-stone-500 font-gothic animate-pulse">
            Loading more grief... 😭
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmPostId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-lg p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative text-black">
            <h3 className="font-heading-vintage text-xs tracking-widest text-stone-900 font-bold uppercase">
              Mita de is gham ko?
            </h3>
            <p className="text-[11px] text-stone-600 font-serif leading-relaxed">
              Are you sure you want to permanently delete this tragedy from the Mehfil? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmPostId(null)}
                className="flex-1 bg-stone-700 hover:bg-stone-855 text-white text-xs font-bold py-2.5 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeletePost) {
                    onDeletePost(deleteConfirmPostId);
                  }
                  setDeleteConfirmPostId(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Feed;
