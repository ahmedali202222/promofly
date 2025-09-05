import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import StickerCanvas from "./StickerCanvas";
import StickerTray from "./StickerTray";

export default function CameraStudio({ onClose, onCapture }) {
  const webcamRef = useRef(null);
  const stickerRef = useRef(null);
  const [facing, setFacing] = useState("user");
  const [filterId, setFilterId] = useState("none");
  const [showTray, setShowTray] = useState(true);
  
  // Photo/Video mode state
  const [mode, setMode] = useState("photo"); // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Responsive video constraints based on screen size
  const getVideoConstraints = () => {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 1024;
    
    return {
      width: isMobile ? 270 : isTablet ? 360 : 480,
      height: isMobile ? 480 : isTablet ? 640 : 640,
      facingMode: facing,
      frameRate: isMobile ? 24 : 30
    };
  };

  const getAudioConstraints = () => {
    return mode === "video" ? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    } : false;
  };

  const [videoConstraints, setVideoConstraints] = useState(getVideoConstraints());
  const [audioConstraints, setAudioConstraints] = useState(getAudioConstraints());

  // Update video constraints on window resize and mode change
  useEffect(() => {
    const handleResize = () => {
      setVideoConstraints(getVideoConstraints());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [facing]);

  // Update audio constraints when mode changes
  useEffect(() => {
    setAudioConstraints(getAudioConstraints());
  }, [mode]);

  // Check if MediaRecorder is supported
  const isMediaRecorderSupported = () => {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported;
  };

  // Get supported MIME type with audio codec compatibility
  const getSupportedMimeType = () => {
    // First, check if we have audio tracks
    const stream = getValidStream();
    const hasAudio = stream && stream.getAudioTracks().length > 0;
    
    console.log('Stream has audio tracks:', hasAudio);
    
    // Different candidates based on audio availability
    const candidates = hasAudio ? [
      "video/webm;codecs=vp9,opus",  // Best quality with audio
      "video/webm;codecs=vp8,opus",  // Good quality with audio
      "video/webm;codecs=vp9",       // Video only vp9
      "video/webm;codecs=vp8",       // Video only vp8
      "video/webm",                  // Let browser choose
      "video/mp4;codecs=h264,aac",   // MP4 with audio
      "video/mp4;codecs=h264",       // MP4 video only
      "video/mp4",                   // MP4 default
      "video/ogg;codecs=theora,vorbis", // OGG with audio
      "video/ogg"                    // OGG default
    ] : [
      "video/webm;codecs=vp9",       // Video only vp9
      "video/webm;codecs=vp8",       // Video only vp8
      "video/webm",                  // Let browser choose
      "video/mp4;codecs=h264",       // MP4 video only
      "video/mp4",                   // MP4 default
      "video/ogg;codecs=theora",     // OGG video only
      "video/ogg"                    // OGG default
    ];
    
    for (const mimeType of candidates) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Using MIME type:', mimeType, 'with audio:', hasAudio);
        return mimeType;
      }
    }
    
    console.warn('No supported MIME type found, using default');
    return '';
  };

  // Get valid media stream
  const getValidStream = () => {
    // Try webcam stream first
    let stream = webcamRef.current?.stream;
    
    if (stream) {
      console.log('Using webcam stream');
      return stream;
    }
    
    // Fallback to video srcObject
    const video = webcamRef.current?.video;
    if (video && video.srcObject) {
      console.log('Using video srcObject');
      return video.srcObject;
    }
    
    console.error('No valid stream found');
    return null;
  };

  // Start recording
  const startRecording = async () => {
    if (isRecording) {
      console.log('Already recording');
      return;
    }

    setRecordingError("");
    
    // Check MediaRecorder support
    if (!isMediaRecorderSupported()) {
      setRecordingError('Video recording not supported in this browser');
      return;
    }

    // Get valid stream
    const stream = getValidStream();
    if (!stream) {
      setRecordingError('No camera stream available');
      return;
    }

    // Check stream tracks
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    
    if (videoTracks.length === 0) {
      setRecordingError('No video track available');
      return;
    }

    console.log(`Stream has ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks`);

    try {
      // Clear previous chunks
      chunksRef.current = [];
      
      // Get supported MIME type
      let mimeType = getSupportedMimeType();
      let options = mimeType ? { mimeType } : {};
      
      // Try to create MediaRecorder with progressive fallback
      let mediaRecorder;
      let lastError;
      
      // Try with the selected MIME type first
      try {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log('MediaRecorder created successfully with options:', options);
      } catch (error) {
        console.warn('Failed to create MediaRecorder with selected options, trying fallbacks:', error.message);
        lastError = error;
        
        // Try different MIME types progressively
        const fallbackCandidates = [
          "video/webm",                    // Let browser choose codecs
          "video/webm;codecs=vp9",        // Video only vp9
          "video/webm;codecs=vp8",        // Video only vp8
          "video/mp4",                    // MP4 default
          "video/mp4;codecs=h264",        // MP4 h264
          "video/ogg",                    // OGG default
          ""                              // Browser default
        ];
        
        let success = false;
        for (const candidate of fallbackCandidates) {
          try {
            const fallbackOptions = candidate ? { mimeType: candidate } : {};
            mediaRecorder = new MediaRecorder(stream, fallbackOptions);
            console.log('MediaRecorder created with fallback options:', fallbackOptions);
            success = true;
            break;
          } catch (fallbackError) {
            console.warn(`Failed with ${candidate || 'default'}:`, fallbackError.message);
            lastError = fallbackError;
          }
        }
        
        if (!success) {
          throw lastError || new Error('No supported MIME type found');
        }
      }
      
      mediaRecRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`Data chunk received: ${event.data.size} bytes`);
        }
      };

      mediaRecRef.current.onstop = () => {
        console.log(`Recording stopped. Chunks: ${chunksRef.current.length}`);
        
        if (chunksRef.current.length === 0) {
          setRecordingError('No video data recorded');
          setIsRecording(false);
          return;
        }

        // Create blob and file
        const blob = new Blob(chunksRef.current, { 
          type: chunksRef.current[0]?.type || 'video/webm' 
        });
        
        const file = new File([blob], `video-${Date.now()}.webm`, { 
          type: blob.type 
        });
        
        console.log(`Video file created: ${file.size} bytes, type: ${file.type}`);
        
        // Call capture callback
        onCapture?.(file);
        
        // Reset state
        setIsRecording(false);
        setRecordingTime(0);
        
        // Clear interval
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };

      mediaRecRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        
        let errorMessage = 'Unknown recording error';
        if (event.error?.message) {
          if (event.error.message.includes('codec') || event.error.message.includes('audio track')) {
            errorMessage = 'Audio recording not supported. Recording video only.';
          } else {
            errorMessage = `Recording error: ${event.error.message}`;
          }
        }
        
        setRecordingError(errorMessage);
        setIsRecording(false);
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };

      // Start recording with timeslice for reliable data collection
      mediaRecRef.current.start(200); // 200ms chunks
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingError(`Failed to start recording: ${error.message}`);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!isRecording || !mediaRecRef.current) {
      console.log('Not recording or no MediaRecorder');
      return;
    }

    try {
      console.log('Stopping recording...');
      mediaRecRef.current.stop();
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingError(`Failed to stop recording: ${error.message}`);
      setIsRecording(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const cssFilters = {
    none: "", bw: "grayscale(1) contrast(1.05)",
    vintage: "sepia(0.3) contrast(1.1)",
    cool: "saturate(1.2) hue-rotate(10deg)",
    warm: "saturate(1.1) hue-rotate(-10deg)",
    vibrant: "saturate(1.35) contrast(1.06)",
  };

  // Photo capture with stickers using canvas composition
  const capturePhoto = useCallback(async () => {
    console.log("Capture button clicked");
    
    try {
      const video = webcamRef.current?.video;
      if (!video) {
        console.error("No video element");
        return;
      }

      // Create canvas with same dimensions as video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply CSS filter to canvas
      if (cssFilters[filterId]) {
        ctx.filter = cssFilters[filterId];
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
      }

      // Draw stickers on top - manually handle coordinate transformation
      if (stickerRef.current && stickerRef.current.els) {
        const els = stickerRef.current.els;
        const W = 1080, H = 1920; // StickerCanvas internal dimensions
        
        // Calculate scale from internal space to actual canvas
        const scaleX = canvas.width / W;
        const scaleY = canvas.height / H;
        
        els.forEach((e) => {
          ctx.save();
          
          // Transform coordinates from internal space to canvas space
          const x = e.x * scaleX;
          const y = e.y * scaleY;
          const scale = e.scale * Math.min(scaleX, scaleY);
          
          ctx.translate(x, y);
          ctx.rotate((e.rot * Math.PI) / 180);
          
          if (e.type === "emoji") {
            ctx.font = `${Math.round(120 * scale)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(e.emoji, 0, 0);
          } else if (e.type === "label") {
            const pad = 16 * scale;
            ctx.font = `700 ${Math.round(42 * scale)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
            const textW = ctx.measureText(e.text).width;
            const boxW = textW + pad * 2;
            const boxH = 60 * scale + pad;
            ctx.fillStyle = e.bg || "#111";
            roundRect(ctx, -boxW/2, -boxH/2, boxW, boxH, 14 * scale);
            ctx.fill();
            ctx.fillStyle = e.color || "#fff";
            ctx.textAlign = "center"; 
            ctx.textBaseline = "middle";
            ctx.fillText(e.text, 0, 2 * scale);
          } else if (e.type === "text") {
            ctx.font = `700 ${Math.round(54 * scale)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
            ctx.fillStyle = e.color || "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(e.text, 0, 0);
          }
          ctx.restore();
        });
      }

      // Convert canvas to file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.png`, { type: "image/png" });
          console.log("File created with stickers, calling onCapture");
          onCapture?.(file);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error("Capture error:", error);
    }
  }, [onCapture, filterId]);

  // Helper function for rounded rectangles
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  // helpers
  const imageFromCanvas = (canvas) =>
    new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = canvas.toDataURL("image/png");
    });

  return (
    <div className="relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] mx-auto">
      <div className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl">
        {/* Live video */}
        <Webcam
          ref={webcamRef}
          audio={mode === "video"}
          screenshotFormat="image/png"
          videoConstraints={videoConstraints}
          audioConstraints={audioConstraints}
          className="absolute inset-0 w-full h-full object-cover bg-black"
          style={{ filter: cssFilters[filterId] || "" }}
          playsInline
          muted={mode === "photo"}
          mirrored={facing === "user"}
        />

        {/* Stickers layer */}
        <div className="absolute inset-0">
          <StickerCanvas ref={stickerRef} />
        </div>

        {/* Top bar */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 right-1 sm:right-2 flex justify-between">
          <button onClick={onClose} className="px-2 py-1 rounded-full bg-black/60 text-white text-xs">Close</button>
          <div className="flex gap-1">
            <button
              onClick={() => setFacing((f)=> f==="user" ? "environment" : "user")}
              disabled={isRecording}
              className={`px-2 py-1 rounded-full text-white text-xs ${
                isRecording 
                  ? "bg-gray-500/60 cursor-not-allowed" 
                  : "bg-black/60"
              }`}
            >
              Switch
            </button>
          </div>
        </div>

        {/* Mode switcher inside frame */}
        <div className="absolute top-8 sm:top-10 left-1/2 transform -translate-x-1/2 flex gap-1">
          <button
            onClick={() => {
              console.log("Setting mode to photo");
              setMode("photo");
            }}
            disabled={isRecording}
            className={`px-2 py-1 rounded-full text-xs ${
              isRecording 
                ? "bg-gray-500/60 text-gray-300 cursor-not-allowed" 
                : mode==="photo" 
                ? "bg-black text-white" 
                : "bg-black/60 text-white"
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => {
              console.log("Setting mode to video");
              setMode("video");
            }}
            disabled={isRecording}
            className={`px-2 py-1 rounded-full text-xs ${
              isRecording 
                ? "bg-gray-500/60 text-gray-300 cursor-not-allowed" 
                : mode==="video" 
                ? "bg-black text-white" 
                : "bg-black/60 text-white"
            }`}
          >
            Video
          </button>
        </div>

        {/* Audio indicator */}
        {mode === "video" && (
          <div className="absolute top-16 sm:top-18 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/80 text-white text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"/>
              </svg>
              Audio On
            </div>
          </div>
        )}

                  {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-20 sm:top-22 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/80 text-white text-xs animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Recording... {recordingTime > 0 && `${recordingTime}s`}
              </div>
            </div>
          )}

          {/* Error display */}
          {recordingError && (
            <div className="absolute top-32 sm:top-36 left-1/2 transform -translate-x-1/2">
              <div className="px-3 py-2 rounded-full bg-red-500/90 text-white text-xs max-w-xs text-center">
                {recordingError}
              </div>
            </div>
          )}


        {/* Bottom controls */}
        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2 flex flex-col gap-1 sm:gap-2">
          {/* Filters */}
          <div className="flex gap-1 justify-center flex-wrap">
            {["none","bw","vintage","cool","warm","vibrant"].map((id)=>(
              <button key={id}
                onClick={()=>setFilterId(id)}
                className={`px-2 py-1 rounded-full text-xs ${filterId===id? "bg-white text-black":"bg-black/60 text-white"}`}>
                {id}
              </button>
            ))}
          </div>

          {/* Tray toggle + Capture */}
          <div className="flex items-center justify-between gap-1">
            <button onClick={()=>setShowTray(s=>!s)} className="px-2 py-1 rounded-full bg-black/60 text-white text-xs">
              {showTray ? "Hide" : "Stickers"}
            </button>
            {mode === "photo" ? (
              <button
                onClick={() => {
                  console.log("Photo capture button clicked, mode:", mode);
                  capturePhoto();
                }}
                className="px-3 py-2 rounded-full bg-white text-black font-bold shadow text-xs"
              >
                Capture
              </button>
            ) : (
              <button
                onClick={async () => {
                  console.log("Video button clicked, isRecording:", isRecording);
                  if (isRecording) {
                    console.log("Stopping recording...");
                    stopRecording();
                  } else {
                    console.log("Starting recording...");
                    await startRecording();
                  }
                }}
                disabled={isRecording && !mediaRecRef.current}
                className={`px-3 py-2 rounded-full font-bold shadow text-xs ${
                  isRecording 
                    ? "bg-red-600 text-white" 
                    : "bg-white text-black"
                } ${isRecording && !mediaRecRef.current ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isRecording ? "Stop" : "Record"}
              </button>
            )}
          </div>

          {/* Sticker tray */}
          {showTray && (
            <StickerTray
              onAddEmoji={(e)=>stickerRef.current.addEmoji(e)}
              onAddLabel={(t,bg)=>stickerRef.current.addLabel(t,bg)}
              onAddText={(t)=>stickerRef.current.addText(t)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
