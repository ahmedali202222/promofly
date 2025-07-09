import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import PromoForm from './components/PromoForm';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/submit" element={<PromoForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
