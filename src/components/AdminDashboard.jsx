import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import useAuth from '../Hooks/useAuth';
import SignOutButton from './SignOutButton';
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPromos(data);
      } catch (error) {
        console.error('Error fetching promos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchPromos();
  }, [currentUser]);

  if (!currentUser) return <p className="text-center mt-10">❌ Access denied. Please log in.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Submitted Promos</h2>
        <SignOutButton />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : promos.length === 0 ? (
        <p>No promos submitted yet.</p>
      ) : (
        <div className="space-y-4">
          {promos.map((promo) => (
            <div key={promo.id} className="border p-4 rounded bg-gray-50">
              <p><strong>Offer:</strong> {promo.offerText}</p>
              <p>
                <strong>Media:</strong>{' '}
                <a href={promo.media} className="text-blue-500" target="_blank" rel="noopener noreferrer">
                  {promo.media}
                </a>
              </p>
              <p><strong>Platforms:</strong> {promo.platforms?.join(', ')}</p>
              <p><strong>Location:</strong> {promo.location}</p>
              <p className="text-sm text-gray-500">
                Submitted: {promo.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
