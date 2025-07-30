import React, { useState, useRef, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import AlertContext from '../../context/AlertContext';
import api from '../../utils/api';
import './ScientistChat.css';

const ScientistChat = () => {
  const { user } = useContext(AuthContext);
  const { setAlert } = useContext(AlertContext);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ecologist',
      text: `Hello ${user?.name || 'fellow nature explorer'}! 🌿 I'm Dr. Maya Chen, a field ecologist with over 15 years of experience studying biodiversity. I'm here to help you learn about the amazing plants and animals you discover in EcoDEX! Feel free to ask me anything about nature, ecology, or share photos of species you'd like to know more about.`,
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setAlert('Image selected! You can now send it with your message.', 'success');
    } else {
      setAlert('Please select a valid image file', 'danger');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      image: selectedImage ? URL.createObjectURL(selectedImage) : null,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', inputMessage);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await api.post('/api/ecodex/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const ecologistMessage = {
        id: Date.now() + 1,
        sender: 'ecologist',
        text: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, ecologistMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setAlert('Sorry, I had trouble processing your message. Please try again.', 'danger');
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ecologist',
        text: "I apologize, but I'm having some technical difficulties right now. Please try sending your message again in a moment!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'ecologist',
        text: `Hello again ${user?.name || 'fellow nature explorer'}! 🌿 Ready for another nature conversation? I'm here to help you explore the wonderful world of biodiversity!`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="scientist-chat-container">
      <div className="chat-header">
        <div className="ecologist-profile">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              🧬
            </div>
          </div>
          <div className="profile-info">
            <h2>Dr. Maya Chen</h2>
            <p className="profile-title">Field Ecologist & Biodiversity Expert</p>
            <div className="status-indicator">
              <span className="status-dot"></span>
              Online & Ready to Help
            </div>
          </div>
        </div>
        <button className="clear-chat-btn" onClick={clearChat} title="Start New Conversation">
          🔄
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            {message.sender === 'ecologist' && (
              <div className="message-avatar">
                🧬
              </div>
            )}
            <div className="message-content">
              {message.image && (
                <div className="message-image">
                  <img src={message.image} alt="Shared by user" />
                </div>
              )}
              <div className="message-text">
                {message.text}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {message.sender === 'user' && (
              <div className="message-avatar user-avatar">
                👤
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="message ecologist">
            <div className="message-avatar">
              🧬
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {selectedImage && (
          <div className="selected-image-preview">
            <img src={URL.createObjectURL(selectedImage)} alt="Selected" />
            <button 
              className="remove-image-btn"
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              ❌
            </button>
          </div>
        )}
        
        <div className="chat-input-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <button 
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image"
          >
            📷
          </button>
          
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Dr. Chen about plants, animals, ecology, or share a photo..."
            className="message-input"
            rows="1"
            disabled={isLoading}
          />
          
          <button 
            className="send-btn"
            onClick={sendMessage}
            disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </div>
        
        <div className="input-hints">
          💡 Try asking: "What's this plant?", "Tell me about forest ecosystems", or share a photo!
        </div>
      </div>
    </div>
  );
};

export default ScientistChat;