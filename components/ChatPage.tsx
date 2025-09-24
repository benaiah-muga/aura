
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamAIResponse } from '../services/geminiService';
import { uploadChatHistory } from '../services/web3storageService';
import { ChatMessage, MessageAuthor } from '../types';
import { APP_NAME, LUNA_IMAGE_B64, ORION_IMAGE_B64 } from '../constants';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { Toast } from './Toast';

interface ChatPageProps {
  account: string;
  companion: 'Luna' | 'Orion';
  userName: string;
  initialUserMessage: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ToastState = { message: string; type: 'success' | 'error' } | null;

const companionConfig = {
    'Luna': {
        name: 'Luna',
        avatar: LUNA_IMAGE_B64,
        systemInstruction: `You are Luna, a caring and supportive AI companion with a compassionate and wise personality. Your purpose is to provide a safe, non-judgmental space for users to express their thoughts and feelings. Respond with empathy, kindness, and encouragement. Keep your responses concise and conversational. Your tone should be warm and calming. Address the user by their name, which is {userName}.`,
    },
    'Orion': {
        name: 'Orion',
        avatar: ORION_IMAGE_B64,
        systemInstruction: `You are Orion, a calm and analytical AI companion. You help users understand their thoughts and feelings through logical exploration and gentle questioning. Your approach is structured and mindful. You are patient and thoughtful in your responses. Keep your responses concise and conversational. Address the user by their name, which is {userName}.`,
    }
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1.5 ml-4">
    <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
    <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

export const ChatPage: React.FC<ChatPageProps> = ({ account, companion, userName, initialUserMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [toast, setToast] = useState<ToastState>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentCompanion = companionConfig[companion];
  const chatHistoryKey = `aura_chat_history_${account}_${companion}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isAiTyping]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem(chatHistoryKey);
    if (storedHistory) {
      setMessages(JSON.parse(storedHistory));
    } else if (initialUserMessage) {
      // Only use initial message if there's no history
      getAiResponse([], initialUserMessage);
    }
  }, [initialUserMessage, chatHistoryKey]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }
  }, [messages, chatHistoryKey]);


  const getAiResponse = useCallback(async (history: ChatMessage[], newMessage: string) => {
    setIsAiTyping(true);
    
    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: newMessage };
    const currentMessages = [...history, userMessage];
    
    let aiResponse = '';
    const aiMessage: ChatMessage = { author: MessageAuthor.AI, text: '' };
    setMessages([...currentMessages, aiMessage]);

    const instruction = currentCompanion.systemInstruction.replace('{userName}', userName);

    await streamAIResponse(history, newMessage, (chunk) => {
        aiResponse += chunk;
        setMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { ...msg, text: aiResponse } : msg
        ));
    }, instruction);
    
    setIsAiTyping(false);
  }, [currentCompanion.systemInstruction, userName]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiTyping) return;
    getAiResponse(messages, input);
    setInput('');
  };

  const handleSaveChat = async () => {
    setSaveStatus('saving');
    const cid = await uploadChatHistory(messages);
    if (cid) {
      setSaveStatus('saved');
      setToast({ message: `Chat saved! CID: ${cid.substring(0,10)}...`, type: 'success'});
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setToast({ message: 'Failed to save chat history.', type: 'error' });
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-dark-bg text-brand-dark-text animate-fade-in-up">
      <header className="bg-brand-dark-bg-secondary/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-3">
          <img src={currentCompanion.avatar} alt={currentCompanion.name} className="w-10 h-10 rounded-full object-cover" />
          <h1 className="text-xl font-bold text-brand-dark-text">{currentCompanion.name}</h1>
        </div>
        <button
          onClick={handleSaveChat}
          disabled={saveStatus !== 'idle'}
          className="bg-brand-purple text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-brand-purple/80 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          {saveStatus === 'saving' && <SpinnerIcon className="mr-2" />}
          {saveStatus === 'saved' ? 'Saved!' : 'Save Chat to Web3'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-end gap-3 ${
                message.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.author === MessageAuthor.AI && (
                 <img src={currentCompanion.avatar} alt={currentCompanion.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              )}
              <div
                className={`max-w-md lg:max-w-lg p-4 rounded-2xl shadow-sm ${
                  message.author === MessageAuthor.USER
                    ? 'bg-brand-purple text-white rounded-br-none'
                    : 'bg-brand-dark-bg-secondary text-brand-dark-text rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex items-end gap-3 justify-start">
               <img src={currentCompanion.avatar} alt={currentCompanion.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
               <div className="bg-brand-dark-bg-secondary p-4 rounded-2xl shadow-sm rounded-bl-none">
                 <TypingIndicator />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-brand-dark-bg-secondary/80 backdrop-blur-md p-4 border-t border-white/10 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
          <div className="flex items-center bg-brand-dark-bg border border-gray-700 rounded-full shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-brand-purple transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-4 bg-transparent border-none focus:ring-0 text-brand-dark-text"
              disabled={isAiTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isAiTyping}
              className="bg-brand-purple text-white rounded-full w-10 h-10 m-2 flex-shrink-0 flex items-center justify-center hover:bg-brand-purple/80 transition-colors disabled:bg-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </form>
      </footer>
       {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
    </div>
  );
};