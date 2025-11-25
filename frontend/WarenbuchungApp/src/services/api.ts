/**
 * api.ts
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Wareneingang,
  CreateWareneingangRequest,
  UpdateWareneingangRequest,
  Warenausgang,
  CreateWarenausgangRequest,
  UpdateWarenausgangRequest,
  SettingsUser,
  UserQueryParams,
  OrderSummary,
  OrderAssignment,
  ProjectAssignment,
} from '../types';
import { API_BASE_URL } from '../../config';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Don't clear storage immediately, let the app handle re-login
          // This allows the user to manually log in again
        }
        return Promise.reject(error);
      }
    );
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection to:', this.api.defaults.baseURL);
      const response = await this.api.get('/health', {
        timeout: 5000, // 5 seconds timeout
      });
      console.log('✅ API connection successful:', response.status);
      return response.status === 200;
    } catch (error: any) {
      console.error('❌ API connection failed:', {
        message: error.message,
        code: error.code,
        baseURL: this.api.defaults.baseURL,
        url: error.config?.url,
      });
      return false;
    }
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    const { token, user } = response.data;
    
    // Store token and user data
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    const { token, user } = response.data;
    
    // Store token and user data
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    
    return response.data;
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
  }

  async getStoredUser(): Promise<any> {
    const userData = await SecureStore.getItemAsync('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      return false;
    }
    
    // Test if token is still valid by making a simple API call
    try {
      await this.api.get('/auth/me');
      return true;
    } catch (error) {
      // Clear invalid token
      await this.logout();
      return false;
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const response: AxiosResponse<Product[]> = await this.api.get('/products');
    return response.data;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response: AxiosResponse<Product[]> = await this.api.get(`/products/search?query=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getProduct(id: number): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.post('/products', product);
    return response.data;
  }

  async updateProduct(id: number, product: UpdateProductRequest): Promise<void> {
    await this.api.put(`/products/${id}`, product);
  }

  async deleteProduct(id: number): Promise<void> {
    await this.api.delete(`/products/${id}`);
  }

  // Wareneingang methods
  async getWareneingaenge(): Promise<Wareneingang[]> {
    const response: AxiosResponse<Wareneingang[]> = await this.api.get('/wareneingaenge');
    return response.data;
  }

  async getWareneingang(id: number): Promise<Wareneingang> {
    const response: AxiosResponse<Wareneingang> = await this.api.get(`/wareneingaenge/${id}`);
    return response.data;
  }

  async createWareneingang(wareneingang: CreateWareneingangRequest): Promise<Wareneingang> {
    const response: AxiosResponse<Wareneingang> = await this.api.post('/wareneingaenge', wareneingang);
    return response.data;
  }

  async updateWareneingang(id: number, wareneingang: UpdateWareneingangRequest): Promise<void> {
    await this.api.put(`/wareneingaenge/${id}`, wareneingang);
  }

  async deleteWareneingang(id: number): Promise<void> {
    await this.api.delete(`/wareneingaenge/${id}`);
  }

  // Warenausgang methods
  async getWarenausgaenge(): Promise<Warenausgang[]> {
    const response: AxiosResponse<Warenausgang[]> = await this.api.get('/warenausgaenge');
    return response.data;
  }

  async getWarenausgang(id: number): Promise<Warenausgang> {
    const response: AxiosResponse<Warenausgang> = await this.api.get(`/warenausgaenge/${id}`);
    return response.data;
  }

  async createWarenausgang(warenausgang: CreateWarenausgangRequest): Promise<Warenausgang> {
    const response: AxiosResponse<Warenausgang> = await this.api.post('/warenausgaenge', warenausgang);
    return response.data;
  }

  async updateWarenausgang(id: number, warenausgang: UpdateWarenausgangRequest): Promise<void> {
    await this.api.put(`/warenausgaenge/${id}`, warenausgang);
  }

  async deleteWarenausgang(id: number): Promise<void> {
    await this.api.delete(`/warenausgaenge/${id}`);
  }

  // Order methods
  async getOrders(orderNumber?: string): Promise<OrderSummary[]> {
    const params =
      orderNumber && orderNumber.trim().length > 0
        ? { orderNumber: orderNumber.trim() }
        : undefined;
    const response: AxiosResponse<any[]> = await this.api.get('/orders', {
      params,
    });
    return response.data.map(order => ({
      id: order.id ?? order.Id,
      orderNumber: order.orderNumber ?? order.OrderNumber ?? '',
      orderDate: order.orderDate ?? order.OrderDate ?? new Date().toISOString(),
      status: order.status ?? order.Status,
      supplier: order.supplier ?? order.Supplier ?? undefined,
      supplierId: order.supplierId ?? order.SupplierId ?? undefined,
      assignedItemCount:
        order.assignedItemCount ?? order.AssignedItemCount ?? 0,
      createdAt: order.createdAt ?? order.CreatedAt ?? new Date().toISOString(),
      updatedAt: order.updatedAt ?? order.UpdatedAt ?? undefined,
    }));
  }

  async getOrderAssignments(orderId: number): Promise<OrderAssignment[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/orders/${orderId}/items`);
    return response.data.map(assignment => ({
      id: assignment.id ?? assignment.Id,
      orderId: assignment.orderId ?? assignment.OrderId ?? orderId,
      productId: assignment.productId ?? assignment.ProductId,
      productName: assignment.productName ?? assignment.ProductName ?? '',
      productSku: assignment.productSku ?? assignment.ProductSku ?? '',
      defaultQuantity: assignment.defaultQuantity ?? assignment.DefaultQuantity ?? 0,
      unit: assignment.unit ?? assignment.Unit ?? undefined,
      createdAt: assignment.createdAt ?? assignment.CreatedAt ?? new Date().toISOString(),
      updatedAt: assignment.updatedAt ?? assignment.UpdatedAt ?? undefined,
    }));
  }

  async getProjectAssignments(projectKey: string): Promise<ProjectAssignment[]> {
    if (!projectKey || projectKey.trim().length === 0) {
      return [];
    }

    const response: AxiosResponse<any[]> = await this.api.get(
      `/projects/${encodeURIComponent(projectKey.trim())}/items`
    );

    return response.data.map(assignment => ({
      id: assignment.id ?? assignment.Id,
      projectKey: assignment.projectKey ?? assignment.ProjectKey ?? projectKey,
      productId: assignment.productId ?? assignment.ProductId,
      productName: assignment.productName ?? assignment.ProductName ?? '',
      productSku: assignment.productSku ?? assignment.ProductSku ?? '',
      defaultQuantity: assignment.defaultQuantity ?? assignment.DefaultQuantity ?? 0,
      unit: assignment.unit ?? assignment.Unit ?? undefined,
      createdAt: assignment.createdAt ?? assignment.CreatedAt ?? new Date().toISOString(),
      updatedAt: assignment.updatedAt ?? assignment.UpdatedAt ?? undefined,
    }));
  }

  // Settings methods (Admin only)
  async getUsers(params?: UserQueryParams): Promise<SettingsUser[]> {
    const queryParams: Record<string, string | boolean> = {};

    if (params?.search && params.search.trim().length > 0) {
      queryParams.search = params.search.trim();
    }

    if (params?.role && params.role !== 'all') {
      queryParams.role = params.role;
    }

    if (typeof params?.includeInactive === 'boolean' && !params.includeInactive) {
      queryParams.includeInactive = params.includeInactive;
    }

    const response: AxiosResponse<SettingsUser[]> = await this.api.get('/settings/users', {
      params: queryParams,
    });
    return response.data;
  }

  async createUser(userData: any): Promise<SettingsUser> {
    const response: AxiosResponse<SettingsUser> = await this.api.post('/settings/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: any): Promise<void> {
    await this.api.put(`/settings/users/${id}`, userData);
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/settings/users/${id}`);
  }

  async getReasons(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/settings/reasons/all');
    return response.data;
  }

  async createReason(reasonData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/settings/reasons', reasonData);
    return response.data;
  }

  async updateReason(id: number, reasonData: any): Promise<void> {
    await this.api.put(`/settings/reasons/${id}`, reasonData);
  }

  async deleteReason(id: number): Promise<void> {
    await this.api.delete(`/settings/reasons/${id}`);
  }

  async getJustifications(): Promise<any[]> {
    // Use public endpoint for active justifications (no admin required)
    const response: AxiosResponse<any[]> = await this.api.get('/settings/justifications');
    return response.data;
  }

  async createJustification(templateData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/settings/justifications', templateData);
    return response.data;
  }

  async updateJustification(id: number, templateData: any): Promise<void> {
    await this.api.put(`/settings/justifications/${id}`, templateData);
  }

  async deleteJustification(id: number): Promise<void> {
    await this.api.delete(`/settings/justifications/${id}`);
  }
}

export const apiService = new ApiService();
