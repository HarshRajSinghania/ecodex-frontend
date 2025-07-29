import React, { useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import AlertContext from '../../context/AlertContext';
import setAuthToken from '../../utils/setAuthToken';

const Login = () => {
  const { isAuthenticated, loadUser } = useContext(AuthContext);
  const { setAlert } = useContext(AlertContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();

    const user = {
      email,
      password
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const body = JSON.stringify(user);

      const res = await axios.post('/api/auth', body, config);

      setAuthToken(res.data.token);
      loadUser();
      setAlert('Login successful!', 'success');
    } catch (err) {
      const errors = err.response.data.errors;

      if (errors) {
        errors.forEach(error => setAlert(error.msg, 'danger'));
      }
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="container">
      <h1 className="large pokemon-title">🎯 Welcome Back, Trainer! 🎯</h1>
      <p className="lead">
        🌟 Continue your EcoDEX adventure and discover new species!
      </p>
      <form className="form" onSubmit={e => onSubmit(e)}>
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
            placeholder="🔒 Password"
            name="password"
            value={password}
            onChange={e => onChange(e)}
            minLength="6"
            required
          />
        </div>
        <input type="submit" className="btn btn-primary" value="🚀 Continue Adventure" />
      </form>
      <p className="my-1">
        New trainer? <Link to="/register" style={{color: 'var(--primary-green)'}}>🌟 Start Your Journey</Link>
      </p>
    </div>
  );
};

export default Login;