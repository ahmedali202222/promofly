import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { db } from '../firebase';
import useAuth from '../Hooks/useAuth';
import Navbar from './Navbar';
import SignOutButton from './SignOutButton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

const PAGE_SIZE = 6;
const ADMIN_EMAIL = 'ack48212@gmail.com';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const firstLoad = useRef(true);

  const [promos, setPromos] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [stats, setStats] = useState({ total: 0, platforms: {}, locations: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.email !== ADMIN_EMAIL) navigate('/login');
  }, [currentUser, navigate]);

  useEffect(() => {
    const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromos(data);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      updateStats(data);
      firstLoad.current = false;
    });
    return () => unsubscribe();
  }, []);

  const updateStats = (data) => {
    const platforms = {};
    const locations = {};
    data.forEach(promo => {
      promo.platforms?.forEach(p => {
        platforms[p] = (platforms[p] || 0) + 1;
      });
      const loc = promo.location?.toLowerCase();
      if (loc) {
        locations[loc] = (locations[loc] || 0) + 1;
      }
    });
    setStats({ total: data.length, platforms, locations });
  };

  const handleStatusChange = async (id, status) => {
    await updateDoc(doc(db, 'promotions', id), { status });
  };

  const handleNoteChange = async (id, note) => {
    await updateDoc(doc(db, 'promotions', id), { adminNote: note });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this promo?')) {
      await deleteDoc(doc(db, 'promotions', id));
      setPromos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Offer', 'Location', 'Budget', 'Email', 'Platforms', 'Status', 'Note'];
    const rows = promos.map(p => [
      `"${p.offerText}"`,
      p.location || '',
      `$${p.budget}`,
      p.email || '',
      p.platforms?.join('|') || '',
      p.status || 'Pending',
      p.adminNote || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promos.csv';
    a.click();
  };

  const loadMore = async () => {
    if (!lastDoc) return;
    const q = query(
      collection(db, 'promotions'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(q);
    const newData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPromos(prev => [...prev, ...newData]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
  };

  const filteredPromos = promos.filter(promo => {
    const matchesSearch =
      promo.offerText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'All' || promo.platforms?.includes(platformFilter);
    return matchesSearch && matchesPlatform;
  });

  return (
    <>
       <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            className="border px-3 py-2 rounded w-full md:w-1/2"
            placeholder="Search promos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="border px-3 py-2 rounded w-full md:w-1/4"
          >
            <option value="All">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Snapchat">Snapchat</option>
            <option value="TikTok">TikTok</option>
          </select>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-bold mb-2">Platform Usage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.platforms).map(([k, v]) => ({ name: k, value: v }))}
                  dataKey="value"
                  outerRadius={70}
                  label
                >
                  {Object.entries(stats.platforms).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="font-bold mb-2">Top Locations</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(stats.locations).map(([k, v]) => ({ name: k, value: v }))}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Promo List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromos.map((promo) => (
            <div key={promo.id} className="bg-white p-4 shadow rounded">
              <h4 className="font-bold mb-2">{promo.offerText}</h4>
              {promo.media?.includes('.mp4') ? (
                <video src={promo.media} controls className="w-full mb-2" />
              ) : (
                <img src={promo.media} alt="media" className="w-full mb-2 rounded" />
              )}
              <p><strong>Location:</strong> {promo.location}</p>
              <p><strong>Platforms:</strong> {promo.platforms?.join(', ')}</p>
              <p><strong>Budget:</strong> ${promo.budget}</p>
              <p><strong>Email:</strong> {promo.email}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    promo.status === 'Approved'
                      ? 'bg-green-500 text-white'
                      : promo.status === 'Rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  {promo.status || 'Pending'}
                </span>
              </p>

              {/* Admin Controls */}
              <div className="mt-2">
                <label className="text-sm font-medium">Update Status</label>
                <select
                  value={promo.status || 'Pending'}
                  onChange={(e) => handleStatusChange(promo.id, e.target.value)}
                  className="w-full mt-1 border rounded px-2 py-1"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="mt-2">
                <label className="text-sm font-medium">Admin Note</label>
                <textarea
                  defaultValue={promo.adminNote}
                  onBlur={(e) => handleNoteChange(promo.id, e.target.value)}
                  rows={2}
                  className="w-full mt-1 border rounded px-2 py-1"
                />
              </div>

              <button
                onClick={() => handleDelete(promo.id)}
                className="text-red-600 mt-2 text-sm underline"
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>

        {/* Load More & Export */}
        <div className="mt-6 flex justify-between items-center">
          <button onClick={handleExportCSV} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
            ⬇️ Export CSV
          </button>
          {lastDoc && (
            <button
              onClick={loadMore}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Load More
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
