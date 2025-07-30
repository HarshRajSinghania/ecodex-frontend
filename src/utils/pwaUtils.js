// PWA Utility functions for EcoDEX

// IndexedDB helper for offline storage
export class OfflineStorage {
  constructor() {
    this.dbName = 'EcoDEXDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('offline_entries')) {
          const entriesStore = db.createObjectStore('offline_entries', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          entriesStore.createIndex('timestamp', 'timestamp', { unique: false });
          entriesStore.createIndex('synced', 'synced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cached_species')) {
          const speciesStore = db.createObjectStore('cached_species', { 
            keyPath: 'id' 
          });
          speciesStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  async saveOfflineEntry(entry) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline_entries'], 'readwrite');
      const store = transaction.objectStore('offline_entries');
      
      const entryWithMetadata = {
        ...entry,
        timestamp: Date.now(),
        synced: false,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const request = store.add(entryWithMetadata);
      request.onsuccess = () => resolve(entryWithMetadata);
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineEntries() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline_entries'], 'readonly');
      const store = transaction.objectStore('offline_entries');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offline_entries'], 'readwrite');
      const store = transaction.objectStore('offline_entries');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          entry.synced = true;
          const updateRequest = store.put(entry);
          updateRequest.onsuccess = () => resolve(entry);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(null);
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async cacheSpecies(species) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cached_species'], 'readwrite');
      const store = transaction.objectStore('cached_species');
      const request = store.put(species);
      
      request.onsuccess = () => resolve(species);
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedSpecies() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cached_species'], 'readonly');
      const store = transaction.objectStore('cached_species');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Network status detection
export class NetworkStatus {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = [];
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks('offline');
    });
  }

  onStatusChange(callback) {
    this.callbacks.push(callback);
  }

  notifyCallbacks(status) {
    this.callbacks.forEach(callback => callback(status, this.isOnline));
  }

  async checkConnection() {
    if (!this.isOnline) return false;
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://ecodex-backend.onrender.com';
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Background sync for offline data
export class BackgroundSync {
  constructor(offlineStorage) {
    this.offlineStorage = offlineStorage;
    this.networkStatus = new NetworkStatus();
    this.syncInProgress = false;
    
    // Listen for network changes
    this.networkStatus.onStatusChange((status) => {
      if (status === 'online' && !this.syncInProgress) {
        this.syncOfflineData();
      }
    });
  }

  async syncOfflineData() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    console.log('Starting background sync...');
    
    try {
      const offlineEntries = await this.offlineStorage.getOfflineEntries();
      const unsyncedEntries = offlineEntries.filter(entry => !entry.synced);
      
      for (const entry of unsyncedEntries) {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'https://ecodex-backend.onrender.com';
          const response = await fetch(`${API_URL}/api/ecodex`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({
              species: entry.species,
              location: entry.location,
              image: entry.image,
              notes: entry.notes,
              timestamp: entry.timestamp
            })
          });
          
          if (response.ok) {
            await this.offlineStorage.markAsSynced(entry.id);
            console.log(`Synced offline entry: ${entry.id}`);
          }
        } catch (error) {
          console.error(`Failed to sync entry ${entry.id}:`, error);
        }
      }
      
      console.log('Background sync completed');
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Register background sync with service worker
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
}

// PWA Install Manager
export class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.callbacks = [];
    
    // Check if app is already installed
    this.checkInstallStatus();
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyCallbacks('prompt-available');
    });
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.notifyCallbacks('installed');
    });
  }

  checkInstallStatus() {
    // Check if running in standalone mode (installed)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true;
  }

  onInstallStatusChange(callback) {
    this.callbacks.push(callback);
  }

  notifyCallbacks(status) {
    this.callbacks.forEach(callback => callback(status, this.isInstalled));
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      throw new Error('Install prompt not available');
    }
    
    this.deferredPrompt.prompt();
    const choiceResult = await this.deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    this.deferredPrompt = null;
    return choiceResult.outcome;
  }

  canInstall() {
    return this.deferredPrompt !== null && !this.isInstalled;
  }
}

// Push notification manager
export class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }
    
    if (this.permission === 'granted') {
      const defaultOptions = {
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [100, 50, 100],
        ...options
      };
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, defaultOptions);
      } else {
        return new Notification(title, defaultOptions);
      }
    }
  }

  async scheduleNotification(title, options, delay) {
    setTimeout(() => {
      this.showNotification(title, options);
    }, delay);
  }
}

// Main PWA Manager that coordinates all functionality
export class PWAManager {
  constructor() {
    this.offlineStorage = new OfflineStorage();
    this.networkStatus = new NetworkStatus();
    this.backgroundSync = new BackgroundSync(this.offlineStorage);
    this.installManager = new PWAInstallManager();
    this.notificationManager = new NotificationManager();
    
    this.init();
  }

  async init() {
    try {
      await this.offlineStorage.init();
      await this.backgroundSync.registerBackgroundSync();
      await this.notificationManager.requestPermission();
      console.log('PWA Manager initialized successfully');
    } catch (error) {
      console.error('PWA Manager initialization failed:', error);
    }
  }

  // Expose all managers
  getOfflineStorage() {
    return this.offlineStorage;
  }

  getNetworkStatus() {
    return this.networkStatus;
  }

  getBackgroundSync() {
    return this.backgroundSync;
  }

  getInstallManager() {
    return this.installManager;
  }

  getNotificationManager() {
    return this.notificationManager;
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();