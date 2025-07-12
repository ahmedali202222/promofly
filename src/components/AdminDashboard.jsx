import React, { useEffect, useState, useRef } from 'react';
// Firebase imports to read/write to Firestore
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase'; // your firebase config
import useAuth from '../Hooks/useAuth'; // custom hook to get current user
import SignOutButton from './SignOutButton';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
// Recharts for displaying data visually
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 6; // Number of items per page
const ADMIN_EMAIL = 'ack48212@gmail.com'; // Authorized admin email

const AdminDashboard = () => {
  const { currentUser } = useAuth(); // Get the current logged-in user
  const [promos, setPromos] = useState([]); // Store promo submissions
  const [lastDoc, setLastDoc] = useState(null); // Track pagination
  const [loading, setLoading] = useState(true); // Loading state
  const [newBadge, setNewBadge] = useState(false); // New promo badge indicator
  const [stats, setStats] = useState({ total: 0, platforms: {}, topLocations: {} }); // Stats summary
  const [searchTerm, setSearchTerm] = useState(''); // Search bar input
  const [platformFilter, setPlatformFilter] = useState('All'); // Filter by platform
  const navigate = useNavigate();
  const firstLoad = useRef(true); // Ref to track if it's the first load

  const isAdmin = currentUser?.email === ADMIN_EMAIL; // Check admin access

  // Redirect to login if no user
  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  // Initial fetch of promo data and stats
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
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Load more promos for pagination (one-time fetch)
  const loadMore = async () => {
    if (!lastDoc) return;
    const next = query(
      collection(db, 'promotions'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    try {
      const snap = await getDocs(next);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPromos((prev) => {
        const updated = [...prev, ...data];
        calculateStats(updated);
        return updated;
      });
      setLastDoc(snap.docs[snap.docs.length - 1]);
    } catch (err) {
      console.error('Error loading more promos:', err);
    }
  };

  // Analyze stats from promos
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

    // Change status of a promo (Approved, Rejected, Pending)
  const handleStatusChange = async (promoId, newStatus) => {
    try {
      const ref = doc(db, 'promotions', promoId);
      await updateDoc(ref, { status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

    // Save admin note
  const handleNoteChange = async (promoId, note) => {
    try {
      const ref = doc(db, 'promotions', promoId);
      await updateDoc(ref, { adminNote: note });
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

 // Delete a promo (admin only)
 const handleDelete = async (id) => {
  if (!isAdmin) return alert('❌ You do not have permission.');
  if (window.confirm('Are you sure you want to delete this promo?')) {
    try {
      await deleteDoc(doc(db, 'promotions', id));
      setPromos((prev) => prev.filter((promo) => promo.id !== id));
      calculateStats(promos.filter((promo) => promo.id !== id));
    } catch (err) {
      console.error('Error deleting promo:', err);
    }
  }
};

    // Export promos as CSV
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

    // Filter promos based on search and platform filter
  const filteredPromos = promos.filter((promo) => {
    const matchText =
      promo.offerText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlatform =
      platformFilter === 'All' || promo.platforms?.includes(platformFilter);
    return matchText && matchPlatform;
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-bold text-sm mb-2">Platform Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={Object.entries(stats.platforms).map(([key, value]) => ({ name: key, value }))}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {Object.entries(stats.platforms).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2">Top Locations</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={Object.entries(stats.topLocations).map(([key, value]) => ({ name: key, count: value }))}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e90ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                <p>
                  <strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full text-white ${
                    promo.status === 'Approved' ? 'bg-green-500' :
                    promo.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    {promo.status || 'Pending'}
                  </span>
                </p>
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
