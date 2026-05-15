import type { ScheduledDeliveryWindowId } from '../types/types';

export interface ScheduledDeliveryWindowOption {
  id: ScheduledDeliveryWindowId;
  label: string;
  timeRange: string;
}

export const SCHEDULED_DELIVERY_WINDOWS: ScheduledDeliveryWindowOption[] = [
  {
    id: 'morning-prime',
    label: 'Morning Prime',
    timeRange: '07:00 AM - 08:30 AM',
  },
  {
    id: 'peak-performance',
    label: 'Peak Performance',
    timeRange: '12:00 PM - 01:30 PM',
  },
  {
    id: 'recovery-window',
    label: 'Recovery Window',
    timeRange: '06:30 PM - 08:00 PM',
  },
];

export const getScheduledDeliveryWindow = (id?: ScheduledDeliveryWindowId | null) =>
  SCHEDULED_DELIVERY_WINDOWS.find((scheduledWindow) => scheduledWindow.id === id) || null;

export const formatScheduledDeliveryWindow = (id?: ScheduledDeliveryWindowId | null) => {
  const scheduledWindow = getScheduledDeliveryWindow(id);

  return scheduledWindow ? `${scheduledWindow.label} | ${scheduledWindow.timeRange}` : 'Scheduled delivery';
};
