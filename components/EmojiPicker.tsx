import React from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const commonEmojis = ['👍', '❤️', '😂', '😊', '🙏', '🤔', '😢', '🎉', '😠', '😮'];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  return (
    <div className="absolute bottom-full mb-2 w-full p-2 bg-brand-dark-bg border border-gray-700 rounded-lg shadow-xl animate-fade-in-up z-20">
      <div className="grid grid-cols-5 gap-2">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onEmojiSelect(emoji)}
            className="text-2xl p-2 rounded-lg hover:bg-brand-dark-bg-secondary transition-colors"
            aria-label={`Select emoji ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
