import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Webcam from 'react-webcam';
import { useDropzone } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast';
import useAuth from '../Hooks/useAuth';

const EnhancedPromoForm = () => {
  const { currentUser } = useAuth();

  // form state
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');

  // ui state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  // recording state
  const [isRecording, setIsRecording] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // validation state
  const [validationErrors, setValidationErrors] = useState({});

  // portrait video constraints
  const videoConstraints = { width: 720, height: 1280, facingMode: 'user' };

  // ---------- helpers ----------
  const parseHashtags = (s) =>
    s
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

  // sanitize filename to avoid spaces/unicode/preflight issues
  const makeSafeName = (rawName, mime) => {
    const ext = (mime?.split('/')[1] || 'bin').toLowerCase();
    const base = (rawName || `upload-${Date.now()}`)
      .normalize('NFKD')           // strip diacritics
      .replace(/[^\w.-]+/g, '-')   // spaces/unicode -> hyphens
      .replace(/-+/g, '-')         // collapse --
      .replace(/^-+|-+$/g, '');    // trim
    return base.endsWith(`.${ext}`) ? base : `${base}.${ext}`;
  };

  const validateVideo = (file) =>
    new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const aspectRatio = video.videoWidth / video.videoHeight;
        const expected = 9 / 16;
        const errors = {};
        if (duration > 90) errors.duration = 'Video must be 90 seconds or less';
        if (Math.abs(aspectRatio - expected) > 0.1)
          errors.aspectRatio = 'Video must be 9:16 portrait format';
        resolve(errors);
      };
      video.src = URL.createObjectURL(file);
    });

  // ---------- dropzone ----------
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
    if (file.type.startsWith('video/')) {
      const errors = await validateVideo(file);
      setValidationErrors((prev) => ({ ...prev, ...errors }));
      if (Object.keys(errors).length) toast.error('Video validation failed');
    } else {
      // clear any video-specific validation errors
      setValidationErrors((prev) => {
        const { duration, aspectRatio, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
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
      toast.error('Webcam stream not available. Check camera/mic permissions.');
      return;
    }
    setRecordedChunks([]);
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
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
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const file = new File([blob], `recorded-${Date.now()}.webm`, { type: 'video/webm' });
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(blob));
    setShowWebcam(false);
    setRecordedChunks([]);
    toast.success('Video recorded successfully!');
  }, [recordedChunks]);

  // ---------- validation ----------
  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Title is required';
    if (!caption.trim()) errors.caption = 'Caption is required';
    if (!mediaFile) errors.media = 'Please upload or record media';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Fix validation errors');
      return;
    }
    // if any video-specific errors exist, block submit
    const hasVideoErrors = ['duration', 'aspectRatio'].some((k) => validationErrors[k]);
    if (hasVideoErrors) {
      toast.error('Fix video validation errors');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const safeName = makeSafeName(mediaFile?.name, mediaFile?.type);
      console.log('Uploading:', { safeName, type: mediaFile?.type });

      const storageRef = ref(storage, `promos/${safeName}`);
      const uploadTask = uploadBytesResumable(storageRef, mediaFile);

      uploadTask.on(
        'state_changed',
        (s) => {
          const pct = Math.round((s.bytesTransferred / s.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (err) => {
          console.error('UPLOAD FAIL:', err.code, err.message);
          toast.error(`Upload failed: ${err.code || err.message}`);
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('File uploaded URL:', downloadURL);

          // Write BOTH old and new fields so dashboards show it
          await addDoc(collection(db, 'promotions'), {
            // New/Enhanced
            title: title.trim(),
            caption: caption.trim(),
            hashtags: parseHashtags(hashtags),
            mediaUrl: downloadURL,
            mediaType: mediaFile?.type?.startsWith('video/') ? 'video' : 'image',
            userId: currentUser?.uid || '',
            userEmail: currentUser?.email || '',

            // Compatibility with Admin/Business dashboards
            offerText: title.trim(),
            media: downloadURL,
            email: currentUser?.email || '',
            status: 'Pending',     // capital P (your chips expect this)
            adminNote: '',

            createdAt: serverTimestamp(),
          });

          toast.success('✅ Promo submitted!');
          setShowSubmitSuccess(true);

          // reset
          setTitle('');
          setCaption('');
          setHashtags('');
          setMediaFile(null);
          setMediaUrl('');
          setValidationErrors({});
          setUploadProgress(0);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('SUBMIT ERROR:', err);
      toast.error('Submission failed. Check console.');
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
                  validationErrors.title ? 'border-red-500' : 'border-gray-300'
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
                  validationErrors.caption ? 'border-red-500' : 'border-gray-300'
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
                        ? 'border-blue-500 bg-blue-50'
                        : validationErrors.media
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
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

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowWebcam(true)}
                      className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <span className="text-xl mr-2">📹</span>
                      Record Now
                    </button>
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
                    <p className="text-red-500 text-center mt-2 animate-pulse">● Recording...</p>
                  )}
                </div>
              )}

              {mediaUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  {mediaFile?.type?.startsWith('video/') ? (
                    <video src={mediaUrl} controls className="w-full max-w-sm mx-auto rounded-lg" />
                  ) : (
                    <img src={mediaUrl} alt="Preview" className="w-full max-w-sm mx-auto rounded-lg" />
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

            {/* progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
                <p className="text-center text-sm text-gray-600 mt-2">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              {loading ? 'Submitting...' : 'Submit Promo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPromoForm;
