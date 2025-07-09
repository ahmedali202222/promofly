import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from "../components/Navbar";


const PromoForm = () => {
  const [offerText, setOfferText] = useState('');
  const [media, setMedia] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
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

    try {
      await addDoc(collection(db, 'promotions'), {
        offerText,
        media,
        platforms,
        location,
        createdAt: serverTimestamp(),
      });

      setMessage('✅ Promo submitted successfully!');
      setOfferText('');
      setMedia('');
      setPlatforms([]);
      setLocation('');
    } catch (error) {
      console.error('❌ Error submitting promo:', error);
      setMessage('❌ Failed to submit promo. Please try again.');
    }

    setLoading(false);
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
            type="text"
            placeholder="Link to media (image/video)"
            value={media}
            onChange={(e) => setMedia(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

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
