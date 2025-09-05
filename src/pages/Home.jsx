import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Admin Link - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <a href="/admin/login" className="ml-3 px-3 py-2 rounded-lg border border-black/10 hover:bg-black/5">
            Admin
          </a>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Create Amazing</span>{' '}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 xl:inline">
                    Promotional Content
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Capture, edit, and share stunning photos and videos with our powerful camera tools. 
                  Perfect for businesses, creators, and anyone who wants to make their content stand out.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  {currentUser ? (
                    <div className="rounded-md shadow sm:flex">
                      <Link
                        to="/submit"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:scale-105"
                      >
                        📸 Start Creating
                      </Link>
                      <Link
                        to="/dashboard"
                        className="mt-3 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 md:mt-0 md:ml-3 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                      >
                        📊 My Dashboard
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-md shadow sm:flex">
                      <Link
                        to="/signup"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:scale-105"
                      >
                        🚀 Get Started Free
                      </Link>
                      <Link
                        to="/login"
                        className="mt-3 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 md:mt-0 md:ml-3 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-4 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-purple-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to create amazing content
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  📷
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Advanced Camera</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Capture photos and videos with built-in filters, stickers, and real-time editing tools.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  ✨
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Easy Editing</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Add stickers, text, and filters with our intuitive drag-and-drop interface.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  📱
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Mobile First</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Designed for mobile devices with responsive design and touch-friendly controls.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  🚀
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Fast & Reliable</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Lightning-fast performance with real-time updates and cloud storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
