import React from 'react';
import { Routes, Route } from 'react-router-dom'; // <--- IMPORT THESE
import LoginRegister from "./components/LoginRegister/LoginRegister";

// Assuming you will have other dashboard components
// You'll need to create these files if they don't exist yet
import LearnerDashboard from './components/LearnerDashboard/LearnerDashboard'; // Example path
import LecturerDashboard from './components/LecturerDashboard/LecturerDashboard'; // Example path
import AdminDashboard from './components/AdminDashboard/AdminDashboard'; // Example path
// You might also have a main landing page or home component
// import Home from './components/Home/Home'; // Example path

function App() {
  return (
    // The Routes component is where you define your application's paths
    <Routes>
      {/*
        This route means: when the URL path is exactly "/", render the LoginRegister component.
        This will be your initial page where users log in or register.
      */}
      <Route path="/" element={<LoginRegister/>} />

      {/*
        You can also have a specific route for "/login" if you want,
        though "/" often suffices for the initial entry point.
      */}
      <Route path="/login" element={<LoginRegister />} />

      {/*
        Define routes for your dashboards.
        The paths here should match what you navigate to in LoginRegister.js
        (e.g., navigate('/dashboard/learner')).
      */}
      <Route path="/dashboard/learner" element={<LearnerDashboard />} />
      <Route path="/dashboard/lecturer" element={<LecturerDashboard />} />
      <Route path="/dashboard/administrator" element={<AdminDashboard />} />

      {/* Add any other routes for your application here, for example: */}
      {/* <Route path="/home" element={<Home />} /> */}

      {/*
        Optional: A catch-all route for any undefined paths (404 Not Found)
        You would create a NotFoundPage component.
      */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;
