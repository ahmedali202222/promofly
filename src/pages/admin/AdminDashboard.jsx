import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminDashboard = () => {
  const [pendingPromos, setPendingPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'promos'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by createdAt in ascending order (oldest first)
      promosData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.toDate() - b.createdAt.toDate();
      });
      setPendingPromos(promosData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pending promos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Review pending promotional content</p>
        </div>

        {pendingPromos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending promos</h3>
            <p className="text-gray-500">All promotional content has been reviewed.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Pending Promos ({pendingPromos.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Review and approve or reject promotional content
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {pendingPromos.map((promo) => (
                <li key={promo.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {promo.title}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {promo.description || 'No description provided'}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>By: {promo.userEmail}</span>
                          <span className="ml-4">Submitted: {formatDate(promo.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex space-x-2">
                        {promo.fileUrl && (
                          <a
                            href={promo.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            View File
                          </a>
                        )}
                        <Link
                          to={`/admin/promos/${promo.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
