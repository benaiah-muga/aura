
import React, { useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import { XIcon } from './icons/XIcon';
import { CompanionAvatar } from './CompanionAvatar';

interface ChatHistoryModalProps {
  messages: ChatMessage[];
  onClose: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ messages, onClose }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on open
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
          document.body.style.overflow = 'unset';
      };
  }, []);


  const aiName = messages.find(m => m.author === MessageAuthor.AI)?.author || 'AI';


  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-brand-dark-bg-secondary border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-bold text-brand-dark-text">Saved Conversation</h2>
          <button onClick={onClose} className="text-brand-dark-subtext hover:text-brand-dark-text">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end gap-3 ${
                  message.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.author === MessageAuthor.AI && (
                  <CompanionAvatar name={'AI'} /> // Placeholder, could pass companion name
                )}
                <div
                  className={`max-w-md lg:max-w-lg p-4 rounded-2xl shadow-sm ${
                    message.author === MessageAuthor.USER
                      ? 'bg-brand-purple text-white rounded-br-none'
                      : 'bg-brand-dark-bg text-brand-dark-text rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>
      </div>
    </div>
  );
};
