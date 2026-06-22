// API validation and LLM interface for Aansu.ai



/**
 * Checks if the prompt is too vague or lacks meaningful context.
 */
export function isTooVague(text: string): boolean {
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


export interface PoemGenerationResponse {
  success: boolean;
  poem: string;
  error?: string;
}

/**
 * Clean and structure LLM response to verify it matches a 4-line format.
 */
function sanitizePoem(rawPoem: string): string {
  // Split into lines, trim, and filter out empty lines or XML remnants
  const lines = rawPoem
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("<") && !line.endsWith(">"));

  // If we don't get exactly 4 lines, try to adapt, or fallback
  if (lines.length >= 4) {
    return lines.slice(0, 4).join("\n");
  }
  
  // Return the raw text joined nicely if it's less than 4 lines
  return lines.join("\n");
}



/**
 * Secure API wrapper for generating the Marsiya elegy.
 * Communicates exclusively with the secure backend server.
 */
export async function generateMarsiya(
  inconvenience: string,
  preferredProvider: "gemini" | "groq" = "gemini"
): Promise<PoemGenerationResponse> {
  // 1. Validation & Safety Filter
  if (!inconvenience || inconvenience.trim().length < 3) {
    return {
      success: false,
      poem: "",
      error: "Sitam ka zikr toh kijiye! (Please enter at least 10 characters outlining your inconvenience.)"
    };
  }

  if (isTooVague(inconvenience)) {
    return {
      success: false,
      poem: "",
      error: "Sitam me thoda toh wazan hona chahiye! Apni dastaan thodi tafseel se bayaan kijiye. \n(Your tragedy lacks weight! Please describe your misfortune with a little more detail.)"
    };
  }



  try {
    // 2. Call backend proxy (/api/generate)
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inconvenience, provider: preferredProvider })
    }).catch(() => null);

    if (!res) {
      return {
        success: false,
        poem: "",
        error: "Gham ka tufaan aa gaya! (Cannot connect to the server.)"
      };
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, poem: sanitizePoem(data.poem) };
    } else {
      const serverError = data.error || "Unknown Server Error";
      return {
        success: false,
        poem: "",
        error: serverError
      };
    }
  } catch (error) {
    const err = error as Error;
    console.error("LLM Generation Error:", err);
    return {
      success: false,
      poem: "",
      error: `API Gham (Error): ${err.message || String(err)}.`
    };
  }
}


export interface DatabaseTragedy {
  _id?: string;
  id?: string;
  inconvenience: string;
  poem: string;
  poetName: string;
  weepsCount: number;
  reactions: {
    laughing: number;
    sad: number;
    hands: number;
    heart: number;
  };
  createdAt?: string;
}

export async function getMehfilFeed(page: number = 1, limit: number = 15): Promise<{ feed: DatabaseTragedy[]; hasMore: boolean }> {
  try {
    const res = await fetch(`/api/feed?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    return {
      feed: data.success ? data.feed : [],
      hasMore: data.success ? !!data.hasMore : false
    };
  } catch (err) {
    console.error("Failed to load Mehfil feed from backend:", err);
    return { feed: [], hasMore: false };
  }
}

export async function publishTragedyToMehfil(
  inconvenience: string,
  poem: string,
  poetName: string
): Promise<DatabaseTragedy | null> {
  try {
    const res = await fetch("/api/feed/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inconvenience, poem, poetName })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP Error ${res.status}`);
    }
    const data = await res.json();
    return data.success ? data.post : null;
  } catch (err) {
    console.error("Failed to publish tragedy:", err);
    throw err;
  }
}

export async function toggleReactionOnBackend(
  postId: string,
  reactionType: "weeps" | "laughing" | "sad" | "hands" | "heart",
  increment: boolean
): Promise<boolean> {
  try {
    const res = await fetch("/api/feed/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, reactionType, increment })
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("Failed to sync reaction update:", err);
    return false;
  }
}

export async function deleteTragedyFromMehfil(postId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/feed/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP Error ${res.status}`);
    }
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("Failed to delete tragedy from backend:", err);
    throw err;
  }
}


