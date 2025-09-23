
export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

// FIX: Add ethereum to the Window interface to fix TypeScript errors in App.tsx
// The `window.ethereum` object is injected by wallet extensions like MetaMask,
// and this declaration makes it available to TypeScript.
declare global {
  interface Window {
    ethereum: any;
  }
}