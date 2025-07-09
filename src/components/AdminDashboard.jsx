import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import useAuth from '../Hooks/useAuth';
import SignOutButton from './SignOutButton';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 6;
const ADMIN_EMAIL = 'admin@yourdomain.com'; // 🔐 your admin email here

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [promos, setPromos] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState(false);
  const [stats, setStats] = useState({ total: 0, platforms: {}, topLocations: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const navigate = useNavigate();
  const firstLoad = useRef(true);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  useEffect(() => {
    const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPromos(data);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      calculateStats(data);

      if (!firstLoad.current) setNewBadge(true);
      firstLoad.current = false;
    });
    return () => unsubscribe();
  }, []);

  const loadMore = async () => {
    if (!lastDoc) return;
    const next = query(
      collection(db, 'promotions'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snapshot = await onSnapshot(next, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPromos((prev) => [...prev, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      calculateStats([...promos, ...data]);
    });
  };

  const calculateStats = (data) => {
    const platformCounts = {};
    const locationCounts = {};
    data.forEach((promo) => {
      promo.platforms?.forEach((p) => {
        platformCounts[p] = (platformCounts[p] || 0) + 1;
      });
      const loc = promo.location?.trim().toLowerCase();
      if (loc) {
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    });
    setStats({
      total: data.length,
      platforms: platformCounts,
      topLocations: locationCounts,
    });
  };

  const handleStatusChange = async (promoId, newStatus) => {
    try {
      const ref = doc(db, 'promotions', promoId);
      await updateDoc(ref, { status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleNoteChange = async (promoId, note) => {
    try {
      const ref = doc(db, 'promotions', promoId);
      await updateDoc(ref, { adminNote: note });
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return alert('❌ You do not have permission.');
    if (window.confirm('Delete this promo?')) {
      try {
        await deleteDoc(doc(db, 'promotions', id));
        setPromos((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error('Error deleting:', err);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Offer Text', 'Media', 'Platforms', 'Location', 'Budget', 'Email', 'Status', 'Note', 'Submitted At'];
    const rows = promos.map((promo) => [
      `"${promo.offerText}"`,
      promo.media || '',
      (promo.platforms || []).join(' | '),
      promo.location || '',
      promo.budget || '',
      promo.email || '',
      promo.status || 'Pending',
      promo.adminNote || '',
      promo.createdAt?.toDate?.().toLocaleString() || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promos.csv';
    a.click();
  };

  const filteredPromos = promos.filter((promo) => {
    const matchText =
      promo.offerText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlatform =
      platformFilter === 'All' || promo.platforms?.includes(platformFilter);
    return matchText && matchPlatform;
  });

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto mt-10 p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            📊 Admin Dashboard {newBadge && <span className="ml-2 text-red-600 text-sm">🆕 New Promo!</span>}
          </h2>
          <SignOutButton />
        </div>

        <div className="bg-white shadow rounded p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="font-bold mb-1">Summary</h3>
              <p>Total Promos: {stats.total}</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {Object.entries(stats.platforms).map(([p, c]) => <li key={p}>{p}: {c}</li>)}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-bold">Top Locations:</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {Object.entries(stats.topLocations).map(([l, c]) => <li key={l}>{l}: {c}</li>)}
              </ul>
            </div>
            <button onClick={handleExportCSV} className="bg-gray-100 hover:bg-gray-200 text-sm px-4 py-2 rounded mt-2">
              ⬇️ Export CSV
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search offer, location, or email"
            className="border px-3 py-2 rounded w-full md:w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="border px-3 py-2 rounded w-full md:w-1/4"
          >
            <option value="All">All Platforms</option>
            <option value="TikTok">TikTok</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Snapchat">Snapchat</option>
          </select>
        </div>

        {/* Promos */}
        {filteredPromos.length === 0 ? (
          <p>No promos found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPromos.map((promo) => (
              <div key={promo.id} className="border p-4 rounded bg-white shadow">
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
                <p><strong>Status:</strong> {promo.status || 'Pending'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted: {promo.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
                </p>

                {/* Status & Notes */}
                {isAdmin && (
                  <>
                    <div className="mt-3">
                      <label className="text-sm font-medium block mb-1">Update Status:</label>
                      <select
                        value={promo.status || 'Pending'}
                        onChange={(e) => handleStatusChange(promo.id, e.target.value)}
                        className="border px-2 py-1 rounded w-full"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="mt-3">
                      <label className="text-sm font-medium block mb-1">Admin Note:</label>
                      <textarea
                        rows={2}
                        defaultValue={promo.adminNote || ''}
                        onBlur={(e) => handleNoteChange(promo.id, e.target.value)}
                        placeholder="Write an internal note..."
                        className="w-full border px-2 py-1 rounded"
                      />
                    </div>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="mt-3 text-red-600 text-sm underline"
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {lastDoc && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
