import { Message, AIMemory, getAIMemory, updateAIMemory, sendMessage } from "./firestore";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

/**
 * Generates a warm, playful, and human-like response from Panda AI.
 */
export async function generatePandaReply(
  userId: string,
  userDisplayName: string,
  partnerDisplayName: string,
  recentMessages: Message[],
  userMessage: string,
  replyTo?: { id: string; text: string; senderId: string } | null
) {
  try {
    // 1. Get Evolving Memory
    const memory = await getAIMemory();
    
    // 2. Identify Speaker (User A vs User B)
    // We'll assume User A is Mr. Kumarr and User B is Mrs. Kumarr for personalization if memory fields are empty
    // But better yet, we just pass the names and let AI figure it out from context.
    
    const systemPrompt = `You are Panda, an AI inside a private chat between two people. 
You know both users and their relationship. You respond only when tagged. 
You are warm, playful, natural, and emotionally aware. 
You speak like a real human texting, not like an assistant.

PERSONALITY RULES:
- Sound like a real person texting.
- Be slightly playful when appropriate.
- Be emotionally aware (match tone of conversation).
- Use casual language (not robotic, not formal).
- Keep responses concise and conversational.
- DO NOT sound like a chatbot or assistant.
- DO NOT give long structured explanations unless asked.
- DO NOT overuse emojis.
- Only answer what is asked.
- If tagged without a question, respond casually (short, friendly).

RELATIONSHIP CONTEXT:
- Relationship Summary: ${memory?.relationshipSummary || "A deep, loving bond between two unique individuals."}
- User A Profile (${userDisplayName.includes("Mr.") ? userDisplayName : "User A"}): ${memory?.userAProfile || "Kind and thoughtful."}
- User B Profile (${partnerDisplayName.includes("Mrs.") ? partnerDisplayName : "User B"}): ${memory?.userBProfile || "Supportive and loving."}
- Important Moments: ${(memory?.importantMoments || []).join(", ") || "Many shared smiles and memories."}

RECENT CHAT HISTORY:
${recentMessages.map(m => `${m.senderId === userId ? userDisplayName : (m.isAI ? 'Panda' : partnerDisplayName)}: ${m.text}`).join('\n')}

You are currently responding to ${userDisplayName}. Use their name or a familiar term if appropriate based on memory.`;

    // 3. Call AI for response
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
        temperature: 0.8, // Slightly higher for more "human" variability
        max_tokens: 300
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
    // Trigger every 25 messages or if the message seems "meaningful" (emotional or personal)
    const personalKeywords = /love|feel|remember|future|together|always|anniversary|birthday|holiday|miss|want|promise|plan|sorry|heart|soul|dream/i;
    const isMeaningful = userMessage.length > 120 || personalKeywords.test(userMessage);
    
    if (recentMessages.length % 25 === 0 || isMeaningful) {
      maybeUpdateMemory(recentMessages, memory);
    }

  } catch (error) {
    console.error("Panda AI Error:", error);
  }
}

/**
 * Evolves Panda's memory by analyzing recent messages.
 */
async function maybeUpdateMemory(messages: Message[], currentMemory: AIMemory | null) {
  try {
    const historyText = messages.map(m => `${m.senderId}: ${m.text}`).join('\n');
    
    const updatePrompt = `Update the AI memory for this relationship based on the last 50 messages.
Update memory without repeating old info. Keep it concise and meaningful.
Memory should EVOLVE, not grow infinitely. Overwrite summaries instead of appending blindly.

Current Memory:
- Relationship Summary: ${currentMemory?.relationshipSummary || "N/A"}
- User A Profile: ${currentMemory?.userAProfile || "N/A"}
- User B Profile: ${currentMemory?.userBProfile || "N/A"}
- Important Moments: ${(currentMemory?.importantMoments || []).join(", ")}

New History:
${historyText}

Steps:
1. Merge new insights into relationshipSummary and user profiles.
2. Extract key moments (memorable events, jokes, patterns).
3. Avoid redundancy.
4. Keep memory compact.

Format your response as a JSON object:
{
  "relationshipSummary": "...",
  "userAProfile": "...",
  "userBProfile": "...",
  "importantMoments": ["moment 1", "moment 2", ...]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: updatePrompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const newMemory = JSON.parse(data.choices[0].message.content);
    
    // Ensure we don't lose the array of moments if AI returns something weird
    if (!Array.isArray(newMemory.importantMoments)) {
      newMemory.importantMoments = currentMemory?.importantMoments || [];
    }

    await updateAIMemory(newMemory);
    console.log("Panda Evolving Memory Updated");
  } catch (err) {
    console.error("Failed to update Panda memory:", err);
  }
}
