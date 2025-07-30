import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import AlertContext from '../../context/AlertContext';
import api from '../../utils/api';
import './EcoDEX.css';

const EcoDEX = () => {
  const { user } = useContext(AuthContext);
  const { setAlert } = useContext(AlertContext);
  
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    rarity: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, [filters, currentPage]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(filters.type && { type: filters.type }),
        ...(filters.rarity && { rarity: filters.rarity })
      });

      const response = await api.get(`/api/ecodex/entries?${params}`);
      
      let filteredEntries = response.data.entries;
      
      // Client-side search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredEntries = filteredEntries.filter(entry =>
          entry.name.toLowerCase().includes(searchTerm) ||
          entry.scientificName.toLowerCase().includes(searchTerm) ||
          entry.description.toLowerCase().includes(searchTerm)
        );
      }
      
      setEntries(filteredEntries);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setAlert('Error loading EcoDEX entries', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/ecodex/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openEntryModal = (entry) => {
    setSelectedEntry(entry);
  };

  const closeEntryModal = () => {
    setSelectedEntry(null);
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#95a5a6',
      uncommon: '#27ae60',
      rare: '#3498db',
      epic: '#9b59b6',
      legendary: '#f39c12'
    };
    return colors[rarity] || '#95a5a6';
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

  if (loading && entries.length === 0) {
    return (
      <div className="ecodex-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <h3>Loading your EcoDEX...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="ecodex-container">
      <div className="ecodex-header">
        <h1>📚 Your EcoDEX Collection</h1>
        <p>Discover and collect the amazing species around you!</p>
      </div>

      {stats && (
        <div className="ecodex-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>🎯 Total Discoveries</h3>
              <div className="stat-number">{stats.totalEntries}</div>
            </div>
            
            <div className="stat-card">
              <h3>🌱 Plants</h3>
              <div className="stat-number">
                {stats.typeStats.find(s => s._id === 'plant')?.count || 0}
              </div>
            </div>
            
            <div className="stat-card">
              <h3>🦋 Animals</h3>
              <div className="stat-number">
                {stats.typeStats.find(s => s._id === 'animal')?.count || 0}
              </div>
            </div>
            
            <div className="stat-card">
              <h3>⭐ Legendary</h3>
              <div className="stat-number">
                {stats.rarityStats.find(s => s._id === 'legendary')?.count || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ecodex-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Search species..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="plant">🌱 Plants</option>
            <option value="animal">🦋 Animals</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filters.rarity}
            onChange={(e) => handleFilterChange('rarity', e.target.value)}
            className="filter-select"
          >
            <option value="">All Rarities</option>
            <option value="common">⚪ Common</option>
            <option value="uncommon">🟢 Uncommon</option>
            <option value="rare">🔵 Rare</option>
            <option value="epic">🟣 Epic</option>
            <option value="legendary">🟡 Legendary</option>
          </select>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <h2>🌟 Start Your Adventure!</h2>
            <p>Your EcoDEX is empty. Go out and discover some amazing species!</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/camera'}
            >
              📸 Start Capturing
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="entries-grid">
            {entries.map((entry) => (
              <div 
                key={entry._id} 
                className="entry-card"
                onClick={() => openEntryModal(entry)}
              >
                <div className="entry-image">
                  <img 
                    src={`data:image/jpeg;base64,${entry.image}`}
                    alt={entry.name}
                  />
                  <div className={`rarity-indicator ${entry.rarity}`}>
                    {getRarityEmoji(entry.rarity)}
                  </div>
                </div>
                
                <div className="entry-info">
                  <h3 className="entry-name">{entry.name}</h3>
                  <p className="entry-scientific">{entry.scientificName}</p>
                  <div className="entry-meta">
                    <span className={`type-badge ${entry.type}`}>
                      {entry.type === 'plant' ? '🌱' : '🦋'} {entry.type}
                    </span>
                    <span className="discovery-date">
                      {new Date(entry.discoveredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                className="btn btn-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {selectedEntry && (
        <div className="modal-overlay" onClick={closeEntryModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeEntryModal}>×</button>
            
            <div className="modal-header">
              <h2>{selectedEntry.name}</h2>
              <p className="modal-scientific">{selectedEntry.scientificName}</p>
              {selectedEntry.isFirstDiscovery && (
                <div className="first-discovery-badge">
                  ⭐ FIRST DISCOVERY! ⭐
                </div>
              )}
            </div>

            <div className="modal-body">
              <div className="modal-image">
                <img 
                  src={`data:image/jpeg;base64,${selectedEntry.image}`}
                  alt={selectedEntry.name}
                />
              </div>

              <div className="modal-details">
                <div className={`rarity-badge ${selectedEntry.rarity}`}>
                  {getRarityEmoji(selectedEntry.rarity)} {selectedEntry.rarity.toUpperCase()}
                </div>

                <div className="detail-section">
                  <h4>📝 Description</h4>
                  <p>{selectedEntry.description}</p>
                </div>

                <div className="detail-section">
                  <h4>🏠 Habitat & Region</h4>
                  <p><strong>Habitat:</strong> {selectedEntry.habitat}</p>
                  <p><strong>Region:</strong> {selectedEntry.region}</p>
                </div>

                {selectedEntry.stats && (
                  <div className="detail-section">
                    <h4>📊 Stats</h4>
                    <div className="stats-list">
                      {selectedEntry.stats.size && (
                        <div className="stat-item">
                          <span>Size:</span> {selectedEntry.stats.size}
                        </div>
                      )}
                      {selectedEntry.stats.weight && (
                        <div className="stat-item">
                          <span>Weight:</span> {selectedEntry.stats.weight}
                        </div>
                      )}
                      {selectedEntry.stats.lifespan && (
                        <div className="stat-item">
                          <span>Lifespan:</span> {selectedEntry.stats.lifespan}
                        </div>
                      )}
                      {selectedEntry.stats.diet && (
                        <div className="stat-item">
                          <span>Diet:</span> {selectedEntry.stats.diet}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEntry.abilities && selectedEntry.abilities.length > 0 && (
                  <div className="detail-section">
                    <h4>⚡ Special Abilities</h4>
                    {selectedEntry.abilities.map((ability, index) => (
                      <div key={index} className="ability-item">
                        <strong>{ability.name}:</strong> {ability.description}
                      </div>
                    ))}
                  </div>
                )}

                {selectedEntry.funFacts && selectedEntry.funFacts.length > 0 && (
                  <div className="detail-section">
                    <h4>🌟 Fun Facts</h4>
                    <ul className="fun-facts-list">
                      {selectedEntry.funFacts.map((fact, index) => (
                        <li key={index}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="detail-section">
                  <h4>📅 Discovery Info</h4>
                  <p><strong>Discovered:</strong> {new Date(selectedEntry.discoveredAt).toLocaleString()}</p>
                  <p><strong>Conservation Status:</strong> {selectedEntry.conservationStatus.replace('_', ' ')}</p>
                  <p><strong>Experience Points:</strong> +{selectedEntry.experiencePoints} XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcoDEX;