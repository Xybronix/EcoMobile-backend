// Shared Types and Interfaces

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'USER' | 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';
  roleId?: string;
  status: 'pending' | 'pending_verification' | 'active' | 'inactive' | 'suspended' | 'banned';
  isActive?: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  phoneVerified?: boolean;
  phoneVerificationCode?: string;
  phoneVerificationExpires?: Date;
  accountVerified?: boolean;
  accountVerifiedAt?: Date;
  accountVerifiedBy?: string;
  language: 'fr' | 'en';
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bike {
  id: string;
  bikeNumber: string;
  model: string;
  type: 'electric' | 'classic' | 'cargo';
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  batteryLevel?: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  station?: string;
  lastMaintenanceDate?: Date;
  totalDistance: number;
  totalRides: number;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ride {
  id: string;
  userId: string;
  bikeId: string;
  startTime: Date;
  endTime?: Date;
  startLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distance?: number;
  duration?: number;
  cost?: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'charge' | 'ride' | 'refund' | 'subscription';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  description?: string;
  rideId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  userId: string;
  bikeId?: string;
  rideId?: string;
  type: 'accident' | 'theft' | 'vandalism' | 'mechanical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  images?: string[];
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Maintenance {
  id: string;
  bikeId: string;
  type: 'routine' | 'repair' | 'inspection' | 'cleaning';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  performedBy?: string;
  scheduledDate: Date;
  completedDate?: Date;
  cost?: number;
  parts?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments?: string[];
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'ride' | 'payment' | 'maintenance' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface PricingConfig {
  id: string;
  name: string;
  type: 'per_minute' | 'per_hour' | 'daily' | 'subscription';
  basePrice: number;
  pricePerMinute?: number;
  pricePerHour?: number;
  unlockFee?: number;
  bikeType?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  logo?: string;
  supportedLanguages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_ride';
  value: number;
  maxUsageCount?: number;
  usageCount: number;
  validFrom: Date;
  validUntil: Date;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  userRestrictions?: string[];
  bikeTypeRestrictions?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoCodeUsage {
  id: string;
  promoCodeId: string;
  userId: string;
  rideId?: string;
  discountAmount: number;
  usedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  bikeId?: string;
  rideId?: string;
  rating: number;
  comment?: string;
  category: 'bike' | 'ride' | 'service';
  status: 'pending' | 'approved' | 'rejected';
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  userId: string;
  rideId?: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedBy?: string;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: 'technical' | 'billing' | 'general' | 'complaint' | 'suggestion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  subject: string;
  description: string;
  attachments?: string[];
  assignedTo?: string;
  relatedRideId?: string;
  relatedBikeId?: string;
  resolution?: string;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments?: string[];
  internal: boolean;
  createdAt: Date;
}

export interface MaintenanceAlert {
  id: string;
  bikeId: string;
  type: 'distance' | 'time' | 'battery' | 'manual' | 'incident';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold?: number;
  currentValue?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  createdAt: Date;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'service_area' | 'restricted' | 'parking' | 'slow_zone';
  coordinates: Array<{latitude: number; longitude: number}>;
  rules?: {
    maxSpeed?: number;
    parkingAllowed?: boolean;
    ridingAllowed?: boolean;
    penalty?: number;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: Date;
  services: {
    database: boolean;
    email: boolean;
    payment: boolean;
    geolocation: boolean;
  };
  metrics: {
    uptime: number;
    responseTime: number;
    activeUsers: number;
    activeBikes: number;
    activeRides: number;
  };
}

export interface Statistics {
  totalUsers: number;
  activeUsers: number;
  totalBikes: number;
  availableBikes: number;
  totalRides: number;
  activeRides: number;
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  popularRoutes: Array<{
    startLocation: string;
    endLocation: string;
    count: number;
  }>;
  bikeUtilization: Array<{
    bikeId: string;
    bikeNumber: string;
    utilizationRate: number;
  }>;
  peakHours: Array<{
    hour: number;
    rideCount: number;
  }>;
}

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  language?: 'fr' | 'en';
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
