import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Navbar from "../components/Navbar";

const PromoForm = () => {
  const [offerText, setOfferText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handlePlatformChange = (e) => {
    const value = e.target.value;
    setPlatforms((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setUploadProgress(0);

    if (!budget || budget < 5 || budget > 100) {
      setMessage('❌ Budget must be between $5 and $100');
      setLoading(false);
      return;
    }

    if (!mediaFile) {
      setMessage('❌ Please upload an image or video');
      setLoading(false);
      return;
    }

    if (mediaFile.size > 10 * 1024 * 1024) {
      setMessage('❌ File must be under 10MB');
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
          setMessage('❌ Upload failed. Please try again.');
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, 'promotions'), {
            offerText,
            media: downloadURL,
            platforms,
            location,
            budget: parseFloat(budget),
            email,
            createdAt: serverTimestamp(),
          });

          setMessage('✅ Promo submitted successfully!');
          setOfferText('');
          setMediaFile(null);
          setPlatforms([]);
          setLocation('');
          setBudget('');
          setEmail('');
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('❌ Error submitting promo:', error);
      setMessage('❌ Failed to submit promo. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">📢 Submit a New Promo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="What's the offer?"
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setMediaFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

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

          <input
            type="email"
            placeholder="Your Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Submitting...' : 'Submit Promo'}
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
        )}
      </div>
    </>
  );
};

export default PromoForm;
