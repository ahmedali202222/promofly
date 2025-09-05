import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminPromoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const promoDoc = await getDoc(doc(db, 'promos', id));
        if (promoDoc.exists()) {
          setPromo({ id: promoDoc.id, ...promoDoc.data() });
        } else {
          setError('Promo not found');
        }
      } catch (error) {
        console.error('Error fetching promo:', error);
        setError('Failed to load promo');
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'promos', id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      navigate('/admin');
    } catch (error) {
      console.error('Error approving promo:', error);
      setError('Failed to approve promo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'promos', id), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      navigate('/admin');
    } catch (error) {
      console.error('Error rejecting promo:', error);
      setError('Failed to reject promo');
    } finally {
      setActionLoading(false);
    }
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
            <p className="mt-4 text-gray-600">Loading promo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !promo) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 mb-6">{error || 'Promo not found'}</p>
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            ← Back to Admin
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{promo.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                promo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                promo.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {promo.description || 'No description provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Submitted by</dt>
                    <dd className="mt-1 text-sm text-gray-900">{promo.userEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Files</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {promo.fileUrls && promo.fileUrls.length > 0 ? (
                        <div className="space-y-1">
                          {promo.fileUrls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="text-gray-500">File {index + 1}:</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                              >
                                {promo.fileNames?.[index] || `File ${index + 1}`}
                              </a>
                              <span className="text-gray-400">
                                ({promo.fileTypes?.[index] || 'Unknown type'})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : promo.fileName ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">File:</span>
                          <a
                            href={promo.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {promo.fileName}
                          </a>
                          <span className="text-gray-400">({promo.fileType})</span>
                        </div>
                      ) : (
                        'No files'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(promo.createdAt)}</dd>
                  </div>
                  {promo.updatedAt && promo.updatedAt !== promo.createdAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(promo.updatedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
                {promo.fileUrls && promo.fileUrls.length > 0 ? (
                  <div className="space-y-4">
                    {promo.fileUrls.map((url, index) => {
                      const fileType = promo.fileTypes?.[index] || '';
                      const fileName = promo.fileNames?.[index] || `File ${index + 1}`;
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{fileName}</h4>
                          {fileType.startsWith('image/') ? (
                            <img
                              src={url}
                              alt={fileName}
                              className="w-full h-64 object-cover rounded-lg"
                            />
                          ) : fileType.startsWith('video/') ? (
                            <video
                              src={url}
                              controls
                              className="w-full h-64 rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                              <p className="text-gray-500">Preview not available</p>
                            </div>
                          )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Open in New Tab
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : promo.fileUrl ? (
                  <div className="space-y-4">
                    {promo.fileType.startsWith('image/') ? (
                      <img
                        src={promo.fileUrl}
                        alt={promo.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : promo.fileType.startsWith('video/') ? (
                      <video
                        src={promo.fileUrl}
                        controls
                        className="w-full h-64 rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Preview not available</p>
                      </div>
                    )}
                    <a
                      href={promo.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Open in New Tab
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500">No media available</p>
                )}
              </div>
            </div>

            {promo.status === 'pending' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPromoDetail;
