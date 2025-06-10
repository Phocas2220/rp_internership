import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPowerOff, FaPlus, FaTrash, FaEye } from 'react-icons/fa';
import './LecturerDashboard.css'; // Your existing CSS import

const LecturerDashboard = () => {
    const navigate = useNavigate();

    // State for lecturer's ID and assigned modules
    const [lecturerId, setLecturerId] = useState(null);
    const [assignedModules, setAssignedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for Content Upload Form
    const [selectedFile, setSelectedFile] = useState(null);
    const [contentTitle, setContentTitle] = useState('');
    const [contentDescription, setContentDescription] = useState('');
    // selectedModuleId is used for content upload, quiz creation, AND learner viewing
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // State: Module Contents (for display and reordering)
    const [moduleContents, setModuleContents] = useState({});
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [reorderStatus, setReorderStatus] = useState('');
    const [selectedContentItem, setSelectedContentItem] = useState(null);


    // State for Quiz Creation
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDescription, setQuizDescription] = useState('');
    const [quizDuration, setQuizDuration] = useState('');
    const [quizPassPercentage, setQuizPassPercentage] = useState('');
    const [quizQuestions, setQuizQuestions] = useState([]); // Array of question objects
    const [quizCreationStatus, setQuizCreationStatus] = useState(''); // Feedback for quiz creation
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false); // Disable form during submission

    // State: Module Quizzes (to display created quizzes)
    const [moduleQuizzes, setModuleQuizzes] = useState({});

    // States for View/Delete Quiz (existing)
    const [showQuizDetailModal, setShowQuizDetailModal] = useState(false);
    const [quizDetail, setQuizDetail] = useState(null);
    const [quizDetailLoading, setQuizDetailLoading] = useState(false);
    const [quizDetailError, setQuizDetailError] = useState('');
    const [deleteQuizStatus, setDeleteQuizStatus] = useState('');

    // NEW STATE FOR ENROLLED LEARNERS
    const [enrolledLearners, setEnrolledLearners] = useState([]);
    const [learnersLoading, setLearnersLoading] = useState(false);
    const [learnersError, setLearnersError] = useState('');


    // Effect to get lecturer ID from localStorage on component mount
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.role === 'lecturer' && userData.id) {
            setLecturerId(userData.id);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Function to fetch module contents (memoized with useCallback)
    const fetchModuleContents = useCallback(async (moduleId) => {
        if (!moduleId) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/modules/${moduleId}/contents`);
            setModuleContents(prevContents => ({
                ...prevContents,
                [moduleId]: response.data,
            }));
        } catch (err) {
            console.error(`Error fetching contents for module ${moduleId}:`, err);
            setError(`Failed to load contents for module ${moduleId}.`);
        }
    }, []);

    // Function to fetch quizzes for a module (memoized with useCallback)
    const fetchModuleQuizzes = useCallback(async (moduleId) => {
        if (!moduleId) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/modules/${moduleId}/quizzes`);
            setModuleQuizzes(prevQuizzes => ({
                ...prevQuizzes,
                [moduleId]: response.data,
            }));
        } catch (err) {
            console.error(`Error fetching quizzes for module ${moduleId}:`, err);
            setQuizDetailError(`Failed to load quizzes for module ${moduleId}.`);
        }
    }, []);

    // NEW: Function to fetch enrolled learners for a module (memoized with useCallback)
    const fetchEnrolledLearners = useCallback(async (moduleId) => {
        if (!moduleId) {
            setEnrolledLearners([]); // Clear learners if no module selected
            return;
        }

        setLearnersLoading(true);
        setLearnersError('');
        try {
            const response = await axios.get(`http://localhost:5000/api/lecturer/modules/${moduleId}/learners`);
            setEnrolledLearners(response.data);
        } catch (err) {
            console.error(`Error fetching enrolled learners for module ${moduleId}:`, err);
            // If 404 (no learners found), set empty array but don't show an error message.
            // For other errors, display a message.
            if (err.response && err.response.status === 404) {
                setEnrolledLearners([]); // No learners found for this module
            } else {
                setLearnersError(err.response?.data?.error || `Failed to load learners for module ${moduleId}.`);
            }
        } finally {
            setLearnersLoading(false);
        }
    }, []);


    // Function to fetch assigned modules and all associated data
    const fetchAssignedModules = useCallback(async () => {
        if (!lecturerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`http://localhost:5000/api/modules?lecturerId=${lecturerId}`);
            setAssignedModules(response.data);
            if (response.data.length > 0) {
                // Set default selected module if none is selected
                if (!selectedModuleId && response.data[0]) {
                    setSelectedModuleId(response.data[0].id);
                }
                // Fetch content, quizzes, and learners for each module
                response.data.forEach(module => {
                    fetchModuleContents(module.id);
                    fetchModuleQuizzes(module.id);
                    // No need to call fetchEnrolledLearners here in a loop for all modules
                    // Instead, it will be called once `selectedModuleId` changes (see next useEffect)
                });
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching assigned modules:', err);
            setError('Failed to load assigned modules.');
            setLoading(false);
        }
    }, [lecturerId, selectedModuleId, fetchModuleContents, fetchModuleQuizzes]); // Removed fetchEnrolledLearners from dependencies as it's now managed by its own useEffect

    // Effect to fetch assigned modules when lecturerId is available
    useEffect(() => {
        fetchAssignedModules();
    }, [fetchAssignedModules]);

    // NEW Effect to fetch enrolled learners whenever the selectedModuleId changes
    useEffect(() => {
        fetchEnrolledLearners(selectedModuleId);
    }, [selectedModuleId, fetchEnrolledLearners]);


    // Handle File Change (for content upload)
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    // Handle Content Upload Submission (existing)
    const handleUploadContent = async (e) => {
        e.preventDefault();
        if (!selectedModuleId) { setUploadStatus('Please select a module.'); return; }
        if (!contentTitle.trim()) { setUploadStatus('Please enter a title for the content.'); return; }
        if (!selectedFile) { setUploadStatus('Please select a file to upload.'); return; }

        setIsUploading(true);
        setUploadStatus('Uploading...');
        setError('');

        const formData = new FormData();
        formData.append('module_id', selectedModuleId);
        formData.append('title', contentTitle.trim());
        formData.append('description', contentDescription.trim());
        formData.append('contentFile', selectedFile);

        let detectedContentType = '';
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        if (['mp4', 'mov', 'avi', 'webm'].includes(fileExtension)) {
            detectedContentType = 'video';
        } else if (fileExtension === 'pdf') {
            detectedContentType = 'pdf';
        } else if (['ppt', 'pptx'].includes(fileExtension)) {
            detectedContentType = 'presentation';
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            detectedContentType = 'image';
        } else {
            detectedContentType = 'other';
        }
        formData.append('content_type', detectedContentType);

        try {
            const response = await axios.post('http://localhost:5000/api/content/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadStatus(response.data.message || 'Upload successful!');
            setSelectedFile(null);
            setContentTitle('');
            setContentDescription('');
            document.getElementById('contentFile').value = '';
            fetchModuleContents(selectedModuleId);
        } catch (err) {
            console.error('Content upload error:', err);
            setUploadStatus(err.response?.data?.error || 'Upload failed due to a server error.');
            if (!err.response?.data?.error) { setError('Upload failed. Please try again.'); }
        } finally {
            setIsUploading(false);
        }
    };

    // Handle content item reordering (existing)
    const handleMoveContent = (moduleId, currentIndex, direction) => {
        setModuleContents(prevModuleContents => {
            const contents = [...prevModuleContents[moduleId]];
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            if (newIndex >= 0 && newIndex < contents.length) {
                [contents[currentIndex], contents[newIndex]] = [contents[newIndex], contents[currentIndex]];
                contents.forEach((item, idx) => {
                    item.display_order = idx;
                });
                return { ...prevModuleContents, [moduleId]: contents };
            }
            return prevModuleContents;
        });
    };

    // Save reordered content (existing)
    const handleSaveOrder = async (moduleId) => {
        setIsSavingOrder(true);
        setReorderStatus('Saving order...');
        setError('');

        const contentsToUpdate = moduleContents[moduleId].map((content, index) => ({
            id: content.id,
            display_order: index,
        }));

        try {
            const response = await axios.patch('http://localhost:5000/api/content/reorder', {
                contentUpdates: contentsToUpdate
            });
            setReorderStatus(response.data.message || 'Order saved successfully!');
            fetchModuleContents(moduleId);
        } catch (err) {
            console.error('Failed to save order:', err);
            setReorderStatus(err.response?.data?.error || 'Failed to save order due to a server error.');
            setError('Failed to save order. Please try again.');
        } finally {
            setIsSavingOrder(false);
        }
    };

    // Quiz Creation Handlers (existing)
    const handleAddQuestion = () => {
        setQuizQuestions(prevQuestions => [
            ...prevQuestions,
            {
                question_text: '',
                question_type: 'multiple_choice',
                options: [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }],
            }
        ]);
    };

    const handleRemoveQuestion = (index) => {
        setQuizQuestions(prevQuestions => prevQuestions.filter((_, i) => i !== index));
    };

    const handleQuestionChange = (index, field, value) => {
        setQuizQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            newQuestions[index][field] = value;
            if (field === 'question_type') {
                if (value === 'true_false') {
                    newQuestions[index].options = [
                        { option_text: 'True', is_correct: false },
                        { option_text: 'False', is_correct: false }
                    ];
                    newQuestions[index].is_true_correct = null;
                } else if (value === 'multiple_choice') {
                    if (!newQuestions[index].options || newQuestions[index].options.length < 2) {
                        newQuestions[index].options = [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }];
                    }
                    delete newQuestions[index].is_true_correct;
                } else if (value === 'short_answer') {
                    newQuestions[index].options = [];
                    delete newQuestions[index].is_true_correct;
                }
            }
            return newQuestions;
        });
    };

    const handleAddOption = (questionIndex) => {
        setQuizQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            newQuestions[questionIndex].options.push({ option_text: '', is_correct: false });
            return newQuestions;
        });
    };

    const handleRemoveOption = (questionIndex, optionIndex) => {
        setQuizQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
            return newQuestions;
        });
    };

    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
        setQuizQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            if (field === 'is_correct') {
                if (newQuestions[questionIndex].question_type === 'multiple_choice') {
                    newQuestions[questionIndex].options.forEach((opt, idx) => {
                        opt.is_correct = (idx === optionIndex) ? value : false;
                    });
                } else {
                    newQuestions[questionIndex].options[optionIndex][field] = value;
                }
            } else {
                newQuestions[questionIndex].options[optionIndex][field] = value;
            }
            return newQuestions;
        });
    };

    const handleTrueFalseCorrectChange = (questionIndex, isTrue) => {
        setQuizQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            newQuestions[questionIndex].is_true_correct = isTrue;
            newQuestions[questionIndex].options[0].is_correct = isTrue;
            newQuestions[questionIndex].options[1].is_correct = !isTrue;
            return newQuestions;
        });
    };


    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        // ... (Existing quiz creation validation and submission) ...
        if (!selectedModuleId) { setQuizCreationStatus('Please select a module for the quiz.'); return; }
        if (!quizTitle.trim()) { setQuizCreationStatus('Please enter a quiz title.'); return; }
        if (quizQuestions.length === 0) { setQuizCreationStatus('Please add at least one question.'); return; }

        for (const [qIndex, question] of quizQuestions.entries()) {
            if (!question.question_text.trim()) { setQuizCreationStatus(`Question ${qIndex + 1}: text cannot be empty.`); return; }
            if (question.question_type === 'multiple_choice') {
                if (question.options.length < 2) { setQuizCreationStatus(`Question ${qIndex + 1}: Multiple choice questions need at least two options.`); return; }
                const hasCorrectOption = question.options.some(opt => opt.is_correct);
                if (!hasCorrectOption) { setQuizCreationStatus(`Question ${qIndex + 1}: Multiple choice question needs at least one correct option.`); return; }
                for (const [oIndex, option] of question.options.entries()) {
                    if (!option.option_text.trim()) { setQuizCreationStatus(`Question ${qIndex + 1}, Option ${oIndex + 1}: text cannot be empty.`); return; }
                }
            } else if (question.question_type === 'true_false') {
                if (question.is_true_correct === null || question.is_true_correct === undefined) { setQuizCreationStatus(`Question ${qIndex + 1}: Please select the correct answer (True/False).`); return; }
            }
        }

        setIsCreatingQuiz(true);
        setQuizCreationStatus('Creating quiz...');
        setError('');

        const quizData = {
            module_id: selectedModuleId,
            title: quizTitle.trim(),
            description: quizDescription.trim(),
            duration_minutes: quizDuration ? parseInt(quizDuration, 10) : null,
            pass_percentage: quizPassPercentage ? parseInt(quizPassPercentage, 10) : 0,
            questions: quizQuestions.map(q => {
                const newQ = {
                    question_text: q.question_text.trim(),
                    question_type: q.question_type,
                };
                if (q.question_type === 'multiple_choice') {
                    newQ.options = q.options.map(opt => ({
                        option_text: opt.option_text.trim(),
                        is_correct: opt.is_correct,
                    }));
                } else if (q.question_type === 'true_false') {
                    newQ.is_true_correct = q.is_true_correct;
                }
                return newQ;
            })
        };

        try {
            const response = await axios.post('http://localhost:5000/api/quizzes', quizData);
            setQuizCreationStatus(response.data.message || 'Quiz created successfully!');
            setQuizTitle('');
            setQuizDescription('');
            setQuizDuration('');
            setQuizPassPercentage('');
            setQuizQuestions([]);
            fetchModuleQuizzes(selectedModuleId);
        } catch (err) {
            console.error('Quiz creation error:', err);
            setQuizCreationStatus(err.response?.data?.error || 'Quiz creation failed due to a server error.');
            if (!err.response?.data?.error) { setError('Quiz creation failed. Please try again.'); }
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    // Quiz View/Delete Handlers (existing)
    const handleViewQuiz = async (quizId) => {
        setQuizDetailLoading(true);
        setQuizDetailError('');
        setQuizDetail(null);
        setShowQuizDetailModal(true);

        try {
            const response = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`);
            setQuizDetail(response.data);
        } catch (err) {
            console.error('Error fetching quiz details:', err);
            setQuizDetailError(err.response?.data?.error || 'Failed to load quiz details.');
        } finally {
            setQuizDetailLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId, module_id) => {
        if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            setDeleteQuizStatus('Deleting quiz...');
            setError('');

            try {
                const response = await axios.delete(`http://localhost:5000/api/quizzes/${quizId}`);
                setDeleteQuizStatus(response.data.message || 'Quiz deleted successfully!');
                fetchModuleQuizzes(module_id);
            } catch (err) {
                console.error('Error deleting quiz:', err);
                setDeleteQuizStatus(err.response?.data?.error || 'Failed to delete quiz due to a server error.');
            } finally {
                setTimeout(() => setDeleteQuizStatus(''), 3000);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Main loading and error for dashboard
    if (loading) {
        return <p>Loading dashboard content...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div>
            <nav className="navbar">
                <h2 className="title">Lecturer Dashboard</h2>
                <button onClick={handleLogout} className="logout-button" title="Logout">
                    <FaPowerOff className="power-icon" />
                    Logout
                </button>
            </nav>

            <div className="dashboard-content">
                <p className="welcome-message">Welcome, Lecturer!</p>

                {/* === SECTION 1: MODULE PREPARATION === */}
                <div className="module-preparation-section">
                    <h3 className="section-title"> Module Preparation</h3>

                    {/* Assigned Modules and Content/Quiz Display */}
                    <div className="module-list-container">
                        <h4 className="module-list-title">Your Assigned Modules:</h4>
                        {assignedModules.length === 0 ? (
                            <p className="empty-message">No modules assigned to you yet.</p>
                        ) : (
                            <ul className="module-items-list">
                                {assignedModules.map(module => (
                                    <li key={module.id} className="module-item">
                                        <span className="module-title">{module.title}</span> - {module.description}
                                        {module.published ? (
                                            <span className="module-status-published">(Published)</span>
                                        ) : (
                                            <span className="module-status-draft">(Draft)</span>
                                        )}

                                        {/* Display Uploaded Content for this module */}
                                        <div className="this">
  <div className="module-content-section">
    <h5 className="content-section-title">Uploaded Content:</h5>
    {moduleContents[module.id] && moduleContents[module.id].length > 0 ? (
      <>
        <ul className="content-items-list">
          {moduleContents[module.id].map((content, index) => (
            <li key={content.id} className="content-item">
              <div className="content-item-details">
                {content.title} ({content.content_type}) -{' '}
                <button
                  onClick={() => setSelectedContentItem(content)}
                  className="content-view-link"
                >
                  View
                </button>{' '}
                (Original: {content.original_filename})
              </div>
              <div className="content-item-actions">
                <button
                  type="button"
                  onClick={() => handleMoveContent(module.id, index, 'up')}
                  disabled={index === 0 || isSavingOrder}
                  className="content-move-button"
                  title="Move Up"
                >
                  ⬆️
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveContent(module.id, index, 'down')}
                  disabled={index === moduleContents[module.id].length - 1 || isSavingOrder}
                  className="content-move-button"
                  title="Move Down"
                >
                  ⬇️
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* File Viewer */}
        {selectedContentItem && (
          <div className="content-viewer">
            <div className="viewer-header">
              <h4>{selectedContentItem.title}</h4>
              <button className="close-viewer-btn" onClick={() => setSelectedContentItem(null)}>
                ✖ Close
              </button>
            </div>
            <div className="viewer-body">
              {selectedContentItem.content_type === 'video' && (
                <video
                  controls
                  className="content-video"
                  src={`http://localhost:5000${selectedContentItem.file_path}`}
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {selectedContentItem.content_type === 'image' && (
                <img
                  src={`http://localhost:5000${selectedContentItem.file_path}`}
                  alt={selectedContentItem.title}
                  className="content-image"
                />
              )}

              {['pdf', 'presentation'].includes(selectedContentItem.content_type) && (
                <iframe
                  src={`http://localhost:5000/${selectedContentItem.file_path}`}
                  title={selectedContentItem.title}
                  className="content-iframe"
                  allowFullScreen
                >
                  Your browser doesn't support embedded files.{' '}
                  <a
                    href={`http://localhost:5000${selectedContentItem.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here to open
                  </a>
                </iframe>
              )}

              {selectedContentItem.content_type === 'link' && (
                <div className="external-link-container">
                  <p>Click the button below to open the external resource:</p>
                  <a
                    href={selectedContentItem.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn external-resource-btn"
                  >
                    🌐 Open External Link
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="save-order-container">
          <button
            type="button"
            onClick={() => handleSaveOrder(module.id)}
            className="save-order-button"
            disabled={isSavingOrder}
          >
            {isSavingOrder ? 'Saving Order...' : 'Save Order'}
          </button>
        </div>

        {reorderStatus && (
          <p className={`reorder-status ${reorderStatus.includes('successful') ? 'success' : 'error'}`}>
            {reorderStatus}
          </p>
        )}
      </>
    ) : (
      <p className="empty-content-message">
        No content uploaded for this module yet. Use the form below to add some!
      </p>
    )}
  </div>

  {/* Display Quizzes for this module */}
  <div className="module-quiz-section">
    <h5 className="quiz-section-title">Assigned Quizzes:</h5>
    {moduleQuizzes[module.id] && moduleQuizzes[module.id].length > 0 ? (
      <ul className="quiz-items-list">
        {moduleQuizzes[module.id].map((quiz) => (
          <li key={quiz.id} className="quiz-item">
            <div className="quiz-item-details">
              {quiz.title} ({quiz.duration_minutes || 'N/A'} mins, {quiz.pass_percentage}% pass)
            </div>
            <div className="quiz-item-actions">
              <button
                type="button"
                onClick={() => handleViewQuiz(quiz.id)}
                className="quiz-action-button view"
                title="View Quiz Details"
              >
                <FaEye className="icon-margin" /> View
              </button>
              <button
                type="button"
                onClick={() => handleDeleteQuiz(quiz.id, module.id)}
                className="quiz-action-button delete"
                title="Delete Quiz"
              >
                <FaTrash className="icon-margin" /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="empty-quiz-message">
        No quizzes created for this module yet. Use the form below to create one!
      </p>
    )}
    {deleteQuizStatus && (
      <p className={`delete-quiz-status ${deleteQuizStatus.includes('successful') ? 'success' : 'error'}`}>
        {deleteQuizStatus}
      </p>
    )}
  </div>
</div>

                                                             

                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Content Upload Form */}
                    <div className="form-container">
                        <h4 className="form-title"> Upload New Module Content</h4>
                        <form onSubmit={handleUploadContent} className="content-upload-form">
                            <div className="form-group">
                                <label htmlFor="selectModuleContent" className="form-label">Select Module:</label>
                                <select
                                    id="selectModuleContent"
                                    className="form-select"
                                    value={selectedModuleId}
                                    onChange={(e) => setSelectedModuleId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select a Module --</option>
                                    {assignedModules.map(module => (
                                        <option key={module.id} value={module.id}>
                                            {module.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="contentTitle" className="form-label">Content Title:</label>
                                <input
                                    type="text"
                                    id="contentTitle"
                                    className="form-input"
                                    value={contentTitle}
                                    onChange={(e) => setContentTitle(e.target.value)}
                                    placeholder="e.g., Introduction to React"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contentDescription" className="form-label">Description (Optional):</label>
                                <textarea
                                    id="contentDescription"
                                    className="form-textarea"
                                    value={contentDescription}
                                    onChange={(e) => setContentDescription(e.target.value)}
                                    placeholder="Brief description of the content..."
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="contentFile" className="form-label">Select File:</label>
                                <input
                                    type="file"
                                    id="contentFile"
                                    className="form-file-input"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-button" disabled={isUploading}>
                                <FaPlus className="icon-margin" /> {isUploading ? 'Uploading...' : 'Upload Content'}
                            </button>
                            {uploadStatus && (
                                <p className={`status-message ${uploadStatus.includes('successful') ? 'success' : 'error'}`}>
                                    {uploadStatus}
                                </p>
                            )}
                        </form>
                    </div>

                    {/* Quiz Creation Form */}
                    <div className="form-container">
                        <h4 className="form-title"> Create New Quiz</h4>
                        <form onSubmit={handleCreateQuiz} className="quiz-creation-form">
                            <div className="form-group">
                                <label htmlFor="selectModuleQuiz" className="form-label">Select Module:</label>
                                <select
                                    id="selectModuleQuiz"
                                    className="form-select"
                                    value={selectedModuleId}
                                    onChange={(e) => setSelectedModuleId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select a Module --</option>
                                    {assignedModules.map(module => (
                                        <option key={module.id} value={module.id}>
                                            {module.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="quizTitle" className="form-label">Quiz Title:</label>
                                <input
                                    type="text"
                                    id="quizTitle"
                                    className="form-input"
                                    value={quizTitle}
                                    onChange={(e) => setQuizTitle(e.target.value)}
                                    placeholder="e.g., React Basics Quiz"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="quizDescription" className="form-label">Description (Optional):</label>
                                <textarea
                                    id="quizDescription"
                                    className="form-textarea"
                                    value={quizDescription}
                                    onChange={(e) => setQuizDescription(e.target.value)}
                                    placeholder="Brief description of the quiz..."
                                    rows="2"
                                ></textarea>
                            </div>
                            <div className="form-group-inline">
                                <div className="form-group">
                                    <label htmlFor="quizDuration" className="form-label">Duration (Minutes):</label>
                                    <input
                                        type="number"
                                        id="quizDuration"
                                        className="form-input-short"
                                        value={quizDuration}
                                        onChange={(e) => setQuizDuration(e.target.value)}
                                        placeholder="e.g., 30"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="quizPassPercentage" className="form-label">Pass Percentage (%):</label>
                                    <input
                                        type="number"
                                        id="quizPassPercentage"
                                        className="form-input-short"
                                        value={quizPassPercentage}
                                        onChange={(e) => setQuizPassPercentage(e.target.value)}
                                        placeholder="e.g., 70"
                                    />
                                </div>
                            </div>

                            <h5 className="sub-section-title">Quiz Questions:</h5>
                            {quizQuestions.length === 0 && <p className="empty-message">No questions added yet. Click "Add Question" to start.</p>}
                            {quizQuestions.map((question, qIndex) => (
                                <div key={qIndex} className="question-block">
                                    <div className="question-header">
                                        <label className="form-label">Question {qIndex + 1}:</label>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(qIndex)}
                                            className="remove-button"
                                            title="Remove Question"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                    <textarea
                                        className="form-textarea"
                                        value={question.question_text}
                                        onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                                        placeholder="Enter question text here..."
                                        rows="2"
                                        required
                                    ></textarea>

                                    <div className="form-group">
                                        <label className="form-label">Question Type:</label>
                                        <select
                                            className="form-select"
                                            value={question.question_type}
                                            onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                                        >
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false">True/False</option>
                                            <option value="short_answer">Short Answer</option>
                                        </select>
                                    </div>

                                    {question.question_type === 'multiple_choice' && (
                                        <div className="options-section">
                                            <h6 className="options-title">Options (Select one correct):</h6>
                                            {question.options.map((option, oIndex) => (
                                                <div key={oIndex} className="option-item">
                                                    <input
                                                        type="radio"
                                                        name={`correct-option-${qIndex}`}
                                                        checked={option.is_correct}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, 'is_correct', e.target.checked)}
                                                        className="option-radio"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option.option_text}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, 'option_text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className="form-input-inline"
                                                        required
                                                    />
                                                    {question.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                            className="remove-option-button"
                                                            title="Remove Option"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => handleAddOption(qIndex)}
                                                className="add-option-button"
                                            >
                                                Add Option
                                            </button>
                                        </div>
                                    )}

                                    {question.question_type === 'true_false' && (
                                        <div className="true-false-section">
                                            <label className="form-label">Correct Answer:</label>
                                            <div className="true-false-radios">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`true-false-${qIndex}`}
                                                        checked={question.is_true_correct === true}
                                                        onChange={() => handleTrueFalseCorrectChange(qIndex, true)}
                                                    /> True
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`true-false-${qIndex}`}
                                                        checked={question.is_true_correct === false}
                                                        onChange={() => handleTrueFalseCorrectChange(qIndex, false)}
                                                    /> False
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {question.question_type === 'short_answer' && (
                                        <p className="short-answer-note">Learners will provide a text answer. Grading will be manual.</p>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                className="add-question-button"
                            >
                                <FaPlus className="icon-margin" /> Add Question
                            </button>
                            <button type="submit" className="submit-button" disabled={isCreatingQuiz}>
                                {isCreatingQuiz ? 'Creating Quiz...' : 'Create Quiz'}
                            </button>
                            {quizCreationStatus && (
                                <p className={`status-message ${quizCreationStatus.includes('successful') ? 'success' : 'error'}`}>
                                    {quizCreationStatus}
                                </p>
                            )}
                        </form>
                    </div>
                </div>

                {/* === SECTION 2: ENROLLED LEARNERS === */}
                <div className="enrolled-learners-section">
                    <h3 className="section-title"> Enrolled Learners (for Selected Module)</h3>
                    <div className="form-group-small">
                        <label htmlFor="selectLearnerModule" className="form-label">Select Module to view learners:</label>
                        <select
                            id="selectLearnerModule"
                            className="form-select-small"
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                        >
                            <option value="">-- Select a Module --</option>
                            {assignedModules.map(module => (
                                <option key={module.id} value={module.id}>
                                    {module.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedModuleId && (
                        <div className="learner-list-container">
                            {learnersLoading ? (
                                <p>Loading enrolled learners...</p>
                            ) : learnersError ? (
                                <p className="error-message">{learnersError}</p>
                            ) : enrolledLearners.length > 0 ? (
                                <ul className="learner-items-list">
                                    {enrolledLearners.map(learner => (
                                        <li key={learner.learner_id} className="learner-item">
                                            <span className="learner-name">{learner.first_name} {learner.last_name}</span> - {learner.email}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="empty-message">No learners enrolled in this module yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Quiz Detail Modal */}
            {showQuizDetailModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Quiz Details</h3>
                            <button onClick={() => setShowQuizDetailModal(false)} className="modal-close-button">&times;</button>
                        </div>
                        <div className="modal-body">
                            {quizDetailLoading ? (
                                <p>Loading quiz details...</p>
                            ) : quizDetailError ? (
                                <p className="error-message">{quizDetailError}</p>
                            ) : quizDetail ? (
                                <div>
                                    <h4 className="quiz-detail-title">{quizDetail.title}</h4>
                                    <p className="quiz-detail-description">Description: {quizDetail.description || 'N/A'}</p>
                                    <p className="quiz-detail-info">Duration: {quizDetail.duration_minutes || 'N/A'} minutes</p>
                                    <p className="quiz-detail-info">Pass Percentage: {quizDetail.pass_percentage || '0'}%</p>

                                    <h5 className="quiz-detail-subtitle">Questions:</h5>
                                    {quizDetail.questions && quizDetail.questions.length > 0 ? (
                                        <ol className="quiz-detail-questions-list">
                                            {quizDetail.questions.map((question, qIndex) => (
                                                <li key={question.id} className="quiz-detail-question-item">
                                                    <p className="question-text"><strong>{qIndex + 1}. {question.question_text}</strong> ({question.question_type.replace('_', ' ')})</p>
                                                    {question.options && question.options.length > 0 && (
                                                        <ul className="question-options-list">
                                                            {question.options.map(option => (
                                                                <li key={option.id} className={`question-option-item ${option.is_correct ? 'correct' : ''}`}>
                                                                    {option.option_text} {option.is_correct && <span className="correct-badge">(Correct)</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {question.question_type === 'true_false' && (
                                                        <p className="true-false-answer">Correct Answer: <strong>{question.is_true_correct ? 'True' : 'False'}</strong></p>
                                                    )}
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <p>No questions for this quiz.</p>
                                    )}
                                </div>
                            ) : null}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowQuizDetailModal(false)} className="close-modal-button">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LecturerDashboard;