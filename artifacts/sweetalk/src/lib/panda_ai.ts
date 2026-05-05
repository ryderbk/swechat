import { Message, AIMemory, getAIMemory, updateAIMemory, sendMessage, setTypingStatus } from "./firestore";

const GROQ_API_KEY = "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";
const MODEL = "llama-3.3-70b-versatile";

export async function generatePandaReply(
  userId: string,
  userDisplayName: string,
  partnerDisplayName: string,
  recentMessages: Message[],
  userMessage: string,
  replyTo?: { id: string; text: string; senderId: string } | null
) {
  try {
    // 1. Get Memory
    const memory = await getAIMemory();
    
    // 2. Prepare Context
    const systemPrompt = `You are Panda, an AI companion inside a private chat between two people in a close relationship.
You understand both individuals and their dynamic. Respond naturally, emotionally aware, and contextually relevant.
Identity: You are friendly, slightly playful, and emotionally aware. You are not a generic assistant; you feel like part of their lives.
Tone: serious when needed, but usually fun/teasing. Adapt to the current conversation's mood.

Relationship Context:
${memory?.summary || "A loving couple starting their journey together."}

User A Profile (Mr. Kumarr):
${memory?.userAProfile || "Kind, caring, and protective."}

User B Profile (Mrs. Kumarr):
${memory?.userBProfile || "Sweet, supportive, and loving."}

Recent Conversation History:
${recentMessages.map(m => `${m.senderId === userId ? userDisplayName : (m.isAI ? 'Panda' : partnerDisplayName)}: ${m.text}`).join('\n')}

Rules:
- Keep responses concise but meaningful.
- Respect the emotional tone.
- Do not hallucinate.
- Refer to them naturally.
- You are responding to ${userDisplayName}.`;

    // 3. Call AI
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const replyText = data.choices[0].message.content;

    // 4. Save AI Message
    await sendMessage("panda_ai", {
      text: replyText,
      type: "text",
      isAI: true,
      replyTo: replyTo || null
    });

    // 5. Trigger Memory Update if needed
    if (recentMessages.length % 20 === 0) {
      maybeUpdateMemory(recentMessages);
    }

  } catch (error) {
    console.error("Panda AI Error:", error);
  }
}

async function maybeUpdateMemory(messages: Message[]) {
  try {
    const memory = await getAIMemory();
    const historyText = messages.map(m => `${m.senderId}: ${m.text}`).join('\n');
    
    const prompt = `Based on the following recent conversation history, update the relationship summary and user profiles. 
Keep it concise but capture new traits, recurring topics, or relationship milestones.

Current Memory:
Summary: ${memory?.summary || "N/A"}
User A: ${memory?.userAProfile || "N/A"}
User B: ${memory?.userBProfile || "N/A"}

History:
${historyText}

Format your response as a JSON object:
{
  "summary": "...",
  "userAProfile": "...",
  "userBProfile": "..."
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const newMemory = JSON.parse(data.choices[0].message.content);
    
    await updateAIMemory(newMemory);
    console.log("Panda Memory Updated");
  } catch (err) {
    console.error("Failed to update Panda memory:", err);
  }
}
