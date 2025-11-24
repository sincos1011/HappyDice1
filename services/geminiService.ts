import { GoogleGenAI } from "@google/genai";

const AI_MODEL = "gemini-2.5-flash";

// Fallback phrases when offline
const OFFLINE_PHRASES = [
  "No internet? I'll cheer for you anyway! Yay! 🎉",
  "Offline mode: You are doing great! ✨",
  "The magic clouds are resting, but the dice still roll! 🎲",
  "WiFi is taking a nap, but good luck is awake! 💤",
  "Beep boop! Offline high-five! ✋",
  "Rolling in analog mode... still cute! 🌸"
];

export const generateRollNarrative = async (
  values: number[], 
  sum: number,
  theme: string = "Cute & Whimsical"
): Promise<string> => {
  // 1. Check Offline Status
  if (!navigator.onLine) {
    const randomPhrase = OFFLINE_PHRASES[Math.floor(Math.random() * OFFLINE_PHRASES.length)];
    return `${randomPhrase} (Offline)`;
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key not found.");
      return "Sleepy AI... (Connect API Key to wake up!)";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Updated prompt for CUTE style
    const prompt = `
      You are a cute, tiny magical spirit living inside the dice.
      The player rolled: [${values.join(', ')}]. Total: ${sum}.
      
      Give a very short, adorable, happy, or funny reaction.
      - If the roll is high (Total > ${values.length * 4}): Celebrate! Confetti!
      - If the roll is low: Offer a hug or a "oopsie!"
      - Use emojis! 
      - Keep it under 20 words.
      - Tone: Animal Crossing / Nintendo / Kawaii.
    `;

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
    });

    return response.text?.trim() || "Poof! Magic failed!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return offline phrase if API fails
    const randomPhrase = OFFLINE_PHRASES[Math.floor(Math.random() * OFFLINE_PHRASES.length)];
    return `${randomPhrase} (Connection Error)`;
  }
};