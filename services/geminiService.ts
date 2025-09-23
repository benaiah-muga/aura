import { GoogleGenAI, Content } from '@google/genai';
import { ChatMessage, MessageAuthor } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

// --- Prototyping Change ---
// API Key is embedded directly for simplicity since .env files were causing issues.
// For production, always use environment variables for security.
// FIX: The API key must be obtained exclusively from `process.env.API_KEY` as per coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are AURA, a caring and supportive AI mental health companion. Your purpose is to provide a safe, non-judgmental space for users to express their thoughts and feelings. Respond with empathy, kindness, and encouragement. Keep your responses concise and conversational. Do not provide medical advice, but you can suggest seeking professional help if a user's situation seems serious. Your tone should be warm and calming.`;

// FIX: Correctly format chat history for the Gemini API.
// The `history` property of `ai.chats.create` expects an array of `Content` objects,
// not an array of `Part` objects. Each `Content` object must have a `role` and a `parts` array.
const convertToGeminiHistory = (messages: ChatMessage[]): Content[] => {
    return messages.map(message => ({
        parts: [{ text: message.text }],
        role: message.author === MessageAuthor.USER ? 'user' : 'model'
    }));
};


export const streamAIResponse = async (history: ChatMessage[], newMessage: string, onChunk: (text: string) => void) => {
    try {
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