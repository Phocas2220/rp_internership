import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleForm from './ModuleForm';
import ModuleList from './ModuleList';
import axios from 'axios';

const ModuleManagement = () => {
  const [modules, setModules] = useState([]);
  const [editingModule, setEditingModule] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'administrator') {
      navigate('/');
    } else {
      fetchModules();
    }
  }, [navigate]); // ✅ Added 'navigate' here

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/modules');
      setModules(res.data);
      setMessage('Modules loaded successfully');
      setError('');
    } catch (err) {
      console.error('Error fetching modules', err);
      setError('Failed to load modules');
      setMessage('');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Module Management</h2>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-2">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{error}</div>}

      {loading ? (
        <div>Loading modules...</div>
      ) : (
        <>
          <ModuleForm 
            onSave={fetchModules} 
            editingModule={editingModule} 
            setEditingModule={setEditingModule} 
          />
          <ModuleList 
            modules={modules} 
            onEdit={setEditingModule} 
            onRefresh={fetchModules} 
          />
        </>
      )}
    </div>
  );
};

export default ModuleManagement;
