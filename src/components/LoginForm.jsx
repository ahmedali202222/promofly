import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import useAuth from '../Hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/admin');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('✅ Logged in successfully!');
      navigate('/admin');
    } catch (error) {
      let msg = '❌ Login failed.';
      if (error.code === 'auth/user-not-found') msg = '❌ No account found.';
      if (error.code === 'auth/wrong-password') msg = '❌ Incorrect password.';
      setMessage(msg);
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto mt-10 space-y-4 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold text-center">Admin Login</h2>
      <input
        type="email"
        placeholder="Email"
        className="w-full border px-4 py-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border px-4 py-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
      >
        Login
      </button>
      {message && (
        <p className="text-sm mt-2 text-center text-gray-700">{message}</p>
      )}
    </form>
  );
};

export default LoginForm;
