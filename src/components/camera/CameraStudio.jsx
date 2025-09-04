import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

// Uncomment these if you have them created already
import StickerCanvas from "./StickerCanvas";
import StickerTray from "./StickerTray";

export default function CameraStudio({ onClose, onCapture }) {
  const webcamRef = useRef(null);
  const stickerRef = useRef(null);

  // camera state
  const [facing, setFacing] = useState("user"); // 'user' | 'environment'
  const [frontId, setFrontId] = useState(null);
  const [backId, setBackId] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [videoInputs, setVideoInputs] = useState([]);
  const [streamKey, setStreamKey] = useState(0); // forces <Webcam> remount
  
  // capture mode and recording state
  const [mode, setMode] = useState("photo"); // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);

  // called after permission is granted; enumerate devices then pick front/back
  const handleUserMedia = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      setVideoInputs(cams);

      // try detect by label; otherwise fall back by index order
      const back =
        cams.find((d) => /back|rear|environment/i.test(d.label)) ||
        cams[1] ||
        cams[0];
      const front =
        cams.find((d) => /front|user|face/i.test(d.label)) ||
        cams[0];

      setFrontId(front?.deviceId || null);
      setBackId(back?.deviceId || null);

      // honor current facing on first init if we can
      if (!deviceId) {
        if (facing === "environment" && back?.deviceId) setDeviceId(back.deviceId);
        if (facing === "user" && front?.deviceId) setDeviceId(front.deviceId);
      }
    } catch {
      // On HTTP or before permission, labels may be empty; we still handle fallback
    }
  }, [deviceId, facing]);

  const stopCurrentStream = () => {
    try {
      const stream = webcamRef.current?.stream;
      stream?.getTracks()?.forEach((t) => t.stop());
    } catch {}
  };

  const switchCamera = useCallback(() => {
    // if there is only one camera, do nothing (MacBook scenario)
    if (videoInputs.length < 2) return;

    // stop current stream (crucial for iOS Safari)
    stopCurrentStream();

    setFacing((prev) => {
      const next = prev === "user" ? "environment" : "user";
      if (next === "environment" && backId) setDeviceId(back.deviceId);
      else if (next === "user" && frontId) setDeviceId(front.deviceId);
      else setDeviceId(null); // fallback to facingMode
      return next;
    });

    // force <Webcam> remount with new constraints
    setStreamKey((k) => k + 1);
  }, [videoInputs.length, backId, frontId]);

  // also allow explicit device picking when multiple cameras exist
  const handlePickDevice = (newDeviceId) => {
    stopCurrentStream();
    setDeviceId(newDeviceId || null);
    // set facing based on selection (optional best-effort)
    if (newDeviceId && newDeviceId === backId) setFacing("environment");
    else if (newDeviceId && newDeviceId === frontId) setFacing("user");
    setStreamKey((k) => k + 1);
  };

  // Prefer deviceId (exact), fallback to facingMode (exact)
  const videoConstraints = {
    width: 1080,
    height: 1920,
    ...(deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { exact: facing } }),
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

  // Photo capture with object-cover math (no black bars)
  const capturePhoto = async () => {
    const video = webcamRef.current?.video;
    if (!video) return;
    
    const canvas = document.createElement('canvas');
    const W = 1080, H = 1920; // 9:16 export size
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    
    // Use object-cover math: Math.max scale to fill entire canvas
    const scale = Math.max(W / video.videoWidth, H / video.videoHeight);
    const iw = Math.round(video.videoWidth * scale);
    const ih = Math.round(video.videoHeight * scale);
    const ix = Math.round((W - iw) / 2);
    const iy = Math.round((H - ih) / 2);
    
    // Draw video frame (covers entire canvas, may crop)
    ctx.drawImage(video, ix, iy, iw, ih);
    
    // Add stickers if any
    if (stickerRef.current?.exportPNG) {
      await stickerRef.current.exportPNG(canvas);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture?.(new File([blob], `photo-${Date.now()}.png`, { type: "image/png" }));
      }
    }, "image/png");
  };


  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-full bg-black/60 text-white"
        >
          ✕
        </button>

        {videoInputs.length > 1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={switchCamera}
              className="px-3 py-1.5 rounded-full bg-black/60 text-white"
              title="Flip camera"
            >
              Flip
            </button>
            <select
              className="px-2 py-1 rounded bg-black/60 text-white text-sm"
              value={deviceId || ""}
              onChange={(e) => handlePickDevice(e.target.value)}
            >
              {videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || "Camera"}
                </option>
              ))}
            </select>
          </div>
        ) : (
          // On MacBook (single camera), hide Flip/picker
          <div />
        )}
      </div>


      {/* Fixed 9:16 camera box (preview + stickers) */}
      <div className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl bg-black">
        <Webcam
          key={`${facing}-${deviceId || "nodevice"}-${streamKey}`} // remount on switch/pick
          ref={webcamRef}
          audio={mode === "video"} // enable audio for video recording
          playsInline
          muted
          mirrored={facing === "user"} // selfie mirror
          onUserMedia={handleUserMedia}
          screenshotFormat="image/png"
          videoConstraints={videoConstraints}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Stickers layer */}
        <div className="absolute inset-0">
          <StickerCanvas ref={stickerRef} />
        </div>
      </div>

      {/* Mode switcher */}
      <div className="mt-2 flex justify-center gap-2">
        <button
          onClick={() => setMode("photo")}
          className={`px-3 py-1.5 rounded-full text-sm ${mode==="photo" ? "bg-black text-white" : "bg-black/60 text-white"}`}
        >
          Photo
        </button>
        <button
          onClick={() => setMode("video")}
          className={`px-3 py-1.5 rounded-full text-sm ${mode==="video" ? "bg-black text-white" : "bg-black/60 text-white"}`}
        >
          Video
        </button>
      </div>

      {/* Controls below the camera (outside the 9:16 box so nothing gets cropped) */}
      <div className="mt-3 flex justify-center">
        {mode === "photo" ? (
          <button
            onClick={capturePhoto}
            className="px-6 py-3 rounded-full bg-white text-black font-bold shadow"
          >
            Capture
          </button>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-3 rounded-full font-bold shadow ${isRecording ? "bg-red-600 text-white" : "bg-white text-black"}`}
          >
            {isRecording ? "Stop" : "Record"}
          </button>
        )}
      </div>

      {/* Sticker tray */}
      <div className="mt-3">
        <StickerTray
          onAddEmoji={(e) => stickerRef.current?.addEmoji(e)}
          onAddLabel={(t, bg) => stickerRef.current?.addLabel(t, bg)}
          onAddText={(t) => stickerRef.current?.addText(t)}
        />
      </div>
    </div>
  );
}