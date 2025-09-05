import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'promos'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by createdAt in descending order (newest first)
      promosData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toDate() - a.createdAt.toDate();
      });
      setPromos(promosData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
            <p className="mt-4 text-gray-600">Loading your promos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Promos</h1>
          <p className="mt-2 text-gray-600">Manage your promotional content</p>
        </div>

        {promos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📸</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No promos yet</h3>
            <p className="text-gray-500 mb-6">Get started by submitting your first promotional content.</p>
            <a
              href="/submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Content
            </a>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {promos.map((promo) => (
                <li key={promo.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-4">
                          {/* Preview Thumbnail */}
                          <div className="flex-shrink-0">
                            {promo.fileUrls && promo.fileUrls.length > 0 ? (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                {promo.fileTypes?.[0]?.startsWith('image/') ? (
                                  <img
                                    src={promo.fileUrls[0]}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : promo.fileTypes?.[0]?.startsWith('video/') ? (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8 5v10l8-5-8-5z"/>
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                                    </svg>
                                  </div>
                                )}
                                {promo.fileCount && promo.fileCount > 1 && (
                                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    +{promo.fileCount - 1}
                                  </div>
                                )}
                              </div>
                            ) : promo.fileUrl ? (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                {promo.fileType?.startsWith('image/') ? (
                                  <img
                                    src={promo.fileUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : promo.fileType?.startsWith('video/') ? (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8 5v10l8-5-8-5z"/>
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Content Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {promo.title}
                                {promo.fileCount && promo.fileCount > 1 && (
                                  <span className="ml-2 text-sm text-gray-500">
                                    ({promo.fileCount} files)
                                  </span>
                                )}
                              </h3>
                              {getStatusBadge(promo.status)}
                            </div>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {promo.description || 'No description provided'}
                            </p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span>Submitted: {formatDate(promo.createdAt)}</span>
                              {promo.updatedAt && promo.updatedAt !== promo.createdAt && (
                                <span className="ml-4">Updated: {formatDate(promo.updatedAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {promo.fileUrls && promo.fileUrls.length > 0 ? (
                          <div className="space-y-1">
                            {promo.fileUrls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                              >
                                View File {promo.fileUrls.length > 1 ? `${index + 1}` : ''}
                              </a>
                            ))}
                          </div>
                        ) : promo.fileUrl ? (
                          <a
                            href={promo.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            View File
                          </a>
                        ) : null}
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

export default Dashboard;
