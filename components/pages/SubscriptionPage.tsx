
import React from 'react';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { POLYGON_AMOY_CURRENCY_SYMBOL, SUBSCRIPTION_PRICE_POL } from '../../constants';
import { CreditCardIcon } from '../icons/CreditCardIcon';

type AccessStatus = 'none' | 'trial' | 'active';

interface SubscriptionPageProps {
  onSubscribe: () => void;
  isLoading: boolean;
  companion: 'Luna' | 'Orion';
  accessStatus: AccessStatus;
  subscriptionStatus: string;
}

const SubscribeCard: React.FC<Omit<SubscriptionPageProps, 'accessStatus' | 'subscriptionStatus'>> = ({ onSubscribe, isLoading, companion }) => {
    const features = [
        "Unlimited AI chat",
        "Advanced mood tracking",
        "Exclusive community access",
        "Guided journaling prompts",
    ];

    const initial = companion ? companion.charAt(0).toUpperCase() : 'S';
    
    return (
        <div className="w-full max-w-sm bg-brand-dark-bg-secondary rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="w-full h-48 flex items-center justify-center bg-brand-dark-bg">
                <div className="relative w-32 h-32">
                    <div className="absolute inset-0 bg-brand-purple rounded-full blur-xl opacity-50 animate-glow"></div>
                    <div className="relative flex items-center justify-center w-full h-full bg-brand-purple rounded-full">
                        <span className="font-bold text-7xl text-white">{initial}</span>
                    </div>
                </div>
            </div>
            <div className="p-8 text-left">
                <h2 className="text-3xl font-bold text-brand-dark-text mb-2">Unlock Your AI Companion</h2>
                <p className="text-brand-dark-subtext mb-6">{SUBSCRIPTION_PRICE_POL} {POLYGON_AMOY_CURRENCY_SYMBOL} / month</p>
                <ul className="space-y-3 mb-8">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-brand-dark-primary mr-3" />
                            <span className="text-brand-dark-text">{feature}</span>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onSubscribe}
                    disabled={isLoading}
                    className="w-full bg-brand-dark-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-brand-dark-secondary transition-colors duration-300 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon className="mr-2" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <span>Subscribe Now</span>
                    )}
                </button>
            </div>
        </div>
    );
}

const StatusCard: React.FC<{ subscriptionStatus: string }> = ({ subscriptionStatus }) => (
    <div className="w-full max-w-md bg-brand-dark-bg-secondary rounded-2xl shadow-lg border border-white/10 p-8">
        <header className="flex items-center space-x-4 mb-4">
            <CreditCardIcon className="w-8 h-8 text-brand-dark-primary" />
            <h2 className="text-2xl font-bold text-brand-dark-text">Current Plan</h2>
        </header>
        <div className="bg-brand-dark-bg p-4 rounded-lg border border-white/10">
            <p className="text-lg text-brand-dark-text font-semibold">{subscriptionStatus}</p>
            <p className="text-sm text-brand-dark-subtext">You have full access to all features.</p>
        </div>
        <div className="text-center mt-6">
            <p className="text-brand-dark-subtext">Thank you for being a valued member of our community.</p>
        </div>
    </div>
);


export const SubscriptionPage: React.FC<SubscriptionPageProps> = (props) => {
    const { accessStatus, subscriptionStatus } = props;

    return (
        <div className="p-4 sm:p-8 animate-fade-in-up flex-1 flex flex-col items-center justify-center">
            {accessStatus === 'none' && (
                 <div className="flex flex-col items-center justify-center">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-text">Your Access Has Expired</h1>
                        <p className="text-brand-dark-subtext mt-2">Please subscribe to continue your journey with us.</p>
                    </header>
                    <SubscribeCard {...props} />
                </div>
            )}
            {accessStatus === 'trial' && (
                <div className="flex flex-col items-center justify-center space-y-8">
                    <header className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-text">Subscription</h1>
                        <p className="text-brand-dark-subtext mt-2">You are currently on a free trial.</p>
                    </header>
                    <StatusCard subscriptionStatus={subscriptionStatus} />
                    <div className="w-full max-w-sm pt-8">
                        <h2 className="text-2xl font-bold text-center text-brand-dark-text mb-4">Ready to Upgrade?</h2>
                        <SubscribeCard {...props} />
                    </div>
                </div>
            )}
            {accessStatus === 'active' && (
                <div className="flex flex-col items-center justify-center">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-text">Subscription</h1>
                    </header>
                    <StatusCard subscriptionStatus={subscriptionStatus} />
                </div>
            )}
        </div>
    );
};
