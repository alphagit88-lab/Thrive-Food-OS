import API from './apiClient';
import type {
  ChefOrder,
  ChefOrderStatus,
  CustomerOrderDraft,
  FoodOsCreateOrderPayload,
  FoodOsOrderMetadata,
} from '../types/types';

interface SingleOrderApiResponse {
  success: boolean;
  data?: ChefOrder;
  error?: string;
  message?: string;
}

interface ListOrdersApiResponse {
  success: boolean;
  data?: ChefOrder[];
  error?: string;
  message?: string;
}

export const FOOD_OS_ORDER_PREFIX = 'THRIVE_FOOD_OS::';

const parseFoodOsOrderMetadata = (notes?: string | null): FoodOsOrderMetadata | null => {
  if (!notes || !notes.startsWith(FOOD_OS_ORDER_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(notes.slice(FOOD_OS_ORDER_PREFIX.length)) as FoodOsOrderMetadata;
  } catch {
    return null;
  }
};

export const normalizeChefOrder = (order: ChefOrder): ChefOrder => ({
  ...order,
  metadata: order.metadata || parseFoodOsOrderMetadata(order.notes),
});

const buildAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const buildFoodOsOrderNote = (draft: CustomerOrderDraft) =>
  `${FOOD_OS_ORDER_PREFIX}${JSON.stringify({
    source: 'thrive-food-os',
    meal_name: draft.meal_name,
    delivery_type: draft.delivery_type,
    location_name: draft.location_name,
    total_price: draft.total_price,
    created_at: draft.created_at,
    plate_items: draft.plate_items,
  })}`;

export const createFoodOsOrder = async (payload: FoodOsCreateOrderPayload) => {
  const response = await API.post<SingleOrderApiResponse>('/orders', payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || response.data.message || 'Failed to place order.');
  }

  return normalizeChefOrder(response.data.data);
};

export const getChefOrders = async (token: string, locationId?: string) => {
  const response = await API.get<ListOrdersApiResponse>('/orders', {
    headers: buildAuthHeaders(token),
    params: locationId && locationId !== 'all' ? { location_id: locationId } : undefined,
  });

  if (!response.data.success) {
    throw new Error(response.data.error || response.data.message || 'Failed to load chef orders.');
  }

  return (response.data.data || []).map(normalizeChefOrder);
};

export const updateChefOrderStatus = async (
  orderId: string,
  status: ChefOrderStatus,
  token: string,
) => {
  const response = await API.patch<SingleOrderApiResponse>(
    `/orders/${orderId}/status`,
    { status },
    { headers: buildAuthHeaders(token) },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || response.data.message || 'Failed to update order status.');
  }

  return normalizeChefOrder(response.data.data);
};
