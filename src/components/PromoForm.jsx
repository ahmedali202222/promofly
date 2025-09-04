// src/pages/PromoForm.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import useAuth from "../Hooks/useAuth";
import imageCompression from "browser-image-compression";
import Modal from "./Modal";
import CameraStudio from "../camera/CameraStudio";

const DRAFT_KEY = "promoDraft.v1";

const EnhancedPromoForm = () => {
  const { currentUser } = useAuth();

  // Essential content only
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  // Media
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const uploadTaskRef = useRef(null);

  // Camera modal
  const [showCamera, setShowCamera] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState({});

  const parseHashtags = (s) =>
    s
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

  const makeSafeName = (rawName, mime) => {
    const ext = (mime?.split("/")[1] || "bin").toLowerCase();
    const base = (rawName || `upload-${Date.now()}`)
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base.endsWith(`.${ext}`) ? base : `${base}.${ext}`;
  };

  const validateVideo = (file) =>
    new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const aspectRatio = video.videoWidth / video.videoHeight;
        const expected = 9 / 16;
        const errors = {};
        if (duration > 90) errors.duration = "Video must be 90 seconds or less";
        if (Math.abs(aspectRatio - expected) > 0.1)
          errors.aspectRatio = "Video must be 9:16 portrait format";
        resolve(errors);
      };
      video.src = URL.createObjectURL(file);
    });

  const getVideoFrameBlob = (file) =>
    new Promise(async (resolve) => {
      try {
        const video = document.createElement("video");
        video.muted = true;
        video.src = URL.createObjectURL(file);
        video.addEventListener(
          "loadeddata",
          async () => {
            const W = 360, H = 640;
            const c = document.createElement("canvas");
            c.width = W; c.height = H;
            const ctx = c.getContext("2d");
            ctx.drawImage(video, 0, 0, W, H);
            c.toBlob((b) => resolve(b), "image/jpeg");
          },
          { once: true }
        );
        video.load();
      } catch {
        resolve(null);
      }
    });

  // Autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setTitle(d.title || "");
        setCaption(d.caption || "");
        setHashtags(d.hashtags || "");
      }
    } catch {}
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, caption, hashtags }));
    } catch {}
  }, [title, caption, hashtags]);

  // Media actions
  const clearMedia = useCallback(() => {
    if (!mediaFile && !mediaUrl) return;
    if (!window.confirm("Remove selected media?")) return;
    if (mediaUrl?.startsWith("blob:")) {
      try { URL.revokeObjectURL(mediaUrl); } catch {}
    }
    setMediaFile(null);
    setMediaUrl("");
    setUploadProgress(0);
    setValidationErrors((prev) => {
      const { media, duration, aspectRatio, ...r } = prev;
      return r;
    });
    toast("Media cleared");
  }, [mediaFile, mediaUrl]);

  const redoMedia = useCallback(() => {
    clearMedia();
    setShowCamera(true);
  }, [clearMedia]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      let file = acceptedFiles[0];
      if (file.type.startsWith("image/") && file.size > 3 * 1024 * 1024) {
        try {
          file = await imageCompression(file, {
            maxSizeMB: 2, maxWidthOrHeight: 1080, useWebWorker: true,
          });
          toast("Image compressed for faster upload");
        } catch (e) { console.warn("Compression failed, using original file", e); }
      }
      setMediaFile(file);
      if (mediaUrl) { try { URL.revokeObjectURL(mediaUrl); } catch {} }
      setMediaUrl(URL.createObjectURL(file));

      if (file.type.startsWith("video/")) {
        const errors = await validateVideo(file);
        setValidationErrors((prev) => ({ ...prev, ...errors }));
        if (Object.keys(errors).length) toast.error("Video validation failed");
      } else {
        setValidationErrors((prev) => { const { duration, aspectRatio, ...r } = prev; return r; });
      }
    },
    [mediaUrl]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const validateForm = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!caption.trim()) e.caption = "Caption is required";
    if (!mediaFile) e.media = "Please upload or record media";
    setValidationErrors(e);
    return Object.keys(e).length === 0;
  };

  // Upload to Storage & create Firestore doc
  const performUploadAndCreateDoc = async () => {
    const uid = currentUser?.uid;
    if (!uid) throw new Error("Please sign in before submitting.");
    const safeName = makeSafeName(mediaFile?.name, mediaFile?.type);
    const storagePath = `promos/${uid}/${safeName}`;
    const objectRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(objectRef, mediaFile);
    uploadTaskRef.current = uploadTask;

    const thumb =
      mediaFile?.type?.startsWith("video/") && (await getVideoFrameBlob(mediaFile));

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
        (err) => { uploadTaskRef.current = null; reject(err); },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            let thumbnailUrl = "", thumbnailPath = "";
            if (thumb) {
              const thumbName = safeName.replace(/\.[^.]+$/, "") + "-thumb.jpg";
              thumbnailPath = `thumbnails/${uid}/${thumbName}`;
              const tRef = ref(storage, thumbnailPath);
              const tTask = uploadBytesResumable(tRef, thumb);
              await new Promise((res, rej) => tTask.on("state_changed", () => {}, rej, res));
              thumbnailUrl = await getDownloadURL(tTask.snapshot.ref);
            }
            await addDoc(collection(db, "promotions"), {
              title: title.trim(),
              caption: caption.trim(),
              hashtags: parseHashtags(hashtags),
              mediaUrl: downloadURL,
              mediaType: mediaFile?.type?.startsWith("video/") ? "video" : "image",
              storagePath,
              thumbnailUrl,
              thumbnailPath,
              userId: uid,
              userEmail: currentUser?.email || "",
              offerText: title.trim(),
              media: downloadURL,
              email: currentUser?.email || "",
              status: "Pending",
              adminNote: "",
              createdAt: serverTimestamp(),
            });
            uploadTaskRef.current = null;
            resolve({ downloadURL, storagePath, thumbnailUrl, thumbnailPath });
          } catch (e) {
            uploadTaskRef.current = null;
            reject(e);
          }
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");
    if (!currentUser?.uid) return toast.error("Please sign in before submitting.");
    if (!validateForm()) return toast.error("Fix validation errors");
    const hasVideoErrors = ["duration", "aspectRatio"].some((k) => validationErrors[k]);
    if (hasVideoErrors) return toast.error("Fix video validation errors");

    setLoading(true);
    setUploadProgress(0);
    try {
      await performUploadAndCreateDoc();
      toast.success("✅ Promo submitted!");
      setShowSubmitSuccess(true);
      if (mediaUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(mediaUrl); } catch {} }
      setTitle(""); setCaption(""); setHashtags("");
      setMediaFile(null); setMediaUrl(""); setValidationErrors({});
      setUploadProgress(0);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      setUploadError(err?.message || "Upload failed");
      toast.error("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const cancelUpload = () => {
    try {
      uploadTaskRef.current?.cancel();
      toast("Upload canceled");
      setLoading(false); setUploadProgress(0);
    } catch (e) {}
  };

  const retryUpload = async () => {
    if (!mediaFile) return toast.error("No media to upload");
    setUploadError("");
    setLoading(true);
    setUploadProgress(0);
    try {
      await performUploadAndCreateDoc();
      toast.success("✅ Promo submitted!");
      setShowSubmitSuccess(true);
      if (mediaUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(mediaUrl); } catch {} }
      setTitle(""); setCaption(""); setHashtags("");
      setMediaFile(null); setMediaUrl(""); setValidationErrors({});
      setUploadProgress(0);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    } catch (err) {
      console.error("RETRY ERROR:", err);
      setUploadError(err?.message || "Upload failed");
      toast.error("Retry failed.");
      setLoading(false);
    }
  };

  if (showSubmitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your promo has been submitted successfully. We'll review it and get back to you soon.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
          >
            Submit Another Promo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Submit Your Promo</h1>
            <p className="text-gray-600 mt-2">
              Record or upload media, then submit your promotional content.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {/* Essential Content */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Weekend Sale"
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption *</label>
                <textarea
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.caption ? "border-red-500" : "border-gray-300"
                  }`}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Buy 1, get 1 50% off..."
                />
                {validationErrors.caption && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.caption}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#sale #bogo #local"
                />
              </div>
            </div>

            {/* Media Upload OR Camera */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Media *</label>

              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : validationErrors.media
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-4xl mb-4">📎</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your media here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Images: JPG, PNG, GIF, WEBP (≤50MB). Videos: MP4/MOV/AVI/WEBM (≤50MB, ≤90s, 9:16).
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                  >
                    <span className="text-xl mr-2">📹</span> Camera Studio
                  </button>
                  {mediaUrl && (
                    <>
                      <button
                        type="button"
                        onClick={redoMedia}
                        className="inline-flex items-center px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        ⟲ Redo
                      </button>
                      <button
                        type="button"
                        onClick={clearMedia}
                        className="inline-flex items-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        🗑 Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {mediaUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  {mediaFile?.type?.startsWith("video/") ? (
                    <video src={mediaUrl} controls className="w-full max-w-sm mx-auto rounded-lg" />
                  ) : (
                    <img src={mediaUrl} alt="Preview" className="w-full max-w-sm mx-auto rounded-lg" />
                  )}
                </div>
              )}

              {validationErrors.media && <p className="text-red-500 text-sm mt-1">{validationErrors.media}</p>}
              {validationErrors.duration && <p className="text-red-500 text-sm mt-1">{validationErrors.duration}</p>}
              {validationErrors.aspectRatio && <p className="text-red-500 text-sm mt-1">{validationErrors.aspectRatio}</p>}
            </div>

            {/* Progress + Submit */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                  <button type="button" onClick={cancelUpload} className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
                    Cancel Upload
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700 truncate">Upload failed: {uploadError}</p>
                <button type="button" onClick={retryUpload} className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                  Retry
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {loading ? "Submitting..." : "Submit Promo"}
            </button>
          </form>
        </div>
      </div>

      {/* Camera Modal */}
      <Modal open={showCamera} onClose={() => setShowCamera(false)} noPadding>
        <div className="p-2">
          <CameraStudio
            onClose={() => setShowCamera(false)}
            onCapture={(file) => {
              setShowCamera(false);
              setMediaFile(file);
              if (mediaUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(mediaUrl); } catch {} }
              setMediaUrl(URL.createObjectURL(file));
              
              // Auto-fill title if it's empty
              if (!title.trim() && file.type.startsWith("image/")) {
                setTitle("New Photo Promo");
              } else if (!title.trim() && file.type.startsWith("video/")) {
                setTitle("New Video Promo");
              }
              
              toast.success(`Media captured successfully! ${file.type.startsWith("video/") ? "🎥" : "📸"}`);
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedPromoForm;
