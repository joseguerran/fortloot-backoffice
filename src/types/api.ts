// API Response types matching backend

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Bot {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR' | 'MAINTENANCE';
  epicAccountId: string;
  displayName: string;
  giftsToday: number;
  giftsAvailable: number;
  lastGiftReset: string;
  lastHeartbeat: string;
  lastError?: string;
  errorCount: number;
  uptime: number;
  vBucks: number;
  maxGiftsPerDay: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  id: string;
  displayName: string;
  epicAccountId?: string;
  email?: string;
  phoneNumber?: string;
  tier: 'REGULAR' | 'VIP' | 'PREMIUM';
}

export interface OrderItem {
  id: string;
  orderId: string;
  catalogItemId?: string;
  productName: string;
  productType: ProductType;
  itemId: string;
  quantity: number;
  basePrice: number;
  profitAmount: number;
  discountAmount: number;
  finalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: CustomerInfo;
  status: 'PENDING' | 'PENDING_PAYMENT' | 'PAYMENT_UPLOADED' | 'PAYMENT_VERIFIED' | 'PAYMENT_REJECTED' | 'WAITING_FRIENDSHIP' | 'WAITING_PERIOD' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED' | 'ABANDONED' | 'WAITING_VBUCKS' | 'WAITING_BOT_FIX' | 'WAITING_BOT';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'VIP';
  basePrice: number;
  discountAmount: number;
  profitAmount: number;
  finalPrice: number;
  currency: string;
  assignedBotId?: string;
  assignedAt?: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  reassignmentCount?: number;
  estimatedDelivery?: string;
  completedAt?: string;
  failedAt?: string;
  expiresAt?: string;
  checkoutStartedAt?: string;
  paymentMethod?: string;
  paymentProofUrl?: string;
  paymentUploadedAt?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  paymentRejectedReason?: string;
  paymentNotes?: string;
  transactionId?: string;
  failureReason?: string;
  progressSteps?: any;
  currentStep?: string;
  hasManualItems?: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}

export interface Analytics {
  period: string;
  orders: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  bots: {
    total: number;
    online: number;
    utilizationRate: number;
    avgGiftsPerBot: number;
  };
  performance: {
    avgDeliveryTime: number;
    avgProcessingTime: number;
    uptime: number;
  };
  revenue: {
    total: number;
    avgOrderValue: number;
  };
}

export interface BotAvailability {
  totalBots: number;
  onlineBots: number;
  availableGifts: number;
  estimatedWaitTime: number;
  nextAvailableSlot?: string;
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface Friendship {
  epicAccountId: string;
  displayName: string;
  status: 'PENDING' | 'ACCEPTED' | 'WAIT_PERIOD' | 'READY' | 'REJECTED' | 'REMOVED';
  friendedAt: string;
  canGiftAt: string;
  isLive: boolean; // Whether the friend is currently in Epic's friend list
}

export interface BotFriends {
  friends: Friendship[];
  total: number;
  onlineInEpic: number;
}

export type BotActivityType =
  | 'BOT_STARTED'
  | 'BOT_STOPPED'
  | 'BOT_ERROR'
  | 'FRIEND_REQUEST_RECEIVED'
  | 'FRIEND_ADDED'
  | 'FRIEND_REMOVED'
  | 'GIFT_SENT'
  | 'GIFT_FAILED'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'FRIENDS_SYNCED'
  | 'VBUCKS_UPDATED';

export interface BotActivity {
  id: string;
  botId: string;
  type: BotActivityType;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface BotActivities {
  activities: BotActivity[];
  total: number;
  limit: number;
  offset: number;
}

export type ProductType = 'VBUCKS' | 'SKIN' | 'EMOTE' | 'PICKAXE' | 'GLIDER' | 'BACKPACK' | 'WRAP' | 'BATTLE_PASS' | 'BUNDLE' | 'OTHER';

export interface CatalogItem {
  id: string;
  itemId?: string;
  name: string;
  description: string;
  type: ProductType;
  rarity?: string;
  image: string;
  baseVbucks?: number;
  basePriceUsd?: number;
  profitMargin?: number;
  discount: number;
  flashSalePrice?: number;
  flashSaleEndsAt?: string;
  isCustom: boolean;
  isActive: boolean;
  requiresManualProcess: boolean;
  tags: string[];
  bundleItems?: any;
  calculatedPrice?: {
    basePrice: number;
    profitAmount: number;
    discountAmount: number;
    taxAmount?: number;
    finalPrice: number;
    vbucksPrice?: number;
    currencyCode: string;
    currencySymbol: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogItemRequest {
  itemId?: string;
  name: string;
  description: string;
  type: ProductType;
  rarity?: string;
  image: string;
  baseVbucks?: number;
  basePriceUsd?: number;
  profitMargin?: number;
  discount?: number;
  isCustom?: boolean;
  isActive?: boolean;
  requiresManualProcess?: boolean;
  tags?: string[];
  bundleItems?: any;
}

export interface UpdateCatalogItemRequest {
  name?: string;
  description?: string;
  type?: ProductType;
  rarity?: string;
  image?: string;
  baseVbucks?: number;
  basePriceUsd?: number;
  profitMargin?: number;
  discount?: number;
  isActive?: boolean;
  requiresManualProcess?: boolean;
  tags?: string[];
  bundleItems?: any;
}

export interface FlashSaleRequest {
  price: number;
  endsAt: string;
}

export interface SyncCatalogResult {
  catalogId?: string;
  shopClosesAt?: string;
  itemCount: number;
  apiItems: number;
  customItems: number;
  newItems?: number;
  updatedItems?: number;
  deactivatedItems?: number;
  updatedAt?: string;
  message?: string;
}
