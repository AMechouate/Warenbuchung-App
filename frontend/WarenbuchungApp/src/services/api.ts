import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../config';
import {
  AuthResponse,
  LoginRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Wareneingang,
  CreateWareneingangRequest,
  UpdateWareneingangRequest,
  Warenausgang,
  CreateWarenausgangRequest,
  UpdateWarenausgangRequest,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Debug: Zeige die verwendete API-URL
    console.log('🔗 API Base URL:', API_BASE_URL);
    
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

    // Response interceptor to handle auth errors and network issues
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Log network errors for debugging
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network Error')) {
          console.error('❌ Netzwerkfehler:', {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
          });
        } else if (error.response) {
          // Server responded with error status
          console.error('❌ API Fehler:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
          });
        } else {
          // Request was made but no response received
          console.error('❌ Keine Antwort vom Server:', {
            message: error.message,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
          });
        }

        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
        }
        return Promise.reject(error);
      }
    );
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
    return !!token;
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing backend connection to:', API_BASE_URL);
      const response = await this.api.get('/health', {
        timeout: 5000, // Shorter timeout for connection test
      });
      console.log('✅ Backend connection successful:', response.data);
      return response.status === 200 && response.data?.status === 'ok';
    } catch (error: any) {
      console.error('❌ Backend connection test failed:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        url: API_BASE_URL,
      });
      return false;
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const response: AxiosResponse<Product[]> = await this.api.get('/products');
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
}

export const apiService = new ApiService();
