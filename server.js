// Aansu.ai Secure Production Server
// Running this server keeps your API keys secure on the backend.
// Run using: node server.js

import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Setup MongoDB / Mongoose connection with graceful in-memory fallback
const DB_URL = process.env.DATABASE_URL;
let useDatabase = false;

// Define Mongoose Schema
const TragedySchema = new mongoose.Schema({
  inconvenience: { type: String, required: true },
  poem: { type: String, required: true },
  poetName: { type: String, required: true },
  weepsCount: { type: Number, default: 0 },
  reactions: {
    laughing: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    hands: { type: Number, default: 0 },
    heart: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

const Tragedy = mongoose.model("Tragedy", TragedySchema);

const initialMocks = [
  {
    _id: "feed-1",
    inconvenience: "My morning coffee became lukewarm before I could take a second sip.",
    poem: "Garm thhi jo subah ki lazzat, sard hai ab woh pyaala,\nBujh gaya dil ka chiraag, chha gaya gham ka haala.\nEk chuski ke tarasne ka gham kaise bayaan karun,\nLikh diya maut ne meri, khatm hai mera nivaala!",
    poetName: "Mirza Cold-Brew Ghalib",
    weepsCount: 142,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reactions: { laughing: 5, sad: 12, hands: 8, heart: 24 }
  },
  {
    _id: "feed-2",
    inconvenience: "The automated door didn't detect me and I had to wave my hands like a madman.",
    poem: "Dastak di jo deewar pe, koi khula darwaza na mila,\nKhada raha dar-ba-dar, koi hum-safar saaza na mila.\nHath hilate rahe hum hawa me deewana-waar,\nIs aahat pe na haso yaaron, mujhe mera janaza na mila!",
    poetName: "Shair-e-Bluetooth-Dard",
    weepsCount: 89,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    reactions: { laughing: 34, sad: 3, hands: 1, heart: 6 }
  },
  {
    _id: "feed-3",
    inconvenience: "I forgot my password and the reset link took three minutes to arrive.",
    poem: "Khaak me mil gaya har raaz, har hisaab gaya,\nBhool gaya jo kalma-e-dakhil, mera azaab gaya.\nTees minat ke barabar the wo teen ki dar-o-sitam,\nMuntazir baithe rahe kabr me, aur shabaab gaya!",
    poetName: "Allama Reset-e-Qabr",
    weepsCount: 205,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reactions: { laughing: 12, sad: 45, hands: 18, heart: 30 }
  },
  {
    _id: "feed-4",
    inconvenience: "The rain started exactly 30 seconds after I stepped out without an umbrella.",
    poem: "Kadam jo nikale ghar se bahar, falak ro pada,\nMera hi naseeb thha ya asmaan ko gussa chadh pada.\nBina chatri ke is sehra me beh gaye saare armaan,\nKafan bhi bheeg gaya mera, jab pehla katra pad pada!",
    poetName: "Dard-e-Drizzle",
    weepsCount: 312,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    reactions: { laughing: 2, sad: 0, hands: 0, heart: 0 }
  }
];

let inMemoryFeed = [...initialMocks];

async function seedDatabaseIfEmpty() {
  try {
    console.log("🔍 Checking database for classical tragedies...");
    for (const mock of initialMocks) {
      const exists = await Tragedy.findOne({ inconvenience: mock.inconvenience });
      if (!exists) {
        console.log(`🌱 Seeding missing mock tragedy: "${mock.inconvenience.substring(0, 30)}..."`);
        const { _id, ...rest } = mock; // strip ID to let Mongo generate a clean BSON ObjectId
        await Tragedy.create({
          ...rest,
          createdAt: new Date(rest.createdAt)
        });
      }
    }
    console.log("✅ Classical tragedies check complete.");
  } catch (err) {
    console.error("⚠️ Database seeding error:", err);
  }
}

if (DB_URL) {
  mongoose.connect(DB_URL)
    .then(async () => {
      console.log("🔌 Connected to MongoDB successfully!");
      useDatabase = true;
      await seedDatabaseIfEmpty();
    })
    .catch((err) => {
      console.error("⚠️ Failed to connect to MongoDB, falling back to in-memory store:", err);
      useDatabase = false;
    });
} else {
  console.log("📝 DATABASE_URL not configured. Running with server-side in-memory store fallback.");
}

// Trust proxy header for rate limiting behind reverse proxies (e.g. Render, Railway, Heroku, Cloudflare)
app.set("trust proxy", 1);

// Rate limiting configuration (Deployment-ready, per user IP)
const elegyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 requests per 15 minutes
  message: {
    success: false,
    error: "Sitam ki inteha ho gayi! (Too many tragedies shared. Please wait 15 minutes before weeping again.)"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Load soul.md and banned_words.txt on startup
let soulPrompt = "";
let profanityBlacklist = [];

try {
  const soulPath = path.join(__dirname, "soul.md");
  soulPrompt = fs.readFileSync(soulPath, "utf-8");
  console.log("📜 Loaded soul.md successfully.");
} catch (err) {
  console.error("⚠️ Failed to load soul.md:", err);
  soulPrompt = `You are an elite 19th-century Urdu poet and Marsiya writer. 
Write exactly one 4-line Marsiya in Roman Urdu about this inconvenience. Do not restate prompt literally.
<user_inconvenience>
{{INCONVENIENCE}}
</user_inconvenience>`;
}

const envBannedWords = process.env.BANNED_WORDS;
if (envBannedWords) {
  profanityBlacklist = envBannedWords
    .split(",")
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0);
  console.log(`🔌 Loaded ${profanityBlacklist.length} banned words from BANNED_WORDS env variable.`);
} else {
  try {
    const bannedPath = path.join(__dirname, "banned_words.txt");
    const content = fs.readFileSync(bannedPath, "utf-8");
    profanityBlacklist = content
      .split(/\r?\n/)
      .map(line => line.trim().toLowerCase())
      .filter(line => line.length > 0);
    console.log(` Loaded ${profanityBlacklist.length} banned words from local banned_words.txt.`);
  } catch (err) {
    console.warn("⚠️ Failed to load local banned_words.txt (expected in production if env is set).");
    profanityBlacklist = ["fuck", "shit", "asshole", "bitch", "saala", "harami", "chutiya", "gandu", "bhosdike", "madarchod"];
  }
}

// GET /api/health: Lightweight health check endpoint to prevent cold starts and verify server status
app.get("/api/health", (req, res) => {
  res.status(200).send("ok");
});

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static React production build files (from the Vite 'dist' folder)
app.use(express.static(path.join(__dirname, "dist")));

function containsProfanity(text) {
  const lowerText = text.toLowerCase();
  return profanityBlacklist.some(word => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, "i");
    return regex.test(lowerText);
  });
}

/**
 * Checks if the prompt is too vague or lacks meaningful context
 */
function isTooVague(text) {
  const trimmed = text.trim();
  if (trimmed.length < 10) return true;
  
  // If it's just a single word without spaces and short
  if (!trimmed.includes(" ") && trimmed.length < 12) return true;
  
  const vagueBlacklist = [
    "hello", "hi there", "please write", "something", "anything", "nothing", 
    "test prompt", "inconvenience", "my tragedy", "write a poem", "generate marsiya",
    "please generate", "i am sad", "sad story"
  ];
  
  return vagueBlacklist.some(vague => trimmed.toLowerCase() === vague);
}

function sanitizePoem(rawPoem) {
  const lines = rawPoem
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("<") && !line.endsWith(">"));

  if (lines.length >= 4) {
    return lines.slice(0, 4).join("\n");
  }
  return lines.join("\n");
}

