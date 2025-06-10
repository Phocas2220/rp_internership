import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleManagement from '../admin/ModuleManagement.jsx';
import UserManagement from '../admin/UserManagement.jsx';
import Reports from '../admin/Reports.jsx';
import { FaPowerOff } from 'react-icons/fa';
import './AdminDashboard.css'; // Make sure this file contains styles for navbar and logout

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('modules');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'administrator') {
      navigate('/'); // redirect unauthorized users to home
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className='des'>
      {/* Navigation Bar */}
      <nav className="navbar">
        <h2 className="title">Administrator Dashboard</h2>
        <button onClick={handleLogout} className="logout-button" title="Logout">
          <FaPowerOff className="power-icon" />
          Logout
        </button>
      </nav>

      {/* Main Dashboard Content */}
      <div className="p-6 dashboard-main">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('modules')}
            className={`btn ${activeTab === 'modules' ? 'btn-primary' : ''}`}
          >
            Module Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`btn ${activeTab === 'reports' ? 'btn-primary' : ''}`}
          >
            System Reports
          </button>
        </div>

        {activeTab === 'modules' && <ModuleManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'reports' && <Reports />}
        </div>
        <h6 className="marquee-heading"> </h6>
    </div>
  );
};

export default AdminDashboard;
