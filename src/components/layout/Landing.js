import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <section className="landing">
      <div className="landing-inner">
        <h1 className="x-large pokemon-title">🌿 Welcome to EcoDEX 🦋</h1>
        <p className="lead">
          🌱 Discover and collect plants and animals in the real world!
          📸 Take photos, learn about nature, and build your personal EcoDEX collection.
          ⭐ Level up as you explore the natural world around you!
        </p>
        <div className="buttons">
          <Link to="/register" className="btn btn-primary">
            <i className="fas fa-user-plus"></i> Start Your Adventure
          </Link>
          <Link to="/login" className="btn btn-secondary">
            <i className="fas fa-sign-in-alt"></i> Continue Journey
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Landing;