import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_VERSION, AUTH_STORAGE_KEY } from './constants';
import type { ApiResponse, Bot, Order, Analytics, BotAvailability, QueueStats, BotFriends, BotActivities, CatalogItem, CreateCatalogItemRequest, UpdateCatalogItemRequest, FlashSaleRequest, SyncCatalogResult } from '@/types/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes - catalog sync needs more time
});

// Request interceptor - Add API key to headers
apiClient.interceptors.request.use(
  (config) => {
    // Get API key from localStorage
    const apiKey = localStorage.getItem(AUTH_STORAGE_KEY);
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - Clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: any): T => {
  if (response.data.success) {
    return response.data.data as T;
  }
  throw new Error(response.data.error || 'Unknown error');
};

// ============================================================================
// API Functions
// ============================================================================

// ----- Authentication -----
export const authApi = {
  testConnection: async (apiKey: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_VERSION}/health`, {
        headers: { 'X-API-Key': apiKey },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

// ----- Bots -----
export const botsApi = {
  getAll: async (): Promise<Bot[]> => {
    const response = await apiClient.get('/bots');
    const data = handleResponse<{ bots: Bot[]; stats: any }>(response);
    return data.bots;
  },

  getOne: async (id: string): Promise<Bot> => {
    const response = await apiClient.get(`/bots/${id}`);
    return handleResponse<Bot>(response);
  },

  getAvailability: async (): Promise<BotAvailability> => {
    const response = await apiClient.get('/bots/availability');
    return handleResponse<BotAvailability>(response);
  },

  start: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/bots/${id}/login`);
    return handleResponse<void>(response);
  },

  stop: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/bots/${id}/logout`);
    return handleResponse<void>(response);
  },

  restart: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/bots/${id}/restart`);
    return handleResponse<void>(response);
  },

  create: async (data: {
    name: string;
    displayName: string;
    deviceId: string;
    accountId: string;
    secret: string;
    maxGiftsPerDay?: number;
  }): Promise<Bot> => {
    const response = await apiClient.post('/bots', data);
    return handleResponse<Bot>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/bots/${id}`);
    return handleResponse<void>(response);
  },

  getFriends: async (id: string): Promise<BotFriends> => {
    const response = await apiClient.get(`/bots/${id}/friends`);
    return handleResponse<BotFriends>(response);
  },

  getActivities: async (id: string, limit = 50, offset = 0): Promise<BotActivities> => {
    const response = await apiClient.get(`/bots/${id}/activities?limit=${limit}&offset=${offset}`);
    return handleResponse<BotActivities>(response);
  },

  syncFriends: async (id: string): Promise<{ totalInEpic: number; alreadyInDatabase: number; newFriendsAdded: number }> => {
    const response = await apiClient.post(`/bots/${id}/sync-friends`);
    return handleResponse<{ totalInEpic: number; alreadyInDatabase: number; newFriendsAdded: number }>(response);
  },

  refreshVBucks: async (id: string): Promise<{ botId: string; vbucks: number }> => {
    const response = await apiClient.get(`/bots/${id}/vbucks`);
    return handleResponse<{ botId: string; vbucks: number }>(response);
  },

  addFriend: async (id: string, epicId: string): Promise<{ botId: string; epicId: string; status: string }> => {
    const response = await apiClient.post(`/bots/${id}/add-friend`, { epicId });
    return handleResponse<{ botId: string; epicId: string; status: string }>(response);
  },
};

// ----- Orders -----
export const ordersApi = {
  getAll: async (params?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Order[]> => {
    const response = await apiClient.get('/orders', { params });
    const data = handleResponse<{ orders: Order[]; pagination: any }>(response);
    return data.orders;
  },

  getOne: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return handleResponse<Order>(response);
  },

  cancel: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/orders/${id}/cancel`);
    return handleResponse<void>(response);
  },

  retry: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/orders/${id}/retry`);
    return handleResponse<void>(response);
  },

  approve: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/orders/${id}/approve`);
    return handleResponse<void>(response);
  },

  markVBucksLoaded: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/orders/${id}/vbucks-loaded`);
    return handleResponse<void>(response);
  },

  markBotFixed: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/orders/${id}/bot-fixed`);
    return handleResponse<void>(response);
  },

  continueOrder: async (id: string): Promise<void> => {
    const response = await apiClient.post(`/orders/${id}/continue`);
    return handleResponse<void>(response);
  },

  completeManually: async (id: string, adminNote?: string): Promise<void> => {
    const response = await apiClient.post(`/orders/${id}/complete-manually`, { adminNote });
    return handleResponse<void>(response);
  },
};

