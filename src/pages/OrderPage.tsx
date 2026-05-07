import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderPage.css';
import { MdOutlineLocationOn } from 'react-icons/md';
import mealImage from '../assets/food-plate.png';
import { buildFoodOsOrderNote, createFoodOsOrder, normalizeChefOrder } from '../services/orderService';
import { createOrderRealtimeClient, getOrderChannelName } from '../services/realtimeService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { completeOrder, startNewMeal, syncPlacedOrder } from '../store/slices/mealBuilderSlice';
import type { ChefOrder, CustomerOrderDraft, PlateItem } from '../types/types';
import {
  ORDER_STATUS_SYNC_EVENT,
  ORDER_STATUS_SYNC_STORAGE_KEY,
  readCustomerSession,
  readSyncedChefOrder,
} from '../utils/storage';
import { formatCustomerOrderStatusLabel, getCustomerOrderStatusCopy } from '../utils/orderStatus';

const DELIVERY_FEE = 150;
const SERVICE_CHARGE_RATE = 0.05;

const formatPrice = (amount: number, currency = 'LKR') =>
  `${currency} ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(amount)}`;

const formatMacroValue = (value: number) => {
  const roundedValue = Math.round(value * 10) / 10;
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1);
};

const getDisplayTags = (item: PlateItem) =>
  [item.variant, item.specification, item.cook_style, item.quantity_label].filter(Boolean);

const OrderPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const draft = useAppSelector((state) => state.mealBuilder.checkoutDraft) as CustomerOrderDraft | null;
  const placedOrder = useAppSelector((state) => state.mealBuilder.placedOrder);
  const activeDraft = draft || placedOrder?.metadata || null;
  const placedOrderStatusLabel = placedOrder ? formatCustomerOrderStatusLabel(placedOrder.status) : 'Checkout';
  const placedOrderStatusCopy = placedOrder ? getCustomerOrderStatusCopy(placedOrder.status) : null;

  const totals = useMemo(() => {
    const subtotal = activeDraft?.plate_items.reduce((sum, item) => sum + item.price, 0) || 0;
    const deliveryFee = activeDraft ? DELIVERY_FEE : 0;
    const serviceCharge = activeDraft ? Math.round(subtotal * SERVICE_CHARGE_RATE) : 0;
    const total = subtotal + deliveryFee + serviceCharge;

    return { subtotal, deliveryFee, serviceCharge, total };
  }, [activeDraft]);

  const totalMacros = useMemo(
    () =>
      (activeDraft?.plate_items || []).reduce(
        (totalsAccumulator, item) => {
          totalsAccumulator.protein += item.macros.protein || 0;
          totalsAccumulator.carbs += item.macros.carbs || 0;
          totalsAccumulator.fats += item.macros.fats || 0;
          totalsAccumulator.kcal += item.macros.kcal || 0;
          return totalsAccumulator;
        },
        { protein: 0, carbs: 0, fats: 0, kcal: 0 },
      ),
    [activeDraft],
  );

  useEffect(() => {
    if (!placedOrder?.id) {
      return;
    }

    const watchToken = placedOrder.metadata?.realtime_token;

    const applyOrderUpdate = (incomingOrder: ChefOrder) => {
      const normalizedOrder = normalizeChefOrder(incomingOrder);

      if (normalizedOrder.id !== placedOrder.id) {
        return;
      }

      dispatch(syncPlacedOrder(normalizedOrder));
    };

    const syncedOrder = readSyncedChefOrder(placedOrder.id);
    if (syncedOrder) {
      applyOrderUpdate(syncedOrder);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== ORDER_STATUS_SYNC_STORAGE_KEY) {
        return;
      }

      const nextSyncedOrder = readSyncedChefOrder(placedOrder.id);
      if (nextSyncedOrder) {
        applyOrderUpdate(nextSyncedOrder);
      }
    };

    const handleLocalSync = (event: Event) => {
      const customEvent = event as CustomEvent<ChefOrder>;
      if (customEvent.detail) {
        applyOrderUpdate(customEvent.detail);
      }
    };

    const pusher = watchToken ? createOrderRealtimeClient(placedOrder.id, watchToken) : null;
    const channel = pusher?.subscribe(getOrderChannelName(placedOrder.id));

    channel?.bind('order:created', applyOrderUpdate);
    channel?.bind('order:status-updated', applyOrderUpdate);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(ORDER_STATUS_SYNC_EVENT, handleLocalSync as EventListener);

    return () => {
      channel?.unbind('order:created', applyOrderUpdate);
      channel?.unbind('order:status-updated', applyOrderUpdate);
      if (pusher) {
        pusher.unsubscribe(getOrderChannelName(placedOrder.id));
        pusher.disconnect();
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(ORDER_STATUS_SYNC_EVENT, handleLocalSync as EventListener);
    };
  }, [dispatch, placedOrder?.id, placedOrder?.metadata?.realtime_token]);

  const handlePlaceOrder = async () => {
    if (!draft || placingOrder) {
      return;
    }

    const customerSession = readCustomerSession();
    if (!customerSession?.token || !customerSession.user?.id) {
      navigate('/login?redirect=%2Forder');
      return;
    }

    setPlacingOrder(true);
    setError('');

    try {
      const nextDraft: CustomerOrderDraft = {
        ...draft,
        total_price: totals.total,
      };

      const createdOrder = await createFoodOsOrder({
        location_id: draft.location_id,
        customer_id: customerSession?.user?.id,
        notes: buildFoodOsOrderNote(nextDraft),
        items: draft.plate_items.map((item) => ({
          quantity: 1,
          unit_price: item.price,
          notes: [item.name, item.variant, item.specification, item.cook_style, item.quantity_label]
            .filter(Boolean)
            .join(' | '),
        })),
      });

      dispatch(completeOrder(createdOrder));
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Failed to place order. Please try again.';
      setError(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderEmptyState = () => (
    <div className="order-container">
      <div className="empty-order-state">
        <h2>No checkout meal found</h2>
        <p>Build a plate first, then come back here to place the order.</p>
        <button className="place-order-btn empty-order-button" onClick={() => navigate('/build')}>
          Build a Meal
        </button>
      </div>
    </div>
  );

  if (!draft && !placedOrder) {
    return renderEmptyState();
  }

  const plateItems = activeDraft?.plate_items || [];
  const currency = plateItems[0]?.currency || 'LKR';

  return (
    <div className="order-container">
      <div className="sidebar">
        <section className="card">
          <h3 className="card-label">Delivery or Pickup</h3>
          <div className="toggle-options">
            <div className="toggle-btn active">
              <p className="main-text">Deliver to Me</p>
              <p className="sub-text">
                {activeDraft?.delivery_type === 'schedule' ? 'Scheduled delivery' : 'Estimated 45 minutes'}
              </p>
              <p className="popular-badge">Live Order</p>
            </div>
            <div className="toggle-btn">
              <p className="main-text">{activeDraft?.location_name || 'Kitchen Pickup'}</p>
              <p className="sub-text">Prepared by Thrive kitchen</p>
            </div>
          </div>
          <div className="address-display">
            <div className="address-icon">
              <MdOutlineLocationOn size={16} color="var(--lime-green)" />
            </div>

            <div className="address-text">
              <strong>{activeDraft?.location_name || 'Thrive Kitchen'}</strong>
              <p>Live order will be prepared for the selected kitchen location.</p>
            </div>
            <button className="change-link" onClick={() => navigate('/build')}>
              Edit
            </button>
          </div>
        </section>

        <section className="payment-card">
          <div className="payment-header">
            <h3 className="payment-label">ORDER STATUS</h3>
            <button className={`manage-btn${placedOrder ? ` status-${placedOrder.status}` : ''}`}>
              {placedOrderStatusLabel}
            </button>
          </div>

          {placedOrder ? (
            <div className={`order-feedback success status-${placedOrder.status}`}>
              <strong>{placedOrderStatusCopy?.title}</strong>
              <span>Order ID: {placedOrder.order_number || placedOrder.id}</span>
              <span>Status: {placedOrderStatusLabel}</span>
              <span>{placedOrderStatusCopy?.description}</span>
            </div>
          ) : (
            <div className="order-feedback">
              <strong>Ready to send to the kitchen</strong>
            </div>
          )}

          {error ? <div className="order-feedback error">{error}</div> : null}
        </section>
      </div>

      <main className="main-summary">
        <h3 className="card-label-orderSummery">Order Summary</h3>
        <div className="summary-body">
          <p className="bowl-title">"{activeDraft?.meal_name || 'Custom Thrive Plate'}"</p>
          <ul className="item-list">
            {plateItems.map((item) => (
              <li key={item.id} className="list-item">
                <div className="item-dot"></div>
                <div className="item-content">
                  <p className="item-header">
                    {item.name}{' '}
                    <span className="item-kcal">{`${formatMacroValue(item.macros.kcal)} Kcal/${item.quantity_label}`}</span>
                  </p>
                  <div className="tag-container">
                    {getDisplayTags(item).map((tag) => (
                      <span key={`${item.id}-${tag}`} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="price-text">{formatPrice(item.price, item.currency)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="nutrition-strip">
          <div className="stat">
            <strong>{formatMacroValue(totalMacros.protein)}g</strong>
            <span>Protein</span>
          </div>
          <div className="stat">
            <strong>{formatMacroValue(totalMacros.carbs)}g</strong>
            <span>Carbs</span>
          </div>
          <div className="stat">
            <strong>{formatMacroValue(totalMacros.fats)}g</strong>
            <span>Fats</span>
          </div>
          <div className="stat">
            <strong>{formatMacroValue(totalMacros.kcal)}</strong>
            <span>Kcal</span>
          </div>
        </div>

        <div className="checkout-area">
          <p className="disclaimer">
            Your order will be pushed to the chef interface with the generated order ID and live status.
          </p>
          <div className="receipt-row">
            <span>Subtotal</span>
            <span>{formatPrice(totals.subtotal, currency)}</span>
          </div>
          <div className="receipt-row">
            <span>Delivery Fee</span>
            <span>{formatPrice(totals.deliveryFee, currency)}</span>
          </div>
          <div className="receipt-row">
            <span>Service Charge</span>
            <span>{formatPrice(totals.serviceCharge, currency)}</span>
          </div>

          <div className="total-row">
            <span>TOTAL</span>
            <span>{formatPrice(placedOrder ? Number(placedOrder.total_price) : totals.total, currency)}</span>
          </div>

          {placedOrder ? (
            <>
              <div className="placed-order-meta">
                <span>Order ID: {placedOrder.order_number || placedOrder.id}</span>
                <span className={`status-pill status-${placedOrder.status}`}>{placedOrderStatusLabel}</span>
              </div>
              <button
                className="place-order-btn"
                onClick={() => {
                  dispatch(startNewMeal());
                  navigate('/build');
                }}
              >
                Build Another Meal
              </button>
            </>
          ) : (
            <button className="place-order-btn" onClick={handlePlaceOrder} disabled={placingOrder}>
              {placingOrder ? 'Placing Order...' : 'Place your Order'}
            </button>
          )}

          <p className="security-text">256-bit SSL encrypted - Payments secured by Stripe</p>
        </div>
      </main>

      <div className="plate-sidebar">
        <div className="card-plate">
          <div className="card-label-yourPlate">
            <h3>Your Plate</h3>
            <span className="goal-badge">
              {placedOrder ? `ORDER ${placedOrder.order_number || placedOrder.id}` : 'READY TO SEND'}
            </span>
          </div>
          <img src={mealImage} alt="Meal" className="meal-img" />
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
