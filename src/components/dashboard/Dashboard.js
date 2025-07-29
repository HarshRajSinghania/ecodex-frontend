import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [recentEntries, setRecentEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentEntries();
    fetchStats();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const response = await axios.get('/api/ecodex/entries?limit=6&sort=-discoveredAt');
      setRecentEntries(response.data.entries);
    } catch (error) {
      console.error('Error fetching recent entries:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/ecodex/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureClick = () => {
    navigate('/camera');
  };

  const handleEcoDEXClick = () => {
    navigate('/ecodex');
  };

  const getRarityEmoji = (rarity) => {
    const emojis = {
      common: '⚪',
      uncommon: '🟢',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡'
    };
    return emojis[rarity] || '⚪';
  };

  return (
    <div className="container">
      <h1 className="large pokemon-title">🎮 Trainer Dashboard 🎮</h1>
      <p className="lead">
        🌟 Welcome back, Trainer {user && user.name}! Ready for your next adventure?
      </p>
      
      <div className="dashboard-stats">
        <div className="stats-card">
          <h3>🏆 Trainer Stats</h3>
          <div className="stat-item">
            <span className="stat-label">🎯 Level:</span>
            <span className="stat-value">{user && user.level || 1}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">⚡ Experience:</span>
            <span className="stat-value">{user && user.experience || 0} XP</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">🔍 Discoveries:</span>
            <span className="stat-value">{stats ? stats.totalEntries : 0}</span>
          </div>
        </div>

        {stats && (
          <div className="stats-card">
            <h3>📊 Collection Stats</h3>
            <div className="stat-item">
              <span className="stat-label">🌱 Plants:</span>
              <span className="stat-value">
                {stats.typeStats.find(s => s._id === 'plant')?.count || 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">🦋 Animals:</span>
              <span className="stat-value">
                {stats.typeStats.find(s => s._id === 'animal')?.count || 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">⭐ Legendary:</span>
              <span className="stat-value">
                {stats.rarityStats.find(s => s._id === 'legendary')?.count || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-actions">
        <h3>🚀 Quick Actions</h3>
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleCaptureClick}>
            📸 Capture Species
          </button>
          <button className="btn btn-secondary" onClick={handleEcoDEXClick}>
            📚 View EcoDEX
          </button>
          <button className="btn btn-success" onClick={() => navigate('/camera')}>
            🗺️ Start Exploring
          </button>
        </div>
      </div>

      <div className="recent-discoveries">
        <h3>🌟 Recent Discoveries</h3>
        {loading ? (
          <div className="loading-message">
            <p>Loading your discoveries...</p>
          </div>
        ) : recentEntries.length > 0 ? (
          <div className="discoveries-grid">
            {recentEntries.map((entry) => (
              <div key={entry._id} className="discovery-card" onClick={() => navigate('/ecodex')}>
                <img
                  src={`data:image/jpeg;base64,${entry.image}`}
                  alt={entry.name}
                />
                <div className="discovery-info">
                  <h4>{entry.name}</h4>
                  <p className="scientific-name">{entry.scientificName}</p>
                  <span className={`rarity ${entry.rarity.toLowerCase()}`}>
                    {getRarityEmoji(entry.rarity)} {entry.rarity.toUpperCase()}
                  </span>
                  {entry.isFirstDiscovery && (
                    <div className="first-discovery-indicator">
                      ⭐ FIRST!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{textAlign: 'center', padding: '3rem'}}>
            <h3>🌱 Your Adventure Awaits!</h3>
            <p>No discoveries yet. Start exploring to build your EcoDEX collection!</p>
            <p>🎯 Find plants and animals in the wild to level up!</p>
            <button className="btn btn-primary" onClick={handleCaptureClick} style={{marginTop: '20px'}}>
              📸 Start Your First Capture
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;