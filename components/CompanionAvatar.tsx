import React from 'react';

export const CompanionAvatar: React.FC<{ name: string, className?: string }> = ({ name, className = "w-8 h-8" }) => {
    const initial = name ? name.charAt(0).toUpperCase() : 'A';
    const sizeClasses = className.includes('w-10') ? 'text-xl' : 'text-sm';
    return (
        <div className={`relative inline-flex items-center justify-center overflow-hidden bg-brand-purple rounded-full flex-shrink-0 ${className}`}>
            <span className={`font-medium text-white ${sizeClasses}`}>{initial}</span>
        </div>
    );
};
