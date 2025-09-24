
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamAIResponse } from '../../services/geminiService';
import { uploadChatHistory } from '../../services/web3storageService';
import { ChatMessage, MessageAuthor } from '../../types';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { Toast } from '../Toast';
import { UserProfile } from './UserProfile';
import { AiProfile } from './AiProfile';

interface ChatInterfaceProps {
  account: string;
  companion: 'Luna' | 'Orion';
  userName: string;
  companionConfig: {
    name: string;
    avatar: string;
    descriptor: string;
    systemInstruction: string;
    welcome: (name: string) => string;
  }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ToastState = { message: string; type: 'success' | 'error' } | null;

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1.5 ml-4">
      <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ account, companion, userName, companionConfig }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [toast, setToast] = useState<ToastState>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatHistoryKey = `aura_chat_history_${account}_${companion}`;
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
  
    useEffect(scrollToBottom, [messages, isAiTyping]);
  
    // Load/initialize chat history on mount
    useEffect(() => {
      const storedHistory = localStorage.getItem(chatHistoryKey);
      if (storedHistory) {
        setMessages(JSON.parse(storedHistory));
      } else {
        setMessages([{
            author: MessageAuthor.AI,
            text: companionConfig.welcome(userName)
        }]);
      }
    }, [chatHistoryKey, companionConfig, userName]);
  
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
  
      const instruction = companionConfig.systemInstruction.replace('{userName}', userName);
  
      await streamAIResponse(history, newMessage, (chunk) => {
          aiResponse += chunk;
          setMessages(prev => prev.map((msg, index) => 
              index === prev.length - 1 ? { ...msg, text: aiResponse } : msg
          ));
      }, instruction);
      
      setIsAiTyping(false);
    }, [companionConfig.systemInstruction, userName]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isAiTyping) return;
      const historyToSend = messages.slice();
      // If only the welcome message exists, send an empty history to the AI
      if (historyToSend.length === 1 && historyToSend[0].author === MessageAuthor.AI) {
        getAiResponse([], input);
      } else {
        getAiResponse(historyToSend, input);
      }
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
        <div className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 h-full overflow-hidden animate-fade-in-up">
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-w-0 h-full bg-brand-dark-bg-secondary/50 border border-white/10 rounded-2xl shadow-lg">
                <header className="bg-brand-dark-bg/80 backdrop-blur-md p-4 flex justify-between items-center z-10 flex-shrink-0 rounded-t-2xl border-b border-white/10">
                    <div className="flex items-center space-x-3">
                        <img src={companionConfig.avatar} alt={companionConfig.name} className="w-10 h-10 rounded-full object-cover lg:hidden" />
                        <h1 className="text-xl font-bold text-brand-dark-text lg:hidden">{companionConfig.name}</h1>
                        <h1 className="hidden lg:block text-xl font-bold text-brand-dark-text">Conversation</h1>
                    </div>
                    <button
                        onClick={handleSaveChat}
                        disabled={saveStatus !== 'idle'}
                        className="bg-brand-purple text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-brand-purple/80 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                        {saveStatus === 'saving' && <SpinnerIcon className="mr-2" />}
                        {saveStatus === 'saved' ? 'Saved!' : 'Save Chat'}
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
                            <img src={companionConfig.avatar} alt={companionConfig.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
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
                        <img src={companionConfig.avatar} alt={companionConfig.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        <div className="bg-brand-dark-bg-secondary p-4 rounded-2xl shadow-sm rounded-bl-none">
                            <TypingIndicator />
                        </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                    </div>
                </main>
    
                <footer className="bg-brand-dark-bg/80 backdrop-blur-md p-4 border-t border-white/10 rounded-b-2xl">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                    <div className="flex items-center bg-brand-dark-bg-secondary border border-gray-700 rounded-full shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-brand-purple transition-all">
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
            </div>
            {/* Profiles Sidebar (Right) */}
            <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-6 order-first lg:order-last overflow-y-auto">
                <UserProfile userName={userName} />
                <AiProfile companionConfig={companionConfig} />
            </aside>
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
