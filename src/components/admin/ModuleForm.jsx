import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ModuleForm.css';

const ModuleForm = ({ onSave, editingModule, setEditingModule }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [published, setPublished] = useState(false);
    const [lecturers, setLecturers] = useState([]); // State to store lecturers
    const [selectedLecturerId, setSelectedLecturerId] = useState(''); // State for selected lecturer

    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                const response = await axios.get('/api/lecturers');
                setLecturers(response.data);
            } catch (err) {
                console.error('Failed to fetch lecturers:', err);
            }
        };
        fetchLecturers();
    }, []); // Run once on component mount

    useEffect(() => {
        if (editingModule) {
            setTitle(editingModule.title);
            setDescription(editingModule.description);
            setPublished(editingModule.published);
            // Set selected lecturer if editing a module that has one
            setSelectedLecturerId(editingModule.lecturer_id || '');
        } else {
            setTitle('');
            setDescription('');
            setPublished(false);
            setSelectedLecturerId(''); // Clear selected lecturer when creating new
        }
    }, [editingModule]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Include lecturer_id in the payload
        const payload = { 
            title, 
            description, 
            published, 
            lecturer_id: selectedLecturerId || null // Send null if no lecturer selected
        };

        try {
            if (editingModule) {
                await axios.put(`/api/modules/${editingModule.id}`, payload);
            } else {
                await axios.post('/api/modules', payload);
            }
            onSave(); // refresh list
            setEditingModule(null); // clear form
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="module-form mb-4 space-y-2">
            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Module Title"
                required
                className="block w-full p-2 border rounded"
            />

            <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description"
                className="block w-full p-2 border rounded"
            />

            <label className="block">
                <input
                    type="checkbox"
                    checked={published}
                    onChange={e => setPublished(e.target.checked)}
                    className="mr-2"
                />
                Published
            </label>

            <label className="block">
                Assign Lecturer:
                <select
                    value={selectedLecturerId}
                    onChange={e => setSelectedLecturerId(e.target.value)}
                    className="block w-full p-2 border rounded mt-1"
                >
                    <option value="">-- Select Lecturer --</option>
                    {lecturers.map(lecturer => (
                        <option key={lecturer.id} value={lecturer.id}>
                            {lecturer.firstname} {lecturer.lastname}
                        </option>
                    ))}
                </select>
            </label>

            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                {editingModule ? 'Update' : 'Create'} Module
            </button>
        </form>
    );
};

export default ModuleForm;