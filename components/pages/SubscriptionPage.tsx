
import React from 'react';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { POLYGON_AMOY_CURRENCY_SYMBOL } from '../../constants';
import { LUNA_IMAGE_B64 } from '../../constants';

interface SubscriptionPageProps {
  onSubscribe: () => void;
  isLoading: boolean;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSubscribe, isLoading }) => {
    const features = [
        "Unlimited AI chat",
        "Advanced mood tracking",
        "Exclusive community access",
        "Guided journaling prompts",
    ];

    return (
        <div className="min-h-full w-full flex flex-col items-center justify-center p-4 animate-fade-in-up bg-brand-dark-bg text-brand-dark-text">
            <div className="w-full max-w-sm bg-brand-dark-bg-secondary rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                <img
                    src={LUNA_IMAGE_B64} // Using Luna's image for better branding, as per the design mockup
                    alt="AI Companion"
                    className="w-full h-48 object-cover"
                />
                <div className="p-8 text-left">
                    <h2 className="text-3xl font-bold text-brand-dark-text mb-2">Unlock Your AI Mental Health Companion</h2>
                    <p className="text-brand-dark-subtext mb-6">$20/month <span className="text-xs">(paid in {POLYGON_AMOY_CURRENCY_SYMBOL} on Polygon)</span></p>

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
                     <p className="text-xs text-center text-brand-dark-subtext mt-4">Your trial has ended. Subscribe to continue your journey.</p>
                </div>
            </div>
        </div>
    );
};
