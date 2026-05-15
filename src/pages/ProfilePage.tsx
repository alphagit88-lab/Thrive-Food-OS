import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import { loadMealBuilderState, type MealBuilderPersistedState } from '../store/mealBuilderStorage';
import type { CustomerSession } from '../types/types';
import {
  clearCustomerSession,
  CUSTOMER_SESSION_EVENT,
  readCustomerSession,
} from '../utils/storage';
import { formatCustomerOrderStatusLabel, getCustomerOrderStatusCopy } from '../utils/orderStatus';

const PROFILE_REDIRECT_TARGET = '/login?redirect=%2Fprofile';

const formatProfileDate = (value?: string, emptyLabel = 'Not added') => {
  if (!value) {
    return emptyLabel;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatPrice = (amount: number, currency = 'LKR') =>
  `${currency} ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(amount)}`;

const getInitials = (firstName?: string, lastName?: string) => {
  const initials = `${firstName?.trim().charAt(0) || ''}${lastName?.trim().charAt(0) || ''}`.toUpperCase();
  return initials || 'TM';
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => readCustomerSession());
  const [mealBuilderState, setMealBuilderState] = useState<MealBuilderPersistedState | null>(() =>
    loadMealBuilderState(),
  );

  useEffect(() => {
    const syncPageState = () => {
      setCustomerSession(readCustomerSession());
      setMealBuilderState(loadMealBuilderState());
    };

    const handleStorage = () => {
      syncPageState();
    };

    const handleCustomerSessionEvent = () => {
      syncPageState();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CUSTOMER_SESSION_EVENT, handleCustomerSessionEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CUSTOMER_SESSION_EVENT, handleCustomerSessionEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!customerSession?.token) {
      navigate(PROFILE_REDIRECT_TARGET, { replace: true });
    }
  }, [customerSession?.token, navigate]);

  if (!customerSession?.token) {
    return null;
  }

  const user = customerSession.user;
  const fullName = [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(' ') || 'Thrive Member';
  const draft = mealBuilderState?.checkoutDraft || null;
  const placedOrder = mealBuilderState?.placedOrder || null;
  const recentMealName = draft?.meal_name || placedOrder?.metadata?.meal_name || 'No active meal yet';
  const recentMealCount = draft?.plate_items.length || placedOrder?.metadata?.plate_items?.length || 0;
  const recentMealLocation = draft?.location_name || placedOrder?.metadata?.location_name || 'Choose a Thrive kitchen';
  const recentTotal = draft?.total_price || placedOrder?.total_price || 0;
  const recentCurrency = draft?.plate_items[0]?.currency || placedOrder?.metadata?.plate_items[0]?.currency || 'LKR';
  const orderStatusLabel = placedOrder ? formatCustomerOrderStatusLabel(placedOrder.status) : 'Draft Ready';
  const orderStatusCopy = placedOrder ? getCustomerOrderStatusCopy(placedOrder.status) : null;

  const handleLogout = () => {
    clearCustomerSession();
    setCustomerSession(null);
    navigate('/', { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <section className="profile-hero">
          <div className="profile-intro-card">
            <span className="profile-eyebrow">THRIVE MEMBER PROFILE</span>
            <h1 className="profile-title">{fullName}</h1>
            <p className="profile-copy">
              Keep your account details in one place, jump back into your latest meal build, and manage
              your session from your personal Thrive dashboard.
            </p>

            <div className="profile-action-row">
              <Link to="/build" className="profile-primary-link">
                Build My Meal
              </Link>
              <Link to="/order" className="profile-secondary-link">
                View Current Order
              </Link>
            </div>
          </div>

          <aside className="profile-summary-card">
            <div className="profile-avatar">{getInitials(user?.firstName, user?.lastName)}</div>
            <div className="profile-summary-content">
              <span className="profile-summary-label">Signed in</span>
              <strong>{formatProfileDate(customerSession.authenticated_at, 'Just now')}</strong>
              <span className="profile-summary-label">Customer ID</span>
              <strong>{user?.id || 'Will appear after your first synced order'}</strong>
            </div>
          </aside>
        </section>

        <section className="profile-content-grid">
          <div className="profile-panel">
            <div className="profile-panel-header">
              <span className="profile-panel-kicker">ACCOUNT DETAILS</span>
              <h2>My profile</h2>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-card">
                <span>Email</span>
                <strong>{user?.email?.trim() || 'Not added'}</strong>
              </div>
              <div className="profile-info-card">
                <span>Phone</span>
                <strong>{user?.phone?.trim() || 'Not added'}</strong>
              </div>
              <div className="profile-info-card">
                <span>Date of birth</span>
                <strong>{formatProfileDate(user?.dob)}</strong>
              </div>
              <div className="profile-info-card">
                <span>Gender</span>
                <strong>{user?.gender?.trim() || 'Not added'}</strong>
              </div>
            </div>
          </div>

          <div className="profile-panel">
            <div className="profile-panel-header">
              <span className="profile-panel-kicker">MEAL SNAPSHOT</span>
              <h2>{placedOrder ? 'Latest order' : draft ? 'Saved draft' : 'Start your next meal'}</h2>
            </div>

            <div className="profile-order-card">
              <div className="profile-order-head">
                <span className={`profile-status-pill${placedOrder ? ` status-${placedOrder.status}` : ' status-draft'}`}>
                  {placedOrder ? orderStatusLabel : 'Draft Ready'}
                </span>
                <strong>{recentMealName}</strong>
              </div>

              <p className="profile-order-copy">
                {placedOrder
                  ? `${orderStatusCopy?.title}. ${orderStatusCopy?.description}`
                  : draft
                    ? 'Your saved draft is still waiting in checkout. Jump back in whenever you are ready.'
                    : 'You do not have an active draft yet. Start building a custom meal to see it here.'}
              </p>

              <div className="profile-order-metrics">
                <div>
                  <span>Kitchen</span>
                  <strong>{recentMealLocation}</strong>
                </div>
                <div>
                  <span>Items</span>
                  <strong>{recentMealCount}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{recentTotal > 0 ? formatPrice(Number(recentTotal), recentCurrency) : 'Not started'}</strong>
                </div>
              </div>

              <div className="profile-action-row compact">
                <Link to={placedOrder || draft ? '/order' : '/build'} className="profile-primary-link">
                  {placedOrder ? 'Track Order' : draft ? 'Continue Checkout' : 'Start Building'}
                </Link>
                <Link to="/menu" className="profile-secondary-link">
                  Browse Menu
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-utilities-grid">
          <div className="profile-utility-card">
            <span className="profile-panel-kicker">QUICK LINKS</span>
            <h2>Where do you want to go next?</h2>
            <div className="profile-link-grid">
              <Link to="/community" className="profile-utility-link">Community</Link>
              <Link to="/powerDrinks" className="profile-utility-link">Power Drinks</Link>
              <Link to="/about" className="profile-utility-link">Who We Are</Link>
            </div>
          </div>

          <div className="profile-utility-card accent">
            <span className="profile-panel-kicker">SESSION CONTROL</span>
            <h2>Secure your account access</h2>
            <p>
              When you are finished on this device, sign out here to clear your Thrive customer session.
            </p>
            <button className="profile-logout-btn" onClick={handleLogout} type="button">
              Log Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