// ----- Analytics -----
export const analyticsApi = {
  getMetrics: async (period: 'today' | 'week' | 'month' = 'today'): Promise<Analytics> => {
    const response = await apiClient.get(`/analytics/metrics?period=${period}`);
    return handleResponse<Analytics>(response);
  },

  getQueues: async (): Promise<QueueStats[]> => {
    const response = await apiClient.get('/analytics/queues');
    return handleResponse<QueueStats[]>(response);
  },

  getCheckoutAbandonment: async (params?: { period?: 'today' | 'week' | 'month' | 'all'; limit?: number }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/analytics/checkout-abandonment?${queryParams.toString()}`);
    return handleResponse<any>(response);
  },
};

// ----- Catalog -----
export const catalogApi = {
  getAll: async (params?: {
    type?: string;
    isCustom?: boolean;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: CatalogItem[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
    const response = await apiClient.get('/catalog/items', { params });
    return handleResponse<{ items: CatalogItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>(response);
  },

  getOne: async (id: string): Promise<CatalogItem> => {
    const response = await apiClient.get(`/catalog/items/${id}`);
    return handleResponse<CatalogItem>(response);
  },

  create: async (data: CreateCatalogItemRequest): Promise<CatalogItem> => {
    const response = await apiClient.post('/catalog/items', data);
    return handleResponse<CatalogItem>(response);
  },

  update: async (id: string, data: UpdateCatalogItemRequest): Promise<CatalogItem> => {
    const response = await apiClient.patch(`/catalog/items/${id}`, data);
    return handleResponse<CatalogItem>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/catalog/items/${id}`);
    return handleResponse<void>(response);
  },

  syncFromAPI: async (): Promise<SyncCatalogResult> => {
    const response = await apiClient.post('/catalog/update');
    return handleResponse<SyncCatalogResult>(response);
  },

  createFlashSale: async (id: string, data: FlashSaleRequest): Promise<CatalogItem> => {
    const response = await apiClient.post(`/catalog/items/${id}/flash-sale`, data);
    return handleResponse<CatalogItem>(response);
  },
};

// ----- Pricing -----
export const pricingApi = {
  getConfig: async (): Promise<any> => {
    const response = await apiClient.get('/pricing/config');
    return handleResponse<any>(response);
  },

  updateConfig: async (data: any): Promise<any> => {
    const response = await apiClient.patch('/pricing/config', data);
    return handleResponse<any>(response);
  },
};

// ----- Config -----
export type CheckoutMode = 'whatsapp' | 'wizard' | 'bot-wizard';

export interface ConfigResponse {
  key: string;
  value: string;
  description?: string;
}

export const configApi = {
  getCheckoutMode: async (): Promise<CheckoutMode> => {
    const response = await apiClient.get('/config/checkout-mode');
    // El backend retorna { success: true, value: "wizard" } directamente, no dentro de data
    if (response.data.success) {
      return response.data.value as CheckoutMode;
    }
    throw new Error(response.data.error || 'Failed to get checkout mode');
  },

  setCheckoutMode: async (mode: CheckoutMode): Promise<void> => {
    const response = await apiClient.put('/config/checkout-mode', { value: mode });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to set checkout mode');
    }
  },

  getManualCheckoutEnabled: async (): Promise<boolean> => {
    const response = await apiClient.get('/config/manual-checkout');
    if (response.data.success) {
      return response.data.enabled as boolean;
    }
    throw new Error(response.data.error || 'Failed to get manual checkout enabled');
  },

  setManualCheckoutEnabled: async (enabled: boolean): Promise<void> => {
    const response = await apiClient.put('/config/manual-checkout', { enabled });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to set manual checkout enabled');
    }
  },

  getWhatsAppEnabled: async (): Promise<boolean> => {
    const response = await apiClient.get('/config/whatsapp-enabled');
    if (response.data.success) {
      return response.data.enabled as boolean;
    }
    throw new Error(response.data.error || 'Failed to get WhatsApp enabled');
  },

  setWhatsAppEnabled: async (enabled: boolean): Promise<void> => {
    const response = await apiClient.put('/config/whatsapp-enabled', { enabled });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to set WhatsApp enabled');
    }
  },

  getCryptoPaymentsEnabled: async (): Promise<boolean> => {
    const response = await apiClient.get('/config/crypto-payments-enabled');
    if (response.data.success) {
      return response.data.enabled as boolean;
    }
    throw new Error(response.data.error || 'Failed to get crypto payments enabled');
  },

  setCryptoPaymentsEnabled: async (enabled: boolean): Promise<void> => {
    const response = await apiClient.put('/config/crypto-payments-enabled', { enabled });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to set crypto payments enabled');
    }
  },
};

