import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginChef } from '../services/chefAuthService';
import { readChefSession, saveChefSession } from '../utils/storage';
import './ChefLoginPage.css';

const ChefLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const existingSession = readChefSession();

    if (existingSession?.token) {
      navigate('/chef/orders', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Enter the chef email and password to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await loginChef(email.trim(), password);

      if (session.user.role !== 'kitchen_staff') {
        throw new Error('Use a user account with the kitchen_staff role for this chef screen.');
      }

      saveChefSession(session);
      navigate('/chef/orders', { replace: true });
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : 'Chef login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chef-login-page">
      <div className="chef-login-shell">
        <div className="chef-login-panel">
          <div className="chef-login-copy">
            <span className="chef-kicker">Kitchen Operations</span>
            <h1>Chef live board login</h1>
            <p>
              Sign in with the kitchen chef account to receive new orders instantly from
              Thrive-Food-OS.
            </p>
            <div className="chef-login-notes">
              <div>
                <strong>Role</strong>
                <span>kitchen_staff</span>
              </div>
              <div>
                <strong>Live feed</strong>
                <span>Socket.IO order stream</span>
              </div>
            </div>
          </div>

          <form className="chef-login-card" onSubmit={handleLogin}>
            <label className="chef-field-label" htmlFor="chef-email">
              Chef Email
            </label>
            <input
              id="chef-email"
              className="chef-field"
              type="email"
              placeholder="chef@thrive.lk"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />

            <label className="chef-field-label" htmlFor="chef-password">
              Password
            </label>
            <input
              id="chef-password"
              className="chef-field"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />

            {error ? <div className="chef-login-error">{error}</div> : null}

            <button className="chef-login-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Open Chef Orders'}
            </button>

            <div className="chef-login-footer">
              <Link to="/">Back to Thrive-Food-OS</Link>
              <Link to="/login">Customer Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChefLoginPage;
