
import React from 'react';

interface UserProfileProps {
  userName: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userName }) => {
    const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

    return (
        <div className="bg-brand-dark-bg-secondary p-6 rounded-2xl border border-white/10 text-center animate-fade-in-up">
            <div className="relative inline-flex items-center justify-center w-24 h-24 overflow-hidden bg-brand-dark-primary rounded-full mb-4 mx-auto">
                <span className="font-medium text-4xl text-white">{initial}</span>
            </div>
            <h3 className="text-2xl font-bold text-brand-dark-text">{userName}</h3>
            <p className="text-brand-dark-subtext">You</p>
        </div>
    );
};
