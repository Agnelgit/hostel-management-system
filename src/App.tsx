import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Sidebar from './components/Layout/Sidebar';
import DashboardStats from './components/Dashboard/DashboardStats';
import StudentList from './components/Students/StudentList';
import StudentDashboard from './components/Students/StudentDashboard';
import StudentFees from './components/Students/StudentFees';
import StudentComplaints from './components/Students/StudentComplaints';
import StudentVisitors from './components/Students/StudentVisitors';
import RoomManagement from './components/Rooms/RoomManagement';
import apiClient from './api/client';

const AppContent: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    // Show student-specific dashboard for students
    if (user?.role === 'student' && activeSection === 'dashboard') {
      return <StudentDashboard />;
    }

    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <DashboardStats onCardClick={(key) => {
              // map simple key to sections
              // simple heuristics: map the card title keyword to a section id
              if (key.includes('student')) setActiveSection('students');
              else if (key.includes('room') || key.includes('available')) setActiveSection('rooms');
              else if (key.includes('complaint') || key.includes('open')) setActiveSection('complaints');
              else if (key.includes('visitor')) setActiveSection('visitors');
              else if (key.includes('fee') || key.includes('pending')) setActiveSection('fees');
              else setActiveSection(key);
            }} />
          </div>
        );
      case 'students':
        return <StudentList />;
      case 'rooms':
        return <RoomManagement />;
      case 'fees':
        if (user?.role === 'student') {
          return <StudentFees />;
        }
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Fee Management</h2>
            <p className="text-gray-600">Fee management functionality coming soon...</p>
          </div>
        );
      case 'complaints':
        if (user?.role === 'student') {
          return <StudentComplaints />;
        }
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaints</h2>
            <p className="text-gray-600">Complaint management functionality coming soon...</p>
          </div>
        );
      case 'visitors':
        if (user?.role === 'student') {
          return <StudentVisitors />;
        }
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Visitor Management</h2>
            <p className="text-gray-600">Visitor management functionality coming soon...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2>
            <p className="text-gray-600">Reports functionality coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <DashboardStats />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;