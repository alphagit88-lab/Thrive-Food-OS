import type { ChefOrder, CustomerOrderDraft, PlateItem } from '../types/types';

const STORAGE_KEY = 'thrive-food-os:meal-builder-state';

export interface MealBuilderPersistedState {
  selectedLocationId: string;
  plateItems: PlateItem[];
  selectedDelivery: 'now' | 'schedule';
  mealName: string;
  checkoutDraft: CustomerOrderDraft | null;
  placedOrder: ChefOrder | null;
}

export const loadMealBuilderState = (): MealBuilderPersistedState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY);
  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(rawState) as MealBuilderPersistedState;
  } catch {
    return null;
  }
};

export const saveMealBuilderState = (state: MealBuilderPersistedState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
