import type { ChefOrder, ChefSession, CustomerOrderDraft, CustomerSession } from '../types/types';

export const ORDER_DRAFT_STORAGE_KEY = 'thrive-food-os:order-draft';
export const CHEF_SESSION_STORAGE_KEY = 'thrive-food-os:chef-session';
export const CUSTOMER_SESSION_STORAGE_KEY = 'thrive-food-os:customer-session';
export const CUSTOMER_SESSION_EVENT = 'thrive-food-os:customer-session-event';
export const ORDER_STATUS_SYNC_STORAGE_KEY = 'thrive-food-os:order-status-sync';
export const ORDER_STATUS_SYNC_EVENT = 'thrive-food-os:order-status-sync-event';
const LEGACY_CUSTOMER_TOKEN_STORAGE_KEY = 'token';
const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const normalizeCustomerSession = (session: CustomerSession): CustomerSession => {
  const normalizedToken = session.token?.trim();
  const normalizedUser = session.user ? { ...session.user } : undefined;

  if (!normalizedUser?.id && normalizedToken && UUID_LIKE_PATTERN.test(normalizedToken)) {
    if (normalizedUser) {
      normalizedUser.id = normalizedToken;
    } else {
      return {
        ...session,
        token: normalizedToken,
        user: {
          id: normalizedToken,
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        },
      };
    }
  }

  return {
    ...session,
    token: normalizedToken,
    user: normalizedUser,
  };
};

export const getCustomerSessionIdentity = (session?: CustomerSession | null) =>
  session ? normalizeCustomerSession(session).user?.id || '' : '';

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

export const saveCustomerSession = (session: CustomerSession) => {
  if (!isBrowser) {
    return;
  }

  const normalizedSession = normalizeCustomerSession(session);

  window.localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(normalizedSession));

  if (normalizedSession.token) {
    window.localStorage.setItem(LEGACY_CUSTOMER_TOKEN_STORAGE_KEY, normalizedSession.token);
  } else {
    window.localStorage.removeItem(LEGACY_CUSTOMER_TOKEN_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_EVENT, { detail: normalizedSession }));
};

export const readCustomerSession = () => {
  if (!isBrowser) {
    return null;
  }

  const savedSession = safeParse<CustomerSession>(window.localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY));
  if (savedSession) {
    return normalizeCustomerSession(savedSession);
  }

  const legacyToken = window.localStorage.getItem(LEGACY_CUSTOMER_TOKEN_STORAGE_KEY);
  if (!legacyToken) {
    return null;
  }

  return normalizeCustomerSession({
    token: legacyToken,
    authenticated_at: new Date(0).toISOString(),
  } satisfies CustomerSession);
};

export const clearCustomerSession = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_CUSTOMER_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_EVENT, { detail: null }));
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
