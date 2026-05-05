import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFoodOsLocations } from '../services/mealBuilderService';
import { getChefOrders, normalizeChefOrder, updateChefOrderStatus } from '../services/orderService';
import {
  createChefRealtimeClient,
  isRealtimeConfigured,
  KITCHEN_ORDERS_CHANNEL,
} from '../services/realtimeService';
import { clearChefSession, readChefSession, saveSyncedChefOrder } from '../utils/storage';
import type { ChefOrder, ChefOrderStatus, PlateItem, ThriveLocation } from '../types/types';
import { ACTIVE_ORDER_STATUSES, formatKitchenStatusLabel } from '../utils/orderStatus';
import './ChefOrdersPage.css';

type ChefBoardTab = 'all' | 'received' | 'accepted' | 'preparing' | 'ready';

const formatPrice = (amount: number | string, currency = 'LKR') => {
  const numericAmount = Number(amount || 0);
  return `${currency} ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(
    numericAmount,
  )}`;
};

const sortOrders = (orders: ChefOrder[]) =>
  [...orders].sort((left, right) => {
    const leftTime = new Date(left.order_date || left.created_at).getTime();
    const rightTime = new Date(right.order_date || right.created_at).getTime();
    return rightTime - leftTime;
  });

const upsertOrder = (orders: ChefOrder[], incomingOrder: ChefOrder) => {
  const nextOrders = orders.filter((order) => order.id !== incomingOrder.id);
  nextOrders.unshift(incomingOrder);
  return sortOrders(nextOrders);
};

const syncChefOrder = (order: ChefOrder) => {
  const normalizedOrder = normalizeChefOrder(order);
  saveSyncedChefOrder(normalizedOrder);
  return normalizedOrder;
};

const getDisplayItems = (order: ChefOrder) => {
  if (order.metadata?.plate_items?.length) {
    return order.metadata.plate_items.map((item: PlateItem) => ({
      id: item.id,
      name: item.name,
      tags: [item.quantity_label, item.specification, item.cook_style].filter(Boolean),
    }));
  }

  return (order.items || []).map((item) => ({
    id: item.id,
    name: item.menu_item_name || 'Custom item',
    tags: item.notes
      ? item.notes
          .split('|')
          .slice(1)
          .map((segment) => segment.trim())
          .filter(Boolean)
      : [],
  }));
};

const ChefOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ChefOrder[]>([]);
  const [chefToken, setChefToken] = useState('');
  const [chefName, setChefName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketState, setSocketState] = useState<'connecting' | 'connected' | 'offline'>(
    'connecting',
  );
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [locations, setLocations] = useState<ThriveLocation[]>([]);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<ChefBoardTab>('all');

  useEffect(() => {
    const session = readChefSession();

    if (!session?.token) {
      navigate('/chef/login', { replace: true });
      return;
    }

    if (session.user.role !== 'kitchen_staff') {
      clearChefSession();
      navigate('/chef/login', { replace: true });
      return;
    }

    setChefToken(session.token);
    setChefName(session.user.name);
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    const loadLocations = async () => {
      try {
        const fetchedLocations = await getFoodOsLocations();

        if (!mounted) {
          return;
        }

        setLocations(fetchedLocations);
      } catch {
        if (mounted) {
          setLocations([]);
        }
      }
    };

    void loadLocations();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!chefToken) {
      return;
    }

    let mounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const fetchedOrders = await getChefOrders(chefToken, selectedLocationFilter);

        if (!mounted) {
          return;
        }

        setOrders(sortOrders(fetchedOrders.map(syncChefOrder)));
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Unable to load chef orders right now.';
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, [chefToken, selectedLocationFilter]);

  useEffect(() => {
    if (!chefToken) {
      return;
    }

    if (!isRealtimeConfigured()) {
      setSocketState('offline');
      return;
    }

    const pusher = createChefRealtimeClient(chefToken);

    if (!pusher) {
      setSocketState('offline');
      return;
    }

    const mapConnectionState = (state: string) => {
      if (state === 'connected') {
        setSocketState('connected');
        return;
      }

      if (state === 'connecting' || state === 'initialized') {
        setSocketState('connecting');
        return;
      }

      setSocketState('offline');
    };

    const channel = pusher.subscribe(KITCHEN_ORDERS_CHANNEL);

    setSocketState('connecting');

    const handleOrderCreated = (incomingOrder: ChefOrder) => {
      const nextOrder = syncChefOrder(incomingOrder);
      setOrders((currentOrders) => upsertOrder(currentOrders, nextOrder));
    };

    const handleOrderStatusUpdated = (incomingOrder: ChefOrder) => {
      const nextOrder = syncChefOrder(incomingOrder);
      setOrders((currentOrders) => upsertOrder(currentOrders, nextOrder));
    };

    const handleConnectionChange = (states: { current: string }) => {
      mapConnectionState(states.current);
    };

    const handleConnectionError = () => {
      setSocketState('offline');
    };

    pusher.connection.bind('state_change', handleConnectionChange);
    pusher.connection.bind('error', handleConnectionError);
    channel.bind('order:created', handleOrderCreated);
    channel.bind('order:status-updated', handleOrderStatusUpdated);
    channel.bind('pusher:subscription_error', () => {
      setSocketState('offline');
      setError('Unable to subscribe to live chef updates right now.');
    });

    return () => {
      channel.unbind('order:created', handleOrderCreated);
      channel.unbind('order:status-updated', handleOrderStatusUpdated);
      channel.unbind('pusher:subscription_error');
      pusher.connection.unbind('state_change', handleConnectionChange);
      pusher.connection.unbind('error', handleConnectionError);
      pusher.unsubscribe(KITCHEN_ORDERS_CHANNEL);
      pusher.disconnect();
    };
  }, [chefToken]);

  const activeOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
          return false;
        }

        if (selectedLocationFilter === 'all') {
          return true;
        }

        return order.location_id === selectedLocationFilter;
      }),
    [orders, selectedLocationFilter],
  );

  const waitingAcceptanceCount = activeOrders.filter((order) => order.status === 'received').length;
  const acceptedCount = activeOrders.filter((order) => order.status === 'accepted').length;
  const inProgressCount = activeOrders.filter((order) => order.status === 'preparing').length;
  const completedCount = activeOrders.filter((order) => order.status === 'ready').length;
  const visibleOrders = useMemo(
    () =>
      selectedStatusTab === 'all'
        ? activeOrders
        : activeOrders.filter((order) => order.status === selectedStatusTab),
    [activeOrders, selectedStatusTab],
  );

  const summaryTabs: Array<{
    id: ChefBoardTab;
    label: string;
    count: number;
    className?: string;
  }> = [
    { id: 'all', label: 'Active Orders', count: activeOrders.length },
    { id: 'received', label: 'Waiting Acceptance', count: waitingAcceptanceCount },
    {
      id: 'accepted',
      label: 'Accepted',
      count: acceptedCount,
      className: 'chef-summary-card-accepted',
    },
    {
      id: 'preparing',
      label: 'In Progress',
      count: inProgressCount,
      className: 'chef-summary-card-progress',
    },
    {
      id: 'ready',
      label: 'Completed',
      count: completedCount,
      className: 'chef-summary-card-ready',
    },
  ];

  const getEmptyStateMessage = () => {
    switch (selectedStatusTab) {
      case 'received':
        return 'No orders are waiting for acceptance right now.';
      case 'accepted':
        return 'No accepted orders yet. Accepted orders will appear here before preparation starts.';
      case 'preparing':
        return 'No in-progress orders right now. Orders being prepared will appear here.';
      case 'ready':
        return 'No completed orders yet. Finished meals will appear here.';
      default:
        return 'No active orders yet. New orders will appear here as soon as customers place them.';
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: ChefOrderStatus) => {
    if (!chefToken) {
      return;
    }

    setUpdatingOrderId(orderId);
    setError('');

    try {
      const updatedOrder = syncChefOrder(await updateChefOrderStatus(orderId, status, chefToken));
      setOrders((currentOrders) => upsertOrder(currentOrders, updatedOrder));
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : `Unable to mark this order as ${formatKitchenStatusLabel(status).toLowerCase()} right now.`;
      setError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    await handleOrderStatusUpdate(orderId, 'accepted');
  };

  const handleStartPreparing = async (orderId: string) => {
    await handleOrderStatusUpdate(orderId, 'preparing');
  };

  const handleCompleteOrder = async (orderId: string) => {
    await handleOrderStatusUpdate(orderId, 'ready');
  };

  const handleLogout = () => {
    clearChefSession();
    navigate('/chef/login', { replace: true });
  };

  return (
    <div className="chef-orders-page">
      <div className="chef-orders-shell">
        <header className="chef-orders-header">
          <div>
            <span className="chef-orders-kicker">Thrive Chef Console</span>
            <h1>Live kitchen order board</h1>
            <p>{chefName ? `Logged in as ${chefName}` : 'Kitchen chef session active'}</p>
          </div>

          <div className="chef-header-actions">
            <select
              className="chef-location-filter"
              value={selectedLocationFilter}
              onChange={(event) => setSelectedLocationFilter(event.target.value)}
            >
              <option value="all">All Kitchens</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <div className={`chef-socket-indicator ${socketState}`}>
              <span />
              {socketState === 'connected'
                ? 'Live'
                : socketState === 'connecting'
                  ? 'Connecting'
                  : 'Offline'}
            </div>
            <button className="chef-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {error ? <div className="chef-orders-alert">{error}</div> : null}

        <section className="chef-orders-summary">
          {summaryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`chef-summary-card ${tab.className || ''} ${
                selectedStatusTab === tab.id ? 'is-active' : ''
              }`}
              onClick={() => setSelectedStatusTab(tab.id)}
            >
              <strong>{tab.count}</strong>
              <span>{tab.label}</span>
            </button>
          ))}
        </section>

        <section className="chef-orders-grid">
          {loading ? (
            <div className="chef-orders-empty">Loading kitchen orders...</div>
          ) : visibleOrders.length ? (
            visibleOrders.map((order) => {
              const displayItems = getDisplayItems(order);
              const mealName = order.metadata?.meal_name || 'Custom Thrive Meal';
              const currency = order.metadata?.plate_items?.[0]?.currency || 'LKR';

              return (
                <article key={order.id} className="chef-order-card">
                  <div className="chef-order-top">
                    <div>
                      <span className="chef-order-label">Order ID</span>
                      <h2>{order.order_number || order.id}</h2>
                    </div>
                    <span className={`chef-status-pill status-${order.status}`}>{formatKitchenStatusLabel(order.status)}</span>
                  </div>

                  <div className="chef-order-meta">
                    <div>
                      <span>Kitchen</span>
                      <strong>{order.location_name || 'Unknown kitchen'}</strong>
                    </div>
                    <div>
                      <span>Meal</span>
                      <strong>{mealName}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{formatPrice(order.total_price, currency)}</strong>
                    </div>
                    <div>
                      <span>Created</span>
                      <strong>{new Date(order.order_date || order.created_at).toLocaleTimeString()}</strong>
                    </div>
                  </div>

                  <div className="chef-order-items">
                    {displayItems.map((item) => (
                      <div key={item.id} className="chef-order-item">
                        <strong>{item.name}</strong>
                        <div className="chef-order-tags">
                          {item.tags.length ? (
                            item.tags.map((tag) => <span key={`${item.id}-${tag}`}>{tag}</span>)
                          ) : (
                            <span>Chef note pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="chef-order-footer">
                    <span className="chef-order-source">
                      {order.metadata?.source === 'thrive-food-os'
                        ? 'Placed from Thrive-Food-OS'
                        : 'Restaurant dashboard order'}
                    </span>

                    {order.status === 'received' ? (
                      <button
                        className="chef-accept-button"
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={updatingOrderId === order.id}
                      >
                        {updatingOrderId === order.id ? 'Accepting...' : 'Accept Order'}
                      </button>
                    ) : order.status === 'accepted' ? (
                      <div className="chef-order-actions">
                        <span className="chef-inline-status status-accepted">Accepted</span>
                        <button
                          className="chef-progress-button"
                          onClick={() => handleStartPreparing(order.id)}
                          disabled={updatingOrderId === order.id}
                        >
                          {updatingOrderId === order.id ? 'Updating...' : 'Start Preparing'}
                        </button>
                      </div>
                    ) : order.status === 'preparing' ? (
                      <div className="chef-order-actions">
                        <span className="chef-inline-status status-preparing">In Progress</span>
                        <button
                          className="chef-complete-button"
                          onClick={() => handleCompleteOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                        >
                          {updatingOrderId === order.id ? 'Updating...' : 'Complete Order'}
                        </button>
                      </div>
                    ) : (
                      <button className="chef-accepted-button" disabled>
                        {order.status === 'ready' ? 'Completed' : 'Kitchen Updated'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="chef-orders-empty">{getEmptyStateMessage()}</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChefOrdersPage;
