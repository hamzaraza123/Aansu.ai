import React from "react";

interface ShareCardProps {
  inconvenience: string;
  poem: string;
}

/**
 * ShareCard Component
 * Rendered with high-fidelity, dramatic styling, suitable for exporting as an image.
 * Uses inline-style backgrounds & Google fonts to ensure standard rendering when screenshotted.
 */
export const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(
  ({ inconvenience, poem }, ref) => {
    // Split the poem by newlines for rendering
    const poemLines = poem.split("\n");

    return (
      <div
        ref={ref}
        style={{
          width: "500px",
          minHeight: "650px",
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          color: "#000000",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "8px double #074B88",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        }}
        className="font-serif"
      >
        {/* Subtle radial glow background overlay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(7, 75, 136, 0.08) 0%, rgba(0,0,0,0) 70%)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Vintage corner ornaments */}
        <div style={{ position: "absolute", top: "15px", left: "15px", color: "#074B88", opacity: 0.6, fontSize: "20px", fontWeight: "bold" }}>✦</div>
        <div style={{ position: "absolute", top: "15px", right: "15px", color: "#074B88", opacity: 0.6, fontSize: "20px", fontWeight: "bold" }}>✦</div>
        <div style={{ position: "absolute", bottom: "15px", left: "15px", color: "#074B88", opacity: 0.6, fontSize: "20px", fontWeight: "bold" }}>✦</div>
        <div style={{ position: "absolute", bottom: "15px", right: "15px", color: "#074B88", opacity: 0.6, fontSize: "20px", fontWeight: "bold" }}>✦</div>

        <div style={{ zIndex: 10, display: "flex", flexDirection: "column", flexGrow: 1 }}>
          {/* Header Branding */}
          <div style={{ textAlign: "center", marginBottom: "35px" }}>
            <span
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                color: "#074B88",
                fontSize: "24px",
                letterSpacing: "4px",
              }}
            >
              AANSU.AI
            </span>
            <div
              style={{
                width: "80px",
                height: "1px",
                backgroundColor: "#074B88",
                margin: "8px auto 0",
              }}
            />
            <p
              style={{
                fontSize: "11px",
                color: "#4b5563",
                fontStyle: "italic",
                marginTop: "4px",
                letterSpacing: "1px",
              }}
            >
              Matam-e-Gham-e-Zindagi
            </p>
          </div>

          {/* User's Minor Inconvenience Prompt */}
          <div
            style={{
              backgroundColor: "rgba(7, 75, 136, 0.05)",
              borderLeft: "4px solid #074B88",
              padding: "16px",
              marginBottom: "35px",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                color: "#074B88",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Saneha (Tragedy)
            </span>
            <p
              style={{
                fontSize: "14px",
                color: "#1f2937",
                lineHeight: "1.5",
                fontStyle: "italic",
              }}
            >
              "{inconvenience}"
            </p>
          </div>

          {/* Marsiya Poem Output */}
          <div
            style={{
              textAlign: "center",
              margin: "auto 0",
              padding: "10px 0",
            }}
          >
            <span
              style={{
                color: "#074B88",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "3px",
                display: "block",
                marginBottom: "20px",
              }}
            >
              Marsiya (Elegy)
            </span>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "19px",
                lineHeight: "2.1",
                color: "#111827",
                fontStyle: "italic",
              }}
            >
              {poemLines.map((line, idx) => (
                <p key={idx} style={{ margin: "10px 0", wordWrap: "break-word" }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info & Watermark */}
        <div
          style={{
            zIndex: 10,
            textAlign: "center",
            marginTop: "35px",
            borderTop: "1px solid rgba(7, 75, 136, 0.2)",
            paddingTop: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "10px",
            color: "#4b5563",
          }}
        >
          <span>19th-Century Roman Urdu Elegy</span>
          <span style={{ color: "#074B88", letterSpacing: "1px" }}>aansu.ai/weep</span>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
