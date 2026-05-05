import type { ChefOrder, ChefSession, CustomerOrderDraft } from '../types/types';

export const ORDER_DRAFT_STORAGE_KEY = 'thrive-food-os:order-draft';
export const CHEF_SESSION_STORAGE_KEY = 'thrive-food-os:chef-session';
export const ORDER_STATUS_SYNC_STORAGE_KEY = 'thrive-food-os:order-status-sync';
export const ORDER_STATUS_SYNC_EVENT = 'thrive-food-os:order-status-sync-event';

const isBrowser = typeof window !== 'undefined';

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const saveOrderDraft = (draft: CustomerOrderDraft) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const readOrderDraft = () => {
  if (!isBrowser) {
    return null;
  }

  return safeParse<CustomerOrderDraft>(window.localStorage.getItem(ORDER_DRAFT_STORAGE_KEY));
};

export const clearOrderDraft = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
};

export const saveChefSession = (session: ChefSession) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(CHEF_SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const readChefSession = () => {
  if (!isBrowser) {
    return null;
  }

  return safeParse<ChefSession>(window.localStorage.getItem(CHEF_SESSION_STORAGE_KEY));
};

export const clearChefSession = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(CHEF_SESSION_STORAGE_KEY);
};

type SyncedChefOrdersMap = Record<string, ChefOrder>;

export const saveSyncedChefOrder = (order: ChefOrder) => {
  if (!isBrowser) {
    return;
  }

  const currentOrders =
    safeParse<SyncedChefOrdersMap>(window.localStorage.getItem(ORDER_STATUS_SYNC_STORAGE_KEY)) || {};

  currentOrders[order.id] = order;

  window.localStorage.setItem(ORDER_STATUS_SYNC_STORAGE_KEY, JSON.stringify(currentOrders));
  window.dispatchEvent(new CustomEvent(ORDER_STATUS_SYNC_EVENT, { detail: order }));
};

export const readSyncedChefOrder = (orderId: string) => {
  if (!isBrowser) {
    return null;
  }

  const currentOrders = safeParse<SyncedChefOrdersMap>(
    window.localStorage.getItem(ORDER_STATUS_SYNC_STORAGE_KEY),
  );

  return currentOrders?.[orderId] || null;
};
