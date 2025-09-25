import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamAIResponse } from '../../services/geminiService';
import { uploadChatHistory } from '../../services/web3storageService';
import { ChatMessage, MessageAuthor } from '../../types';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { Toast } from '../Toast';
import { UserProfile } from './UserProfile';
import { AiProfile } from './AiProfile';
import { EmojiPicker } from '../EmojiPicker';
import { EmojiHappyIcon } from '../icons/EmojiHappyIcon';
import { SendIcon } from '../icons/SendIcon';
import { CompanionAvatar } from '../CompanionAvatar';

interface ChatInterfaceProps {
  account: string;
  companion: 'Luna' | 'Orion';
  userName: string;
  companionConfig: {
    name: string;
    descriptor: string;
    systemInstruction: string;
    welcome: (name: string) => string;
  }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ToastState = { message: string; type: 'success' | 'error' } | null;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ account, companion, userName, companionConfig }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [toast, setToast] = useState<ToastState>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatFooterRef = useRef<HTMLFormElement>(null);
    const chatHistoryKey = `solace_chat_history_${account}_${companion}`;
  
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

    // Effect to close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chatFooterRef.current && !chatFooterRef.current.contains(event.target as Node)) {
                setIsEmojiPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
  
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
          setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                  newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      text: aiResponse
                  };
              }
              return newMessages;
          });
      }, instruction);
      
      setIsAiTyping(false);
    }, [companionConfig.systemInstruction, userName]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isAiTyping) return;
      setIsEmojiPickerOpen(false);
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
          const savedChatsKey = `solace_saved_chats_${account}`;
          const savedChats = JSON.parse(localStorage.getItem(savedChatsKey) || '[]');
          
          const firstUserMessage = messages.find(m => m.author === MessageAuthor.USER);

          const newEntry = {
              cid,
              timestamp: new Date().getTime(),
              preview: firstUserMessage ? firstUserMessage.text.substring(0, 50) + '...' : 'Conversation with ' + companionConfig.name,
              companionName: companionConfig.name,
          };
          
          savedChats.unshift(newEntry);
          localStorage.setItem(savedChatsKey, JSON.stringify(savedChats));

          setSaveStatus('saved');
          setToast({ message: 'Chat saved to your journal!', type: 'success'});
          setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
          setSaveStatus('error');
          setToast({ message: 'Failed to save chat history.', type: 'error' });
          setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };

    const handleEmojiSelect = (emoji: string) => {
        setInput(prev => prev + emoji);
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 h-full overflow-hidden animate-fade-in-up">
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-w-0 h-full bg-brand-dark-bg-secondary/50 border border-white/10 rounded-2xl shadow-lg">
                <header className="bg-brand-dark-bg/80 backdrop-blur-md p-4 flex justify-between items-center z-10 flex-shrink-0 rounded-t-2xl border-b border-white/10">
                    <div className="flex items-center space-x-3">
                        <CompanionAvatar name={companionConfig.name} className="w-10 h-10 lg:hidden" />
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
                           <CompanionAvatar name={companionConfig.name} />
                        )}
                        <div
                            className={`max-w-md lg:max-w-lg p-4 rounded-2xl shadow-sm ${
                            message.author === MessageAuthor.USER
                                ? 'bg-brand-purple text-white rounded-br-none'
                                : 'bg-brand-dark-bg-secondary text-brand-dark-text rounded-bl-none'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">
                                {message.text}
                                {message.author === MessageAuthor.AI && isAiTyping && index === messages.length - 1 && (
                                    <span className="animate-blink font-light">|</span>
                                )}
                            </p>
                        </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </div>
                </main>
    
                <footer className="bg-brand-dark-bg/80 backdrop-blur-md p-4 border-t border-white/10 rounded-b-2xl">
                    <form onSubmit={handleSendMessage} ref={chatFooterRef} className="max-w-3xl mx-auto relative">
                        {isEmojiPickerOpen && <EmojiPicker onEmojiSelect={handleEmojiSelect} />}
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
                                type="button"
                                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                className="text-brand-dark-subtext hover:text-brand-dark-text p-2 transition-colors"
                                aria-label="Open emoji picker"
                            >
                                <EmojiHappyIcon className="w-6 h-6" />
                            </button>
                            <button
                                type="submit"
                                disabled={!input.trim() || isAiTyping}
                                className="bg-brand-purple text-white rounded-full w-10 h-10 m-2 flex-shrink-0 flex items-center justify-center hover:bg-brand-purple/80 transition-colors disabled:bg-gray-500"
                                aria-label="Send message"
                            >
                                <SendIcon className="h-5 w-5" />
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