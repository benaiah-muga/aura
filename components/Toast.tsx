
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg shadow-2xl text-white animate-fade-in-up';
  const typeClasses = type === 'success' ? 'bg-brand-accent' : 'bg-red-500';

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      <div className="flex items-center">
        <span className="font-semibold">{message}</span>
        <button onClick={onClose} className="ml-4 font-bold text-xl">&times;</button>
      </div>
    </div>
  );
};
