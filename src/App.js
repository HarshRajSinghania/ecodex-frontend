import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Camera from './components/camera/Camera';
import EcoDEX from './components/ecodex/EcoDEX';
import ScientistChat from './components/scientistchat/ScientistChat';
import Alert from './components/layout/Alert';
import PrivateRoute from './components/routing/PrivateRoute';
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt';
import AuthContext from './context/AuthContext';
import AlertContext from './context/AlertContext';
import setAuthToken from './utils/setAuthToken';
import { pwaManager } from './utils/pwaUtils';
import axios from 'axios';

import './App.css';

if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    loadUser();
    initializePWA();
  }, []);

  const initializePWA = () => {
    // Initialize PWA manager
    pwaManager.init();

    // Listen for network status changes
    const networkStatus = pwaManager.getNetworkStatus();
    networkStatus.onStatusChange((status, online) => {
      setIsOnline(online);
      
      if (online) {
        setAlert('🌐 Back online! Syncing data...', 'success', 3000);
        // Trigger background sync
        pwaManager.getBackgroundSync().syncOfflineData();
      } else {
        setAlert('📱 You\'re offline. Data will sync when connection returns.', 'info', 5000);
      }
    });

    // Listen for app updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
        setAlert('🔄 App updated! Refresh to get the latest features.', 'info', 10000);
      });
    }

    // Set initial online status
    setIsOnline(networkStatus.isOnline);
  };

  const loadUser = async () => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }

    try {
      const res = await axios.get('/api/auth');
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('token');
      setAuthToken(null);
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  };

  const setAlert = (msg, alertType, timeout = 5000) => {
    const id = Date.now();
    setAlerts([...alerts, { id, msg, alertType }]);

    setTimeout(() => setAlerts(alerts => alerts.filter(alert => alert.id !== id)), timeout);
  };

  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    setUser,
    setIsAuthenticated,
    setLoading,
    loadUser
  };

  const alertContextValue = {
    alerts,
    setAlert
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <AlertContext.Provider value={alertContextValue}>
        <Router>
          <div className={`App ${!isOnline ? 'offline' : ''}`}>
            <Navbar />
            <Alert />
            
            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
            
            {/* Offline indicator */}
            {!isOnline && (
              <div className="offline-banner">
                <span>📱 You're offline - some features may be limited</span>
              </div>
            )}
            
            {/* Update available banner */}
            {updateAvailable && (
              <div className="update-banner">
                <span>🔄 New version available!</span>
                <button onClick={() => window.location.reload()}>
                  Update Now
                </button>
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={<PrivateRoute component={Dashboard} />}
              />
              <Route
                path="/camera"
                element={<PrivateRoute component={Camera} />}
              />
              <Route
                path="/ecodex"
                element={<PrivateRoute component={EcoDEX} />}
              />
              <Route
                path="/scientistchat"
                element={<PrivateRoute component={ScientistChat} />}
              />
            </Routes>
          </div>
        </Router>
      </AlertContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
