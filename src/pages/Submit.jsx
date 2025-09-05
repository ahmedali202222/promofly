import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components';
import { CameraStudio } from '../camera';

const Submit = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileUpload = (uploadedFile) => {
    setFiles(prev => [...prev, uploadedFile]);
    setShowCamera(false);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one file or take a photo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload all files to Storage and collect URLs
      const fileUrls = [];
      const fileNames = [];
      const fileTypes = [];

      for (const file of files) {
        const fileRef = ref(storage, `promos/${currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        
        fileUrls.push(downloadURL);
        fileNames.push(file.name);
        fileTypes.push(file.type);
      }

      // Create Firestore document with multiple files
      await addDoc(collection(db, 'promos'), {
        title,
        description,
        fileUrls, // Array of URLs
        fileNames, // Array of file names
        fileTypes, // Array of file types
        fileCount: files.length,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting promo:', error);
      setError('Failed to submit promo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Submit Your Content
          </h1>
          <p className="text-lg text-gray-600">
            Share your amazing promotional content with the world
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden">
          <div className="px-6 py-8 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Enter a catchy title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Describe your content"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Media *
                </label>
                
                {/* File Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="space-y-4">
                    <div className="text-6xl">📁</div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drop your files here, or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-purple-600 hover:text-purple-500 font-medium"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports multiple images and videos up to 100MB each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Camera Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-full flex items-center justify-center py-4 px-6 border-2 border-purple-300 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all duration-200 transform hover:scale-105"
                  >
                    <span className="text-2xl mr-3">📷</span>
                    <span className="font-medium">Take Photo/Video with Camera</span>
                  </button>
                </div>
                
                {/* Selected Files Display with Previews */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">
                      Selected Files ({files.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {files.map((file, index) => (
                        <div key={index} className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Preview */}
                          <div className="aspect-video bg-gray-100 flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                              />
                            ) : file.type.startsWith('video/') ? (
                              <video
                                src={URL.createObjectURL(file)}
                                className="w-full h-full object-cover"
                                controls
                                onLoadedData={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                              />
                            ) : (
                              <div className="text-center">
                                <div className="text-4xl mb-2">📄</div>
                                <p className="text-sm text-gray-500">Preview not available</p>
                              </div>
                            )}
                          </div>
                          
                          {/* File Info */}
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    file.type.startsWith('image/') 
                                      ? 'bg-green-100 text-green-800' 
                                      : file.type.startsWith('video/') 
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {file.type.startsWith('image/') ? 'Image' : 
                                     file.type.startsWith('video/') ? 'Video' : 'File'}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                                className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                title="Remove file"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || files.length === 0}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting {files.length} file{files.length !== 1 ? 's' : ''}...
                    </div>
                  ) : (
                    `Submit ${files.length} File${files.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal open={showCamera} onClose={() => setShowCamera(false)} noPadding>
        <div className="p-2">
          <CameraStudio
            onClose={() => setShowCamera(false)}
            onCapture={handleFileUpload}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Submit;
