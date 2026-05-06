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
import { ACTIVE_ORDER_STATUSES } from '../utils/orderStatus';
import type { ChefOrder, ChefOrderStatus, PlateItem, ThriveLocation } from '../types/types';
import './ChefOrdersPage.css';

interface KitchenBoardItem {
  id: string;
  name: string;
  detail: string;
}

interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
  kcal: number;
}

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

const titleCase = (value?: string | null) =>
  (value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase());

const formatOrderNumber = (order: ChefOrder) => {
  const orderLabel = order.order_number || order.id;
  return orderLabel.startsWith('#') ? orderLabel : `#${orderLabel}`;
};

const formatBoardTime = (value?: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value || Date.now()));

const formatElapsedTime = (value: string, currentTimeMs: number) => {
  const elapsedSeconds = Math.max(0, Math.floor((currentTimeMs - new Date(value).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds,
    ).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getKitchenBoardItems = (order: ChefOrder): KitchenBoardItem[] => {
  if (order.metadata?.plate_items?.length) {
    return order.metadata.plate_items.map((item: PlateItem) => ({
      id: item.id,
      name: item.name,
      detail: [item.cook_style, item.quantity_label].filter(Boolean).join('  '),
    }));
  }

  return (order.items || []).map((item) => {
    const noteSegments = item.notes
      ? item.notes
          .split('|')
          .map((segment) => segment.trim())
          .filter(Boolean)
      : [];

    return {
      id: item.id,
      name: item.menu_item_name || noteSegments[0] || 'Custom item',
      detail: noteSegments.slice(1).join('  '),
    };
  });
};

const getMacroTotals = (order: ChefOrder): MacroTotals | null => {
  if (!order.metadata?.plate_items?.length) {
    return null;
  }

  return order.metadata.plate_items.reduce<MacroTotals>(
    (totals, item) => {
      totals.protein += item.macros.protein || 0;
      totals.carbs += item.macros.carbs || 0;
      totals.fats += item.macros.fats || 0;
      totals.kcal += item.macros.kcal || 0;
      return totals;
    },
    { protein: 0, carbs: 0, fats: 0, kcal: 0 },
  );
};

const formatMacroNumber = (value: number) => {
  const roundedValue = Math.round(value * 10) / 10;
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1);
};

const formatMacroSummary = (order: ChefOrder) => {
  const totals = getMacroTotals(order);

  if (!totals) {
    return null;
  }

  return `P: ${formatMacroNumber(totals.protein)}g C: ${formatMacroNumber(
    totals.carbs,
  )}g F: ${formatMacroNumber(totals.fats)}g Kcal: ${formatMacroNumber(totals.kcal)}`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const printKitchenTicket = (
  order: ChefOrder,
  locationLookup: Map<string, ThriveLocation>,
  currentTimeMs: number,
) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const items = getKitchenBoardItems(order);
  const ticketLocation =
    titleCase(locationLookup.get(order.location_id)?.location_type) || order.location_name || 'Kitchen';
  const ticketMarkup = items
    .map(
      (item) => `
        <div class="ticket-row">
          <span>${escapeHtml(item.name)}</span>
          <span>${escapeHtml(item.detail || '-')}</span>
        </div>`,
    )
    .join('');
  const macroSummary = formatMacroSummary(order);
  const printWindow = window.open('', '_blank', 'width=420,height=640');

  if (!printWindow) {
    return false;
  }

  const createdAt = order.order_date || order.created_at;

  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(formatOrderNumber(order))}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 20px;
        font-family: Arial, sans-serif;
        color: #111111;
      }
      .ticket {
        border: 2px solid #111111;
        padding: 18px;
      }
      .ticket-header,
      .ticket-row,
      .ticket-meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .ticket-header {
        font-weight: 700;
        margin-bottom: 12px;
      }
      .ticket-title {
        margin: 0 0 8px;
        font-size: 22px;
        color: #1f8f56;
      }
      .ticket-customer {
        margin: 0 0 12px;
        color: #4b5563;
      }
      .ticket-badge {
        display: inline-block;
        padding: 4px 12px;
        margin-bottom: 14px;
        background: #bff4cb;
      }
      .ticket-items {
        display: grid;
        gap: 8px;
        margin-bottom: 14px;
      }
      .ticket-row span:last-child {
        text-align: right;
      }
      .ticket-meta {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid #111111;
        font-size: 13px;
      }
      .ticket-macros {
        margin-top: 12px;
        font-size: 13px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="ticket-header">
        <span>${escapeHtml(formatOrderNumber(order))}</span>
        <span>${escapeHtml(formatBoardTime(createdAt))} ${escapeHtml(
          formatElapsedTime(createdAt, currentTimeMs),
        )}</span>
      </div>
      <p class="ticket-title">${escapeHtml(order.metadata?.meal_name || 'Custom Thrive Meal')}</p>
      <p class="ticket-customer">${escapeHtml(order.customer_name || 'Guest')}</p>
      <span class="ticket-badge">${escapeHtml(ticketLocation)}</span>
      <div class="ticket-items">${ticketMarkup}</div>
      ${macroSummary ? `<div class="ticket-macros">${escapeHtml(macroSummary)}</div>` : ''}
      <div class="ticket-meta">
        <span>${escapeHtml(order.location_name || 'Unknown kitchen')}</span>
        <span>${escapeHtml(new Date(createdAt).toLocaleDateString())}</span>
      </div>
    </div>
    <script>
      window.onload = function () {
        window.print();
        window.close();
      };
    </script>
  </body>
</html>`);
  printWindow.document.close();
  return true;
};

const ChefOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ChefOrder[]>([]);
  const [chefToken, setChefToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [locations, setLocations] = useState<ThriveLocation[]>([]);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('all');
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());

  useEffect(() => {
    const rootElement = document.getElementById('root');
    document.body.classList.add('chef-orders-route');
    rootElement?.classList.add('chef-orders-root');

    return () => {
      document.body.classList.remove('chef-orders-route');
      rootElement?.classList.remove('chef-orders-root');
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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
    setSelectedLocationFilter(session.user.location_id || 'all');
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
    if (!chefToken || !isRealtimeConfigured()) {
      return;
    }

    const pusher = createChefRealtimeClient(chefToken);

    if (!pusher) {
      return;
    }

    const channel = pusher.subscribe(KITCHEN_ORDERS_CHANNEL);

    const handleOrderCreated = (incomingOrder: ChefOrder) => {
      const nextOrder = syncChefOrder(incomingOrder);
      setOrders((currentOrders) => upsertOrder(currentOrders, nextOrder));
    };

    const handleOrderStatusUpdated = (incomingOrder: ChefOrder) => {
      const nextOrder = syncChefOrder(incomingOrder);
      setOrders((currentOrders) => upsertOrder(currentOrders, nextOrder));
    };

    channel.bind('order:created', handleOrderCreated);
    channel.bind('order:status-updated', handleOrderStatusUpdated);
    channel.bind('pusher:subscription_error', () => {
      setError('Unable to subscribe to live chef updates right now.');
    });

    return () => {
      channel.unbind('order:created', handleOrderCreated);
      channel.unbind('order:status-updated', handleOrderStatusUpdated);
      channel.unbind('pusher:subscription_error');
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

  const locationLookup = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );

  const newOrders = useMemo(
    () => activeOrders.filter((order) => order.status === 'received'),
    [activeOrders],
  );
  const inPreparationOrders = useMemo(
    () => activeOrders.filter((order) => order.status === 'accepted' || order.status === 'preparing'),
    [activeOrders],
  );
  const readyOrders = useMemo(
    () => activeOrders.filter((order) => order.status === 'ready'),
    [activeOrders],
  );

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
        updateError instanceof Error ? updateError.message : 'Unable to update the order status right now.';
      setError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/chef/login');
  };

  const handlePrint = (order: ChefOrder) => {
    const didPrint = printKitchenTicket(order, locationLookup, currentTimeMs);

    if (!didPrint) {
      setError('Unable to open the print dialog. Please allow pop-ups for this page.');
    }
  };

  const columns = [
    {
      id: 'new',
      title: 'New Orders',
      count: newOrders.length,
      orders: newOrders,
      empty: 'No new orders',
    },
    {
      id: 'prep',
      title: 'In Preparation',
      count: inPreparationOrders.length,
      orders: inPreparationOrders,
      empty: 'No orders in preparation',
    },
    {
      id: 'ready',
      title: 'Ready Collected',
      count: readyOrders.length,
      orders: readyOrders,
      empty: 'No ready orders',
    },
  ] as const;

  return (
    <div className="chef-orders-page">
      <header className="chef-board-header">
        <button type="button" className="chef-board-back" onClick={handleBack}>
          Back
        </button>

        <select
          className="chef-board-location-filter"
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
      </header>

      {error ? <div className="chef-board-alert">{error}</div> : null}

      <main className="chef-board-grid">
        {columns.map((column) => (
          <section key={column.id} className="chef-board-column">
            <div className="chef-board-column-header">
              <h2>{column.title}</h2>
              <span>{column.count}</span>
            </div>

            <div className="chef-board-column-body">
              {loading ? (
                <div className="chef-board-empty">Loading kitchen orders...</div>
              ) : column.orders.length ? (
                column.orders.map((order) => {
                  const items = getKitchenBoardItems(order);
                  const macroSummary = formatMacroSummary(order);
                  const kitchenBadge =
                    titleCase(locationLookup.get(order.location_id)?.location_type) ||
                    titleCase(order.location_name) ||
                    'Kitchen';
                  const createdAt = order.order_date || order.created_at;
                  const mealName = order.metadata?.meal_name || 'Custom Thrive Meal';
                  const isUpdating = updatingOrderId === order.id;
                  const showPrint = order.status !== 'ready';

                  return (
                    <article key={order.id} className="chef-ticket-card">
                      <div className="chef-ticket-top">
                        <span>{formatOrderNumber(order)}</span>
                        <span>
                          {formatBoardTime(createdAt)} {formatElapsedTime(createdAt, currentTimeMs)}
                        </span>
                      </div>

                      <p className="chef-ticket-title">"{mealName}"</p>
                      <p className="chef-ticket-customer">{order.customer_name || 'Guest Customer'}</p>
                      <span className="chef-ticket-badge">{kitchenBadge}</span>

                      <div className="chef-ticket-items">
                        {items.length ? (
                          items.map((item) => (
                            <div key={item.id} className="chef-ticket-item-row">
                              <span>{item.name}</span>
                              <span>{item.detail || '-'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="chef-ticket-item-row chef-ticket-item-row-empty">
                            <span>No item details available</span>
                            <span>-</span>
                          </div>
                        )}
                      </div>

                      {macroSummary ? <p className="chef-ticket-macros">{macroSummary}</p> : null}

                      <div
                        className={`chef-ticket-actions ${showPrint ? 'has-secondary-action' : 'is-single-action'}`}
                      >
                        {order.status === 'received' ? (
                          <button
                            type="button"
                            className="chef-ticket-action-button"
                            onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Starting...' : 'Start Prep'}
                          </button>
                        ) : order.status === 'accepted' || order.status === 'preparing' ? (
                          <button
                            type="button"
                            className="chef-ticket-action-button"
                            onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Updating...' : 'Mark Ready'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="chef-ticket-action-button"
                            onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Updating...' : 'Collected'}
                          </button>
                        )}

                        {showPrint ? (
                          <button
                            type="button"
                            className="chef-ticket-print-button"
                            onClick={() => handlePrint(order)}
                            disabled={isUpdating}
                          >
                            Print
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="chef-board-empty">{column.empty}</div>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default ChefOrdersPage;
