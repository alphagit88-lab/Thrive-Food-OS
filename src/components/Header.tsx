import React, { useEffect, useState } from 'react';
import './Header.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { CustomerSession } from '../types/types';
import {
  clearCustomerSession,
  CUSTOMER_SESSION_EVENT,
  CUSTOMER_SESSION_STORAGE_KEY,
  readCustomerSession,
} from '../utils/storage';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => readCustomerSession());

  useEffect(() => {
    const syncCustomerSession = () => {
      setCustomerSession(readCustomerSession());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== CUSTOMER_SESSION_STORAGE_KEY) {
        return;
      }

      syncCustomerSession();
    };

    const handleCustomerSessionEvent = () => {
      syncCustomerSession();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CUSTOMER_SESSION_EVENT, handleCustomerSessionEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CUSTOMER_SESSION_EVENT, handleCustomerSessionEvent as EventListener);
    };
  }, []);

  const firstName = customerSession?.user?.firstName?.trim() || 'Account';
  const currentPath = `${location.pathname}${location.search}`;
  const loginTarget = `/login?redirect=${encodeURIComponent(currentPath)}`;
  const signUpTarget = `/signUp?redirect=${encodeURIComponent(currentPath)}`;

  const handleLogout = () => {
    clearCustomerSession();
    setCustomerSession(null);

    if (location.pathname === '/order') {
      navigate('/login?redirect=%2Forder');
      return;
    }

    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <div className="logo">THRIVE</div>
        </Link>
        <div className='header-nav'>
          <nav className="nav">
            <ul className="nav-links">
              <li><Link to="/menu">Menu</Link></li>
              <li><Link to="/powerDrinks">Power Drinks</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/#who">Who we are</Link></li>
              <li><Link to="/#franchise">Franchise</Link></li>
              <li><Link to="/#profile">Profile</Link></li>
            </ul>
          </nav>
          <div className="header-auth">
            {customerSession?.token ? (
              <>
                <span className="header-account-name">{firstName}</span>
                <button className="sign-up-btn auth-logout-btn" onClick={handleLogout} type="button">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to={loginTarget} className="build-btn-link">
                  <button className="sign-up-btn auth-login-btn" type="button">Log In</button>
                </Link>
                <Link to={signUpTarget} className="build-btn-link">
                  <button className="sign-up-btn" type="button">Sign Up</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
