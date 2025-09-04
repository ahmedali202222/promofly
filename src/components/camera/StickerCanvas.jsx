import { useState, useRef, useCallback } from 'react';

const StickerCanvas = ({ elements, onUpdateElement, onRemoveElement, className = "" }) => {
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const handlePointerDown = useCallback((e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - element.x;
    const offsetY = e.clientY - rect.top - element.y;
    
    setDraggedElement(elementId);
    setDragOffset({ x: offsetX, y: offsetY });
  }, [elements]);

  const handlePointerMove = useCallback((e) => {
    if (!draggedElement) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    // Keep within bounds
    const maxX = rect.width - 100;
    const maxY = rect.height - 50;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    onUpdateElement(draggedElement, { x: clampedX, y: clampedY });
  }, [draggedElement, dragOffset, onUpdateElement]);

  const handlePointerUp = useCallback(() => {
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleScale = useCallback((elementId, delta) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    const newScale = Math.max(0.3, Math.min(3, element.scale + delta));
    onUpdateElement(elementId, { scale: newScale });
  }, [elements, onUpdateElement]);

  const handleRotate = useCallback((elementId, delta) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    const newRotation = (element.rotation + delta) % 360;
    onUpdateElement(elementId, { rotation: newRotation });
  }, [elements, onUpdateElement]);

  // Export stickers to PNG
  const exportStickerPNG = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, 1080, 1920);
    
    // Draw all elements
    elements.forEach(element => {
      ctx.save();
      ctx.translate(element.x, element.y);
      ctx.scale(element.scale, element.scale);
      ctx.rotate((element.rotation * Math.PI) / 180);
      
      if (element.type === 'emoji' || element.type === 'label') {
        // Draw background
        ctx.fillStyle = element.color || '#FF0000';
        ctx.roundRect(-50, -25, 100, 50, 25);
        ctx.fill();
        
        // Draw text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.text, 0, 0);
      } else if (element.type === 'text') {
        ctx.fillStyle = element.color || '#FFFFFF';
        ctx.font = `bold ${element.fontSize || 32}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.text, 0, 0);
      }
      
      ctx.restore();
    });
    
    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
  }, [elements]);

  // Expose export function to parent
  useRef(() => {
    if (canvasRef.current) {
      canvasRef.current.exportStickerPNG = exportStickerPNG;
    }
  });

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {elements.map(element => (
        <div
          key={element.id}
          className="absolute cursor-move select-none"
          style={{
            left: element.x,
            top: element.y,
            transform: `scale(${element.scale}) rotate(${element.rotation}deg)`,
            transformOrigin: 'center center',
          }}
          onPointerDown={(e) => handlePointerDown(e, element.id)}
        >
          {element.type === 'emoji' || element.type === 'label' ? (
            <div
              className={`px-3 py-1 rounded-full font-bold text-sm shadow-lg ${element.color || 'bg-red-500'} text-white`}
            >
              {element.emoji && <span className="mr-1">{element.emoji}</span>}
              {element.text}
            </div>
          ) : (
            <div
              className="font-bold shadow-lg"
              style={{
                fontSize: element.fontSize || 32,
                color: element.color || '#FFFFFF',
              }}
            >
              {element.text}
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveElement(element.id);
              }}
              className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleScale(element.id, 0.2);
              }}
              className="w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-blue-600"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleScale(element.id, -0.2);
              }}
              className="w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-blue-600"
            >
              −
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StickerCanvas;
