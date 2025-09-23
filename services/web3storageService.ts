import lighthouse from '@lighthouse-web3/sdk';
import { ChatMessage } from '../types';

// --- Developer Action Required ---
// 1. Go to https://files.lighthouse.storage/
// 2. Login with your wallet.
// 3. Go to "API Key" on the left menu.
// 4. Create a new API key and paste it here.
const LIGHTHOUSE_API_KEY = "5b53c99a.4a6c9fe6c44c4131b4700bcbc43904a3";

// Note: This filename is a remnant of a previous implementation.
// This service now exclusively uses Lighthouse.storage.

export const uploadChatHistory = async (messages: ChatMessage[]): Promise<string | null> => {
    // FIX: This comparison was causing a TypeScript error because LIGHTHOUSE_API_KEY is a const
    // with a specific value, so it can never equal the placeholder string. The check has been removed.
    if (!LIGHTHOUSE_API_KEY) {
        console.error("Lighthouse API key is not set. Please add it to `services/web3storageService.ts`.");
        return null;
    }

    try {
        const data = JSON.stringify({
            version: 1,
            createdAt: new Date().toISOString(),
            messages: messages,
        }, null, 2);

        const fileName = `aura-chat-${new Date().getTime()}.json`;

        // The Lighthouse SDK for browser needs the data as a Blob
        const blob = new Blob([data], { type: 'application/json' });
        const file = new File([blob], fileName);

        // The progressCallback is optional, but useful for future UI enhancements
        const progressCallback = (progressData: any) => {
            const percentage = Math.round((progressData?.total / progressData?.uploaded) * 100);
            console.log(`Lighthouse Upload Progress: ${percentage}%`);
        };

        // lighthouse.upload expects a File object and the API key
        const response = await lighthouse.upload(
            {
              persist: true,
              target: {
                files: [file],
              },
            },
            LIGHTHOUSE_API_KEY,
            progressCallback,
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