import { configureStore } from '@reduxjs/toolkit';
import mealBuilderReducer from './slices/mealBuilderSlice';
import { saveMealBuilderState } from './mealBuilderStorage';

export const store = configureStore({
  reducer: {
    mealBuilder: mealBuilderReducer,
  },
});

store.subscribe(() => {
  const state = store.getState();

  saveMealBuilderState({
    selectedLocationId: state.mealBuilder.selectedLocationId,
    plateItems: state.mealBuilder.plateItems,
    selectedDelivery: state.mealBuilder.selectedDelivery,
    mealName: state.mealBuilder.mealName,
    checkoutDraft: state.mealBuilder.checkoutDraft,
    placedOrder: state.mealBuilder.placedOrder,
  });
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
