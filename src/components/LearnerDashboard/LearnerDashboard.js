import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPowerOff, FaSearch, FaFilter, FaBook, FaGlobe, FaUserCircle, FaPlayCircle, FaCheckCircle, FaDownload, FaEye, FaPlus, FaTimes } from 'react-icons/fa';
import './LearnerDashboard.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

// --- API BASE URL ---
// Make sure this matches where your backend is running
const API_BASE_URL = 'http://localhost:5000';

const LearnerDashboard = () => {
    const [activeTab, setActiveTab] = useState('myModules');
    const [searchTerm, setSearchTerm] = useState('');
    const [myModules, setMyModules] = useState([]); // Will store enrolled modules
    const [allModules, setAllModules] = useState([]); // Will store all browseable modules
    const [selectedModule, setSelectedModule] = useState(null); // Module clicked for learning
    const [moduleContents, setModuleContents] = useState([]); // Contents of the selected module
    const [quizDetails, setQuizDetails] = useState(null); // Quiz for the selected module
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [enrollmentMessage, setEnrollmentMessage] = useState('');
    const [selectedModuleToEnroll, setSelectedModuleToEnroll] = useState(null);

    const [loadingMyModules, setLoadingMyModules] = useState(true);
    const [errorMyModules, setErrorMyModules] = useState(null);
    const [loadingAllModules, setLoadingAllModules] = useState(true);
    const [errorAllModules, setErrorAllModules] = useState(null);
    const [loadingModuleContents, setLoadingModuleContents] = useState(false);
    const [errorModuleContents, setErrorModuleContents] = useState(null); // Corrected typo here (was = null, now = useState(null))

    // --- State for Embedded Content Viewer ---
    const [selectedContentItem, setSelectedContentItem] = useState(null); // Stores the content object being viewed

    const navigate = useNavigate(); // Initialize useNavigate hook

    // --- Get Learner ID from localStorage ---
    const getLearnerId = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.id;
            } catch (e) {
                console.error("Error parsing user data from localStorage:", e);
                return null;
            }
        }
        return null;
    };

    const learnerId = getLearnerId();

    useEffect(() => {
        if (!learnerId) {
            setErrorMyModules('Learner ID not found. Please log in.');
            setLoadingMyModules(false);
            setErrorAllModules('Learner ID not found. Please log in.');
            setLoadingAllModules(false);
            return;
        }

        // --- Fetch My Modules (Enrolled Modules) ---
        const fetchMyModules = async () => {
            setLoadingMyModules(true);
            setErrorMyModules(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/learners/${learnerId}/enrolled-modules`);
                // Ensure myModules is always an array. If response.data.modules is null/undefined,
                // or response.data is null/undefined, default to an empty array.
                setMyModules(Array.isArray(response.data.modules) ? response.data.modules : Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching my modules:', error);
                setErrorMyModules('Failed to load your enrolled modules.');
                setMyModules([]); // Ensure it's an empty array on error
            } finally {
                setLoadingMyModules(false);
            }
        };

        fetchMyModules();
    }, [learnerId]); // Dependency on learnerId means this runs once on component mount if ID exists


    // Separate useEffect for fetching all modules, dependent on myModules
    useEffect(() => {
        if (!learnerId) return; // Don't fetch if no learnerId

        const fetchAllModulesAndFilter = async () => {
            setLoadingAllModules(true);
            setErrorAllModules(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/modules`);
                // Ensure myModules is an array before mapping
                const enrolledModuleIds = new Set(myModules.map(m => m.id));
                const browsableModules = response.data.filter(module => !enrolledModuleIds.has(module.id) && module.published); // Also filter by published status
                setAllModules(browsableModules);
            } catch (error) {
                console.error('Error fetching all modules:', error);
                setErrorAllModules('Failed to load available modules.');
                setAllModules([]);
            } finally {
                setLoadingAllModules(false);
            }
        };

        fetchAllModulesAndFilter();
    }, [learnerId, myModules]); // Rerun when learnerId or myModules change


    // --- Fetch Module Contents when selectedModule changes ---
    useEffect(() => {
        if (selectedModule && selectedModule.id) {
            const fetchModuleDetails = async () => {
                setLoadingModuleContents(true);
                setErrorModuleContents(null);
                setModuleContents([]); // Clear previous contents
                setQuizDetails(null); // Clear previous quiz details
                setSelectedContentItem(null); // Reset selected content when module changes

                try {
                    // Fetch module contents
                    const contentsResponse = await axios.get(`${API_BASE_URL}/api/modules/${selectedModule.id}/contents`);
                    setModuleContents(contentsResponse.data);

                    // Fetch quiz for the module
                    const quizzesResponse = await axios.get(`${API_BASE_URL}/api/modules/${selectedModule.id}/quizzes`);
                    if (quizzesResponse.data && quizzesResponse.data.length > 0) {
                        setQuizDetails(quizzesResponse.data[0]); // Assuming one quiz per module for now
                    } else {
                        setQuizDetails(null);
                    }

                } catch (error) {
                    console.error('Error fetching module details or quiz:', error);
                    setErrorModuleContents('Failed to load module contents or quiz.');
                } finally {
                    setLoadingModuleContents(false);
                }
            };
            fetchModuleDetails();
        }
    }, [selectedModule]); // This effect runs whenever selectedModule changes


    const handleLogout = () => {
        localStorage.removeItem('user'); // Clear user data
        // Redirect to login page or home page
        window.location.href = '/login'; // Or use react-router-dom history.push
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredMyModules = myModules.filter(module =>
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (module.lecturer_name && module.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredAllModules = allModules.filter(module =>
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (module.lecturer_name && module.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleGoToModule = (module) => {
        setSelectedModule(module);
        setActiveTab('learningExperience');
    };

    const handleBackToMyModules = () => {
        setSelectedModule(null);
        setSelectedContentItem(null); // Ensure content viewer is closed
        setActiveTab('myModules');
        // Re-fetch my modules and all modules to ensure accurate enrolled/browsable state
        // This will be triggered by useEffect due to `myModules` dependency on `fetchAllModulesAndFilter`
        // Or you can explicitly call fetchMyModules() here if needed for immediate update
    };

    const handleEnrollClick = (module) => {
        setSelectedModuleToEnroll(module);
        setEnrollmentMessage(''); // Clear previous messages
        setShowEnrollmentModal(true);
    };

    const confirmEnrollment = async () => {
        if (!learnerId || !selectedModuleToEnroll) {
            setEnrollmentMessage('Error: User or module not identified.');
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/api/enrollments`, {
                user_id: learnerId,
                module_id: selectedModuleToEnroll.id
            });
            setEnrollmentMessage(`Successfully enrolled in "${selectedModuleToEnroll.title}"!`);
            // Re-fetch modules to update the My Modules and Browse Modules lists
            // This will trigger the useEffects that fetch `myModules` and `allModules`
            const responseMyModules = await axios.get(`${API_BASE_URL}/api/learners/${learnerId}/enrolled-modules`);
            setMyModules(Array.isArray(responseMyModules.data.modules) ? responseMyModules.data.modules : Array.isArray(responseMyModules.data) ? responseMyModules.data : []); // Ensure array
            
            const responseAllModules = await axios.get(`${API_BASE_URL}/api/modules`);
            const enrolledModuleIds = new Set((Array.isArray(responseMyModules.data.modules) ? responseMyModules.data.modules : Array.isArray(responseMyModules.data) ? responseMyModules.data : []).map(m => m.id)); // Ensure array
            const browsableModules = responseAllModules.data.filter(module => !enrolledModuleIds.has(module.id) && module.published);
            setAllModules(browsableModules); // Update allModules state

            // Optionally, switch to 'myModules' tab after successful enrollment
            // setActiveTab('myModules');

        } catch (error) {
            console.error('Enrollment failed:', error);
            if (error.response && error.response.status === 409) {
                setEnrollmentMessage('You are already enrolled in this module.');
            } else {
                setEnrollmentMessage('Enrollment failed due to a server error.');
            }
        } finally {
            // Keep modal open for a moment to show message, then close
            setTimeout(() => {
                setShowEnrollmentModal(false);
                setSelectedModuleToEnroll(null);
                setEnrollmentMessage('');
            }, 2000); // Close after 2 seconds
        }
    };

    // --- Function to Mark Module as Completed ---
    const handleMarkModuleComplete = async () => {
        if (!learnerId || !selectedModule || !selectedModule.id) {
            console.error("Cannot mark module complete: Learner ID or selected module not found.");
            return;
        }

        // Find the enrollment ID for the currently selected module and learner
        const currentEnrollment = myModules.find(
            m => m.id === selectedModule.id && m.user_id === learnerId
        );

        if (!currentEnrollment || !currentEnrollment.enrollment_id) {
            console.error("Enrollment not found for this module and learner. Cannot mark complete.");
            alert("Error: Cannot mark module complete. Enrollment not found.");
            return;
        }

        try {
            // Call the PATCH API to update the enrollment status
            await axios.patch(`${API_BASE_URL}/api/enrollments/${currentEnrollment.enrollment_id}/complete`, {
                completed: true // Set to true to mark as completed
            });

            alert(`Module "${selectedModule.title}" marked as completed!`);
            // Refresh 'My Modules' to reflect the completed status
            const responseMyModules = await axios.get(`${API_BASE_URL}/api/learners/${learnerId}/enrolled-modules`);
            setMyModules(Array.isArray(responseMyModules.data.modules) ? responseMyModules.data.modules : Array.isArray(responseMyModules.data) ? responseMyModules.data : []); // Ensure array

            // Update the selectedModule's status if it's still active
            setSelectedModule(prev => prev ? { ...prev, is_completed_by_learner: true } : null);

        } catch (error) {
            console.error('Error marking module complete:', error);
            alert('Failed to mark module complete due to a server error.');
        }
    };


    // Function to handle taking the assessment (NOW USES useNavigate)
    const handleTakeAssessment = () => {
        if (quizDetails && quizDetails.id && selectedModule && selectedModule.id) {
            // Use navigate to go to the assessment page, passing module and quiz IDs
            navigate(`/assessment/${selectedModule.id}/${quizDetails.id}`);
        } else {
            alert("No assessment found for this module.");
        }
    };

    // Helper to get relative upload path
// Helper to get relative upload path
     const getUploadPath = (path) => {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return `http://localhost:5000${path}`;
};


    // --- NEW: Function to handle clicking on a content item for embedded viewing ---
    const handleViewContent = (contentItem) => {
        setSelectedContentItem(contentItem);
    };

    // --- NEW: Function to close the embedded content viewer ---
    const handleCloseContentViewer = () => {
        setSelectedContentItem(null);
    };


    return (
        <div className="learner-dashboard">
            {/* Top Navigation Bar */}
            <div className="top-nav">
                <div className="welcome-message">
                    Welcome, {JSON.parse(localStorage.getItem('user'))?.userrole || 'Learner'}!
                </div>
                <div className="nav-links">
                    <span
                        className={activeTab === 'myModules' ? 'active' : ''}
                        onClick={() => {
                            setActiveTab('myModules');
                            setSelectedModule(null); // Reset selected module when switching tabs
                            setSelectedContentItem(null); // Close content viewer
                            setSearchTerm(''); // Clear search when switching tabs
                        }}
                    >
                        <FaBook /> My Modules
                    </span>
                    <span
                        className={activeTab === 'browseModules' ? 'active' : ''}
                        onClick={() => {
                            setActiveTab('browseModules');
                            setSelectedModule(null); // Reset selected module when switching tabs
                            setSelectedContentItem(null); // Close content viewer
                            setSearchTerm(''); // Clear search when switching tabs
                        }}
                    >
                        <FaGlobe /> Browse Modules
                    </span>
                    <span
                        className={activeTab === 'profile' ? 'active' : ''}
                        onClick={() => {
                            setActiveTab('profile');
                            setSelectedModule(null); // Reset selected module when switching tabs
                            setSelectedContentItem(null); // Close content viewer
                            setSearchTerm(''); // Clear search when switching tabs
                        }}
                    >
                        <FaUserCircle /> Profile
                    </span>
                </div>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <FaSearch className="search-icon" />
                </div>
                <div className="logout-btn" onClick={handleLogout}>
                    <FaPowerOff /> Logout
                </div>
            </div>

            {/* Main Content Area */}
            <div className="main-content">
                {/* My Modules Tab */}
                {activeTab === 'myModules' && (
                    <div className="my-modules-section">
                        <h2>My Enrolled Modules</h2>
                        {loadingMyModules && <p>Loading your modules...</p>}
                        {errorMyModules && <p className="error-message">{errorMyModules}</p>}
                        {!loadingMyModules && myModules.length === 0 && !errorMyModules && (
                            <p>You haven't enrolled in any modules yet. <span onClick={() => setActiveTab('browseModules')} className="link-text">Browse available modules</span> to get started!</p>
                        )}
                        <div className="module-grid">
                            {filteredMyModules.map(module => (
                                <div key={module.id} className="module-card">
                                    <h3>{module.title}</h3>
                                    <p>{module.description}</p>
                                    <p className="module-lecturer">Lecturer: {module.lecturer_name || 'N/A'}</p>
                                    <p className="module-status">Status: {module.is_completed_by_learner ? <span className="status-completed">Completed</span> : <span className="status-in-progress">In Progress</span>}</p>
                                    <button
                                        className="go-to-module-btn"
                                        onClick={() => handleGoToModule(module)}
                                    >
                                        <FaPlayCircle /> {module.is_completed_by_learner ? 'Review Module' : 'Resume Learning'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Browse Modules Tab */}
                {activeTab === 'browseModules' && (
                    <div className="browse-modules-section">
                        <h2>Browse Available Modules</h2>
                        {loadingAllModules && <p>Loading modules...</p>}
                        {errorAllModules && <p className="error-message">{errorAllModules}</p>}
                        {!loadingAllModules && allModules.length === 0 && !errorAllModules && (
                            <p>No modules available for enrollment at the moment.</p>
                        )}
                        <div className="module-grid">
                            {filteredAllModules.map(module => (
                                <div key={module.id} className="module-card">
                                    <h3>{module.title}</h3>
                                    <p>{module.description}</p>
                                    <p className="module-lecturer">Lecturer: {module.lecturer_name || 'N/A'}</p>
                                    <button
                                        className="enroll-module-btn"
                                        onClick={() => handleEnrollClick(module)}
                                    >
                                        <FaPlus /> Enroll Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Module Learning Experience Tab - MODIFIED */}
                {activeTab === 'learningExperience' && selectedModule && (
                    <div className="module-learning-section">
                        <button className="back-btn" onClick={handleBackToMyModules}>
                            &larr; Back to My Modules
                        </button>
                        <h2>{selectedModule.title}</h2>
                        <p>{selectedModule.description}</p>

                        {/* Content Viewer Area */}
                        {selectedContentItem && (
                            <div className="content-viewer">
                                <div className="viewer-header">
                                    <h3>{selectedContentItem.title}</h3>
                                    <button className="close-viewer-btn" onClick={handleCloseContentViewer}>
                                        <FaTimes /> Close
                                    </button>
                                </div>
                                <div className="viewer-body">
                                    {selectedContentItem.content_type === 'video' && (
                                        <video controls src={getUploadPath(selectedContentItem.file_path)} className="content-video">
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                    {selectedContentItem.content_type === 'pdf' && (
                                        <iframe src={getUploadPath(selectedContentItem.file_path)} title={selectedContentItem.title} className="content-iframe" allowFullScreen>
                                            This browser does not support PDFs. Please <a href={getUploadPath(selectedContentItem.file_path)} target="_blank" rel="noopener noreferrer">download the PDF</a> to view it.
                                        </iframe>
                                    )}
                                    {selectedContentItem.content_type === 'image' && (
                                        <img src={getUploadPath(selectedContentItem.file_path)} alt={selectedContentItem.title} className="content-image" />
                                    )}
                                    {/* For external links, you might choose to open in a new tab or embed if possible (not always possible for all links) */}
                                    {selectedContentItem.content_type === 'link' && (
                                        <div className="external-link-container">
                                            <p>Click the button below to open the external resource:</p>
                                            <a href={selectedContentItem.file_path} target="_blank" rel="noopener noreferrer" className="btn external-resource-btn">
                                                <FaGlobe /> Open External Link
                                            </a>
                                        </div>
                                    )}
                                    {selectedContentItem.content_type === 'presentation' && (
                                        <iframe src={getUploadPath(selectedContentItem.file_path)} title={selectedContentItem.title} className="content-iframe" allowFullScreen>
                                            Your browser does not support embedded presentations. Please <a href={getUploadPath(selectedContentItem.file_path)} target="_blank" rel="noopener noreferrer">download the file</a> to view it.
                                        </iframe>
                                    )}
                                    {/* Handle other content types if necessary */}
                                </div>
                            </div>
                        )}

                        {/* Module Content List */}
                        {!selectedContentItem && ( // Only show list if no content item is selected
                            <>
                                {loadingModuleContents && <p>Loading module contents...</p>}
                                {errorModuleContents && <p className="error-message">{errorModuleContents}</p>}
                                {!loadingModuleContents && moduleContents.length === 0 && !errorModuleContents && (
                                    <p>No content available for this module yet.</p>
                                )}

                                <div className="module-contents-list">
                                    {moduleContents.map(content => (
                                        <div key={content.id} className="content-item">
                                            <div className="content-details">
                                                <h4>{content.title}</h4>
                                                <p>{content.description}</p>
                                                <div className="content-actions">
                                                    {/* Changed from <a> tags to <button> that calls handleViewContent */}
                                                    {(content.content_type === 'video' || content.content_type === 'pdf' || content.content_type === 'image' || content.content_type === 'presentation') && (
                                                        <button onClick={() => handleViewContent(content)} className="content-link">
                                                            {content.content_type === 'video' && <><FaPlayCircle /> Play Video</>}
                                                            {content.content_type === 'pdf' && <><FaEye /> View Document</>}
                                                            {content.content_type === 'image' && <><FaEye /> View Image</>}
                                                            {content.content_type === 'presentation' && <><FaEye /> View Presentation</>}
                                                        </button>
                                                    )}
                                                    {content.content_type === 'link' && (
                                                        <a href={content.file_path} target="_blank" rel="noopener noreferrer" className="content-link external-link">
                                                            <FaGlobe /> Open External Link
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}


                        <div className="module-footer-actions">
                            <button
                                className="mark-module-complete-btn"
                                onClick={handleMarkModuleComplete}
                                disabled={selectedModule.is_completed_by_learner}
                            >
                                <FaCheckCircle /> {selectedModule.is_completed_by_learner ? 'Module Completed' : 'Mark Module as Completed'}
                            </button>

                            {quizDetails ? (
                                <button
                                    className="take-assessment-btn"
                                    onClick={handleTakeAssessment}
                                >
                                    <FaCheckCircle /> Take Final Assessment
                                </button>
                            ) : (
                                <p className="no-quiz-message">No assessment available for this module yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="profile-section">
                        <h2>My Profile</h2>
                        <p>This section is under construction. You will be able to view and update your profile information here.</p>
                        <div className="profile-details">
                            <p><strong>Username:</strong> {JSON.parse(localStorage.getItem('user'))?.username}</p>
                            <p><strong>Role:</strong> {JSON.parse(localStorage.getItem('user'))?.role}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Enrollment Confirmation Modal */}
            {showEnrollmentModal && selectedModuleToEnroll && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Enrollment</h3>
                        <p>Are you sure you want to enroll in the module: <strong>"{selectedModuleToEnroll.title}"</strong>?</p>
                        {enrollmentMessage && <p className="enrollment-message">{enrollmentMessage}</p>}
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={confirmEnrollment}>Confirm</button>
                            <button className="btn btn-secondary" onClick={() => setShowEnrollmentModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearnerDashboard;