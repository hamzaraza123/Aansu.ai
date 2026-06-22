# 😭 Aansu.ai — Hazar Gham Ka Ek Mehfil

> **"Dil-e-naadaan tujhe hua kya hai, Aakhir is dard ki dawa kya hai?"**  
> *(Oh naive heart, what has happened to you? What is the cure for this pain, after all?)*

Aansu.ai is a "gloriously useless" hackathon masterpiece designed to elevate trivial, minor daily inconveniences (like a lukewarm coffee, a delayed password reset link, or a stubbed toe) into grand, sorrowful, and weeping 19th-century Urdu Marsiyas (elegies) in Roman script.

---

## 🔗 Live Application
🌐 **Visit:** [Aansu.ai](https://aansu-ai.onrender.com/)

---

## 📖 Table of Contents
1. [Purpose of the Project](#-purpose-of-the-project)
2. [Technologies & Languages](#%EF%B8%8F-technologies--languages)
3. [Third-Party Libraries](#%EF%B8%8F-third-party-libraries)
4. [Key Features](#-key-features)
5. [Architectural Techniques](#-architectural-techniques)
6. [Security & Filter Architecture](#-security--filter-architecture)
7. [Database Architecture & Pagination](#-database-architecture--pagination)
8. [Responsive Design](#%EF%B8%8F-responsive-design)

---

## 🎯 Purpose of the Project
In a world that demands constant productivity and optimism, Aansu.ai provides a therapeutic space for ultimate melodrama. By combining the grand, mourning aesthetic of 19th-century Urdu poetry with the minor setbacks of the modern digital era, the project creates a hilarious, exaggerated, and poetically beautiful juxtaposition. 

---

## 🛠️ Technologies & Languages

### Frontend (Client-Side)
* **React 19 (TypeScript):** Component-driven architecture with strict type safety.
* **Vite:** High-performance local development server and optimized build bundler.
* **TailwindCSS & Vanilla CSS:** Modern aesthetics (glassmorphism, subtle animations, and vintage parchment borders).

### Backend (Server-Side)
* **Node.js & Express:** Lightweight secure server acting as a proxy layer.
* **Mongoose:** Object Data Modeling (ODM) library for MongoDB.

### AI Models & APIs
* **Google Gemini AI (Gemini 2.5 Flash):** Primary provider for rapid, creative Marsiya generation.
* **Groq Cloud API (Llama 3.1 8B Instant):** Automated failover provider for server-side load balancing.

---

## ⚙️ Third-Party Libraries

### Frontend
* **`lucide-react`:** Sleek, lightweight icon pack.
* **`html-to-image`:** Converts DOM nodes into high-resolution PNG data URLs directly in the browser for screenshot card sharing.

### Backend
* **`express-rate-limit`:** Lightweight IP-based rate limiting middleware.
* **`cors`:** Cross-Origin Resource Sharing middleware.
* **`dotenv`:** Environment variable loader.

---

## 🌟 Key Features

* **Marsiya Generator:** Input a daily frustration and get a highly dramatic, rhyming quatrain (Ruba'i) in Roman Urdu.
* **Mehfil Feed (Community Feed):** A shared, paginated feed where users can browse, weep over, and comment on public tragedies.
* **Weeping & Reacting:** Users can "Weep" (upvote) public posts or add custom emoji reactions (😂, 😢, 🙏, ❤️) to show solidarity with their fellow mourners.
* **Tragedy Card Sharing:** Instantly generates a clean, downloadable screenshot card of your elegy. 
  * Supports the native **Web Share API** on mobile devices (for quick sharing to WhatsApp Status or Instagram Stories).
  * Auto-downloads a high-resolution PNG on PC.
* **Self-Owned Post Deletion:** Tracks posts published by the user locally via `localStorage` ownership tracking, rendering a custom, in-app delete modal popup to let you wipe your own posts from MongoDB.
* **Sitar Ambient Music:** Loopable background sitar audio (`sitar.mp3`) with an inline volume control button to set the perfect melancholic mood.

---

## 🧩 Architectural Techniques

### The Soul Prompt (`soul.md`)
To prevent prompt leakages and keep the frontend bundle clean, the AI's core persona instructions are isolated in a server-side file called `soul.md`. 
* On backend startup, the server reads `soul.md` once and stores it in memory.
* When a generation request arrives, the server replaces `{{INCONVENIENCE}}` with the user's input, keeping the system prompt invisible to the client.

### Secure Backend Proxy
The frontend has no direct access to the LLM APIs or credentials. All generation requests are sent to `/api/generate` on the backend. This ensures your **`GEMINI_API_KEY`** and **`GROQ_API_KEY`** remain secure in your server environment variables and are never exposed to the client bundle.

---

## 🔒 Security & Filter Architecture

### IP-Based Rate Limiting
To prevent script spamming and API credit exhaustion, the `/api/generate` route is protected by `express-rate-limit`.
* Default: Limits users to **10 requests per 15 minutes per IP address**.
* Rate limits are tracked independently; spamming from one user's IP will never block other users on separate networks.

### Two-Layer Profanity Filtering
Aansu.ai implements a highly effective, hybrid, two-layer validation system:

```
[User Input]
     │
     ▼
┌──────────────────────────────────────────────┐
│ LAYER 1: Server-Side Regex Blacklist         │
│ Matches input against 90+ direct vulgarities │
└──────────────────────┬───────────────────────┘
                       │ (Passed)
                       ▼
┌──────────────────────────────────────────────┐
│ LAYER 2: LLM Semantic Context Filter         │
│ Catches substrings, variations (e.g. fucky)  │
│ or contextual slurs based on soul.md rules  │
└──────────────────────┬───────────────────────┘
                       │ (Passed)
                       ▼
            [Poem Generated successfully]
```

1. **Layer 1 (Fast Regex Match):** The backend immediately tests the input against a blacklist of 90+ transliterated Urdu/English swear words using regular expressions. If a match is found, the server rejects the request immediately with a `400 Bad Request` status, saving API costs.
2. **Layer 2 (LLM Semantic Refusal):** If a user uses a clever variation or substring (like *"fucky"* or Hinglish slang) that bypasses the regex word boundaries, the LLM catches the vulgarity semantically using the rules in `soul.md`. Instead of writing a poem, the LLM outputs a refusal message: `"Tauba! Apke alfaaz..."`.
3. **Response Interception:** The backend server scans the LLM's response. If it contains the refusal string, the server intercepts it and returns a `400 Bad Request` validation error, displaying the warning inside the red UI banner rather than rendering it as a valid poem.

---

## 💾 Database Architecture & Pagination

* **MongoDB Atlas Database:** Connects via a secure URI and schemas defined in Mongoose.
* **Unified Pagination:** The Mehfil feed is queried using aligned offsets (`page` and `limit = 15`) on both the backend and client.
  * When a user scrolls to the bottom of the feed, the **"Show More"** button dynamically queries page 2 (`skip = 15`), page 3 (`skip = 30`), etc.
  * If the database contains fewer than 15 total items, the client automatically receives `hasMore: false` and hides the "Show More" button, avoiding empty requests or layout jumps.

---

## 📱 Responsive Design
The website features a centered vertical container layout:
* **Desktop:** Renders as a sleek, bordered, mobile-frame simulator with a dark background video that makes the vintage parchment cards pop.
* **Mobile:** Expands to fill 100% of the screen, providing a native, app-like feel with a fixed sticky header and footer navigation bar for perfect usability on smartphones.
