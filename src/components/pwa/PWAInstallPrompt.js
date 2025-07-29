import React, { useState, useEffect } from 'react';
import { pwaManager } from '../../utils/pwaUtils';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const installManager = pwaManager.getInstallManager();
    const networkStatus = pwaManager.getNetworkStatus();

    // Check initial install status
    setIsInstalled(installManager.isInstalled);

    // Listen for install status changes
    installManager.onInstallStatusChange((status, installed) => {
      setIsInstalled(installed);
      
      if (status === 'prompt-available' && !installed) {
        setShowPrompt(true);
      } else if (status === 'installed') {
        setShowPrompt(false);
        // Show success notification
        pwaManager.getNotificationManager().showNotification(
          'EcoDEX Installed!',
          {
            body: 'You can now use EcoDEX offline and access it from your home screen.',
            icon: '/logo192.png'
          }
        );
      }
    });

    // Listen for network status changes
    networkStatus.onStatusChange((status, online) => {
      setIsOnline(online);
    });

    // Set initial network status
    setIsOnline(networkStatus.isOnline);
  }, []);

  const handleInstall = async () => {
    try {
      const installManager = pwaManager.getInstallManager();
      const result = await installManager.promptInstall();
      
      if (result === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showPrompt || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-prompt-content">
        <div className="pwa-prompt-icon">
          <img src="/logo192.png" alt="EcoDEX" />
        </div>
        <div className="pwa-prompt-text">
          <h3>Install EcoDEX</h3>
          <p>Get the full experience with offline access and home screen installation!</p>
          <ul>
            <li>📱 Access from your home screen</li>
            <li>🔄 Work offline</li>
            <li>📸 Quick camera access</li>
            <li>🔔 Push notifications</li>
          </ul>
        </div>
        <div className="pwa-prompt-actions">
          <button 
            className="pwa-install-btn"
            onClick={handleInstall}
          >
            Install App
          </button>
          <button 
            className="pwa-dismiss-btn"
            onClick={handleDismiss}
          >
            Maybe Later
          </button>
        </div>
      </div>
      
      {/* Network status indicator */}
      <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
        <span className="status-indicator"></span>
        {isOnline ? 'Online' : 'Offline'}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;