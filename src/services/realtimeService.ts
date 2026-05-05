import Pusher from 'pusher-js';
import { API_BASE_URL } from './apiClient';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY?.trim();
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER?.trim();

export const KITCHEN_ORDERS_CHANNEL = 'private-kitchen-orders';
export const getOrderChannelName = (orderId: string) => `private-order-${orderId}`;

export const isRealtimeConfigured = () => Boolean(PUSHER_KEY && PUSHER_CLUSTER);

const createBaseClient = (channelAuthorization: {
  endpoint: string;
  headers?: Record<string, string>;
  paramsProvider?: () => Record<string, string>;
}) => {
  if (!PUSHER_KEY || !PUSHER_CLUSTER) {
    return null;
  }

  return new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    forceTLS: true,
    channelAuthorization: {
      transport: 'ajax',
      ...channelAuthorization,
    },
  });
};

export const createChefRealtimeClient = (token: string) =>
  createBaseClient({
    endpoint: `${API_BASE_URL}/realtime/auth/kitchen`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const createOrderRealtimeClient = (orderId: string, watchToken: string) =>
  createBaseClient({
    endpoint: `${API_BASE_URL}/realtime/auth/order`,
    paramsProvider: () => ({
      order_id: orderId,
      watch_token: watchToken,
    }),
  });
