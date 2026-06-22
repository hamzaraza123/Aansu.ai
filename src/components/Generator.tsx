import React, { useState, useRef, useEffect } from "react";
import { generateMarsiya } from "../utils/api";
import { toPng } from "html-to-image";
import { ShareCard } from "./ShareCard";
import { AlertCircle, Flame, Share2, Globe, Download, RefreshCw } from "lucide-react";

interface GeneratorProps {
  onPublish: (item: { inconvenience: string; poem: string; poetName: string }) => void;
}

export const Generator: React.FC<GeneratorProps> = ({ onPublish }) => {
  const [inconvenience, setInconvenience] = useState("");
  const [poem, setPoem] = useState("");
  const [loading, setLoading] = useState(false);
  const poemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (poem) {
      setTimeout(() => {
        poemRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [poem]);
  const [error, setError] = useState("");
  
  // States for dynamic screenshot sharing
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasPublished, setHasPublished] = useState(false);

  // Reference to the hidden ShareCard DOM element for rendering high-res screenshots
  const shareCardRef = useRef<HTMLDivElement>(null);

  // List of tragic pen names to assign randomly on publish
  const PEN_NAMES = [
    "Mirza Be-Qaraar", "Allama Be-Aas", "Shair-e-Na-Umeed", "Faiz-e-Fursat", 
    "Ghalib-e-Tension", "Mir Dard-e-Wifi", "Daagh Dehlvi v2", "Zauq-e-Sitam"
  ];

  const handleWeep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inconvenience.trim()) return;

    setLoading(true);
    setError("");
    setPoem("");
    setHasPublished(false);
    setShareImage(null);

    const response = await generateMarsiya(inconvenience, "gemini");

    if (response.success) {
      setPoem(response.poem);
    } else {
      setError(response.error || "A mysterious sorrow blockaded the LLM...");
    }
    setLoading(false);
  };

  // Helper to trigger direct image download
  const downloadImage = (dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `aansu-tragedy-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to trigger native Web Share API
  const shareNatively = async (dataUrl: string) => {
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], "gham-e-aansu.png", { type: "image/png" });

        if (navigator.canShare({ files: [file] })) {
          // Note: WhatsApp and other apps often hide themselves from the OS share sheet
          // if we pass both a file AND text/title payloads. Sharing only the file
          // resolves this, treating it as a clean image attachment share.
          await navigator.share({
            files: [file]
          });
        }
      } catch (err) {
        console.warn("Web Share API failed:", err);
      }
    }
  };

  // Capture the offscreen ShareCard element using html-to-image
  const generateShareImage = async (): Promise<string | null> => {
    if (!shareCardRef.current) return null;
    try {
      setSharingLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      setShareImage(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      setError("Falak ne gham badha diya (Failed to compile sharing card image).");
      return null;
    } finally {
      setSharingLoading(false);
    }
  };

  // Implements the web-share capability or falls back to a gorgeous save modal
  const handleShareGham = async () => {
    const dataUrl = await generateShareImage();
    if (!dataUrl) return;

    setShowShareModal(true);

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    
    if (isMobile) {
      await shareNatively(dataUrl);
    } else {
      downloadImage(dataUrl);
    }
  };

  // Push the newly composed elegy to the community feed (Mehfil)
  const handlePublish = () => {
    if (hasPublished) return;
    
    // Pick a random tragic pseudonym
    const randomName = PEN_NAMES[Math.floor(Math.random() * PEN_NAMES.length)];
    
    onPublish({
      inconvenience,
      poem,
      poetName: randomName,
    });
    
    setHasPublished(true);
  };

  return (
    <div className="space-y-6">
      {/* Offscreen / Hidden card used specifically for html-to-image render */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <ShareCard ref={shareCardRef} inconvenience={inconvenience} poem={poem} />
      </div>

      {/* Main Form container */}
      <form
        onSubmit={handleWeep}
        className="bg-white border border-stone-200 p-8 rounded-lg shadow-[0_15px_35px_rgba(0,0,0,0.15)] relative overflow-hidden text-black"
      >
        {/* Decorative corner brackets */}
        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-stone-400" />
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-stone-400" />
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-stone-400" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-stone-400" />

        {/* Form Title & Decorative Line */}
        <div className="text-center mb-6">
          <h2 className="font-heading-vintage text-lg md:text-xl text-stone-900 tracking-widest uppercase">
            Sitam-e-Zindagi
          </h2>
          <p className="text-[11px] text-stone-600 font-serif italic mt-1">
            Write your trivial misfortune; inherit a tragic elegy.
          </p>
          <div className="w-16 h-[1px] bg-stone-300 mx-auto mt-3" />
        </div>

        {/* Misfortune Text Area Input */}
        <div className="space-y-2 mb-6">
          <label className="block text-[10px] uppercase tracking-wider text-stone-800 font-bold font-sans">
            Describe Your Misfortune:
          </label>
          <textarea
            value={inconvenience}
            onChange={(e) => setInconvenience(e.target.value)}
            placeholder="E.g., The barista forgot my oat milk... / My internet took ten seconds to load..."
            maxLength={180}
            rows={3}
            required
            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-200 transition-all font-serif resize-none shadow-inner"
          />
          <div className="flex justify-between items-center text-[9px] text-stone-600 font-gothic">
            <span>Minimum 10 characters required.</span>
            <span>{inconvenience.length}/180 chars</span>
          </div>
        </div>

        {/* Safety Warning Error Message */}
        {error && (
          <div className="bg-red-50 border-l-2 border-red-600 p-3.5 rounded mb-5 flex items-start gap-2.5 text-xs text-red-900 font-serif leading-relaxed">
            <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>{error}</div>
          </div>
        )}

        {/* Submit Weep Button */}
        <button
          type="submit"
          disabled={loading || inconvenience.trim().length < 10}
          className={`w-full relative overflow-hidden group transition-all duration-300 rounded font-heading-vintage font-bold tracking-widest text-xs py-4 border ${
            loading
              ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-[#074B88] border-[#074B88] text-white hover:bg-[#0a68bd] cursor-pointer shadow-[0_5px_15px_rgba(7, 75, 136, 0.3)] hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw size={12} className="animate-spin text-white" />
              Shedding Tears...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Flame size={12} className="text-white animate-pulse" />
              WEEP & LAMENT 😭
            </span>
          )}
        </button>
      </form>

      {/* Generated Poem display panel */}
      {poem && (
        <div
          ref={poemRef}
          className="bg-white border border-stone-200 rounded-lg shadow-[0_15px_35px_rgba(0,0,0,0.15)] p-6 relative overflow-hidden animate-fade-in text-black"
        >
          {/* Ornate corner bracket */}
          <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-stone-400" />
          <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-stone-400" />
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-stone-400" />
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-stone-400" />

          <div className="text-center space-y-4">
            <span className="text-[9px] font-gothic tracking-widest text-stone-800 uppercase block">
              ✦ AL-MARSIYA (Roman Urdu) ✦
            </span>

            {/* The Poetry Body */}
            <div className="py-4 border-y border-stone-200 max-w-md mx-auto relative">
              <div className="font-serif-vintage italic text-md md:text-[17px] leading-loose text-stone-900 tracking-wide whitespace-pre-line">
                {poem}
              </div>
            </div>

            {/* Actions for output */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              {/* Share Card Trigger */}
              <button
                onClick={handleShareGham}
                disabled={sharingLoading}
                className="flex-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-heading-vintage font-bold tracking-wider py-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                {sharingLoading ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-[#074B88]" />
                    Engraving...
                  </>
                ) : (
                  <>
                    <Share2 size={12} className="text-[#074B88]" />
                    Share my Gham
                  </>
                )}
              </button>

              {/* Publish to feed Trigger */}
              <button
                onClick={handlePublish}
                disabled={hasPublished}
                className={`flex-1 text-xs font-heading-vintage font-bold tracking-wider py-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  hasPublished
                    ? "bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed"
                    : "bg-[#074B88] hover:bg-[#0a68bd] border border-[#074B88] text-white cursor-pointer shadow"
                }`}
              >
                <Globe size={12} className={hasPublished ? "text-stone-400" : "text-white"} />
                {hasPublished ? "Published to Mehfil" : "Publish to Mehfil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Image Overlay Fallback Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-lg p-5 max-w-md w-full text-center space-y-4 shadow-2xl relative animate-fade-in text-black">
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="text-white hover:bg-red-700 text-xs p-1.5 px-3 rounded bg-red-600 border border-red-700 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <h3 className="font-heading-vintage text-sm text-stone-900 tracking-widest pt-2">
              {/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) 
                ? "SHARE YOUR TRAGEDY 📱" 
                : "GHAM CARD DOWNLOADED 💾"}
            </h3>

            <p className="text-[11px] text-stone-600 leading-relaxed font-serif">
              {/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ? (
                "Tap 'Share Natively' to share directly to your WhatsApp chats, Instagram Stories, or DMs. If you want to post to your WhatsApp Status, tap 'Save to Gallery' first, then upload it directly from WhatsApp!"
              ) : (
                "Your Gham card has been downloaded. Open WhatsApp Web or Instagram below to share it in a Chat, Status, DM, or Story!"
              )}
            </p>

            {/* Screen Capture Output Rendered */}
            <div className="border border-stone-200 rounded overflow-hidden max-h-[350px] overflow-y-auto bg-stone-50 flex items-center justify-center">
              {shareImage ? (
                <img
                  src={shareImage}
                  alt="Tragic Marsiya Card"
                  className="w-full max-w-[260px] h-auto rounded border border-stone-200 my-2 animate-fade-in"
                />
              ) : (
                <div className="py-20 flex flex-col items-center gap-2">
                  <RefreshCw className="animate-spin text-blue-600" size={24} />
                  <span className="text-xs text-stone-500 font-gothic">Generating image layer...</span>
                </div>
              )}
            </div>

            {/* Action buttons inside sharing modal */}
            {shareImage && (
              <div className="flex flex-col gap-2.5 pt-1">
                {/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ? (
                  // Mobile buttons
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => shareNatively(shareImage)}
                      style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold" }}
                      className="w-full bg-green-800 hover:bg-green-700 border border-green-600 text-white text-xs py-2.5 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 size={13} className="text-white" />
                      Share Natively 📱
                    </button>
                    <a
                      href={shareImage}
                      download="aansu-tragedy.png"
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
                      onClick={() => downloadImage(shareImage)}
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
  );
};
export default Generator;
