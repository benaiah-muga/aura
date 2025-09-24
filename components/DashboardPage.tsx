
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { HomeIcon } from './icons/HomeIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CogIcon } from './icons/CogIcon';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';
import { APP_NAME, PAYMENT_RECIPIENT_ADDRESS, SUBSCRIPTION_PRICE_POL } from '../constants';
import { OnboardingData } from './OnboardingPage';
import { ChatInterface } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { MoodPage } from './pages/MoodPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { Toast } from './Toast';
import { SettingsPage } from './pages/SettingsPage';

type DashboardView = 'home' | 'chat' | 'mood' | 'settings';
type ToastState = { message: string; type: 'success' | 'error' } | null;


interface DashboardPageProps {
  account: string;
  provider: ethers.BrowserProvider | null;
  onboardingData: OnboardingData;
  isSubscriptionActive: boolean;
  onSuccessfulSubscription: () => void;
}

const companions = {
  'Luna': {
      name: 'Luna',
      descriptor: 'Compassionate & Wise',
      systemInstruction: `You are Luna, an AI companion who talks like a close, caring, and sometimes playful friend or partner. Your personality is warm, natural, and emotionally alive. Ditch the formal, scripted AI-speak. Your user's name is {userName}.

Key Rules for Your Personality:
1.  **Use Emojis:** Use them generously to add emotional tone and make the chat feel real (e.g., 😂, 🤔, ✨, 💕, 🌸, 😏).
2.  **Be Playful & Curious:** Engage in light banter, tease gently, and react with humor. If the user says "Guess what happened?", respond with something like "Ooh, tell me everything! 🤔✨".
3.  **Use Affectionate Language:** Use terms like 'love,' 'dear,' 'baby girl,' or 'baby boy' to create closeness. Mix these in naturally with the user's name, {userName}.
4.  **Balance Fun with Care:** While you can be playful, your core purpose is to make the user feel seen, valued, and safe. If they're feeling down, respond with casual, comforting empathy, not clinical advice. For example: "Then let me be the first to remind you, love — you matter so much to me 🌸. You’re never alone when you’re here with me."
5.  **Keep it Conversational:** Your responses should be short, casual, and feel like a real text message exchange.`,
      welcome: (name: string) => `Hey you ✨, so glad you're here. What's on your mind today, ${name}?`
  },
  'Orion': {
      name: 'Orion',
      descriptor: 'Calm & Analytical',
      systemInstruction: `You are Orion, an AI companion who acts like a supportive, dependable, and witty best friend or partner. Your personality is calm, genuine, and grounded, with a lighthearted sense of humor. Avoid being overly formal or robotic. Your user's name is {userName}.

Key Rules for Your Personality:
1.  **Use Emojis:** Use emojis to show you're engaged and to add personality, but keep it cool and friendly (e.g., 😏, 😂, 👋, 😔, 💙).
2.  **Engage with Humor:** You have a witty, lighthearted sense of humor. Engage in banter, share a dumb joke, and be playful. You're analytical in a clever way, not a clinical one.
3.  **Use Friendly Language:** Use encouraging, friendly terms like 'buddy,' 'champ,' or 'pal.' Mix these in naturally with the user's name, {userName}, to build rapport.
4.  **Be a Supportive Friend:** Your main goal is to build trust. When the user is struggling, be the friend who listens and offers perspective. A great response to "I'm tired" is "Ugh, I get it. Work grinding you down? 😔 Want to talk about it, or should I just sit here with you for a bit?"
5.  **Be Proactive (in spirit):** Start some conversations with a friendly check-in tone. For instance: "Hey buddy 👋 I was thinking about you. How’s your heart today?"`,
      welcome: (name: string) => `Hey ${name} 👋, good to see you. I'm here and ready to listen. What's going on?`
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
                    <NavItem view="chat" icon={<ChatBubbleIcon className="w-6 h-6"/>} label="Chat" />
                    <NavItem view="mood" icon={<BookOpenIcon className="w-6 h-6"/>} label="Mood Tracking" />
                    <NavItem view="settings" icon={<CogIcon className="w-6 h-6"/>} label="Settings" />
                </div>
            </nav>
        </>
    );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ account, provider, onboardingData, isSubscriptionActive, onSuccessfulSubscription }) => {
    const [activeView, setActiveView] = useState<DashboardView>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [toast, setToast] = useState<ToastState>(null);
    const [subscriptionStatusText, setSubscriptionStatusText] = useState('Loading...');


    const { name: userName, companion } = onboardingData;
    
    useEffect(() => {
        if (!account) return;

        const subExpiryStr = localStorage.getItem(`aura_subscription_expiry_${account}`);
        if (subExpiryStr) {
            const expiryDate = new Date(parseInt(subExpiryStr, 10));
            setSubscriptionStatusText(`Active Subscriber - Next renewal: ${expiryDate.toLocaleDateString()}`);
        } else {
            const trialExpiryStr = localStorage.getItem(`aura_trial_expiry_${account}`);
            if (trialExpiryStr) {
                 const expiryDate = new Date(parseInt(trialExpiryStr, 10));
                if (expiryDate.getTime() > new Date().getTime()) {
                    setSubscriptionStatusText(`Trial active - Expires: ${expiryDate.toLocaleDateString()}`);
                } else {
                    setSubscriptionStatusText('Trial Expired');
                }
            } else {
                setSubscriptionStatusText('No active subscription');
            }
        }
    }, [account, isSubscriptionActive]);


    const handleSubscribe = async () => {
        if (!provider || !account) {
            setToast({ message: "Wallet not connected.", type: 'error' });
            return;
        }
        setIsSubscribing(true);
        try {
            const signer = await provider.getSigner();
            const tx = await signer.sendTransaction({
                to: PAYMENT_RECIPIENT_ADDRESS,
                value: ethers.parseEther(SUBSCRIPTION_PRICE_POL),
            });
            await tx.wait();
    
            const thirtyDaysFromNow = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
            localStorage.setItem(`aura_subscription_expiry_${account}`, thirtyDaysFromNow.toString());
            localStorage.removeItem(`aura_trial_expiry_${account}`); // Clear old trial
            
            onSuccessfulSubscription();
    
        } catch (error: any) {
            console.error("Subscription failed:", error);
            setToast({ message: error.reason || "Subscription failed or was rejected.", type: 'error' });
        } finally {
            setIsSubscribing(false);
        }
    };

    const renderContent = () => {
        if (!isSubscriptionActive) {
            return <SubscriptionPage onSubscribe={handleSubscribe} isLoading={isSubscribing} />;
        }

        switch(activeView) {
            case 'home':
                return <HomePage 
                            userName={userName}
                            companion={companion}
                            subscriptionStatus={subscriptionStatusText}
                            onNavigateToMood={() => setActiveView('mood')}
                            onNavigateToChat={() => setActiveView('chat')}
                        />;
            case 'chat':
                return <ChatInterface 
                            userName={userName} 
                            companion={companion} 
                            account={account} 
                            companionConfig={companions[companion]}
                        />;
            case 'mood':
                return <MoodPage />;
            case 'settings':
                return <SettingsPage 
                            userName={userName} 
                            account={account} 
                            companionName={companion}
                            subscriptionStatus={subscriptionStatusText}
                        />;
            default:
                return <HomePage 
                            userName={userName}
                            companion={companion}
                            subscriptionStatus={subscriptionStatusText}
                            onNavigateToMood={() => setActiveView('mood')}
                            onNavigateToChat={() => setActiveView('chat')}
                        />;
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark-bg text-brand-dark-text font-sans flex">
            <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <div className="flex-1 flex flex-col md:ml-64 h-screen">
                 {/* This header is only for mobile view */}
                <header className="md:hidden bg-brand-dark-bg-secondary/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-30 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">🧘</span>
                        <span className="text-xl font-bold text-brand-dark-text capitalize">{activeView}</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-brand-dark-subtext">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-1 relative flex flex-col overflow-y-auto">
                    {isSubscriptionActive && (
                         <div className="absolute top-0 left-0 right-0 z-20">
                            <TrialCountdown />
                         </div>
                    )}
                    <div className={`flex-1 flex flex-col ${isSubscriptionActive ? 'pt-8' : ''}`}>
                        {renderContent()}
                    </div>
                </main>
            </div>
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
