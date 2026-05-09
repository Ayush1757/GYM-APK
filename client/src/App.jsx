import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QRScanner from './pages/QRScanner';
import MainLayout from './layouts/MainLayout';

import Payments from './pages/Payments';

// Placeholder components for remaining pages
const Workouts = () => <div className="glass-card p-10 text-center"><h2 className="text-3xl font-black italic underline decoration-neon-green">WORKOUTS</h2><p className="mt-4 text-gray-400">Coming soon... Your personalized training sessions.</p></div>;
const Progress = () => <div className="glass-card p-10 text-center"><h2 className="text-3xl font-black italic underline decoration-neon-green">PROGRESS</h2><p className="mt-4 text-gray-400">Track your body metrics and performance gains.</p></div>;
const Profile = () => <div className="glass-card p-10 text-center"><h2 className="text-3xl font-black italic underline decoration-neon-green">MY PROFILE</h2><p className="mt-4 text-gray-400">Personalize your fitness identity.</p></div>;
const Achievements = () => <div className="glass-card p-10 text-center"><h2 className="text-3xl font-black italic underline decoration-neon-green">ACHIEVEMENTS</h2><p className="mt-4 text-gray-400">Unlock badges and compete in challenges.</p></div>;
const BMICalculator = () => <div className="glass-card p-10 text-center"><h2 className="text-3xl font-black italic underline decoration-neon-green">BMI CALCULATOR</h2><p className="mt-4 text-gray-400">Instant body mass index calculation.</p></div>;

import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<QRScanner />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/bmi" element={<BMICalculator />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
