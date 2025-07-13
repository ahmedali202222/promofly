import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from '../Hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const BusinessDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userPromos, setUserPromos] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch user's own promos
  useEffect(() => {
    if (currentUser?.email) {
      const q = query(
        collection(db, 'promotions'),
        where('email', '==', currentUser.email)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const promos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserPromos(promos);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto mt-10 p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">
          👤 Your Promotions
        </h2>

        {userPromos.length === 0 ? (
          <p className="text-center text-gray-600">No promos found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPromos.map((promo) => (
              <div key={promo.id} className="bg-white shadow p-4 rounded">
                <h4 className="font-bold mb-2">{promo.offerText}</h4>

                {promo.media?.includes('.mp4') || promo.media?.includes('video') ? (
                  <video src={promo.media} controls className="w-full rounded mb-2" />
                ) : promo.media ? (
                  <img src={promo.media} alt="promo" className="w-full rounded mb-2" />
                ) : (
                  <p className="text-sm text-gray-500">No media uploaded</p>
                )}

                <p><strong>Platforms:</strong> {promo.platforms?.join(', ')}</p>
                <p><strong>Location:</strong> {promo.location}</p>
                <p><strong>Budget:</strong> ${promo.budget}</p>

                <p>
                  <strong>Status:</strong>
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full text-white ${
                    promo.status === 'Approved'
                      ? 'bg-green-500'
                      : promo.status === 'Rejected'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}>
                    {promo.status || 'Pending'}
                  </span>
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    className="text-sm text-blue-600 underline"
                    onClick={() => alert('Duplicate promo (coming soon)')}
                  >
                    🔁 Duplicate
                  </button>
                  <button
                    className="text-sm text-gray-600 underline"
                    onClick={() => alert('Resubmit promo (coming soon)')}
                  >
                    🔄 Resubmit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BusinessDashboard;
