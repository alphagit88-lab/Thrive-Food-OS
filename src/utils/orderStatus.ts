import type { ChefOrderStatus } from '../types/types';

export const ACTIVE_ORDER_STATUSES: ChefOrderStatus[] = ['received', 'accepted', 'preparing', 'ready'];

export const formatKitchenStatusLabel = (status: ChefOrderStatus) => {
  switch (status) {
    case 'received':
      return 'New Order';
    case 'accepted':
      return 'Accepted';
    case 'preparing':
      return 'In Progress';
    case 'ready':
      return 'Completed';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const formatCustomerOrderStatusLabel = (status: ChefOrderStatus) => {
  switch (status) {
    case 'received':
      return 'Pending Chef';
    case 'accepted':
      return 'Accepted';
    case 'preparing':
      return 'In Progress';
    case 'ready':
      return 'Ready';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const getCustomerOrderStatusCopy = (status: ChefOrderStatus) => {
  switch (status) {
    case 'received':
      return {
        title: 'Order placed successfully',
        description: 'Waiting for the kitchen team to accept your live order.',
      };
    case 'accepted':
      return {
        title: 'Order accepted by kitchen',
        description: 'The barista team has accepted your order and will start preparing it shortly.',
      };
    case 'preparing':
      return {
        title: 'Order in progress',
        description: 'Your meal is currently being prepared in the kitchen.',
      };
    case 'ready':
      return {
        title: 'Order ready',
        description: 'Your meal is ready for pickup or final handoff.',
      };
    case 'delivered':
      return {
        title: 'Order delivered',
        description: 'Your order has been completed successfully.',
      };
    case 'cancelled':
      return {
        title: 'Order cancelled',
        description: 'This order was cancelled. Please contact support if you need help.',
      };
    default:
      return {
        title: 'Order update received',
        description: 'Your order status has changed.',
      };
  }
};
