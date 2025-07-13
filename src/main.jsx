import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import App from './App';
import PromoForm from './components/PromoForm';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import BusinessDashboard from './components/BusinessDashboard';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<App />} />
            <Route path="/submit" element={<PromoForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<BusinessDashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
