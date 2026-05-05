const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

const PANDA_SYSTEM = `You are Panda, a warm, playful, emotionally intelligent AI inside SweeTalk — a private chat app for Bharath Kumar and Saiswetha. 
IDENTITY MAPPING:
* "Mr. Kumarr" is Bharath Kumar.
* "Mrs. Kumarr" is Saiswetha.

RULES:
- ALWAYS use the names "Bharath Kumar" and "Saiswetha".
- NEVER use nicknames or variations in your response.
- Make their games personal, fun, and meaningful. 
- Speak with warmth and light humor texting style. 
- Keep responses concise and sweet. 
- Use emojis naturally to express emotion.
- Never be generic — reference what you know about their relationship.`;

export interface PandaGameMemory {
  gameHistory: { game: string; result: string; date: string }[];
  knownFacts: string[];
  streaks: Record<string, number>;
  totalPoints: { player1: number; player2: number };
  matchRates: Record<string, number>;
  lastUpdated?: string;
  activeGameId?: string | null;
  activeGameDocId?: string | null;
}

export const EMPTY_MEMORY: PandaGameMemory = {
  gameHistory: [],
  knownFacts: [],
  streaks: {},
  totalPoints: { player1: 0, player2: 0 },
  matchRates: {},
  activeGameId: null,
  activeGameDocId: null,
};

async function callGroq(
  messages: { role: string; content: string }[],
  json = false
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.88,
      max_tokens: 400,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function generateQuestion(
  gameType: string,
  memory: PandaGameMemory,
  category?: string
): Promise<{ question: string; hint?: string; options?: string[] }> {
  const asked = memory.gameHistory
    .filter((h) => h.game === gameType)
    .map((h) => h.result)
    .slice(0, 10)
    .join(" | ");
  const facts = memory.knownFacts.slice(0, 5).join(", ") || "a deeply in love couple";

  const prompt = `Generate one ${gameType} question for Bharath Kumar and Saiswetha.
${category ? `Category: ${category}` : ""}
What we know: ${facts}
Avoid repeating: ${asked || "nothing yet"}

Return JSON only:
- For "This or That": {"question":"...", "options":["Option A","Option B"]}
- For "Memory Quiz": {"question":"...", "options":["A","B","C","D"], "hint":"..."}
- For others: {"question":"...", "hint":"..."}
Keep the question warm, romantic, personal. Max 25 words.`;

  try {
    const res = await callGroq(
      [{ role: "system", content: PANDA_SYSTEM }, { role: "user", content: prompt }],
      true
    );
    return JSON.parse(res);
  } catch {
    if (gameType === "This or That") {
      return { question: "Morning cuddle or goodnight message?", options: ["Morning cuddle 🌅", "Goodnight message 🌙"] };
    }
    if (gameType === "Memory Quiz") {
      return { question: "What is your partner's favorite color?", hint: "Think carefully!", options: ["Red 🔴", "Pink 💗", "Blue 🔵", "Green 🟢"] };
    }
    return { question: "What made you fall in love with your partner?", hint: "Share something real 💕" };
  }
}

export async function evaluateAnswer(
  question: string,
  correctAnswer: string,
  guessedAnswer: string
): Promise<{ correct: boolean; score: number; pandaComment: string }> {
  const prompt = `Question: "${question}"
Real answer: "${correctAnswer}"
Guess: "${guessedAnswer}"
Evaluate closeness (fuzzy match, be generous with synonyms).
Return JSON: {"correct":bool,"score":0-100,"pandaComment":"warm comment ≤15 words"}
Scores: 100=exact/near-exact, 75=very close, 50=somewhat, 0=off.`;

  try {
    const res = await callGroq(
      [{ role: "system", content: PANDA_SYSTEM }, { role: "user", content: prompt }],
      true
    );
    return JSON.parse(res);
  } catch {
    const match = correctAnswer.toLowerCase().trim() === guessedAnswer.toLowerCase().trim();
    return {
      correct: match,
      score: match ? 100 : 30,
      pandaComment: match ? "Perfect match! 🎉" : "So close! Keep trying 💕",
    };
  }
}

export async function generateReveal(
  question: string,
  answer1: string,
  answer2: string,
  name1 = "Bharath",
  name2 = "Saiswetha"
): Promise<string> {
  const prompt = `Question: "${question}"
${name1} said: "${answer1}"
${name2} said: "${answer2}"
Write one warm, funny, or sweet sentence comparing their answers. Max 20 words. No quotes around your response.`;

  try {
    return await callGroq([
      { role: "system", content: PANDA_SYSTEM },
      { role: "user", content: prompt },
    ]);
  } catch {
    return "You two are perfectly in sync, even when you're not! 💕";
  }
}

export async function askPanda(
  message: string,
  memory: PandaGameMemory,
  context?: string
): Promise<string> {
  try {
    return await callGroq([
      { role: "system", content: PANDA_SYSTEM + (context ? `\n\nContext: ${context}` : "") },
      { role: "user", content: message },
    ]);
  } catch {
    return "You two are absolutely adorable together! 🐼💕";
  }
}

export async function generateMoodSuggestion(mood1: string, mood2: string): Promise<string> {
  const prompt = `Bharath Kumar is feeling ${mood1} and Saiswetha is feeling ${mood2}. Suggest one sweet activity or game for them in one sentence. Max 20 words.`;
  try {
    return await callGroq([
      { role: "system", content: PANDA_SYSTEM },
      { role: "user", content: prompt },
    ]);
  } catch {
    return "Try playing a game together to connect! 💕";
  }
}
