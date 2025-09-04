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
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);

  const videoConstraints = { 
    width: 480, 
    height: 640, 
    facingMode: facing,
    frameRate: 30
  };

  // Helper function to pick supported MIME type
  function pickSupportedMime() {
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      ""
    ];
    return candidates.find(t => !t || MediaRecorder.isTypeSupported(t)) || "";
  }

  const startRecording = () => {
    const stream = webcamRef.current?.stream;
    if (!stream || isRecording) return;
    chunksRef.current = [];
    const mimeType = pickSupportedMime();
    mediaRecRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecRef.current.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
    mediaRecRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
      onCapture?.(file);
      setIsRecording(false);
    };
    mediaRecRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    try { mediaRecRef.current?.stop(); } catch {}
  };

  const cssFilters = {
    none: "", bw: "grayscale(1) contrast(1.05)",
    vintage: "sepia(0.3) contrast(1.1)",
    cool: "saturate(1.2) hue-rotate(10deg)",
    warm: "saturate(1.1) hue-rotate(-10deg)",
    vibrant: "saturate(1.35) contrast(1.06)",
  };

  // Simple photo capture using webcam screenshot
  const capturePhoto = useCallback(async () => {
    console.log("Capture button clicked");
    
    try {
      const dataUrl = webcamRef.current?.getScreenshot();
      if (!dataUrl) {
        console.error("No screenshot data");
        return;
      }
      
      console.log("Screenshot taken, converting to file");
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}.png`, { type: "image/png" });
      
      console.log("File created, calling onCapture");
      onCapture?.(file);
    } catch (error) {
      console.error("Capture error:", error);
    }
  }, [onCapture]);

  // helpers
  const imageFromCanvas = (canvas) =>
    new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = canvas.toDataURL("image/png");
    });

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <div className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl">
        {/* Live video */}
        <Webcam
          ref={webcamRef}
          audio={mode === "video"}
          screenshotFormat="image/png"
          videoConstraints={videoConstraints}
          className="absolute inset-0 w-full h-full object-cover bg-black"
          style={{ filter: cssFilters[filterId] || "" }}
          playsInline
          muted
          mirrored={facing === "user"}
        />

        {/* Stickers layer */}
        <div className="absolute inset-0">
          <StickerCanvas ref={stickerRef} />
        </div>

        {/* Top bar */}
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <button onClick={onClose} className="px-3 py-1.5 rounded-full bg-black/60 text-white">Close</button>
          <div className="flex gap-2">
            <button
              onClick={() => setFacing((f)=> f==="user" ? "environment" : "user")}
              className="px-3 py-1.5 rounded-full bg-black/60 text-white"
            >
              Switch
            </button>
          </div>
        </div>

        {/* Mode switcher inside frame */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button
            onClick={() => {
              console.log("Setting mode to photo");
              setMode("photo");
            }}
            className={`px-3 py-1.5 rounded-full text-sm ${mode==="photo" ? "bg-black text-white" : "bg-black/60 text-white"}`}
          >
            Photo
          </button>
          <button
            onClick={() => {
              console.log("Setting mode to video");
              setMode("video");
            }}
            className={`px-3 py-1.5 rounded-full text-sm ${mode==="video" ? "bg-black text-white" : "bg-black/60 text-white"}`}
          >
            Video
          </button>
        </div>


        {/* Bottom controls */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-3">
          {/* Filters */}
          <div className="flex gap-2 justify-center">
            {["none","bw","vintage","cool","warm","vibrant"].map((id)=>(
              <button key={id}
                onClick={()=>setFilterId(id)}
                className={`px-3 py-1.5 rounded-full text-sm ${filterId===id? "bg-white text-black":"bg-black/60 text-white"}`}>
                {id}
              </button>
            ))}
          </div>

          {/* Tray toggle + Capture */}
          <div className="flex items-center justify-between">
            <button onClick={()=>setShowTray(s=>!s)} className="px-3 py-2 rounded-full bg-black/60 text-white">
              {showTray ? "Hide Stickers" : "Show Stickers"}
            </button>
            {mode === "photo" ? (
              <button
                onClick={() => {
                  console.log("Photo capture button clicked, mode:", mode);
                  capturePhoto();
                }}
                className="px-6 py-3 rounded-full bg-white text-black font-bold shadow"
              >
                Capture
              </button>
            ) : (
              <button
                onClick={() => {
                  console.log("Video button clicked, isRecording:", isRecording);
                  isRecording ? stopRecording() : startRecording();
                }}
                className={`px-6 py-3 rounded-full font-bold shadow ${isRecording ? "bg-red-600 text-white" : "bg-white text-black"}`}
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
