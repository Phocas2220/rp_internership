import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaFileUpload, FaLink, FaFilePdf, FaVideo, FaTextHeight } from 'react-icons/fa'; // Icons for content types and actions
import './ModuleContentManager.css'; // Path is relative to this file

const ModuleContentManager = ({ module, onBackToModules }) => {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddContentModal, setShowAddContentModal] = useState(false);
    const [newContent, setNewContent] = useState({
        title: '',
        description: '',
        content_type: 'text', // Default to text
        file: null, // For file uploads
        fileUrl: '', // For external URLs (if content_type is video_url or external_link)
        display_order: 0 // Will be set dynamically
    });
    const [editingContent, setEditingContent] = useState(null); // null or content object being edited

    const fetchModuleContents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/modules/${module.id}/contents`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Sort contents by display_order when fetched
            setContents(data.sort((a, b) => a.display_order - b.display_order));
        } catch (err) {
            console.error('Failed to fetch module contents:', err);
            setError('Failed to load module content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (module) {
            fetchModuleContents();
        }
    }, [module]); // Re-fetch when the selected module changes

    const handleAddContentChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            setNewContent({ ...newContent, file: files[0] });
        } else {
            setNewContent({ ...newContent, [name]: value });
        }
    };

    const handleEditContentChange = (e) => {
        const { name, value } = e.target;
        setEditingContent({ ...editingContent, [name]: value });
    };

    const handleAddContentSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append('module_id', module.id);
        formData.append('content_type', newContent.content_type);
        formData.append('title', newContent.title);
        formData.append('description', newContent.description);
        formData.append('display_order', contents.length > 0 ? Math.max(...contents.map(c => c.display_order)) + 1 : 0); // Set next available order

        if (newContent.file) {
            formData.append('file', newContent.file);
        } else if (newContent.content_type === 'video_url' || newContent.content_type === 'external_link') {
            formData.append('fileUrl', newContent.fileUrl); // Sending explicitly as fileUrl
        }


        try {
            const response = await fetch('http://localhost:5000/api/module-contents', {
                method: 'POST',
                // No 'Content-Type' header when sending FormData; browser sets it automatically with boundary
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            // After successful addition, re-fetch contents to update the list
            fetchModuleContents();
            setShowAddContentModal(false);
            setNewContent({ title: '', description: '', content_type: 'text', file: null, fileUrl: '', display_order: 0 }); // Reset form
            alert('Content added successfully!');
        } catch (err) {
            console.error('Failed to add content:', err);
            setError(`Failed to add content: ${err.message}`);
        }
    };

    const handleUpdateContentSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!editingContent) return;

        try {
            const response = await fetch(`http://localhost:5000/api/module-contents/${editingContent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content_type: editingContent.content_type,
                    title: editingContent.title,
                    description: editingContent.description,
                    display_order: editingContent.display_order,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            fetchModuleContents(); // Re-fetch to show updated data
            setEditingContent(null); // Close edit mode
            alert('Content updated successfully!');
        } catch (err) {
            console.error('Failed to update content:', err);
            setError(`Failed to update content: ${err.message}`);
        }
    };

    const handleDeleteContent = async (contentId) => {
        if (!window.confirm('Are you sure you want to delete this content item? This action cannot be undone.')) {
            return;
        }
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/module-contents/${contentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            fetchModuleContents(); // Re-fetch to update the list
            alert('Content deleted successfully!');
        } catch (err) {
            console.error('Failed to delete content:', err);
            setError(`Failed to delete content: ${err.message}`);
        }
    };

    const handleReorderContent = async (currentIndex, newIndex) => {
        if (newIndex < 0 || newIndex >= contents.length) {
            return; // Out of bounds
        }

        const reorderedContents = Array.from(contents);
        const [movedItem] = reorderedContents.splice(currentIndex, 1);
        reorderedContents.splice(newIndex, 0, movedItem);

        // Update display_order for all affected items based on their new position
        const updates = reorderedContents.map((item, index) => ({
            id: item.id,
            display_order: index
        }));

        setContents(reorderedContents); // Optimistic UI update

        try {
            const response = await fetch('http://localhost:5000/api/module-contents/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }
            // No need to re-fetch if optimistic update is sufficient, but good for confirmation
            // fetchModuleContents();
            alert('Content reordered successfully!');
        } catch (err) {
            console.error('Failed to reorder content:', err);
            setError(`Failed to reorder content: ${err.message}`);
            fetchModuleContents(); // Revert to server state if optimistic update fails
        }
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'video':
                return <FaVideo className="content-icon" />;
            case 'pdf':
                return <FaFilePdf className="content-icon" />;
            case 'text':
                return <FaTextHeight className="content-icon" />;
            case 'quiz':
                return <FaEdit className="content-icon" />; // Will change later for quiz-specific icon
            case 'video_url':
            case 'external_link':
                return <FaLink className="content-icon" />;
            default:
                return <FaFileUpload className="content-icon" />; // Generic for other file types
        }
    };

    return (
        <div className="module-content-manager">
            <button onClick={onBackToModules} className="back-button">← Back to Modules</button>
            <h3>Content for: {module.title}</h3>
            <p className="module-description-display">{module.description}</p>

            <button onClick={() => setShowAddContentModal(true)} className="add-content-button">
                <FaPlus /> Add New Content
            </button>

            {loading && <p>Loading content...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && contents.length === 0 && (
                <p>No content yet for this module. Click "Add New Content" to get started!</p>
            )}

            <div className="content-list">
                {contents.map((content, index) => (
                    <div key={content.id} className="content-item">
                        <div className="content-info">
                            {getContentIcon(content.content_type)}
                            <h4>{content.title}</h4>
                            <p className="content-type-badge">{content.content_type.replace('_', ' ')}</p>
                            {content.description && <p>{content.description}</p>}
                            {content.file_path && (
                                <a href={`http://localhost:5000${content.file_path}`} target="_blank" rel="noopener noreferrer" className="content-link">
                                    {content.original_filename || content.file_path.split('/').pop()}
                                </a>
                            )}
                        </div>
                        <div className="content-actions">
                            <button onClick={() => setEditingContent(content)} title="Edit Content"><FaEdit /></button>
                            <button onClick={() => handleDeleteContent(content.id)} title="Delete Content"><FaTrash /></button>
                            <button onClick={() => handleReorderContent(index, index - 1)} disabled={index === 0} title="Move Up"><FaArrowUp /></button>
                            <button onClick={() => handleReorderContent(index, index + 1)} disabled={index === contents.length - 1} title="Move Down"><FaArrowDown /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Content Modal */}
            {showAddContentModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add New Content to {module.title}</h3>
                        <form onSubmit={handleAddContentSubmit}>
                            <div className="form-group">
                                <label>Content Type:</label>
                                <select name="content_type" value={newContent.content_type} onChange={handleAddContentChange}>
                                    <option value="text">Text/Article</option>
                                    <option value="video">Video (Upload)</option>
                                    <option value="pdf">PDF</option>
                                    <option value="presentation">Presentation</option>
                                    <option value="video_url">Video (External URL)</option>
                                    <option value="external_link">External Link</option>
                                    <option value="quiz">Quiz</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title:</label>
                                <input type="text" name="title" value={newContent.title} onChange={handleAddContentChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional):</label>
                                <textarea name="description" value={newContent.description} onChange={handleAddContentChange}></textarea>
                            </div>
                            {/* Conditional file input or URL input */}
                            {(newContent.content_type === 'video' || newContent.content_type === 'pdf' || newContent.content_type === 'presentation') && (
                                <div className="form-group">
                                    <label>Upload File:</label>
                                    <input type="file" name="file" onChange={handleAddContentChange} />
                                </div>
                            )}
                            {(newContent.content_type === 'video_url' || newContent.content_type === 'external_link') && (
                                <div className="form-group">
                                    <label>URL:</label>
                                    <input type="text" name="fileUrl" value={newContent.fileUrl} onChange={handleAddContentChange} placeholder="e.g., https://youtube.com/watch?v=..." required />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="submit" className="primary-button">Add Content</button>
                                <button type="button" className="secondary-button" onClick={() => { setShowAddContentModal(false); setNewContent({ title: '', description: '', content_type: 'text', file: null, fileUrl: '', display_order: 0 }); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Content Modal */}
            {editingContent && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Content: {editingContent.title}</h3>
                        <form onSubmit={handleUpdateContentSubmit}>
                            <div className="form-group">
                                <label>Content Type:</label>
                                {/* Consider making this read-only or handle file changes separately */}
                                <select name="content_type" value={editingContent.content_type} onChange={handleEditContentChange}>
                                    <option value="text">Text/Article</option>
                                    <option value="video">Video (Upload)</option>
                                    <option value="pdf">PDF</option>
                                    <option value="presentation">Presentation</option>
                                    <option value="video_url">Video (External URL)</option>
                                    <option value="external_link">External Link</option>
                                    <option value="quiz">Quiz</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title:</label>
                                <input type="text" name="title" value={editingContent.title} onChange={handleEditContentChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional):</label>
                                <textarea name="description" value={editingContent.description} onChange={handleEditContentChange}></textarea>
                            </div>
                            {/* File/URL editing is complex if actual file needs replacement.
                                For now, PUT only updates metadata. For file replacement,
                                user would typically delete and re-add.
                            */}
                            {editingContent.file_path && (
                                <p>Current File/URL: <a href={`http://localhost:5000${editingContent.file_path}`} target="_blank" rel="noopener noreferrer">{editingContent.original_filename || editingContent.file_path.split('/').pop()}</a></p>
                            )}
                            <div className="modal-actions">
                                <button type="submit" className="primary-button">Update Content</button>
                                <button type="button" className="secondary-button" onClick={() => setEditingContent(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleContentManager;