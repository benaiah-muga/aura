
import React from 'react';

export const GrinningIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15C14.4853 15 16.5 12.9853 16.5 10.5C16.5 8.01472 14.4853 6 12 6C9.51472 6 7.5 8.01472 7.5 10.5C7.5 12.9853 9.51472 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 14.5C8.8373 15.4517 10.2931 16 12 16C13.7069 16 15.1627 15.4517 16 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
