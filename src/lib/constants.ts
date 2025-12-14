// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_VERSION = '/api';

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  DASHBOARD: 30000,   // 30 seconds
  BOTS: 30000,        // 30 seconds
  ORDERS: 30000,      // 30 seconds
  ORDER_DETAIL: 30000, // 30 seconds
  ANALYTICS: 60000,   // 60 seconds
};

// Auth
export const AUTH_STORAGE_KEY = 'fortloot_api_key';

// Order status colors
export const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-500',
  WAITING_FRIENDSHIP: 'bg-blue-500',
  WAITING_PERIOD: 'bg-blue-400',
  QUEUED: 'bg-indigo-500',
  PROCESSING: 'bg-purple-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
  CANCELLED: 'bg-gray-500',
  REFUNDED: 'bg-orange-500',
} as const;

// Bot status colors
export const BOT_STATUS_COLORS = {
  ONLINE: 'bg-green-500',
  OFFLINE: 'bg-gray-500',
  BUSY: 'bg-yellow-500',
  ERROR: 'bg-red-500',
  MAINTENANCE: 'bg-blue-500',
} as const;
