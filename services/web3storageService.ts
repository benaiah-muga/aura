import lighthouse from '@lighthouse-web3/sdk';
import { ChatMessage } from '../types';

// --- Developer Action Required ---
// 1. Go to https://files.lighthouse.storage/
// 2. Login with your wallet.
// 3. Go to "API Key" on the left menu.
// 4. Create a new API key and paste it here.
// FIX: Explicitly type the API key as a string to allow the placeholder check below,
// preventing a TypeScript error about non-overlapping types.
const LIGHTHOUSE_API_KEY: string = "5b53c99a.4a6c9fe6c44c4131b4700bcbc43904a3";

// Note: This filename is a remnant of a previous implementation.
// This service now exclusively uses Lighthouse.storage.

export const uploadChatHistory = async (messages: ChatMessage[]): Promise<string | null> => {
    if (!LIGHTHOUSE_API_KEY || LIGHTHOUSE_API_KEY === "PASTE_YOUR_LIGHTHOUSE_API_KEY_HERE") {
        console.error("Lighthouse API key is not set. Please add it to `services/web3storageService.ts`.");
        return null;
    }

    try {
        const chatData = JSON.stringify({
            version: 1,
            createdAt: new Date().toISOString(),
            messages: messages,
        }, null, 2);

        const fileName = `solace-chat-${new Date().getTime()}.json`;

        // Using lighthouse.uploadText is simpler and more direct for string data
        const response = await lighthouse.uploadText(
            chatData,
            LIGHTHOUSE_API_KEY,
            fileName
        );

        // The response contains the CID (Hash) of the uploaded file
        const cid = response.data.Hash;
        console.log("Successfully uploaded chat history with CID:", cid);
        console.log(`View file at: https://gateway.lighthouse.storage/ipfs/${cid}`);
        
        return cid;

    } catch (error) {
        console.error("Error uploading chat history to Lighthouse:", error);
        return null;
    }
};