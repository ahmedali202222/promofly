import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import useAuth from "../Hooks/useAuth";

const ADMIN_EMAIL = 'ack48212@gmail.com';

const Navbar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    isActive ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600';

  return (
    <nav className="bg-white shadow p-4 mb-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex gap-6">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/submit" className={navLinkClass}>
            Submit Promo
          </NavLink>
          {/* Show "Dashboard" only for logged-in business users */}
          {currentUser && currentUser.email !== ADMIN_EMAIL && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
          {/* Admin shortcut if needed */}
          {currentUser?.email === ADMIN_EMAIL && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </div>
        <div>
          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="text-blue-500 hover:underline">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
