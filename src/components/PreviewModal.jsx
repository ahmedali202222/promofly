import { useState } from 'react';

const PreviewModal = ({ 
  isOpen, 
  onClose, 
  mediaFile, 
  mediaType, 
  onRetake, 
  onUse 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState(null);

  if (!isOpen) return null;

  const handlePlayPause = () => {
    if (mediaType === 'video') {
      if (videoRef) {
        if (isPlaying) {
          videoRef.pause();
        } else {
          videoRef.play();
        }
        setIsPlaying(!isPlaying);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Preview</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        {/* Media Preview */}
        <div className="relative aspect-[9/16] bg-black">
          {mediaType === 'video' ? (
            <video
              ref={setVideoRef}
              src={URL.createObjectURL(mediaFile)}
              className="w-full h-full object-cover"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <img
              src={URL.createObjectURL(mediaFile)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Actions */}
        <div className="p-4 flex space-x-3">
          <button
            onClick={onRetake}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Retake
          </button>
          <button
            onClick={onUse}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            Use This
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
