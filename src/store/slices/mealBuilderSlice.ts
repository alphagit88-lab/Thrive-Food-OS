import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ChefOrder,
  CustomerOrderDraft,
  DeliveryType,
  PlateItem,
  ScheduledDeliveryWindowId,
} from '../../types/types';
import { loadMealBuilderState } from '../mealBuilderStorage';

export interface MealBuilderState {
  selectedLocationId: string;
  plateItems: PlateItem[];
  selectedDelivery: DeliveryType;
  selectedScheduleWindowId: ScheduledDeliveryWindowId | null;
  mealName: string;
  checkoutDraft: CustomerOrderDraft | null;
  placedOrder: ChefOrder | null;
}

const persistedState = loadMealBuilderState();

const DEFAULT_MEAL_BUILDER_STATE: MealBuilderState = {
  selectedLocationId: '',
  plateItems: [],
  selectedDelivery: 'now',
  selectedScheduleWindowId: null,
  mealName: '',
  checkoutDraft: null,
  placedOrder: null,
};

const initialState: MealBuilderState = {
  ...DEFAULT_MEAL_BUILDER_STATE,
  ...(persistedState || {}),
};

const mealBuilderSlice = createSlice({
  name: 'mealBuilder',
  initialState,
  reducers: {
    resetCurrentBuild: (state) => {
      state.plateItems = [];
      state.mealName = '';
      state.selectedDelivery = 'now';
      state.selectedScheduleWindowId = null;
      state.checkoutDraft = null;
    },
    selectLocation: (state, action: PayloadAction<string>) => {
      const nextLocationId = action.payload;

      if (state.selectedLocationId !== nextLocationId) {
        state.selectedLocationId = nextLocationId;
        state.plateItems = [];
        state.mealName = '';
        state.selectedDelivery = 'now';
        state.selectedScheduleWindowId = null;
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
    setSelectedDelivery: (state, action: PayloadAction<DeliveryType>) => {
      state.selectedDelivery = action.payload;
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
    setSelectedScheduleWindow: (state, action: PayloadAction<ScheduledDeliveryWindowId>) => {
      state.selectedScheduleWindowId = action.payload;
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
    setCheckoutDraft: (state, action: PayloadAction<CustomerOrderDraft>) => {
      state.checkoutDraft = action.payload;
      state.placedOrder = null;
    },
    syncCheckoutLocation: (state, action: PayloadAction<string>) => {
      state.selectedLocationId = action.payload;
    },
    completeOrder: (state, action: PayloadAction<ChefOrder>) => {
      state.placedOrder = action.payload;
      state.checkoutDraft = null;
      state.plateItems = [];
      state.mealName = '';
      state.selectedDelivery = 'now';
      state.selectedScheduleWindowId = null;
    },
    syncPlacedOrder: (state, action: PayloadAction<ChefOrder>) => {
      state.placedOrder = action.payload;
    },
    startNewMeal: (state) => {
      state.plateItems = [];
      state.mealName = '';
      state.selectedDelivery = 'now';
      state.selectedScheduleWindowId = null;
      state.checkoutDraft = null;
      state.placedOrder = null;
    },
  },
});

export const {
  resetCurrentBuild,
  selectLocation,
  addPlateItem,
  removePlateItem,
  setMealName,
  setSelectedDelivery,
  setSelectedScheduleWindow,
  setCheckoutDraft,
  syncCheckoutLocation,
  completeOrder,
  syncPlacedOrder,
  startNewMeal,
} = mealBuilderSlice.actions;

export default mealBuilderSlice.reducer;
