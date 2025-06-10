// LoginRegister.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdOutlineLockPerson,
  MdDriveFileRenameOutline,
  MdAttachEmail,
} from 'react-icons/md';
import {
  FaUserShield,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserCog,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import './LoginRegister.css';

const LoginRegister = () => {
  const [formType, setFormType] = useState('login');
  const [role, setRole] = useState('learner');
  const [loginStatus, setLoginStatus] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [registerData, setRegisterData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
  });

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginStatus(null);
    try {
      const response = await fetch('http://localhost:5000/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...registerData, role }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful!');
        setFormType('login');
        setRegisterData({
          firstname: '',
          lastname: '',
          username: '',
          email: '',
          password: '',
        });
        setShowRegisterPassword(false);
      } else {
        alert('Registration failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Registration failed: Network or server error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus(null);
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginStatus('Login successful!');
        // === FIX IS HERE ===
        // We now store data.id along with username and role,
        // because the server's /login endpoint now returns it.
        localStorage.setItem(
          'user',
          JSON.stringify({
            username: data.username,
            role: data.role,
            id: data.id, // ADDED: Store the user's ID
          })
        );
        // === END FIX ===

        if (data.role === 'learner') navigate('/dashboard/learner');
        else if (data.role === 'lecturer') navigate('/dashboard/lecturer');
        else if (data.role === 'administrator') navigate('/dashboard/administrator');
        else navigate('/dashboard');
      } else {
        alert('Login failed: ' + (data.error || 'Invalid credentials'));
        setLoginStatus(data.error || 'Invalid credentials');
      }
    } catch {
      alert('Login failed: Network or server error');
      setLoginStatus('Network or server error during login.');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoginStatus(null);
    try {
      const response = await fetch('http://localhost:5000/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setLoginStatus(data.message);
        setFormType('login');
        setResetEmail('');
      } else {
        alert('Reset failed: ' + (data.error || 'Failed to send reset link.'));
        setLoginStatus(data.error || 'Failed to send reset link.');
      }
    } catch {
      alert('Reset failed: Network or server error');
      setLoginStatus('Network or server error during reset request.');
    }
  };

  return (
    <div className="wrapper">
      {/* LOGIN FORM */}
      {formType === 'login' && (
        <div className="form-box login">
          <form onSubmit={handleLogin}>
            <h1>LOGIN</h1>
            {loginStatus && (
              <p className={`status-message ${loginStatus.includes('successful') ? 'success' : 'error'}`}>
                {loginStatus}
              </p>
            )}
            <div className="input-box">
              <input
                type="text"
                placeholder="Username"
                required
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              />
              <FaUserShield className="icon" />
            </div>
            <div className="input-box">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
              <MdOutlineLockPerson className="icon" />
              <span className="toggle-password-icon" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="remember-forgot">
              <label>
                <input type="checkbox" /> Remember Me
              </label>
              <button type="button" className="link-button" onClick={() => { setFormType('reset'); setLoginStatus(null); }}>
                Forgot password?
              </button>
            </div>
            <button type="submit">Login</button>
            <div className="register-link">
              <p>
                Don't have an account?{' '}
                <button type="button" className="link-button" onClick={() => { setFormType('register'); setLoginStatus(null); }}>
                  Register
                </button>
              </p>
            </div>
          </form>
        </div>
      )}

      {/* REGISTRATION FORM */}
      {formType === 'register' && (
        <div className="form-box register">
          <form onSubmit={handleRegister}>
            <h1>REGISTRATION</h1>
            <div className="form-content">
              {['firstname', 'lastname', 'username', 'email', 'password'].map((field) => (
                <div className="input-box" key={field}>
                  <input
                    type={
                      field === 'email'
                        ? 'email'
                        : field === 'password'
                        ? showRegisterPassword ? 'text' : 'password'
                        : 'text'
                    }
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    required
                    value={registerData[field]}
                    onChange={(e) => setRegisterData({ ...registerData, [field]: e.target.value })}
                  />
                  {field === 'email' ? (
                    <MdAttachEmail className="icon" />
                  ) : field === 'password' ? (
                    <>
                      <MdOutlineLockPerson className="icon" />
                      <span
                        className="toggle-password-icon"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </>
                  ) : (
                    <MdDriveFileRenameOutline className="icon" />
                  )}
                </div>
              ))}
              <div className="role-selection">
                <div className="contA">
                  <button
                    type="button"
                    className={role === 'learner' ? 'active' : ''}
                    onClick={() => setRole('learner')}
                  >
                    <FaUserGraduate />
                    <p></p>
                  </button>
                </div>
                <div className="contB">
                  <button
                    type="button"
                    className={role === 'lecturer' ? 'active' : ''}
                    onClick={() => setRole('lecturer')}
                  >
                    <FaChalkboardTeacher />
                    <p></p>
                  </button>
                </div>
                <div className="contC">
                  <button
                    type="button"
                    className={role === 'administrator' ? 'active' : ''}
                    onClick={() => setRole('administrator')}
                  >
                    <FaUserCog />
                    <p></p>
                  </button>
                </div>
              </div>
              <div className="remember-forgot">
                <label>
                  <input type="checkbox" required /> I agree to terms and conditions
                </label>
              </div>
              <button type="submit">Register</button>
              <div className="register-link">
                <p>
                  Already have an account?{' '}
                  <button type="button" className="link-button" onClick={() => { setFormType('login'); setLoginStatus(null); }}>
                    Login
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* RESET PASSWORD FORM */}
      {formType === 'reset' && (
        <div className="form-box reset">
          <form onSubmit={handleReset}>
            <h1>RESET PASSWORD</h1>
            {loginStatus && (
              <p className={`status-message ${loginStatus.includes('successful') || loginStatus.includes('sent') ? 'success' : 'error'}`}>
                {loginStatus}
              </p>
            )}
            <div className="input-box">
              <input
                type="email"
                placeholder="Email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <MdAttachEmail className="icon" />
            </div>
            <button type="submit">Send Reset Link</button>
            <div className="register-link">
              <p>
                Remembered your password?{' '}
                <button type="button" className="link-buttonn" onClick={() => { setFormType('login'); setLoginStatus(null); }}>
                  Login
                </button>
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginRegister;