import React, { useState, useEffect } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { CheckIcon } from './icons/CheckIcon';

type Companion = 'Luna' | 'Orion';

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

interface CompanionCardProps {
    name: Companion;
    isSelected: boolean;
    onSelect: () => void;
}

const TrialCountdown: React.FC = () => {
    const account = window.localStorage.getItem('last_connected_account');
    const trialExpiryStr = account ? window.localStorage.getItem(`aura_trial_expiry_${account}`) : null;
    
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
        <div className="absolute top-0 left-0 right-0 bg-brand-purple/90 text-white text-center p-2 text-sm backdrop-blur-sm z-50 shadow-lg">
            <strong>Trial Period:</strong> {timeLeft}
        </div>
    );
};


const CompanionCard: React.FC<CompanionCardProps> = ({ name, isSelected, onSelect }) => {
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


export const DashboardPage: React.FC<DashboardPageProps> = ({ userName, onStartChat }) => {
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
    <div className="relative min-h-screen bg-brand-dark-bg text-brand-dark-text font-sans flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-fade-in-up">
      <TrialCountdown />
      <main className="flex-1 flex flex-col items-center justify-center pt-12 sm:pt-0">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-dark-text">Choose your Companion</h1>
            <p className="text-lg text-brand-dark-subtext mt-2">Select an AI you'd like to talk to.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
            <CompanionCard name="Luna" isSelected={selectedCompanion === 'Luna'} onSelect={() => setSelectedCompanion('Luna')} />
            <CompanionCard name="Orion" isSelected={selectedCompanion === 'Orion'} onSelect={() => setSelectedCompanion('Orion')} />
        </div>
        
        {/* Chat Preview */}
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

      <footer className="w-full max-w-3xl mx-auto">
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