// ----- Payment Methods -----
export interface PaymentMethod {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  instructions?: string;
  accountInfo?: any;
  metadata?: any;
  configs?: PaymentMethodConfig[];
  createdAt: string;
  updatedAt: string;
}

// ----- Payment Method Config Types -----
export type PaymentMethodConfigType = 'CURRENCY_CONVERSION' | 'FEE' | 'COUNTRY_RESTRICTION' | 'AMOUNT_LIMIT';

export interface PaymentMethodConfig {
  id: string;
  paymentMethodId: string;
  type: PaymentMethodConfigType;
  config: CurrencyConversionConfig | FeeConfig | CountryRestrictionConfig | AmountLimitConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyConversionConfig {
  targetCurrency: string;
  rateProvider: 'binance_p2p' | 'manual' | string;
  bankFilter?: string;
  markup: number;
  cacheTTLMin: number;
}

export interface FeeConfig {
  feeType: 'PERCENTAGE' | 'FIXED' | 'COMPOUND';
  feeValue: number; // Porcentaje si es PERCENTAGE o COMPOUND
  fixedFee?: number; // Monto fijo adicional (usado en COMPOUND y FIXED)
  description?: string; // Descripción que ve el cliente
}

export interface CountryRestrictionConfig {
  countries: string[];
  mode: 'whitelist' | 'blacklist';
}

export interface AmountLimitConfig {
  minAmount?: number;
  maxAmount?: number;
}

// ----- Exchange Rate Types -----
export interface ExchangeRateInfo {
  currentRate: number | null;
  rawRate: number | null;
  source: string | null;
  manualRate: number | null;
  manualSetBy: string | null;
  manualSetAt: string | null;
  fetchedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  isManual: boolean;
}

export interface ExchangeRateCache {
  id: string;
  currency: string;
  rate: number;
  rawRate: number | null;
  source: string;
  manualRate: number | null;
  manualSetBy: string | null;
  manualSetAt: string | null;
  fetchedAt: string;
  expiresAt: string;
  isExpired: boolean;
  isManual: boolean;
}

export const paymentMethodsApi = {
  getAll: async (onlyActive?: boolean): Promise<PaymentMethod[]> => {
    const query = onlyActive ? '?active=true' : '';
    const response = await apiClient.get(`/payment-methods${query}`);
    return handleResponse<PaymentMethod[]>(response);
  },

  getById: async (id: string): Promise<PaymentMethod> => {
    const response = await apiClient.get(`/payment-methods/${id}`);
    return handleResponse<PaymentMethod>(response);
  },

  getBySlug: async (slug: string): Promise<PaymentMethod> => {
    const response = await apiClient.get(`/payment-methods/slug/${slug}`);
    return handleResponse<PaymentMethod>(response);
  },

  create: async (data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    const response = await apiClient.post('/payment-methods', data);
    return handleResponse<PaymentMethod>(response);
  },

  update: async (id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    const response = await apiClient.patch(`/payment-methods/${id}`, data);
    return handleResponse<PaymentMethod>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/payment-methods/${id}`);
    return handleResponse<void>(response);
  },

  toggleActive: async (id: string): Promise<PaymentMethod> => {
    const response = await apiClient.patch(`/payment-methods/${id}/toggle`);
    return handleResponse<PaymentMethod>(response);
  },

  reorder: async (items: { id: string; displayOrder: number }[]): Promise<void> => {
    const response = await apiClient.post('/payment-methods/reorder', { items });
    return handleResponse<void>(response);
  },

  // Get payment method with configs
  getWithConfigs: async (id: string): Promise<PaymentMethod> => {
    const response = await apiClient.get(`/payment-methods/${id}/with-configs`);
    return handleResponse<PaymentMethod>(response);
  },

  // Get configs for a payment method
  getConfigs: async (paymentMethodId: string): Promise<PaymentMethodConfig[]> => {
    const response = await apiClient.get(`/payment-methods/${paymentMethodId}/configs`);
    return handleResponse<PaymentMethodConfig[]>(response);
  },

  // Get specific config by type
  getConfigByType: async (paymentMethodId: string, type: PaymentMethodConfigType): Promise<PaymentMethodConfig> => {
    const response = await apiClient.get(`/payment-methods/${paymentMethodId}/configs/${type}`);
    return handleResponse<PaymentMethodConfig>(response);
  },

  // Create or update config
  upsertConfig: async (
    paymentMethodId: string,
    type: PaymentMethodConfigType,
    config: CurrencyConversionConfig | FeeConfig | CountryRestrictionConfig | AmountLimitConfig,
    enabled: boolean = true
  ): Promise<PaymentMethodConfig> => {
    const response = await apiClient.put(`/payment-methods/${paymentMethodId}/configs/${type}`, {
      config,
      enabled,
    });
    return handleResponse<PaymentMethodConfig>(response);
  },

  // Delete config
  deleteConfig: async (paymentMethodId: string, type: PaymentMethodConfigType): Promise<void> => {
    const response = await apiClient.delete(`/payment-methods/${paymentMethodId}/configs/${type}`);
    return handleResponse<void>(response);
  },

  // Toggle config enabled/disabled
  toggleConfig: async (paymentMethodId: string, type: PaymentMethodConfigType, enabled: boolean): Promise<PaymentMethodConfig> => {
    const response = await apiClient.patch(`/payment-methods/${paymentMethodId}/configs/${type}/toggle`, { enabled });
    return handleResponse<PaymentMethodConfig>(response);
  },
};

// ----- Exchange Rates -----
export const exchangeRatesApi = {
  // Get current rate for a currency (public)
  getRate: async (currency: string): Promise<{ currency: string; rate: number; source: string; validUntil: string; isManual: boolean }> => {
    const response = await apiClient.get(`/exchange-rates/${currency}`);
    return handleResponse<{ currency: string; rate: number; source: string; validUntil: string; isManual: boolean }>(response);
  },

  // List all cached rates (admin)
  listRates: async (): Promise<ExchangeRateCache[]> => {
    const response = await apiClient.get('/exchange-rates');
    return handleResponse<ExchangeRateCache[]>(response);
  },

  // Get detailed rate info (admin)
  getRateInfo: async (currency: string): Promise<ExchangeRateInfo> => {
    const response = await apiClient.get(`/exchange-rates/${currency}/info`);
    return handleResponse<ExchangeRateInfo>(response);
  },

  // Force refresh rate from provider (admin)
  fetchRate: async (currency: string): Promise<{
    currency: string;
    rate: number;
    rawRate: number;
    source: string;
    fetchedAt: string;
    expiresAt: string;
  }> => {
    const response = await apiClient.post(`/exchange-rates/${currency}/fetch`);
    return handleResponse<{
      currency: string;
      rate: number;
      rawRate: number;
      source: string;
      fetchedAt: string;
      expiresAt: string;
    }>(response);
  },

  // Test Binance connection (admin)
  testConnection: async (currency: string, bankFilter?: string): Promise<boolean> => {
    try {
      const response = await apiClient.post(`/exchange-rates/${currency}/test`, { bankFilter });
      return response.data.success;
    } catch {
      return false;
    }
  },

  // Invalidate cache (admin)
  invalidateCache: async (currency: string): Promise<void> => {
    const response = await apiClient.delete(`/exchange-rates/${currency}/cache`);
    return handleResponse<void>(response);
  },

  // Set manual rate (admin)
  setManualRate: async (currency: string, rate: number): Promise<{
    currency: string;
    manualRate: number;
    manualSetBy: string;
    manualSetAt: string;
  }> => {
    const response = await apiClient.put(`/exchange-rates/${currency}/manual`, { rate });
    return handleResponse<{
      currency: string;
      manualRate: number;
      manualSetBy: string;
      manualSetAt: string;
    }>(response);
  },

  // Clear manual rate (admin)
  clearManualRate: async (currency: string): Promise<void> => {
    const response = await apiClient.delete(`/exchange-rates/${currency}/manual`);
    return handleResponse<void>(response);
  },
};

// ----- Customers -----
export interface Customer {
  id: string;
  epicAccountId: string | null;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  contactPreference: 'EMAIL' | 'WHATSAPP';
  tier: 'REGULAR' | 'VIP' | 'PREMIUM';
  isBlacklisted: boolean;
  blacklistReason: string | null;
  totalOrders: number;
  totalSpent: number;
  lifetimeValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomersListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const customersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    tier?: string;
    search?: string;
    isBlacklisted?: boolean;
  }): Promise<CustomersListResponse> => {
    const response = await apiClient.get('/customers', { params });
    return handleResponse<CustomersListResponse>(response);
  },

  changeTier: async (id: string, tier: 'REGULAR' | 'VIP' | 'PREMIUM'): Promise<Customer> => {
    const response = await apiClient.patch(`/customers/${id}/tier`, { tier });
    return handleResponse<Customer>(response);
  },

  addToBlacklist: async (id: string, reason: string): Promise<void> => {
    const response = await apiClient.post(`/customers/${id}/blacklist`, { reason });
    return handleResponse<void>(response);
  },

  removeFromBlacklist: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/customers/${id}/blacklist`);
    return handleResponse<void>(response);
  },

