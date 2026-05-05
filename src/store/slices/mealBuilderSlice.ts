import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChefOrder, CustomerOrderDraft, PlateItem } from '../../types/types';
import { loadMealBuilderState } from '../mealBuilderStorage';

export interface MealBuilderState {
  selectedLocationId: string;
  plateItems: PlateItem[];
  selectedDelivery: 'now' | 'schedule';
  mealName: string;
  checkoutDraft: CustomerOrderDraft | null;
  placedOrder: ChefOrder | null;
}

const persistedState = loadMealBuilderState();

const initialState: MealBuilderState = persistedState || {
  selectedLocationId: '',
  plateItems: [],
  selectedDelivery: 'now',
  mealName: '',
  checkoutDraft: null,
  placedOrder: null,
};

const mealBuilderSlice = createSlice({
  name: 'mealBuilder',
  initialState,
  reducers: {
    selectLocation: (state, action: PayloadAction<string>) => {
      const nextLocationId = action.payload;

      if (state.selectedLocationId !== nextLocationId) {
        state.selectedLocationId = nextLocationId;
        state.plateItems = [];
        state.mealName = '';
        state.selectedDelivery = 'now';
        state.checkoutDraft = null;
        state.placedOrder = null;
        return;
      }

      state.selectedLocationId = nextLocationId;
    },
    addPlateItem: (state, action: PayloadAction<PlateItem>) => {
      state.plateItems.push(action.payload);
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
    removePlateItem: (state, action: PayloadAction<string>) => {
      state.plateItems = state.plateItems.filter((item) => item.id !== action.payload);
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
    setMealName: (state, action: PayloadAction<string>) => {
      state.mealName = action.payload;
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
    setSelectedDelivery: (state, action: PayloadAction<'now' | 'schedule'>) => {
      state.selectedDelivery = action.payload;
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
    setCheckoutDraft: (state, action: PayloadAction<CustomerOrderDraft>) => {
      state.checkoutDraft = action.payload;
      state.placedOrder = null;
    },
    completeOrder: (state, action: PayloadAction<ChefOrder>) => {
      state.placedOrder = action.payload;
      state.checkoutDraft = null;
      state.plateItems = [];
      state.mealName = '';
      state.selectedDelivery = 'now';
    },
    syncPlacedOrder: (state, action: PayloadAction<ChefOrder>) => {
      state.placedOrder = action.payload;
    },
    startNewMeal: (state) => {
      state.plateItems = [];
      state.mealName = '';
      state.selectedDelivery = 'now';
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
  },
});

export const {
  selectLocation,
  addPlateItem,
  removePlateItem,
  setMealName,
  setSelectedDelivery,
  setCheckoutDraft,
  completeOrder,
  syncPlacedOrder,
  startNewMeal,
} = mealBuilderSlice.actions;

export default mealBuilderSlice.reducer;
