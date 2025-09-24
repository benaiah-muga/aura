

import React, { useEffect, useState } from 'react';
import { HeartIcon } from '../icons/HeartIcon';
import { ChatBubbleIcon } from '../icons/ChatBubbleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

interface HomePageProps {
    userName: string;
    companion: 'Luna' | 'Orion';
    onNavigateToMood: () => void;
    onNavigateToChat: () => void;
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const WellnessStatCard: React.FC<{ title: string; value: string; change: string; }> = ({ title, value, change }) => (
    <div className="bg-brand-dark-bg-secondary p-6 rounded-xl border border-white/10">
        <p className="text-brand-dark-subtext mb-1">{title}</p>
        <p className="text-3xl font-bold text-brand-dark-text">{value}</p>
        <p className="text-brand-accent mt-1">{change}</p>
    </div>
);

export const HomePage: React.FC<HomePageProps> = ({ userName, companion, onNavigateToMood, onNavigateToChat }) => {
    const [subscriptionStatus, setSubscriptionStatus] = useState('Loading...');

    useEffect(() => {
        const account = localStorage.getItem('last_connected_account');
        if (!account) return;

        const subExpiryStr = localStorage.getItem(`aura_subscription_expiry_${account}`);
        if (subExpiryStr) {
            const expiryDate = new Date(parseInt(subExpiryStr, 10));
            setSubscriptionStatus(`Active Subscriber - Next renewal: ${expiryDate.toLocaleDateString()}`);
        } else {
            const trialExpiryStr = localStorage.getItem(`aura_trial_expiry_${account}`);
            if (trialExpiryStr) {
                 const expiryDate = new Date(parseInt(trialExpiryStr, 10));
                if (expiryDate.getTime() > new Date().getTime()) {
                    setSubscriptionStatus(`Trial active - Expires: ${expiryDate.toLocaleDateString()}`);
                } else {
                    setSubscriptionStatus('Trial Expired');
                }
            } else {
                setSubscriptionStatus('No active subscription');
            }
        }
    }, []);

    return (
        <div className="p-4 sm:p-8 animate-fade-in-up flex-1">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-text flex items-center">
                    {getGreeting()}, {userName}
                    <HeartIcon className="w-8 h-8 text-blue-400 ml-3" />
                </h1>
                <p className="text-brand-dark-subtext mt-1">{subscriptionStatus}</p>
            </header>

            <section className="mb-10">
                <button 
                    onClick={onNavigateToMood}
                    className="w-full text-left bg-brand-dark-primary text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-brand-dark-secondary transition-colors duration-300 transform hover:scale-[1.02]"
                >
                    Daily Check-in
                </button>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold text-brand-dark-text mb-4">Quick Access</h2>
                <button
                    onClick={onNavigateToChat} 
                    className="w-full flex items-center justify-between bg-brand-dark-bg-secondary p-5 rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200"
                >
                    <div className="flex items-center space-x-4">
                        <div className="bg-brand-dark-primary/20 p-3 rounded-full text-brand-dark-primary">
                            <ChatBubbleIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <p className="font-bold text-brand-dark-text">AI Companion</p>
                            <p className="text-sm text-brand-dark-subtext">Chat with {companion}</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-6 h-6 text-brand-dark-subtext" />
                </button>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-brand-dark-text mb-4">Wellness Stats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <WellnessStatCard title="Mood Trends" value="75%" change="+10%" />
                    <WellnessStatCard title="Journaling" value="3/7 Days" change="+1 Day" />
                    <WellnessStatCard title="Reminders" value="2 Active" change="+1 Reminder" />
                </div>
            </section>
        </div>
    );
};