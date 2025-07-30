import axios from 'axios';
import api from './api';

const setAuthToken = token => {
  if (token) {
    // Set token for both axios defaults and our API instance
    axios.defaults.headers.common['x-auth-token'] = token;
    api.defaults.headers.common['x-auth-token'] = token;
    localStorage.setItem('token', token);
  } else {
    // Remove token from both axios defaults and our API instance
    delete axios.defaults.headers.common['x-auth-token'];
    delete api.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('token');
  }
};

export default setAuthToken;