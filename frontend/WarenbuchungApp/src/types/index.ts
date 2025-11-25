// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  expires: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isAdmin?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  locations?: string[];
}

export interface SettingsUser {
  id: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  locations?: string | null;
}

export interface UserQueryParams {
  search?: string;
  role?: 'admin' | 'user' | 'all';
  includeInactive?: boolean;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  locationStock: number;
  unit?: string;
  defaultSupplier?: string;
  itemType: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  locationStock: number;
  unit?: string;
  itemType?: string;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  locationStock: number;
  unit?: string;
  itemType?: string;
}

// Wareneingang Types
export interface Wareneingang {
  id: number;
  productId: number;
  productName: string;
  productSku?: string;
  productType?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  erfassungstyp?: string;
  referenz?: string;
  location?: string;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWareneingangRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  erfassungstyp?: string;
  referenz?: string;
  location?: string;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface UpdateWareneingangRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

// Warenausgang Types
export interface Warenausgang {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customer?: string;
  orderNumber?: string;
  notes?: string;
  attribut?: string;
  projectName?: string;
  begruendung?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWarenausgangRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  customer?: string;
  orderNumber?: string;
  notes?: string;
  attribut?: string;
  projectName?: string;
  begruendung?: string;
}

export interface UpdateWarenausgangRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  customer?: string;
  orderNumber?: string;
  notes?: string;
  attribut?: string;
  projectName?: string;
  begruendung?: string;
}

// Order Types
export interface OrderSummary {
  id: number;
  orderNumber: string;
  orderDate: string;
  status?: string;
  supplier?: string;  // Single supplier (1:1 relationship)
  supplierId?: number;  // Single supplier ID
  assignedItemCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderAssignment {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku?: string;
  defaultQuantity: number;
  unit?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectAssignment {
  id: number;
  projectKey: string;
  productId: number;
  productName: string;
  productSku?: string;
  defaultQuantity: number;
  unit?: string;
  createdAt: string;
  updatedAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface Booking {
  id: number;
  itemId: number;
  itemType: 'material' | 'device';
  quantity: number;
  unit: string;
  timestamp: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Profile: undefined;
  ProjectMaterials: { project: { id: number; name: string; description: string; status: string; startDate: string; endDate: string; } };
  ItemHistory: { 
    itemId: number; 
    itemType: 'material' | 'device'; 
    itemName: string;
    bookingHistory: Booking[];
  };
};

export type MainTabParamList = {
  Wareneingaenge: undefined;
  Warenausgaenge: undefined;
  Settings: undefined;
};

export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: number };
  CreateProduct: undefined;
  EditProduct: { productId: number };
};

export type WareneingangStackParamList = {
  WareneingangList: undefined;
  WareneingangDetail: { wareneingangId: number };
  CreateWareneingang: undefined;
  EditWareneingang: { wareneingangId: number };
};

// Settings Types
export interface WarenausgangReason {
  id: number;
  name: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface JustificationTemplate {
  id: number;
  text: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  locations?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  locations?: string;
}

export interface CreateReasonRequest {
  name: string;
  orderIndex?: number;
}

export interface UpdateReasonRequest {
  name?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface CreateJustificationRequest {
  text: string;
  orderIndex?: number;
}

export interface UpdateJustificationRequest {
  text?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export type WarenausgangStackParamList = {
  WarenausgangList: undefined;
  WarenausgangDetail: { warenausgangId: number };
  CreateWarenausgang: undefined;
  EditWarenausgang: { warenausgangId: number };
};
