import React, { useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import AlertContext from '../../context/AlertContext';
import setAuthToken from '../../utils/setAuthToken';

const Register = () => {
  const { isAuthenticated, loadUser } = useContext(AuthContext);
  const { setAlert } = useContext(AlertContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const { name, email, password, password2 } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (password !== password2) {
      setAlert('Passwords do not match', 'danger');
    } else {
      const newUser = {
        name,
        email,
        password
      };

      try {
        const config = {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const body = JSON.stringify(newUser);

        const res = await api.post('/api/users', body, config);

        setAuthToken(res.data.token);
        loadUser();
        setAlert('Registration successful!', 'success');
      } catch (err) {
        console.error('Registration error:', err);
        
        if (err.response && err.response.data && err.response.data.errors) {
          // Server validation errors
          err.response.data.errors.forEach(error => setAlert(error.msg, 'danger'));
        } else if (err.response && err.response.data && err.response.data.msg) {
          // Server error message
          setAlert(err.response.data.msg, 'danger');
        } else if (err.message) {
          // Network or other errors
          setAlert(`Registration failed: ${err.message}`, 'danger');
        } else {
          // Fallback error
          setAlert('Registration failed. Please check your connection and try again.', 'danger');
        }
      }
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="container">
      <h1 className="large pokemon-title">🌟 Join the Adventure! 🌟</h1>
      <p className="lead">
        🎮 Create Your EcoDEX Trainer Account and start your journey!
      </p>
      <form className="form" onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <input
            type="text"
            placeholder="🧑‍🎓 Trainer Name"
            name="name"
            value={name}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="📧 Email Address"
            name="email"
            value={email}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="🔒 Password (6+ characters)"
            name="password"
            value={password}
            onChange={e => onChange(e)}
            minLength="6"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="🔒 Confirm Password"
            name="password2"
            value={password2}
            onChange={e => onChange(e)}
            minLength="6"
            required
          />
        </div>
        <input type="submit" className="btn btn-primary" value="🚀 Start Adventure" />
      </form>
      <p className="my-1">
        Already a trainer? <Link to="/login" style={{color: 'var(--primary-green)'}}>🎯 Continue Journey</Link>
      </p>
    </div>
  );
};

export default Register;