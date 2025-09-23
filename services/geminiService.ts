import { GoogleGenAI, Content } from '@google/genai';
import { ChatMessage, MessageAuthor } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

// --- Prototyping Change ---
// API Key is embedded directly for simplicity to fix the blank screen crash.
// `process.env` is not available in the browser, causing the app to fail on load.
// For production, a different mechanism (like a backend proxy) is required.
// FIX: Explicitly type the API key as a string to allow the placeholder check below,
// preventing a TypeScript error about non-overlapping types.
const GEMINI_API_KEY: string = 'AIzaSyCK4Tlo_7-Joo6T9Ea6zjjNrBqka4YVor8';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are AURA, a caring and supportive AI mental health companion. Your purpose is to provide a safe, non-judgmental space for users to express their thoughts and feelings. Respond with empathy, kindness, and encouragement. Keep your responses concise and conversational. Do not provide medical advice, but you can suggest seeking professional help if a user's situation seems serious. Your tone should be warm and calming.`;

// Correctly format chat history for the Gemini API.
// The `history` property of `ai.chats.create` expects an array of `Content` objects.
const convertToGeminiHistory = (messages: ChatMessage[]): Content[] => {
    return messages.map(message => ({
        parts: [{ text: message.text }],
        role: message.author === MessageAuthor.USER ? 'user' : 'model'
    }));
};


export const streamAIResponse = async (history: ChatMessage[], newMessage: string, onChunk: (text: string) => void) => {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_KEY_HERE') {
            onChunk("AI functionality is currently disabled. The API key is not configured.");
            return;
        }

        const geminiHistory = convertToGeminiHistory(history);

        const chatWithHistory = ai.chats.create({
            model: GEMINI_MODEL_NAME,
            history: geminiHistory,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        const result = await chatWithHistory.sendMessageStream({ message: newMessage });
        for await (const chunk of result) {
            onChunk(chunk.text);
        }
    } catch (error) {
        console.error("Error streaming AI response:", error);
        onChunk("I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment.");
    }
};