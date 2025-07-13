import React from 'react';
import { Link } from 'react-router-dom';
   
const App = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Welcome to Promofly 🚀</h1>
      <div className="flex gap-6">
        <Link to="/submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Submit Promo
        </Link>
        <Link to="/login" className="px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-100">
          Admin Login
        </Link>
      </div>
    </div>
  );
};
export default App;
