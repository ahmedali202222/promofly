import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import useAuth from '../Hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const SignOutButton = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Sign Out
    </button>
  );
};

export default SignOutButton;
