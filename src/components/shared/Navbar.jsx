import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎬</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Promofly
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {currentUser ? (
              <>
                <Link
                  to="/submit"
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-purple-50"
                >
                  📸 Submit
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-purple-50"
                >
                  📊 Dashboard
                </Link>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isAdmin 
                      ? "text-gray-700 hover:text-red-600 hover:bg-red-50" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  ⚙️ Admin {isAdmin ? "" : "(No Access)"}
                </Link>
                <button
                  onClick={() => {
                    console.log('Current user:', currentUser?.email);
                    console.log('Is admin:', isAdmin);
                    alert(`Email: ${currentUser?.email}\nIs Admin: ${isAdmin}`);
                  }}
                  className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded text-xs"
                  title="Debug Admin Status"
                >
                  🔍
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-red-50"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-purple-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
