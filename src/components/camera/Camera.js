import React, { useState, useRef, useCallback, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import AlertContext from '../../context/AlertContext';
import api from '../../utils/api';
import './Camera.css';

const Camera = () => {
  const { loadUser } = useContext(AuthContext);
  const { setAlert } = useContext(AlertContext);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [identificationResult, setIdentificationResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [currentCamera, setCurrentCamera] = useState('environment'); // 'environment' for back, 'user' for front
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get user's location
  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          setAlert('Location access denied. You can still capture species!', 'warning');
        }
      );
    }
  }, [setAlert]);

  // Check camera permissions
  const checkCameraPermissions = useCallback(async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      // Check current permission status
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        return permission.state;
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return 'unsupported';
    }
  }, []);

  // Alternative camera access method
  const startCameraAlternative = useCallback(async () => {
    console.log('startCameraAlternative function called with camera:', currentCamera);
    setDebugInfo(`Trying to access ${currentCamera === 'environment' ? 'back' : 'front'} camera...`);
    
    try {
      let stream;
      
      // Method 1: Try with the selected camera (simple constraints)
      setDebugInfo(`Trying method 1: ${currentCamera === 'environment' ? 'Back' : 'Front'} camera...`);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: currentCamera }
        });
        setDebugInfo('Method 1 successful!');
      } catch (e1) {
        console.log('Method 1 failed:', e1);
        
        // Method 2: Try with exact facing mode
        setDebugInfo(`Trying method 2: ${currentCamera === 'environment' ? 'Back' : 'Front'} camera (exact)...`);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: currentCamera } }
          });
          setDebugInfo('Method 2 successful!');
        } catch (e2) {
          console.log('Method 2 failed:', e2);
          
          // Method 3: Try opposite camera if back camera fails
          if (currentCamera === 'environment') {
            setDebugInfo('Trying method 3: Front camera as fallback...');
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
              });
              setDebugInfo('Method 3 successful (using front camera)!');
              // Update the current camera state to reflect what's actually being used
              setCurrentCamera('user');
            } catch (e3) {
              console.log('Method 3 failed:', e3);
              
              // Method 4: Try any available camera
              setDebugInfo('Trying method 4: Any available camera...');
              try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setDebugInfo('Method 4 successful!');
              } catch (e4) {
                console.log('Method 4 failed:', e4);
                throw new Error('All camera access methods failed');
              }
            }
          } else {
            // If front camera fails, try back camera
            setDebugInfo('Trying method 3: Back camera as fallback...');
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
              });
              setDebugInfo('Method 3 successful (using back camera)!');
              setCurrentCamera('environment');
            } catch (e3) {
              console.log('Method 3 failed:', e3);
              
              // Method 4: Try any available camera
              setDebugInfo('Trying method 4: Any available camera...');
              try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setDebugInfo('Method 4 successful!');
              } catch (e4) {
                console.log('Method 4 failed:', e4);
                throw new Error('All camera access methods failed');
              }
            }
          }
        }
      }
      
      console.log('Camera stream obtained:', stream);
      setDebugInfo('Camera stream obtained successfully!');
      
      // Set streaming first to create the video element
      console.log('Setting streaming to true to create video element');
      setDebugInfo('Creating video interface...');
      setIsStreaming(true);
      
      // Use setTimeout to wait for the video element to be created
      setTimeout(async () => {
        if (videoRef.current) {
          console.log('Video ref now exists, setting srcObject');
          setDebugInfo('Setting video source...');
          videoRef.current.srcObject = stream;
          
          // Force play the video
          try {
            await videoRef.current.play();
            setDebugInfo('Camera stream active and playing!');
          } catch (playError) {
            console.log('Video play error (this is often normal):', playError);
            setDebugInfo('Camera stream active (play error is normal)');
          }
          
          getLocation();
        } else {
          console.log('Video ref is still null after timeout!');
          setDebugInfo('Error: Video element still not found after timeout');
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setDebugInfo(`Camera error: ${error.message}`);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints cannot be satisfied.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setAlert(errorMessage, 'danger');
    }
  }, [getLocation, setAlert, currentCamera]);

  // Start camera with specific facing mode
  const startCameraWithMode = useCallback(async (facingMode) => {
    console.log('Starting camera with mode:', facingMode);
    setDebugInfo(`Starting ${facingMode === 'environment' ? 'back' : 'front'} camera...`);
    
    try {
      // Stop current stream first
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      let stream;
      
      // Try multiple methods to get the specified camera
      try {
        // Method 1: Basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode }
        });
        console.log('Camera access successful with basic constraints');
        setDebugInfo('Camera access successful!');
      } catch (e1) {
        console.log('Basic constraints failed, trying exact:', e1);
        try {
          // Method 2: Exact constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: facingMode } }
          });
          console.log('Camera access successful with exact constraints');
          setDebugInfo('Camera access successful (exact)!');
        } catch (e2) {
          console.log('Exact constraints failed, trying fallback:', e2);
          // Method 3: Fallback to any camera
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('Camera access successful with fallback');
          setDebugInfo('Camera access successful (fallback)!');
        }
      }
      
      // Update camera state
      setCurrentCamera(facingMode);
      
      // Set streaming first to create the video element
      setIsStreaming(true);
      
      // Use setTimeout to wait for the video element to be created
      setTimeout(async () => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          
          try {
            await videoRef.current.play();
            setDebugInfo(`Successfully started ${facingMode === 'environment' ? 'back' : 'front'} camera!`);
            console.log('Video playing successfully');
          } catch (playError) {
            console.log('Video play error (often normal):', playError);
            setDebugInfo(`${facingMode === 'environment' ? 'Back' : 'Front'} camera active (play error is normal)`);
          }
          
          getLocation();
        } else {
          throw new Error('Video element or stream not available');
        }
      }, 100);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setAlert('Failed to access camera. Please try again.', 'danger');
      setDebugInfo(`Camera access failed: ${error.message}`);
    }
  }, [setAlert, getLocation]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    console.log('startCamera function called');
    setDebugInfo('Starting camera...');
    
    try {
      // First, stop any existing streams
      setDebugInfo('Stopping any existing camera streams...');
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          console.log('Stopping existing track:', track);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      
      // Try the alternative method
      return await startCameraAlternative();
    } catch (error) {
      console.error('Error accessing camera:', error);
      setDebugInfo(`Camera error: ${error.message}`);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints cannot be satisfied.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setAlert(errorMessage, 'danger');
    }
  }, [startCameraAlternative, setAlert]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Ensure video has loaded and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setAlert('Camera not ready. Please wait a moment and try again.', 'warning');
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      
      // Clear canvas and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedImage(blob);
          stopCamera();
        } else {
          setAlert('Failed to capture image. Please try again.', 'danger');
        }
      }, 'image/jpeg', 0.9);
    }
  }, [stopCamera, setAlert]);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCapturedImage(file);
      getLocation();
    } else {
      setAlert('Please select a valid image file', 'danger');
    }
  }, [getLocation, setAlert]);

  // Submit image for identification
  const identifySpecies = useCallback(async () => {
    if (!capturedImage) {
      setAlert('No image captured', 'danger');
      return;
    }

    setIsProcessing(true);
    setIdentificationResult(null);

    try {
      const formData = new FormData();
      formData.append('image', capturedImage);
      
      if (location) {
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
      }

      const response = await api.post('/api/ecodex/identify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setIdentificationResult(response.data);
      
      if (response.data.success) {
        setAlert(
          `🎉 ${response.data.isFirstDiscovery ? 'New species discovered!' : 'Species identified!'} 
           +${response.data.xpGained} XP gained!`, 
          'success'
        );
        
        // Reload user data to update stats
        loadUser();
      }
    } catch (error) {
      console.error('Error identifying species:', error);
      setAlert(
        error.response?.data?.msg || 'Error identifying species. Please try again.',
        'danger'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, location, setAlert, loadUser]);

  // Reset to capture new image
  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setIdentificationResult(null);
  }, []);

  return (
    <div className="camera-container">
      <div className="camera-header">
        <h2>📸 Species Scanner</h2>
        <p>Capture or upload a photo to identify plants and animals!</p>
        {debugInfo && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '10px',
            fontSize: '0.9rem'
          }}>
            Debug: {debugInfo}
          </div>
        )}
      </div>

      {!capturedImage && !identificationResult && (
        <div className="camera-controls">
          {!isStreaming ? (
            <div className="capture-options">
              <div className="camera-buttons">
                <button
                  className="btn btn-primary camera-btn"
                  onClick={() => startCameraWithMode('environment')}
                  style={{ margin: '10px' }}
                >
                  📷 Back Camera
                </button>
                
                <button
                  className="btn btn-primary camera-btn"
                  onClick={() => startCameraWithMode('user')}
                  style={{ margin: '10px' }}
                >
                  🤳 Front Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="camera-view">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                className="camera-video"
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '300px',
                  maxHeight: '500px',
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#000'
                }}
              />
              
              <div className="camera-overlay">
                <div className="capture-frame"></div>
                
                {/* Camera switch buttons in top right */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  display: 'flex',
                  gap: '10px',
                  zIndex: 20
                }}>
                  <button
                    className={`btn ${currentCamera === 'environment' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => startCameraWithMode('environment')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                    title="Switch to back camera"
                  >
                    📷 Back
                  </button>
                  
                  <button
                    className={`btn ${currentCamera === 'user' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => startCameraWithMode('user')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                    title="Switch to front camera"
                  >
                    🤳 Front
                  </button>
                </div>
                
                <div className="capture-controls">
                  <button
                    className="btn btn-danger"
                    onClick={stopCamera}
                  >
                    ❌ Cancel
                  </button>
                  <button
                    className="btn btn-success capture-button"
                    onClick={capturePhoto}
                  >
                    📸 Capture
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {capturedImage && !identificationResult && (
        <div className="image-preview">
          <h3>📷 Captured Image</h3>
          <img 
            src={URL.createObjectURL(capturedImage)} 
            alt="Captured species" 
            className="preview-image"
          />
          
          <div className="preview-controls">
            <button 
              className="btn btn-secondary"
              onClick={resetCapture}
            >
              🔄 Retake
            </button>
            <button 
              className="btn btn-primary"
              onClick={identifySpecies}
              disabled={isProcessing}
            >
              {isProcessing ? '🔍 Identifying...' : '🔍 Identify Species'}
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="spinner"></div>
            <h3>🔍 Analyzing Species...</h3>
            <p>Our AI is examining your photo to identify the species!</p>
          </div>
        </div>
      )}

      {identificationResult && (
        <div className="identification-result">
          <div className="result-header">
            <h2>🎉 Species Identified!</h2>
            {identificationResult.isFirstDiscovery && (
              <div className="first-discovery-badge">
                ⭐ FIRST DISCOVERY! ⭐
              </div>
            )}
          </div>

          <div className="species-card">
            <div className="species-image">
              <img 
                src={`data:image/jpeg;base64,${identificationResult.entry.image}`}
                alt={identificationResult.entry.name}
              />
            </div>

            <div className="species-info">
              <h3 className="species-name">{identificationResult.entry.name}</h3>
              <p className="scientific-name">{identificationResult.entry.scientificName}</p>
              
              <div className={`rarity-badge ${identificationResult.entry.rarity}`}>
                {identificationResult.entry.rarity.toUpperCase()}
              </div>

              <div className="species-stats">
                <div className="stat-item">
                  <span className="stat-label">Type:</span>
                  <span className="stat-value">{identificationResult.entry.type}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Habitat:</span>
                  <span className="stat-value">{identificationResult.entry.habitat}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">XP Gained:</span>
                  <span className="stat-value">+{identificationResult.xpGained}</span>
                </div>
              </div>

              <div className="species-description">
                <p>{identificationResult.entry.description}</p>
              </div>

              {identificationResult.entry.funFacts && identificationResult.entry.funFacts.length > 0 && (
                <div className="fun-facts">
                  <h4>🌟 Fun Facts:</h4>
                  <ul>
                    {identificationResult.entry.funFacts.map((fact, index) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="result-actions">
            <button 
              className="btn btn-primary"
              onClick={resetCapture}
            >
              📸 Capture Another
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/ecodex'}
            >
              📚 View EcoDEX
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Camera;