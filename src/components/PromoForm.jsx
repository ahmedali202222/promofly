import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Navbar from "../components/Navbar";
import { useDropzone } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast';
import useAuth from '../Hooks/useAuth';

const PromoForm = () => {
  const { currentUser } = useAuth();

  const [offerText, setOfferText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePlatformChange = (e) => {
    const value = e.target.value;
    setPlatforms((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setMediaFile(acceptedFiles[0]);
        localStorage.setItem('draftMedia', JSON.stringify(acceptedFiles[0]));
      } else {
        toast.error('❌ File must be under 10MB and a supported format');
      }
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('promoDraft');
    if (saved) {
      const draft = JSON.parse(saved);
      setOfferText(draft.offerText || '');
      setPlatforms(draft.platforms || []);
      setLocation(draft.location || '');
      setBudget(draft.budget || '');
      setEmail(draft.email || '');
    }
  }, []);

  useEffect(() => {
    const draft = {
      offerText,
      platforms,
      location,
      budget,
      email
    };
    localStorage.setItem('promoDraft', JSON.stringify(draft));
  }, [offerText, platforms, location, budget, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    if (!offerText.trim()) {
      toast.error('Offer text is required');
      setLoading(false);
      return;
    }
    if (!mediaFile) {
      toast.error('Please upload a media file');
      setLoading(false);
      return;
    }
    if (budget < 5 || budget > 100) {
      toast.error('Budget must be between $5 and $100');
      setLoading(false);
      return;
    }

    try {
      const storageRef = ref(storage, `promos/${Date.now()}-${mediaFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, mediaFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress.toFixed(0));
        },
        (error) => {
          console.error('Upload error:', error);
          toast.error('❌ Upload failed. Please try again.');
          setLoading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'promotions'), {
              offerText,
              media: downloadURL,
              platforms,
              location,
              budget: parseFloat(budget),
              email: currentUser?.email || email || '',
              userId: currentUser?.uid || '',
              createdAt: serverTimestamp(),
              status: 'Pending',
              adminNote: ''
            });
            toast.success('✅ Promo submitted successfully!');
            setOfferText('');
            setMediaFile(null);
            setPlatforms([]);
            setLocation('');
            setBudget('');
            setEmail('');
            setUploadProgress(0);
            localStorage.removeItem('promoDraft');
            localStorage.removeItem('draftMedia');
          } catch (err) {
            console.error('Submission error:', err);
            toast.error('❌ Failed to submit promo.');
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('❌ Error submitting promo:', error);
      toast.error('❌ Failed to submit promo. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Toaster position="top-right" />
      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">📢 Submit a New Promo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="What's the offer?"
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              required
              maxLength={120}
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
            <p className="text-sm text-right text-gray-500 mt-1">{offerText.length}/120</p>
          </div>

          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded px-4 py-8 text-center text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
            <input {...getInputProps()} />
            <p>📂 Drag & drop media here, or click to select</p>
          </div>

          {mediaFile && (
            <div className="mt-2">
              {mediaFile.type.startsWith('video') ? (
                <video src={URL.createObjectURL(mediaFile)} controls className="w-full rounded" />
              ) : (
                <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full rounded" />
              )}
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-4 text-xs text-white text-center"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress}%
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">Select Platforms:</label>
            <div className="flex gap-4 flex-wrap">
              {['Instagram', 'Facebook', 'Snapchat', 'TikTok'].map((platform) => (
                <label key={platform} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={platform}
                    checked={platforms.includes(platform)}
                    onChange={handlePlatformChange}
                    className="accent-blue-600"
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Location (e.g., Detroit, MI)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

          <input
            type="number"
            placeholder="Budget ($5 - $100)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
            min="5"
            max="100"
            required
          />

          {!currentUser && (
            <input
              type="email"
              placeholder="Your Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 relative"
          >
            {loading ? <span className="animate-pulse">⏳ Submitting...</span> : 'Submit Promo'}
          </button>
        </form>
      </div>
    </>
  );
};

export default PromoForm;
