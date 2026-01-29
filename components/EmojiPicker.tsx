import React from 'react';

const EMOJIS = [
  '😀', '😂', '😍', '👍', '❤️', '🔥', '🎉', '🙏', '🤔', '😢', 
  '😠', '🤯', '🥳', '👀', '💯', '🙌', '✨', '💀', '🫠', '🤡'
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-700 rounded-lg shadow-xl p-2 border border-slate-200 dark:border-slate-600 z-20">
      <div className="grid grid-cols-5 gap-1">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-2xl p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;