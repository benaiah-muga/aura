
import React, { useState, useEffect } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { CheckIcon } from './icons/CheckIcon';
import { HomeIcon } from './icons/HomeIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CogIcon } from './icons/CogIcon';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';
import { APP_NAME } from '../constants';

type Companion = 'Luna' | 'Orion';
type DashboardView = 'home' | 'history' | 'journal' | 'settings';

interface DashboardPageProps {
  userName: string;
  onStartChat: (companion: Companion, initialMessage: string) => void;
}

const companions = {
  Luna: {
    name: 'Luna',
    descriptor: 'Compassionate & Wise',
    avatar: 'https://picsum.photos/seed/luna/200',
    welcome: (name: string) => `Hello ${name}, how are you feeling today? Anything on your mind you'd like to share?`
  },
  Orion: {
    name: 'Orion',
    descriptor: 'Calm & Analytical',
    avatar: 'https://picsum.photos/seed/orion/200',
    welcome: (name: string) => `Greetings ${name}. I am Orion. What is the primary issue you wish to discuss?`
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
        <div className="absolute top-0 left-0 right-0 bg-brand-purple/90 text-white text-center p-2 text-sm backdrop-blur-sm z-20 shadow-lg">
            <strong>Trial Period:</strong> {timeLeft}
        </div>
    );
};

const CompanionCard: React.FC<{ name: Companion; isSelected: boolean; onSelect: () => void; }> = ({ name, isSelected, onSelect }) => {
    const companion = companions[name];
    const baseClasses = "relative group flex flex-col items-center justify-center p-6 bg-brand-dark-bg-secondary rounded-2xl cursor-pointer transition-all duration-300 border-2";
    const selectedClasses = "border-brand-purple animate-glow";
    const unselectedClasses = "border-transparent hover:border-white/20";
  
    return (
        <div onClick={onSelect} className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}>
            {isSelected && (
                <div className="absolute top-3 right-3 bg-brand-purple text-white rounded-full p-1">
                    <CheckIcon className="w-4 h-4" />
                </div>
            )}
            <img 
                src={companion.avatar} 
                alt={companion.name} 
                className={`w-32 h-32 rounded-full object-cover mb-4 border-4 transition-all duration-300 ${isSelected ? 'border-brand-purple/50' : 'border-gray-700 group-hover:border-gray-500'}`}
            />
            <h3 className="text-2xl font-bold text-brand-dark-text">{companion.name}</h3>
            <p className="text-brand-dark-subtext">{companion.descriptor}</p>
        </div>
    );
};

const DashboardHome: React.FC<DashboardPageProps> = ({ userName, onStartChat }) => {
    const [selectedCompanion, setSelectedCompanion] = useState<Companion>('Luna');
    const [message, setMessage] = useState('');
  
    const handleSend = () => {
      if (!message.trim()) return;
      onStartChat(selectedCompanion, message);
    };
  
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleSend();
      }
    };
    
    const currentCompanion = companions[selectedCompanion];
  
    return (
      <div className="flex flex-col flex-1 justify-between p-4 sm:p-6 md:p-8 animate-fade-in-up">
        <main className="flex-1 flex flex-col items-center justify-center pt-12 sm:pt-0">
          <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-brand-dark-text">Choose your Companion</h1>
              <p className="text-lg text-brand-dark-subtext mt-2">Select an AI you'd like to talk to.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
              <CompanionCard name="Luna" isSelected={selectedCompanion === 'Luna'} onSelect={() => setSelectedCompanion('Luna')} />
              <CompanionCard name="Orion" isSelected={selectedCompanion === 'Orion'} onSelect={() => setSelectedCompanion('Orion')} />
          </div>
          
          <div className="w-full max-w-3xl space-y-4">
              <div className="flex justify-center">
                  <div className="bg-brand-dark-bg-secondary text-xs text-brand-dark-subtext px-3 py-1 rounded-full">
                      Today
                  </div>
              </div>
              <div className="flex items-end gap-3 justify-start">
                  <img src={currentCompanion.avatar} alt={currentCompanion.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="max-w-md lg:max-w-lg p-4 rounded-2xl rounded-bl-none shadow-sm bg-brand-dark-bg-secondary text-brand-dark-text">
                      <p>{currentCompanion.welcome(userName)}</p>
                  </div>
              </div>
          </div>
        </main>
  
        <footer className="w-full max-w-3xl mx-auto mt-8">
          <div className="flex items-center bg-brand-dark-bg-secondary rounded-xl p-2 shadow-lg border border-white/10">
            <button className="p-2 text-brand-dark-subtext hover:text-brand-dark-text transition-colors">
              <PlusIcon className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-2 bg-transparent border-none focus:ring-0 text-brand-dark-text placeholder-brand-dark-subtext"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-brand-purple text-white rounded-lg w-10 h-10 flex-shrink-0 flex items-center justify-center hover:bg-brand-purple/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </footer>
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

export const DashboardPage: React.FC<DashboardPageProps> = ({ userName, onStartChat }) => {
    const [activeView, setActiveView] = useState<DashboardView>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const renderContent = () => {
        switch(activeView) {
            case 'home':
                return <DashboardHome userName={userName} onStartChat={onStartChat} />;
            case 'history':
                return <ChatHistoryPage />;
            case 'journal':
                return <JournalPage />;
            case 'settings':
                return <SettingsPage />;
            default:
                return <DashboardHome userName={userName} onStartChat={onStartChat} />;
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark-bg text-brand-dark-text font-sans flex">
            <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <div className="flex-1 flex flex-col md:ml-64">
                <header className="md:hidden bg-brand-dark-bg-secondary/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-30 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">🧘</span>
                        <span className="text-xl font-bold text-brand-dark-text">{APP_NAME}</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-brand-dark-subtext">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-1 relative flex flex-col">
                    <TrialCountdown />
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
