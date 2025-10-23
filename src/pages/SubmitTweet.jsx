import { useState } from 'react';
import { Link } from 'react-router-dom';

const SubmitTweet = () => {
  const [tweetContent, setTweetContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate a brief delay
    setTimeout(() => {
      setIsSubmitting(false);
      setShowMessage(true);
    }, 1000);
  };

  const handleBackToHome = () => {
    setTweetContent('');
    setShowMessage(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full mb-4">
            <span className="text-2xl">🐦</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Tweet</h1>
          <p className="text-gray-600">Share your thoughts with the world</p>
        </div>

        {/* Tweet Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="tweet" className="block text-sm font-medium text-gray-700 mb-2">
                What's happening?
              </label>
              <textarea
                id="tweet"
                name="tweet"
                rows={4}
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
                placeholder="Share your thoughts, ideas, or updates..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                maxLength={280}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {tweetContent.length}/280 characters
                </span>
                <span className="text-sm text-gray-400">
                  {280 - tweetContent.length} remaining
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting || tweetContent.length === 0}
                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  '🐦 Submit Tweet'
                )}
              </button>
              
              <Link
                to="/"
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Backend Not Ready Message */}
        {showMessage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Backend Integration Pending
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your tweet has been prepared for submission, but the backend functionality is not yet implemented. 
                    The tweet content will be processed once the backend integration is complete.
                  </p>
                  <p className="mt-2 font-medium">
                    Tweet content: "{tweetContent}"
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleBackToHome}
                    className="bg-yellow-100 text-yellow-800 font-medium py-2 px-4 rounded-md hover:bg-yellow-200 transition-colors duration-200"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">📱</span>
              </div>
              <span className="text-sm text-gray-600">Real-time posting to Twitter</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">🔗</span>
              </div>
              <span className="text-sm text-gray-600">Link previews and media</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">⏰</span>
              </div>
              <span className="text-sm text-gray-600">Scheduled posting</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">📊</span>
              </div>
              <span className="text-sm text-gray-600">Analytics and insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitTweet;