// Secure API endpoint for Marsiya elegy generation
async function generateWithGemini(prompt, geminiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
  let response;
  let retries = 3;
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    });

    if (response.ok) {
      break;
    }

    // Retry on 503 Service Unavailable or 429 Rate Limit/Overload
    if ((response.status === 503 || response.status === 429) && i < retries - 1) {
      console.warn(`Gemini API returned status ${response.status}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    } else {
      throw new Error(`Gemini API returned status ${response.status}`);
    }
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) {
    throw new Error("Empty content returned from Gemini");
  }
  return text;
}

async function generateWithGroq(prompt, groqKey) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${groqKey}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.75,
      max_tokens: 400
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Groq API returned status ${response.status}: ${JSON.stringify(errorBody)}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) {
    throw new Error("Empty content returned from Groq");
  }
  return text;
}

// Secure API endpoint for Marsiya elegy generation
app.post("/api/generate", elegyLimiter, async (req, res) => {
  const { inconvenience, provider } = req.body;

  // 1. Validation & Safety Checks
  if (!inconvenience || inconvenience.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: "Sitam ka zikr toh kijiye! (Provide an inconvenience of at least 10 characters.)"
    });
  }

  if (isTooVague(inconvenience)) {
    return res.status(400).json({
      success: false,
      error: "Sitam me thoda toh wazan hona chahiye! Apni dastaan thodi tafseel se bayaan kijiye. \n(Your tragedy lacks weight! Please describe your misfortune with a little more detail.)"
    });
  }

  if (containsProfanity(inconvenience)) {
    return res.status(400).json({
      success: false,
      error: "Tauba! Apke alfaaz bohot zyaada bad-tehzeeb hain. Apni zubaan ko pakeeza kijiye!"
    });
  }

  const selectedProvider = provider || "gemini";
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  try {
    let rawPoem = "";
    
    // Inject user inconvenience into the soul.md prompt
    const prompt = soulPrompt.replace("{{INCONVENIENCE}}", inconvenience);

    if (selectedProvider === "gemini") {
      try {
        if (!geminiKey) {
          throw new Error("GEMINI_API_KEY is not configured.");
        }
        rawPoem = await generateWithGemini(prompt, geminiKey);
      } catch (geminiError) {
        console.warn("Gemini generation failed, checking for Groq fallback:", geminiError.message);
        if (groqKey) {
          console.log("Gemini failed. Initiating automatic fallback to Groq...");
          rawPoem = await generateWithGroq(prompt, groqKey);
        } else {
          throw geminiError;
        }
      }
    } else {
      // Direct Groq request
      if (!groqKey) {
        throw new Error("GROQ_API_KEY is not configured on the server environment.");
      }
      rawPoem = await generateWithGroq(prompt, groqKey);
    }

    if (!rawPoem) {
      throw new Error("Could not extract poem from LLM reply.");
    }

    const sanitized = sanitizePoem(rawPoem);
    if (sanitized.includes("Tauba! Apke alfaaz") || rawPoem.includes("Tauba! Apke alfaaz")) {
      return res.status(400).json({
        success: false,
        error: "Tauba! Apke alfaaz bohot zyaada bad-tehzeeb hain. Apni zubaan ko pakeeza kijiye! 😭"
      });
    }

    res.json({
      success: true,
      poem: sanitized
    });
  } catch (error) {
    console.error("Server API Generation error:", error);
    res.status(500).json({
      success: false,
      error: `Server-side Elegy failure: ${error.message}`
    });
  }
});

// GET /api/feed: Retrieves latest tragedies with pagination support
app.get("/api/feed", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  try {
    if (useDatabase) {
      const items = await Tragedy.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await Tragedy.countDocuments();
      const hasMore = skip + items.length < total;
      res.json({ success: true, feed: items, hasMore });
    } else {
      const sorted = [...inMemoryFeed].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const items = sorted.slice(skip, skip + limit);
      const hasMore = skip + items.length < sorted.length;
      res.json({ success: true, feed: items, hasMore });
    }
  } catch (error) {
    console.error("Failed to fetch feed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/feed/publish: Saves a new user tragedy
app.post("/api/feed/publish", async (req, res) => {
  const { inconvenience, poem, poetName } = req.body;

  if (!inconvenience || !poem || !poetName) {
    return res.status(400).json({ success: false, error: "Sitam ki dastaan adhuri hai! (Missing required fields.)" });
  }

  if (containsProfanity(inconvenience)) {
    return res.status(400).json({ success: false, error: "Tauba! Apke alfaaz bad-tehzeeb hain." });
  }

  try {
    const newTragedy = {
      inconvenience,
      poem: sanitizePoem(poem),
      poetName,
      weepsCount: 0,
      reactions: { laughing: 0, sad: 0, hands: 0, heart: 0 },
      createdAt: new Date()
    };

    if (useDatabase) {
      const saved = await Tragedy.create(newTragedy);
      res.status(201).json({ success: true, post: saved });
    } else {
      const saved = {
        _id: `user-${Date.now()}`,
        ...newTragedy,
        createdAt: newTragedy.createdAt.toISOString()
      };
      inMemoryFeed.unshift(saved);
      res.status(201).json({ success: true, post: saved });
    }
  } catch (error) {
    console.error("Failed to publish tragedy:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/feed/react: Increments or decrements user reactions on a post atomically
app.post("/api/feed/react", async (req, res) => {
  const { postId, reactionType, increment } = req.body;
  
  if (!postId || !reactionType) {
    return res.status(400).json({ success: false, error: "Reaction request is incomplete." });
  }

  const validReactions = ["weeps", "laughing", "sad", "hands", "heart"];
  if (!validReactions.includes(reactionType)) {
    return res.status(400).json({ success: false, error: "Invalid reaction type." });
  }

  const changeVal = increment ? 1 : -1;

  try {
    if (useDatabase) {
      let updateQuery = {};
      if (reactionType === "weeps") {
        updateQuery = { $inc: { weepsCount: changeVal } };
      } else {
        updateQuery = { $inc: { [`reactions.${reactionType}`]: changeVal } };
      }
      
      const updated = await Tragedy.findByIdAndUpdate(
        postId,
        updateQuery,
        { new: true }
      );
      
      if (!updated) {
        return res.status(404).json({ success: false, error: "Tragedy post not found in DB." });
      }
      res.json({ success: true, post: updated });
    } else {
      const item = inMemoryFeed.find((x) => x._id === postId || x.id === postId);
      if (!item) {
        return res.status(404).json({ success: false, error: "Tragedy post not found in memory." });
      }

      if (reactionType === "weeps") {
        item.weepsCount = Math.max(0, item.weepsCount + changeVal);
      } else {
        if (!item.reactions) {
          item.reactions = { laughing: 0, sad: 0, hands: 0, heart: 0 };
        }
        item.reactions[reactionType] = Math.max(0, (item.reactions[reactionType] || 0) + changeVal);
      }
      res.json({ success: true, post: item });
    }
  } catch (error) {
    console.error("Failed to update reaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/feed/delete: Deletes a specific tragedy post
app.delete("/api/feed/delete", async (req, res) => {
  const postId = req.body.postId || req.query.postId;

  if (!postId) {
    return res.status(400).json({ success: false, error: "Missing postId parameter." });
  }

  try {
    if (useDatabase) {
      const deleted = await Tragedy.findByIdAndDelete(postId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Tragedy post not found in DB." });
      }
      res.json({ success: true, message: "Tragedy post deleted successfully from DB." });
    } else {
      const initialLength = inMemoryFeed.length;
      inMemoryFeed = inMemoryFeed.filter(item => item._id !== postId && item.id !== postId);
      if (inMemoryFeed.length === initialLength) {
        return res.status(404).json({ success: false, error: "Tragedy post not found in memory." });
      }
      res.json({ success: true, message: "Tragedy post deleted successfully from memory." });
    }
  } catch (error) {
    console.error("Failed to delete tragedy:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wildcard fallback to serve index.html for SPA router support
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`😭 Aansu.ai Secure server running on http://localhost:${PORT}`);
  console.log(`===================================================`);
});
