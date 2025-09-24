
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CogIcon } from './icons/CogIcon';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';
import { APP_NAME, LUNA_IMAGE_B64, ORION_IMAGE_B64 } from '../constants';
import { OnboardingData } from './OnboardingPage';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { Toast } from './Toast';
import { streamAIResponse } from '../services/geminiService';
import { uploadChatHistory } from '../services/web3storageService';
import { ChatMessage, MessageAuthor } from '../types';

type DashboardView = 'home' | 'history' | 'journal' | 'settings';

interface DashboardPageProps {
  account: string;
  onboardingData: OnboardingData;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ToastState = { message: string; type: 'success' | 'error' } | null;

const companions = {
  'Luna': {
      name: 'Luna',
      avatar: LUNA_IMAGE_B64,
      systemInstruction: `You are Luna, a caring and supportive AI companion with a compassionate and wise personality. Your purpose is to provide a safe, non-judgmental space for users to express their thoughts and feelings. Respond with empathy, kindness, and encouragement. Keep your responses concise and conversational. Your tone should be warm and calming. Address the user by their name, which is {userName}.`,
      welcome: (name: string) => `Hello ${name}, it's good to see you. What's on your mind today?`
  },
  'Orion': {
      name: 'Orion',
      avatar: ORION_IMAGE_B64,
      systemInstruction: `You are Orion, a calm and analytical AI companion. You help users understand their thoughts and feelings through logical exploration and gentle questioning. Your approach is structured and mindful. You are patient and thoughtful in your responses. Keep your responses concise and conversational. Address the user by their name, which is {userName}.`,
      welcome: (name: string) => `Greetings, ${name}. I am ready to listen. What would you like to explore?`
  }
};

const TrialCountdown: React.FC = () => {
    const account = typeof window !== 'undefined' ? window.localStorage.getItem('last_connected_account') : null;
    const trialExpiryStr = account ? (typeof window !== 'undefined' ? window.localStorage.getItem(`aura_trial_expiry_${account}`) : null) : null;
    
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!trialExpiryStr) return;

        const trialExpiry = parseInt(trialExpiryStr, 10);

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = trialExpiry - now;

            if (distance < 0) {
                setTimeLeft('Trial has expired.');
                return false;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s remaining`);
            return true;
        };
        
        if (updateCountdown()) {
             const timer = setInterval(() => {
                if (!updateCountdown()) {
                    clearInterval(timer);
                }
            }, 1000);
            return () => clearInterval(timer);
        }

    }, [trialExpiryStr]);

    if (!trialExpiryStr || new Date().getTime() > parseInt(trialExpiryStr, 10)) {
        return null;
    }

    return (
        <div className="bg-brand-purple/90 text-white text-center p-2 text-sm backdrop-blur-sm z-20 shadow-lg">
            <strong>Trial Period:</strong> {timeLeft}
        </div>
    );
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1.5 ml-4">
      <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const ChatInterface: React.FC<{
    account: string;
    companion: 'Luna' | 'Orion';
    userName: string;
}> = ({ account, companion, userName }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [toast, setToast] = useState<ToastState>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentCompanion = companions[companion];
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
        // Start with a welcome message if no history exists
        setMessages([{
            author: MessageAuthor.AI,
            text: currentCompanion.welcome(userName)
        }]);
      }
    }, [chatHistoryKey, currentCompanion, userName]);
  
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
      // Pass only messages before user input to AI history
      const historyToSend = messages.slice();
      if (historyToSend.length === 1 && historyToSend[0].author === MessageAuthor.AI) {
        // If it's only the welcome message, send an empty history
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
        <div className="flex flex-col flex-1 h-full animate-fade-in-up">
            {/* Chat Header */}
            <header className="bg-brand-dark-bg/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center z-10 flex-shrink-0">
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
    
            {/* Messages */}
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
    
            {/* Input Footer */}
            <footer className="bg-brand-dark-bg/80 backdrop-blur-md p-4 border-t border-white/10">
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


const PlaceholderComponent: React.FC<{title: string}> = ({title}) => (
    <div className="p-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-brand-dark-text">{title}</h1>
        <p className="text-brand-dark-subtext mt-4">This feature is coming soon. Stay tuned!</p>
    </div>
);

const ChatHistoryPage = () => <PlaceholderComponent title="Chat History" />;
const JournalPage = () => <PlaceholderComponent title="Journal" />;
const SettingsPage = () => <PlaceholderComponent title="Settings" />;

const Sidebar: React.FC<{
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
    
    const NavItem: React.FC<{view: DashboardView, icon: React.ReactNode, label: string}> = ({ view, icon, label }) => {
        const isActive = activeView === view;
        return (
            <button 
                onClick={() => { setActiveView(view); setIsOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-brand-dark-primary/20 text-brand-dark-text' : 'text-brand-dark-subtext hover:bg-brand-dark-bg hover:text-brand-dark-text'
                }`}
            >
                {icon}
                <span className="font-semibold">{label}</span>
            </button>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div 
                className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
            
            {/* Sidebar */}
            <nav className={`fixed top-0 left-0 h-full w-64 bg-brand-dark-bg-secondary border-r border-white/10 p-5 flex flex-col z-50 transform transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🧘</span>
                        <span className="text-2xl font-bold text-brand-dark-text">{APP_NAME}</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-brand-dark-subtext hover:text-brand-dark-text">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="space-y-2">
                    <NavItem view="home" icon={<HomeIcon className="w-6 h-6"/>} label="Home" />
                    <NavItem view="history" icon={<HistoryIcon className="w-6 h-6"/>} label="Chat History" />
                    <NavItem view="journal" icon={<BookOpenIcon className="w-6 h-6"/>} label="Journal" />
                    <NavItem view="settings" icon={<CogIcon className="w-6 h-6"/>} label="Settings" />
                </div>
            </nav>
        </>
    );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ account, onboardingData }) => {
    const [activeView, setActiveView] = useState<DashboardView>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { name: userName, companion } = onboardingData;

    const renderContent = () => {
        switch(activeView) {
            case 'home':
                return <ChatInterface userName={userName} companion={companion} account={account} />;
            case 'history':
                return <ChatHistoryPage />;
            case 'journal':
                return <JournalPage />;
            case 'settings':
                return <SettingsPage />;
            default:
                return <ChatInterface userName={userName} companion={companion} account={account} />;
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark-bg text-brand-dark-text font-sans flex">
            <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <div className="flex-1 flex flex-col md:ml-64 h-screen">
                <header className="md:hidden bg-brand-dark-bg-secondary/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-30 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">🧘</span>
                        <span className="text-xl font-bold text-brand-dark-text">{APP_NAME}</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-brand-dark-subtext">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-1 relative flex flex-col overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 z-20">
                        <TrialCountdown />
                    </div>
                    <div className="flex-1 flex flex-col pt-8"> {/* Adjusted padding top */}
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};