import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Zap, ZapOff, Type, Smile, Tag, X, Plus, Minus, Camera, Video, Trash2, Move, ChevronUp, ChevronDown } from "lucide-react";

export default function CameraStudioNew({ onClose, onCapture }) {
  const webcamRef = useRef(null);
  const [facing, setFacing] = useState("user");
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const [filterId, setFilterId] = useState("none");
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);
  const [flashOn, setFlashOn] = useState(false);
  const [captureMode, setCaptureMode] = useState("photo");

  // Business features
  const [activeTab, setActiveTab] = useState("stickers");
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [newText, setNewText] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [isBusinessToolsOpen, setIsBusinessToolsOpen] = useState(true);

  const videoConstraints = { 
    width: 1080, 
    height: 1920, 
    facingMode: facing,
    aspectRatio: 9/16
  };

  const FILTERS = [
    { id: "none", name: "Normal", color: "from-gray-400 to-gray-600" },
    { id: "vintage", name: "Vintage", color: "from-amber-400 to-orange-600" },
    { id: "cool", name: "Cool", color: "from-blue-400 to-cyan-600" },
    { id: "warm", name: "Warm", color: "from-yellow-400 to-orange-500" },
    { id: "bw", name: "B&W", color: "from-gray-500 to-gray-700" },
    { id: "vibrant", name: "Vibrant", color: "from-pink-400 to-purple-600" },
  ];

  const BUSINESS_STICKERS = [
    { id: "sale", text: "SALE", color: "bg-red-500", icon: "🏷️" },
    { id: "new", text: "NEW", color: "bg-blue-500", icon: "✨" },
    { id: "hot", text: "HOT", color: "bg-orange-500", icon: "🔥" },
    { id: "limited", text: "LIMITED", color: "bg-purple-500", icon: "⏰" },
    { id: "free", text: "FREE", color: "bg-green-500", icon: "🎁" },
    { id: "discount", text: "50% OFF", color: "bg-pink-500", icon: "💯" },
    { id: "bogo", text: "BOGO", color: "bg-indigo-500", icon: "🔄" },
    { id: "trending", text: "TRENDING", color: "bg-yellow-500", icon: "📈" },
  ];

  const QUICK_TEXTS = [
    "Amazing Deal!",
    "Limited Time!",
    "Best Price!",
    "Don't Miss Out!",
    "Exclusive Offer!",
    "Special Price!",
    "Hurry Up!",
    "Great Value!",
  ];

  // Check camera permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasPermission(true);
        setError(null);
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        setHasPermission(false);
        setError("Camera permission denied. Please allow camera access.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPermissions();
  }, []);

  // Handle camera loading
  const handleUserMedia = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((err) => {
    setIsLoading(false);
    setError("Failed to access camera. Please check your camera connection.");
    console.error("Camera error:", err);
  }, []);

  // PHOTO CAPTURE - SIMPLIFIED AND RELIABLE
  const capturePhoto = useCallback(async () => {
    const webcam = webcamRef.current;
    if (!webcam || isCapturing) return;
    
    setIsCapturing(true);
    console.log("Starting photo capture...");
    console.log("Stickers count:", stickers.length);
    console.log("Text overlays count:", textOverlays.length);
    
    try {
      // Method 1: Try to capture with html2canvas first
      try {
        const html2canvas = (await import('html2canvas')).default;
        const cameraContainer = webcamRef.current?.parentElement;
        
        if (cameraContainer) {
          console.log("Using html2canvas for capture");
          
          const canvas = await html2canvas(cameraContainer, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scale: 1.5,
            width: cameraContainer.offsetWidth,
            height: cameraContainer.offsetHeight,
            logging: false,
            ignoreElements: (element) => {
              return element.classList.contains('business-tools-panel') || 
                     element.classList.contains('capture-button') ||
                     element.classList.contains('camera-controls') ||
                     element.classList.contains('mode-selector') ||
                     element.classList.contains('recording-timer') ||
                     element.classList.contains('close-button') ||
                     element.classList.contains('help-button');
            }
          });

          console.log("Canvas created successfully");
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              console.log("Blob created:", blob.size, "bytes");
              const file = new File([blob], `photo-${Date.now()}.png`, { type: "image/png" });
              onCapture?.(file);
            }
          }, 'image/png', 0.9);
          
          return; // Success, exit early
        }
      } catch (html2canvasError) {
        console.log("html2canvas failed, falling back to webcam:", html2canvasError);
      }

      // Method 2: Fallback to webcam screenshot
      console.log("Using webcam fallback");
      const dataUrl = webcam.getScreenshot({ 
        width: 1080, 
        height: 1920,
        quality: 0.9
      });
      
      if (!dataUrl) {
        throw new Error("Failed to capture photo");
      }
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.png`, { type: "image/png" });
      
      onCapture?.(file);

    } catch (err) {
      console.error("Photo capture failed:", err);
      alert("Photo capture failed. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, isCapturing, stickers.length, textOverlays.length]);

  // VIDEO RECORDING
  const startRecording = useCallback(() => {
    const stream = webcamRef.current?.stream;
    if (!stream || isRecording) return;
    
    try {
      chunksRef.current = [];
      setRecordingTime(0);
      
      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
      };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = '';
      }
      
      mediaRecRef.current = new MediaRecorder(stream, options);
      
      mediaRecRef.current.ondataavailable = (e) => { 
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecRef.current.onstart = () => {
        setIsRecording(true);
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };
      
      mediaRecRef.current.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
          onCapture?.(file);
        }
        
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };
      
      mediaRecRef.current.start(1000);
      
    } catch (err) {
      console.error("Recording failed:", err);
      setIsRecording(false);
    }
  }, [onCapture, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecRef.current && isRecording) {
      try {
        mediaRecRef.current.stop();
      } catch (err) {
        console.error("Error stopping recording:", err);
        setIsRecording(false);
        setRecordingTime(0);
      }
    }
  }, [isRecording]);

  // Camera controls
  const onSwitchCamera = useCallback(() => {
    setFacing(f => (f === "user" ? "environment" : "user"));
  }, []);

  const onToggleFlash = useCallback(() => {
    setFlashOn(prev => !prev);
  }, []);

  // Business features - SIMPLIFIED AND WORKING
  const addSticker = useCallback((sticker) => {
    const newSticker = {
      ...sticker,
      id: Date.now() + Math.random(),
      x: 100 + Math.random() * 200,
      y: 200 + Math.random() * 300,
      scale: 1,
      rotation: 0,
    };
    console.log("Adding sticker:", newSticker);
    setStickers(prev => {
      const newArray = [...prev, newSticker];
      console.log("New stickers array:", newArray);
      return newArray;
    });
    setSelectedSticker(newSticker.id);
  }, []);

  const addTextOverlay = useCallback((text) => {
    const newText = {
      id: Date.now() + Math.random(),
      text,
      x: 100 + Math.random() * 200,
      y: 300 + Math.random() * 400,
      scale: 1,
      rotation: 0,
      fontSize: 32,
      color: "#FFFFFF",
    };
    console.log("Adding text overlay:", newText);
    setTextOverlays(prev => [...prev, newText]);
    setSelectedSticker(newText.id);
  }, []);

  const removeElement = useCallback((id) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setTextOverlays(prev => prev.filter(t => t.id !== id));
    setSelectedSticker(null);
  }, []);

  // SIZE CONTROLS - SIMPLIFIED AND WORKING
  const increaseSize = useCallback((id) => {
    console.log("Increasing size for id:", id);
    setStickers(prev => {
      const newStickers = prev.map(s => 
        s.id === id ? { ...s, scale: Math.min(s.scale * 1.2, 3) } : s
      );
      console.log("Stickers after increase:", newStickers);
      return newStickers;
    });
    setTextOverlays(prev => {
      const newTextOverlays = prev.map(t => 
        t.id === id ? { ...t, scale: Math.min(t.scale * 1.2, 3) } : t
      );
      console.log("Text overlays after increase:", newTextOverlays);
      return newTextOverlays;
    });
  }, []);

  const decreaseSize = useCallback((id) => {
    console.log("Decreasing size for id:", id);
    setStickers(prev => {
      const newStickers = prev.map(s => 
        s.id === id ? { ...s, scale: Math.max(s.scale * 0.8, 0.3) } : s
      );
      console.log("Stickers after decrease:", newStickers);
      return newStickers;
    });
    setTextOverlays(prev => {
      const newTextOverlays = prev.map(t => 
        t.id === id ? { ...t, scale: Math.max(t.scale * 0.8, 0.3) } : t
      );
      console.log("Text overlays after decrease:", newTextOverlays);
      return newTextOverlays;
    });
  }, []);

  const updateElement = useCallback((id, updates) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const clearAll = useCallback(() => {
    setStickers([]);
    setTextOverlays([]);
    setSelectedSticker(null);
  }, []);

  const handleDragEnd = useCallback((id, info) => {
    const cameraContainer = webcamRef.current?.parentElement;
    if (!cameraContainer) return;
    
    const containerRect = cameraContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    let newX = info.point.x;
    let newY = info.point.y;
    
    const estimatedWidth = 120;
    const estimatedHeight = 60;
    const padding = 20;
    
    newX = Math.max(padding, Math.min(containerWidth - estimatedWidth - padding, newX));
    newY = Math.max(padding, Math.min(containerHeight - estimatedHeight - padding, newY));
    
    updateElement(id, { x: newX, y: newY });
  }, [updateElement]);

  const handleCapture = useCallback(() => {
    if (captureMode === "photo") {
      capturePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [captureMode, isRecording, capturePhoto, startRecording, stopRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecRef.current && isRecording) {
        mediaRecRef.current.stop();
      }
    };
  }, [isRecording]);

  // Filter CSS
  const filterCss = {
    none: "", 
    vintage: "sepia(0.3) contrast(1.1) brightness(1.05)",
    cool: "saturate(1.2) hue-rotate(10deg) brightness(1.05)",
    warm: "saturate(1.1) hue-rotate(-10deg) brightness(1.05)",
    bw: "grayscale(1) contrast(1.15)",
    vibrant: "saturate(1.4) contrast(1.05) brightness(1.1)",
  }[filterId] || "";

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full max-w-[420px] mx-auto overflow-hidden rounded-2xl bg-black">
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Starting camera...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full max-w-[420px] mx-auto overflow-hidden rounded-2xl bg-red-50 border-2 border-red-200">
        <div className="flex items-center justify-center h-96 p-6">
          <div className="text-center text-red-700">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Permission denied
  if (!hasPermission) {
    return (
      <div className="relative w-full max-w-[420px] mx-auto overflow-hidden rounded-2xl bg-yellow-50 border-2 border-yellow-200">
        <div className="flex items-center justify-center h-96 p-6">
          <div className="text-center text-yellow-700">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Camera Permission Required</h3>
            <p className="text-sm mb-4">Please allow camera access to use this feature.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Grant Permission
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[420px] mx-auto overflow-hidden rounded-2xl bg-black">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio
          screenshotFormat="image/png"
          videoConstraints={videoConstraints}
          className="w-full h-auto block"
          style={{ filter: filterCss }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
        />
        
        {/* Flash effect */}
        {flashOn && (
          <div className="absolute inset-0 bg-white opacity-80 pointer-events-none" />
        )}
        
        {/* Business Stickers Overlay - WORKING VERSION */}
        {console.log("Rendering stickers:", stickers)}
        {stickers.map((sticker) => (
          <motion.div
            key={sticker.id}
            data-sticker-id={sticker.id}
            className={`absolute cursor-move select-none ${sticker.color} text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg ${
              selectedSticker === sticker.id ? 'ring-2 ring-yellow-400' : ''
            }`}
            style={{
              left: sticker.x,
              top: sticker.y,
              transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
            }}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragEnd={(e, info) => handleDragEnd(sticker.id, info)}
            onClick={() => {
              console.log("Sticker clicked:", sticker.id);
              setSelectedSticker(sticker.id);
            }}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 1000 }}
          >
            {sticker.icon} {sticker.text}
            
            {/* Size Controls - WORKING VERSION */}
            {selectedSticker === sticker.id && (
              <>
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElement(sticker.id);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
                
                {/* Size controls */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Decrease button clicked for sticker:", sticker.id);
                      decreaseSize(sticker.id);
                    }}
                    className="w-6 h-6 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-blue-600"
                    title="Decrease size"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Increase button clicked for sticker:", sticker.id);
                      increaseSize(sticker.id);
                    }}
                    className="w-6 h-6 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-blue-600"
                    title="Increase size"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}

        {/* Text Overlays - WORKING VERSION */}
        {textOverlays.map((textOverlay) => (
          <motion.div
            key={textOverlay.id}
            data-sticker-id={textOverlay.id}
            className={`absolute cursor-move select-none font-bold shadow-lg ${
              selectedSticker === textOverlay.id ? 'ring-2 ring-yellow-400' : ''
            }`}
            style={{
              left: textOverlay.x,
              top: textOverlay.y,
              fontSize: textOverlay.fontSize,
              color: textOverlay.color,
              transform: `scale(${textOverlay.scale}) rotate(${textOverlay.rotation}deg)`,
            }}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragEnd={(e, info) => handleDragEnd(textOverlay.id, info)}
            onClick={() => {
              console.log("Text overlay clicked:", textOverlay.id);
              setSelectedSticker(textOverlay.id);
            }}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 1000 }}
          >
            {textOverlay.text}
            
            {/* Size Controls - WORKING VERSION */}
            {selectedSticker === textOverlay.id && (
              <>
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElement(textOverlay.id);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
                
                {/* Size controls */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Decrease button clicked for text:", textOverlay.id);
                      decreaseSize(textOverlay.id);
                    }}
                    className="w-6 h-6 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-blue-600"
                    title="Decrease size"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Increase button clicked for text:", textOverlay.id);
                      increaseSize(textOverlay.id);
                    }}
                    className="w-6 h-6 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-blue-600"
                    title="Increase size"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}
        
        {/* Camera Controls */}
        <div className="absolute top-0 left-0 right-0 z-30 p-6 camera-controls">
          <div className="flex justify-between items-center">
            {/* Flash control */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onToggleFlash}
              className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-colors ${
                flashOn ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'
              }`}
              title={flashOn ? "Turn off flash" : "Turn on flash"}
            >
              {flashOn ? <Zap size={20} /> : <ZapOff size={20} />}
            </motion.button>
            
            {/* Camera switch */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSwitchCamera}
              className="w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-xl"
              title="Switch camera"
            >
              <RotateCcw size={20} />
            </motion.button>
          </div>
        </div>
        
        {/* Recording Timer */}
        {isRecording && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 recording-timer">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
              ⏺️ {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Mode Selector */}
        <div className="absolute top-20 right-6 z-30 mode-selector">
          <div className="bg-black/60 backdrop-blur-xl rounded-full p-1">
            <div className="flex">
              <button
                onClick={() => setCaptureMode("photo")}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  captureMode === "photo" 
                    ? "bg-white text-black" 
                    : "text-white hover:bg-white/20"
                }`}
              >
                <Camera size={14} className="inline mr-1" />
                Photo
              </button>
              <button
                onClick={() => setCaptureMode("video")}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  captureMode === "video" 
                    ? "bg-white text-black" 
                    : "text-white hover:bg-white/20"
                }`}
              >
                <Video size={14} className="inline mr-1" />
                Video
              </button>
            </div>
          </div>
        </div>
        
        {/* Capture Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 capture-button">
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/40"
              animate={{
                scale: isRecording ? [1, 1.3, 1] : 1,
                opacity: isRecording ? [0.4, 0.8, 0.4] : 0.4,
              }}
              transition={{
                duration: 1.5,
                repeat: isRecording ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
            
            {/* Main button */}
            <motion.button
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : isCapturing
                  ? "bg-blue-500"
                  : "bg-white hover:bg-gray-100"
              }`}
              whileTap={{ scale: 0.9 }}
              onClick={handleCapture}
              disabled={isCapturing}
            >
              {/* Icon */}
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 bg-white rounded-sm"
                  />
                ) : isCapturing ? (
                  <motion.div
                    key="capturing"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="camera"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 bg-gray-800 rounded-full"
                  />
                )}
              </AnimatePresence>
            </motion.button>
            
            {/* Recording indicator */}
            {isRecording && (
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </motion.div>
            )}
          </div>
          
          {/* Clear instruction */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              {captureMode === "photo" ? (
                <>
                  <Camera size={12} />
                  Tap to take photo
                </>
              ) : (
                <>
                  <Video size={12} />
                  {isRecording ? "Tap to stop recording" : "Tap to start recording"}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Business Tools Panel */}
        <div className="absolute bottom-8 left-0 right-0 z-30 business-tools-panel">
          <div className="flex justify-center px-6">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full max-w-sm"
            >
              {/* Toggle Button */}
              <motion.button
                onClick={() => setIsBusinessToolsOpen(!isBusinessToolsOpen)}
                className="w-full bg-black/60 backdrop-blur-xl rounded-t-2xl p-3 text-white flex items-center justify-between hover:bg-black/70 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <Tag size={16} />
                  <span className="font-medium">Business Tools</span>
                  {(stickers.length > 0 || textOverlays.length > 0) && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {stickers.length + textOverlays.length}
                    </span>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: isBusinessToolsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronUp size={20} />
                </motion.div>
              </motion.button>

              {/* Collapsible Content */}
              <AnimatePresence>
                {isBusinessToolsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="bg-black/60 backdrop-blur-xl rounded-b-2xl overflow-hidden"
                  >
                    <div className="p-3">
                      {/* Header with clear all button */}
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white text-sm font-semibold">Add Elements</h3>
                        {(stickers.length > 0 || textOverlays.length > 0) && (
                          <button
                            onClick={clearAll}
                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                            title="Clear all elements"
                          >
                            <Trash2 size={12} />
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Tab Navigation */}
                      <div className="flex gap-1 mb-3">
                        <button
                          onClick={() => setActiveTab("stickers")}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === "stickers" 
                              ? "bg-white text-black" 
                              : "text-white hover:bg-white/20"
                          }`}
                        >
                          <Tag size={14} className="inline mr-1" />
                          Stickers
                        </button>
                        <button
                          onClick={() => setActiveTab("text")}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === "text" 
                              ? "bg-white text-black" 
                              : "text-white hover:bg-white/20"
                          }`}
                        >
                          <Type size={14} className="inline mr-1" />
                          Text
                        </button>
                        <button
                          onClick={() => setActiveTab("filters")}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === "filters" 
                              ? "bg-white text-black" 
                              : "text-white hover:bg-white/20"
                          }`}
                        >
                          <Smile size={14} className="inline mr-1" />
                          Filters
                        </button>
                      </div>

                      {/* Tab Content */}
                      <AnimatePresence mode="wait">
                        {activeTab === "stickers" && (
                          <motion.div
                            key="stickers"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                          >
                            <div className="text-center text-white/60 text-xs mb-2">
                              Tap to add • Drag to move • Tap × to remove • Use ± to resize
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {BUSINESS_STICKERS.map((sticker) => (
                                <motion.button
                                  key={sticker.id}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => addSticker(sticker)}
                                  className={`${sticker.color} text-white p-2 rounded-lg text-xs font-bold shadow-lg hover:shadow-xl transition-all`}
                                  title={`Add ${sticker.text} sticker`}
                                >
                                  <div className="text-lg mb-1">{sticker.icon}</div>
                                  <div className="text-xs">{sticker.text}</div>
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {activeTab === "text" && (
                          <motion.div
                            key="text"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                            <div className="text-center text-white/60 text-xs mb-2">
                              Quick text or custom input • Use ± to resize
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {QUICK_TEXTS.map((text) => (
                                <motion.button
                                  key={text}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => addTextOverlay(text)}
                                  className="bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
                                  title={`Add "${text}"`}
                                >
                                  {text}
                                </motion.button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                placeholder="Custom text..."
                                className="text-sm bg-white/20 text-white placeholder-white/60 border-none outline-none px-3 py-2 rounded-lg flex-1"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newText.trim()) {
                                    addTextOverlay(newText.trim());
                                    setNewText("");
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  if (newText.trim()) {
                                    addTextOverlay(newText.trim());
                                    setNewText("");
                                  }
                                }}
                                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                                disabled={!newText.trim()}
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {activeTab === "filters" && (
                          <motion.div
                            key="filters"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                            <div className="text-center text-white/60 text-xs mb-2">
                              Choose a filter style
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {FILTERS.map((filter) => (
                                <motion.button
                                  key={filter.id}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setFilterId(filter.id)}
                                  className={`w-16 h-16 rounded-lg border-2 transition-all ${
                                    filterId === filter.id
                                      ? 'border-yellow-400 scale-110'
                                      : 'border-white/30'
                                  }`}
                                  style={{
                                    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                                    "--tw-gradient-from": filter.color.split(" ")[1],
                                    "--tw-gradient-to": filter.color.split(" ")[3],
                                  }}
                                  title={filter.name}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors z-40 close-button"
        title="Close camera"
      >
        ✕
      </button>

      {/* Help Button */}
      <button 
        onClick={() => setShowHelp(!showHelp)} 
        className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors z-40 help-button"
        title="Show help"
      >
        ?
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm"
            >
              <h3 className="text-lg font-bold mb-4 text-gray-800">How to Use</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Camera size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <strong>Photo Mode:</strong> Tap the capture button to take a photo
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Video size={16} className="text-red-500 mt-0.5" />
                  <div>
                    <strong>Video Mode:</strong> Tap to start/stop recording
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Tag size={16} className="text-green-500 mt-0.5" />
                  <div>
                    <strong>Stickers:</strong> Tap to add, drag to move, tap × to remove
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Type size={16} className="text-purple-500 mt-0.5" />
                  <div>
                    <strong>Text:</strong> Choose quick text or type custom
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Move size={16} className="text-orange-500 mt-0.5" />
                  <div>
                    <strong>Move Elements:</strong> Drag stickers and text anywhere on screen
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Plus size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <strong>Resize Elements:</strong> Click element, then use ± buttons to resize
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronUp size={16} className="text-gray-500 mt-0.5" />
                  <div>
                    <strong>Business Tools:</strong> Tap to open/close the tools panel
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