  getStats: async (epicId: string): Promise<any> => {
    const response = await apiClient.get(`/customers/${epicId}/stats`);
    return handleResponse<any>(response);
  },
};

// ----- Announcements -----
export interface Announcement {
  id: string;
  type: 'MAINTENANCE' | 'PROMOTION';
  title: string | null;
  message: string | null;
  imageUrl: string | null;
  productId: string | null;
  product?: {
    id: string;
    name: string;
    image: string;
    type: string;
  } | null;
  linkUrl: string | null;
  linkText: string | null;
  isActive: boolean;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  type: 'MAINTENANCE' | 'PROMOTION';
  title: string;
  message: string;
  imageUrl?: string;
  productId?: string;
  linkUrl?: string;
  linkText?: string;
  isActive?: boolean;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface UpdateAnnouncementRequest {
  type?: 'MAINTENANCE' | 'PROMOTION';
  title?: string;
  message?: string;
  imageUrl?: string | null;
  productId?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  isActive?: boolean;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

export const announcementsApi = {
  getAll: async (params?: { type?: string; isActive?: boolean }): Promise<Announcement[]> => {
    const response = await apiClient.get('/announcements', { params });
    return handleResponse<Announcement[]>(response);
  },

  getOne: async (id: string): Promise<Announcement> => {
    const response = await apiClient.get(`/announcements/${id}`);
    return handleResponse<Announcement>(response);
  },

  create: async (data: CreateAnnouncementRequest): Promise<Announcement> => {
    const response = await apiClient.post('/announcements', data);
    return handleResponse<Announcement>(response);
  },

  update: async (id: string, data: UpdateAnnouncementRequest): Promise<Announcement> => {
    const response = await apiClient.patch(`/announcements/${id}`, data);
    return handleResponse<Announcement>(response);
  },

  toggle: async (id: string): Promise<Announcement> => {
    const response = await apiClient.post(`/announcements/${id}/toggle`);
    return handleResponse<Announcement>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/announcements/${id}`);
    return handleResponse<void>(response);
  },

  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/announcements/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return handleResponse<{ url: string; filename: string }>(response);
  },
};

// ----- Logs -----
export interface BotError {
  timestamp: string;
  level: string;
  botId?: string;
  message: string;
  orderId?: string;
  itemId?: string;
  itemName?: string;
  error?: string;
}

export interface BotErrorsResponse {
  errors: BotError[];
  total: number;
  botId: string;
  date: string;
}

export const logsApi = {
  getBotErrors: async (botId?: string, limit: number = 50): Promise<BotErrorsResponse> => {
    const params = new URLSearchParams();
    if (botId) params.append('botId', botId);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/logs/bot-errors?${params.toString()}`);
    return handleResponse<BotErrorsResponse>(response);
  },

  getBotActivity: async (botId?: string, limit: number = 100): Promise<any> => {
    const params = new URLSearchParams();
    if (botId) params.append('botId', botId);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/logs/bot-activity?${params.toString()}`);
    return handleResponse<any>(response);
  },

  getApplicationLogs: async (level?: string, limit: number = 100): Promise<any> => {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/logs/application?${params.toString()}`);
    return handleResponse<any>(response);
  },
};

// ----- Users -----
export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
  isActive: boolean;
  phoneNumber: string | null;
  lastLogin: string | null;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InviteUserRequest {
  username: string;
  email?: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  phoneNumber: string;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return handleResponse<User[]>(response);
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return handleResponse<User>(response);
  },

  invite: async (data: InviteUserRequest): Promise<{ user: User; invitationToken: string }> => {
    const response = await apiClient.post('/users/invite', data);
    return handleResponse<{ user: User; invitationToken: string }>(response);
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, data);
    return handleResponse<User>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/users/${id}`);
    return handleResponse<void>(response);
  },

  resetPassword: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/users/${id}/reset-password`);
    return handleResponse<{ message: string }>(response);
  },

  regenerateApiKey: async (id: string): Promise<{ apiKey: string }> => {
    const response = await apiClient.post(`/users/${id}/regenerate-key`);
    return handleResponse<{ apiKey: string }>(response);
  },

  resendInvitation: async (id: string): Promise<{ invitationToken: string; inviteUrl: string }> => {
    const response = await apiClient.post(`/users/${id}/resend-invitation`);
    return handleResponse<{ invitationToken: string; inviteUrl: string }>(response);
  },
};

// Export default api client for custom requests
export default apiClient;
