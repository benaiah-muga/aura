
import React from 'react';

interface AiProfileProps {
    companionConfig: {
        name: string;
        avatar: string;
        descriptor: string;
    };
}

export const AiProfile: React.FC<AiProfileProps> = ({ companionConfig }) => {
    const { name, avatar, descriptor } = companionConfig;

    return (
        <div className="bg-brand-dark-bg-secondary p-6 rounded-2xl border border-white/10 text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <img 
                src={avatar} 
                alt={name} 
                className="w-24 h-24 rounded-full object-cover mb-4 mx-auto border-2 border-brand-purple"
            />
            <h3 className="text-2xl font-bold text-brand-dark-text">{name}</h3>
            <p className="text-brand-dark-subtext mb-3">{descriptor}</p>
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-300 bg-green-900/50 rounded-full">
                <span className="w-2 h-2 mr-2 bg-green-400 rounded-full"></span>
                Online
            </span>
        </div>
    );
};
