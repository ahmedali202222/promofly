import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Webcam from "react-webcam";
import { useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import useAuth from "../Hooks/useAuth";
import imageCompression from "browser-image-compression";

/**
 * EnhancedPromoForm
 * - Media upload OR webcam recording (portrait 9:16)
 * - Delete / Redo media
 * - Cancel upload + Retry upload
 * - Image compression (large images)
 * - Video thumbnail generation
 * - Autosave draft to localStorage
 * - Writes storagePath (+ thumbnailPath) to Firestore
 * - ✅ Uses UID in Storage paths to satisfy rules
 */

const DRAFT_KEY = "promoDraft.v1";

const EnhancedPromoForm = () => {
  const { currentUser } = useAuth();

  // form state
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // upload control
  const uploadTaskRef = useRef(null);

  // recording state
  const [isRecording, setIsRecording] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // validation state
  const [validationErrors, setValidationErrors] = useState({});

  // portrait video constraints
  const videoConstraints = { width: 720, height: 1280, facingMode: "user" };

  // ---------- helpers ----------
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

        const cleanup = () => {
          try {
            URL.revokeObjectURL(video.src);
          } catch (_) {}
        };

        video.addEventListener(
          "loadeddata",
          async () => {
            const canvas = document.createElement("canvas");
            const width = 360;
            const height = 640;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, width, height);
            canvas.toBlob((blob) => {
              cleanup();
              resolve(blob);
            }, "image/jpeg");
          },
          { once: true }
        );

        video.load();
      } catch {
        resolve(null);
      }
    });

  // ---------- autosave draft ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setTitle(d.title || "");
        setCaption(d.caption || "");
        setHashtags(d.hashtags || "");
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, caption, hashtags })
      );
    } catch (_) {}
  }, [title, caption, hashtags]);

  // ---------- delete / redo ----------
  const clearMedia = useCallback(() => {
    if (!mediaFile && !mediaUrl) return;
    if (!window.confirm("Remove selected media?")) return;

    if (mediaUrl?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(mediaUrl);
      } catch (_) {}
    }
    setMediaFile(null);
    setMediaUrl("");
    setRecordedChunks([]);
    setValidationErrors((prev) => {
      const { media, duration, aspectRatio, ...rest } = prev;
      return rest;
    });
    toast("Media cleared");
  }, [mediaFile, mediaUrl]);

  const redoMedia = useCallback(() => {
    clearMedia();
    setShowWebcam(true);
  }, [clearMedia]);

  // ---------- dropzone ----------
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      let file = acceptedFiles[0];

      if (file.type.startsWith("image/") && file.size > 3 * 1024 * 1024) {
        try {
          file = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1080,
            useWebWorker: true,
          });
          toast("Image compressed for faster upload");
        } catch (err) {
          console.warn("Compression failed, using original file.", err);
        }
      }

      setMediaFile(file);

      if (mediaUrl) {
        try {
          URL.revokeObjectURL(mediaUrl);
        } catch (_) {}
      }
      setMediaUrl(URL.createObjectURL(file));

      if (file.type.startsWith("video/")) {
        const errors = await validateVideo(file);
        setValidationErrors((prev) => ({ ...prev, ...errors }));
        if (Object.keys(errors).length) toast.error("Video validation failed");
      } else {
        setValidationErrors((prev) => {
          const { duration, aspectRatio, ...rest } = prev;
          return rest;
        });
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

  // ---------- recording ----------
  const handleDataAvailable = useCallback(({ data }) => {
    if (data.size > 0) setRecordedChunks((prev) => prev.concat(data));
  }, []);

  const startRecording = useCallback(() => {
    const stream = webcamRef.current?.stream;
    if (!stream) {
      toast.error("Webcam stream not available. Check camera/mic permissions.");
      return;
    }
    setRecordedChunks([]);
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
    setIsRecording(true);
  }, [handleDataAvailable]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (!recordedChunks.length) return;
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const file = new File([blob], `recorded-${Date.now()}.webm`, {
      type: "video/webm",
    });

    if (mediaUrl) {
      try {
        URL.revokeObjectURL(mediaUrl);
      } catch (_) {}
    }

    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(blob));
    setShowWebcam(false);
    setRecordedChunks([]);
    toast.success("Video recorded successfully!");
  }, [recordedChunks]); // eslint-disable-line

  // ---------- validation ----------
  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Title is required";
    if (!caption.trim()) errors.caption = "Caption is required";
    if (!mediaFile) errors.media = "Please upload or record media";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------- upload + Firestore ----------
  const performUploadAndCreateDoc = async () => {
    const uid = currentUser?.uid;
    if (!uid) throw new Error("Please sign in before submitting.");

    const safeName = makeSafeName(mediaFile?.name, mediaFile?.type);
    const storagePath = `promos/${uid}/${safeName}`; // ✅ matches rules
    const objectRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(objectRef, mediaFile);
    uploadTaskRef.current = uploadTask;

    const thumb =
      mediaFile?.type?.startsWith("video/") && (await getVideoFrameBlob(mediaFile));

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (s) => {
          const pct = Math.round((s.bytesTransferred / s.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (err) => {
          uploadTaskRef.current = null;
          reject(err);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            let thumbnailUrl = "";
            let thumbnailPath = "";
            if (thumb) {
              const thumbName =
                safeName.replace(/\.[^.]+$/, "") + "-thumb.jpg";
              thumbnailPath = `thumbnails/${uid}/${thumbName}`; // ✅ under uid
              const thumbRef = ref(storage, thumbnailPath);
              await uploadBytesResumable(thumbRef, thumb);
              thumbnailUrl = await getDownloadURL(thumbRef);
            }

            await addDoc(collection(db, "promotions"), {
              // New/Enhanced
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

              // Compatibility fields
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

    if (!currentUser?.uid) {
      toast.error("Please sign in before submitting.");
      return;
    }
    if (!validateForm()) {
      toast.error("Fix validation errors");
      return;
    }
    const hasVideoErrors = ["duration", "aspectRatio"].some((k) => validationErrors[k]);
    if (hasVideoErrors) {
      toast.error("Fix video validation errors");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      await performUploadAndCreateDoc();

      toast.success("✅ Promo submitted!");
      setShowSubmitSuccess(true);

      if (mediaUrl) {
        try {
          URL.revokeObjectURL(mediaUrl);
        } catch (_) {}
      }
      setTitle("");
      setCaption("");
      setHashtags("");
      setMediaFile(null);
      setMediaUrl("");
      setValidationErrors({});
      setUploadProgress(0);
      setLoading(false);

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (_) {}
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      setUploadError(err?.message || "Upload failed");
      toast.error("Submission failed.");
      setLoading(false);
    }
  };

  const cancelUpload = () => {
    try {
      uploadTaskRef.current?.cancel();
      toast("Upload canceled");
      setLoading(false);
      setUploadProgress(0);
    } catch (e) {
      console.warn("cancel error", e);
    }
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

      if (mediaUrl) {
        try {
          URL.revokeObjectURL(mediaUrl);
        } catch (_) {}
      }
      setTitle("");
      setCaption("");
      setHashtags("");
      setMediaFile(null);
      setMediaUrl("");
      setValidationErrors({});
      setUploadProgress(0);
      setLoading(false);

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (_) {}
    } catch (err) {
      console.error("RETRY ERROR:", err);
      setUploadError(err?.message || "Upload failed");
      toast.error("Retry failed.");
      setLoading(false);
    }
  };

  // ---------- UI ----------
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
            onClick={() => setShowSubmitSuccess(false)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
            <p className="text-gray-600 mt-2">Create engaging content for your business</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your promo title"
                maxLength={100}
              />
              {validationErrors.title && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">{title.length}/100</p>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption *</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.caption ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Write your promo caption..."
                maxLength={500}
              />
              {validationErrors.caption && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.caption}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">{caption.length}/500</p>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#business #promo #sale"
              />
              <p className="text-gray-500 text-sm mt-1">Separate with commas or spaces</p>
            </div>

            {/* Media upload / webcam */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Media *</label>

              {!showWebcam && (
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
                      Images: JPG, PNG, GIF, WEBP (max 50MB)
                      <br />
                      Videos: MP4, MOV, AVI, WEBM (max 50MB, 90s, 9:16 portrait)
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWebcam(true)}
                      className="inline-flex items-center px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <span className="text-xl mr-2">📹</span>
                      Record Now
                    </button>

                    {mediaUrl && (
                      <>
                        <button
                          type="button"
                          onClick={redoMedia}
                          className="inline-flex items-center px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                          title="Redo / Re-record"
                        >
                          ⟲ Redo
                        </button>
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="inline-flex items-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          title="Delete current media"
                        >
                          🗑 Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {showWebcam && (
                <div className="bg-black rounded-lg p-4">
                  <Webcam
                    ref={webcamRef}
                    audio
                    videoConstraints={videoConstraints}
                    className="w-full max-w-sm mx-auto rounded-lg"
                  />
                  <div className="flex justify-center gap-4 mt-4">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Start Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Stop Recording
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowWebcam(false)}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  {isRecording && (
                    <p className="text-red-500 text-center mt-2 animate-pulse">
                      ● Recording...
                    </p>
                  )}
                </div>
              )}

              {mediaUrl && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Preview:</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={redoMedia}
                        className="px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                      >
                        Redo
                      </button>
                      <button
                        type="button"
                        onClick={clearMedia}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {mediaFile?.type?.startsWith("video/") ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full max-w-sm mx-auto rounded-lg"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="w-full max-w-sm mx-auto rounded-lg"
                    />
                  )}
                </div>
              )}

              {validationErrors.media && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.media}</p>
              )}
              {validationErrors.duration && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.duration}</p>
              )}
              {validationErrors.aspectRatio && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.aspectRatio}</p>
              )}
            </div>

            {/* progress + cancel/retry */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Uploading... {uploadProgress}%
                  </p>
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Cancel Upload
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700 truncate">
                  Upload failed: {uploadError}
                </p>
                <button
                  type="button"
                  onClick={retryUpload}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              {loading ? "Submitting..." : "Submit Promo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPromoForm;
