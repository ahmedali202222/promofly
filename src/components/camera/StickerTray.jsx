import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_STICKERS = [
  { id: 'sale', text: 'SALE', color: 'bg-red-500', emoji: '🏷️' },
  { id: 'new', text: 'NEW', color: 'bg-blue-500', emoji: '✨' },
  { id: 'hot', text: 'HOT', color: 'bg-orange-500', emoji: '🔥' },
  { id: 'limited', text: 'LIMITED', color: 'bg-purple-500', emoji: '⏰' },
  { id: 'free', text: 'FREE', color: 'bg-green-500', emoji: '🎁' },
  { id: 'discount', text: '50% OFF', color: 'bg-pink-500', emoji: '💯' },
  { id: 'bogo', text: 'BOGO', color: 'bg-indigo-500', emoji: '🔄' },
  { id: 'trend', text: 'TREND', color: 'bg-yellow-500', emoji: '📈' },
];

const EMOJI_STICKERS = [
  '😀', '😍', '🤩', '😎', '🥳', '🎉', '🎊', '💖', '💕', '🔥', '⭐', '✨',
  '🎯', '💯', '🏆', '🎁', '💰', '💎', '👑', '🚀', '💫', '🌟', '🌈', '🎨'
];

export default function StickerTray({ onAddEmoji, onAddLabel, onAddText }) {
  const [activeTab, setActiveTab] = useState('labels');
  const [customText, setCustomText] = useState('');

  const handleAddSticker = (sticker) => {
    const bgColor = sticker.color?.replace('bg-', '') || 'red-500';
    const colorMap = {
      'red-500': '#ef4444',
      'blue-500': '#3b82f6',
      'orange-500': '#f97316',
      'purple-500': '#a855f7',
      'green-500': '#22c55e',
      'pink-500': '#ec4899',
      'indigo-500': '#6366f1',
      'yellow-500': '#eab308',
    };
    onAddLabel(sticker.text, colorMap[bgColor] || '#ef4444');
  };

  const handleAddEmoji = (emoji) => {
    onAddEmoji(emoji);
  };

  const handleAddCustomText = () => {
    if (!customText.trim()) return;
    onAddText(customText.trim());
    setCustomText('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full bg-black/60 backdrop-blur-xl text-white rounded-2xl p-3"
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('labels')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'labels' 
                ? 'bg-white text-black' 
                : 'bg-white/20 text-white'
            }`}
          >
            Labels
          </button>
          <button
            onClick={() => setActiveTab('emoji')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'emoji' 
                ? 'bg-white text-black' 
                : 'bg-white/20 text-white'
            }`}
          >
            Emoji
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'text' 
                ? 'bg-white text-black' 
                : 'bg-white/20 text-white'
            }`}
          >
            Text
          </button>
        </div>

        {/* Content */}
        <div className="max-h-32 overflow-y-auto">
          {activeTab === 'labels' && (
            <div className="grid grid-cols-4 gap-2">
              {PRESET_STICKERS.map((sticker) => (
                <motion.button
                  key={sticker.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddSticker(sticker)}
                  className={`${sticker.color} text-white p-2 rounded-lg text-xs font-bold shadow-lg hover:shadow-xl transition-all`}
                >
                  <div className="text-sm mb-1">{sticker.emoji}</div>
                  <div className="text-xs leading-tight">{sticker.text}</div>
                </motion.button>
              ))}
            </div>
          )}

          {activeTab === 'emoji' && (
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_STICKERS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter custom text..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomText();
                    }
                  }}
                />
                <button
                  onClick={handleAddCustomText}
                  disabled={!customText.trim()}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Add
                </button>
              </div>
              
              {/* Quick text options */}
              <div className="grid grid-cols-2 gap-2">
                {['Amazing Deal!', 'Limited Time!', 'Best Price!', 'Don\'t Miss Out!', 'Exclusive Offer!', 'Special Price!'].map((text) => (
                  <button
                    key={text}
                    onClick={() => {
                      setCustomText(text);
                      handleAddCustomText();
                    }}
                    className="px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}