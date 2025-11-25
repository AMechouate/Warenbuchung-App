/**
 * SettingsScreen.tsx
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  Text,
  FlatList,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  ActivityIndicator,
  Divider,
  Switch,
  IconButton,
  Portal,
  Dialog,
  Menu,
} from 'react-native-paper';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import {
  CreateUserRequest,
  UpdateUserRequest,
  CreateReasonRequest,
  UpdateReasonRequest,
  CreateJustificationRequest,
  UpdateJustificationRequest,
  SettingsUser,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from '../types';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_REASONS = [
  { id: -1, name: 'Kommission', orderIndex: 1, isActive: true },
  { id: -2, name: 'Auftrag', orderIndex: 2, isActive: true },
  { id: -3, name: 'Umbuchung', orderIndex: 3, isActive: true },
  { id: -4, name: 'Beschädigung', orderIndex: 4, isActive: true },
];

const DEFAULT_JUSTIFICATIONS = [
  { id: -1, text: 'Notfall-Entnahme für dringenden Auftrag', orderIndex: 1, isActive: true },
  { id: -2, text: 'Nachbestellung bereits veranlasst', orderIndex: 2, isActive: true },
  { id: -3, text: 'Lieferant bestätigt Nachschub', orderIndex: 3, isActive: true },
  { id: -4, text: 'Interne Umbuchung zwischen Standorten', orderIndex: 4, isActive: true },
  { id: -5, text: 'Qualitätsprüfung erforderlich', orderIndex: 5, isActive: true },
  { id: -6, text: 'Kundenspezifische Anpassung', orderIndex: 6, isActive: true },
  { id: -7, text: 'Wartungsarbeiten am Lager', orderIndex: 7, isActive: true },
  { id: -8, text: 'Inventur-Korrektur', orderIndex: 8, isActive: true },
];

const SettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'reasons' | 'justifications'>('users');
  
  // Users state
  const [users, setUsers] = useState<SettingsUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SettingsUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<SettingsUser | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<SettingsUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isAdmin: false,
    locations: '',
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productUnitFilter, setProductUnitFilter] = useState<string>('all');
  const [productUnits, setProductUnits] = useState<string[]>([]);
  const [productFilterMenuVisible, setProductFilterMenuVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    stockQuantity: '',
    locationStock: '',
    unit: '',
  });

  // Reasons state
  const [reasons, setReasons] = useState<any[]>(DEFAULT_REASONS);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [editingReason, setEditingReason] = useState<any | null>(null);
  const [reasonForm, setReasonForm] = useState({
    name: '',
    orderIndex: 0,
    isActive: true,
  });
  const [reasonSearchTerm, setReasonSearchTerm] = useState('');
  const [reasonStatusFilter, setReasonStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [filteredReasons, setFilteredReasons] = useState<any[]>(DEFAULT_REASONS);
  const [reasonStatusFilterMenuVisible, setReasonStatusFilterMenuVisible] = useState(false);

  // Justifications state
  const [justifications, setJustifications] = useState<any[]>(DEFAULT_JUSTIFICATIONS);
  const [justificationModalVisible, setJustificationModalVisible] = useState(false);
  const [editingJustification, setEditingJustification] = useState<any | null>(null);
  const [justificationForm, setJustificationForm] = useState({
    text: '',
    orderIndex: 0,
    isActive: true,
  });
  const [justificationSearchTerm, setJustificationSearchTerm] = useState('');
  const [justificationStatusFilter, setJustificationStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [filteredJustifications, setFilteredJustifications] = useState<any[]>(DEFAULT_JUSTIFICATIONS);
  const [justificationStatusFilterMenuVisible, setJustificationStatusFilterMenuVisible] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const user = await apiService.getStoredUser();
      const adminStatus = user?.isAdmin === true || user?.isAdmin === 'true';
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  const loadReasons = async () => {
    try {
      const data = await apiService.getReasons();
      console.log('📦 Loaded reasons from API:', data?.length ?? 0);
      if (!data || data.length === 0) {
        setReasons(DEFAULT_REASONS);
        setFilteredReasons(applyReasonsFilter(DEFAULT_REASONS, reasonSearchTerm, reasonStatusFilter));
      } else {
        setReasons(data);
        setFilteredReasons(applyReasonsFilter(data, reasonSearchTerm, reasonStatusFilter));
      }
    } catch (error) {
      console.error('Error loading reasons:', error);
      setReasons(DEFAULT_REASONS);
      setFilteredReasons(applyReasonsFilter(DEFAULT_REASONS, reasonSearchTerm, reasonStatusFilter));
    }
  };

  const applyReasonsFilter = useCallback((baseReasons: any[], search: string, status: 'all' | 'active' | 'inactive') => {
    const searchLower = search.trim().toLowerCase();
    return baseReasons.filter((reason) => {
      const matchesSearch =
        searchLower.length === 0 ||
        reason.name?.toLowerCase().includes(searchLower);

      const matchesStatus =
        status === 'all' ||
        (status === 'active' && reason.isActive) ||
        (status === 'inactive' && !reason.isActive);

      return matchesSearch && matchesStatus;
    });
  }, []);

  useEffect(() => {
    setFilteredReasons(applyReasonsFilter(reasons, reasonSearchTerm, reasonStatusFilter));
  }, [reasons, reasonSearchTerm, reasonStatusFilter, applyReasonsFilter]);

  const applyJustificationsFilter = useCallback((baseJustifications: any[], search: string, status: 'all' | 'active' | 'inactive') => {
    const searchLower = search.trim().toLowerCase();
    return baseJustifications.filter((justification) => {
      const matchesSearch =
        searchLower.length === 0 ||
        justification.text?.toLowerCase().includes(searchLower);

      const matchesStatus =
        status === 'all' ||
        (status === 'active' && justification.isActive) ||
        (status === 'inactive' && !justification.isActive);

      return matchesSearch && matchesStatus;
    });
  }, []);

  const loadJustifications = useCallback(async () => {
    try {
      const data = await apiService.getJustifications();
      if (!data || data.length === 0) {
        setJustifications(DEFAULT_JUSTIFICATIONS);
        setFilteredJustifications(applyJustificationsFilter(DEFAULT_JUSTIFICATIONS, justificationSearchTerm, justificationStatusFilter));
      } else {
        setJustifications(data);
        setFilteredJustifications(applyJustificationsFilter(data, justificationSearchTerm, justificationStatusFilter));
      }
    } catch (error) {
      console.error('Error loading justifications:', error);
      setJustifications(DEFAULT_JUSTIFICATIONS);
      setFilteredJustifications(applyJustificationsFilter(DEFAULT_JUSTIFICATIONS, justificationSearchTerm, justificationStatusFilter));
    }
  }, [applyJustificationsFilter, justificationSearchTerm, justificationStatusFilter]);

  useEffect(() => {
    setFilteredJustifications(applyJustificationsFilter(justifications, justificationSearchTerm, justificationStatusFilter));
  }, [justifications, justificationSearchTerm, justificationStatusFilter, applyJustificationsFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      const adminStatus = await checkAdminStatus();

      await Promise.all([
        loadReasons(),
        loadJustifications(),
      ]);

      if (adminStatus) {
        await Promise.all([
          loadUsers({ showLoader: false }),
          loadProducts({ showLoader: false }),
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Fehler', 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const applyUserFilters = useCallback((baseUsers: SettingsUser[], search: string, role: 'all' | 'admin' | 'user') => {
    const searchLower = search.trim().toLowerCase();
    const result = baseUsers.filter((user) => {
      const matchesRole =
        role === 'all' || (role === 'admin' ? user.isAdmin : !user.isAdmin);
      const matchesSearch =
        searchLower.length === 0 ||
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.firstName?.toLowerCase().includes(searchLower) ?? false) ||
        (user.lastName?.toLowerCase().includes(searchLower) ?? false);
      return matchesRole && matchesSearch;
    });
    setFilteredUsers(result);
  }, []);

  const loadUsers = useCallback(async (options?: { showLoader?: boolean }) => {
    const shouldShowLoader = options?.showLoader ?? true;

    if (shouldShowLoader) {
      setUsersLoading(true);
    }

    try {
      console.log('📥 Loading users from API...', { userSearchTerm, userRoleFilter });
      const data = await apiService.getUsers({
        search: userSearchTerm,
        role: userRoleFilter,
      });
      console.log('✅ Users loaded:', data.length, 'users');
      setUsers(data);
      applyUserFilters(data, userSearchTerm, userRoleFilter);
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Fehler', 'Sie haben keine Berechtigung, Benutzer anzuzeigen.');
      } else {
        Alert.alert('Fehler', 'Benutzer konnten nicht geladen werden.');
      }
    } finally {
      setUsersLoading(false);
    }
  }, [applyUserFilters, userRoleFilter, userSearchTerm]);

  useEffect(() => {
    applyUserFilters(users, userSearchTerm, userRoleFilter);
  }, [users, userSearchTerm, userRoleFilter, applyUserFilters]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    loadUsers({ showLoader: true });
    loadProducts({ showLoader: true });
  }, [isAdmin, loadUsers, loadProducts]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        return;
      }

      loadUsers({ showLoader: true });
      loadProducts({ showLoader: true });
    }, [isAdmin, loadProducts, loadUsers])
  );

  // User management functions
  const openUserModal = (user?: SettingsUser) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username || '',
        email: user.email || '',
        password: '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isAdmin: user.isAdmin || false,
        locations: user.locations || '',
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        isAdmin: false,
        locations: '',
      });
    }
    setUserModalVisible(true);
  };

  const saveUser = async () => {
    if (!userForm.username || !userForm.email || (!editingUser && !userForm.password)) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle erforderlichen Felder aus.');
      return;
    }

    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          username: userForm.username,
          email: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          isAdmin: userForm.isAdmin,
          locations: userForm.locations,
        };
        if (userForm.password) {
          updateData.password = userForm.password;
        }
        await apiService.updateUser(editingUser.id, updateData);
      } else {
        const createData: CreateUserRequest = {
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          isAdmin: userForm.isAdmin,
          locations: userForm.locations,
        };
        await apiService.createUser(createData);
      }
      setUserModalVisible(false);
      await loadUsers();
      Alert.alert('Erfolg', editingUser ? 'Benutzer wurde aktualisiert.' : 'Benutzer wurde erstellt.');
    } catch (error: any) {
      console.error('Error saving user:', error);
      Alert.alert('Fehler', error.response?.data || 'Fehler beim Speichern des Benutzers.');
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    Alert.alert(
      'Benutzer löschen',
      `Möchten Sie wirklich den Benutzer "${username}" löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteUser(userId);
              await loadUsers();
              Alert.alert('Erfolg', 'Benutzer wurde gelöscht.');
            } catch (error: any) {
              console.error('Error deleting user:', error);
              Alert.alert('Fehler', error.response?.data || 'Fehler beim Löschen des Benutzers.');
            }
          },
        },
      ]
    );
  };

  const handleRoleFilterChange = (role: 'all' | 'admin' | 'user') => {
    setUserRoleFilter(role);
    setFilterMenuVisible(false);
  };

  const openResetPasswordModal = (user: SettingsUser) => {
    setUserToResetPassword(user);
    setNewPassword('');
    setResetPasswordModalVisible(true);
  };

  const resetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie ein neues Passwort ein.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (!userToResetPassword) {
      Alert.alert('Fehler', 'Kein Benutzer zum Zurücksetzen ausgewählt.');
      return;
    }

    try {
      await apiService.updateUser(userToResetPassword.id, { password: newPassword });
      setResetPasswordModalVisible(false);
      setNewPassword('');
      Alert.alert('Erfolg', `Das Passwort für "${userToResetPassword.username}" wurde erfolgreich zurückgesetzt.`);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      Alert.alert('Fehler', error.response?.data || 'Fehler beim Zurücksetzen des Passworts.');
    }
  };

  // Product management helpers
  const applyProductFilters = useCallback((baseProducts: Product[], search: string, unit: string) => {
    const searchLower = search.trim().toLowerCase();
    const normalizedUnit = unit.trim().toLowerCase();

    const result = baseProducts.filter((product) => {
      const matchesSearch =
        searchLower.length === 0 ||
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        (product.description?.toLowerCase().includes(searchLower) ?? false);

      const matchesUnit =
        normalizedUnit === 'all' ||
        (product.unit ? product.unit.trim().toLowerCase() === normalizedUnit : normalizedUnit === '');

      return matchesSearch && matchesUnit;
    });

    setFilteredProducts(result);
  }, []);

  const loadProducts = useCallback(async (options?: { showLoader?: boolean }) => {
    const shouldShowLoader = options?.showLoader ?? true;

    if (shouldShowLoader) {
      setProductsLoading(true);
    }

    try {
      const data = await apiService.getProducts();
      setProducts(data);
      const uniqueUnits = Array.from(
        new Set(
          data
            .map((product) => product.unit?.trim())
            .filter((unit): unit is string => !!unit && unit.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b));

      setProductUnits(uniqueUnits);

      // Reset unit filter if current selection is no longer available
      if (productUnitFilter !== 'all' && !uniqueUnits.some((unit) => unit.toLowerCase() === productUnitFilter.toLowerCase())) {
        setProductUnitFilter('all');
        applyProductFilters(data, productSearchTerm, 'all');
      } else {
        applyProductFilters(data, productSearchTerm, productUnitFilter);
      }
    } catch (error: any) {
      console.error('❌ Error loading products:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Fehler', 'Sie haben keine Berechtigung, Produkte anzuzeigen.');
      } else {
        Alert.alert('Fehler', 'Produkte konnten nicht geladen werden.');
      }
    } finally {
      setProductsLoading(false);
    }
  }, [applyProductFilters, productSearchTerm, productUnitFilter]);

  useEffect(() => {
    applyProductFilters(products, productSearchTerm, productUnitFilter);
  }, [products, productSearchTerm, productUnitFilter, applyProductFilters]);

  const handleProductUnitFilterChange = (unit: string) => {
    setProductUnitFilter(unit);
    setProductFilterMenuVisible(false);
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description ?? '',
        sku: product.sku,
        price: product.price.toString(),
        stockQuantity: product.stockQuantity.toString(),
        locationStock: product.locationStock.toString(),
        unit: product.unit ?? '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        sku: '',
        price: '',
        stockQuantity: '',
        locationStock: '',
        unit: '',
      });
    }
    setProductModalVisible(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.unit.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle erforderlichen Felder aus (Name, SKU, Einheit).');
      return;
    }

    const parsedPrice = parseFloat(productForm.price.replace(',', '.')) || 0;
    if (parsedPrice < 0) {
      Alert.alert('Fehler', 'Der Preis darf nicht negativ sein.');
      return;
    }

    const parsedStockQuantity = parseInt(productForm.stockQuantity, 10);
    if (isNaN(parsedStockQuantity) || parsedStockQuantity < 0) {
      Alert.alert('Fehler', 'Bestandsmenge muss eine positive Zahl sein.');
      return;
    }

    const parsedLocationStock = parseFloat(productForm.locationStock.replace(',', '.')) || 0;
    if (parsedLocationStock < 0) {
      Alert.alert('Fehler', 'Der Lagebestand darf nicht negativ sein.');
      return;
    }

    try {
      if (editingProduct) {
        const updateData: UpdateProductRequest = {
          name: productForm.name.trim(),
          description: productForm.description.trim() || undefined,
          sku: productForm.sku.trim(),
          price: parsedPrice,
          stockQuantity: parsedStockQuantity,
          locationStock: parsedLocationStock,
          unit: productForm.unit.trim(),
        };

        await apiService.updateProduct(editingProduct.id, updateData);
      } else {
        const createData: CreateProductRequest = {
          name: productForm.name.trim(),
          description: productForm.description.trim() || undefined,
          sku: productForm.sku.trim(),
          price: parsedPrice,
          stockQuantity: parsedStockQuantity,
          locationStock: parsedLocationStock,
          unit: productForm.unit.trim(),
        };

        await apiService.createProduct(createData);
      }

      setProductModalVisible(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        sku: '',
        price: '',
        stockQuantity: '',
        locationStock: '',
        unit: '',
      });
      await loadProducts();
      Alert.alert('Erfolg', editingProduct ? 'Produkt wurde aktualisiert.' : 'Produkt wurde erstellt.');
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Fehler', error.response?.data || 'Fehler beim Speichern des Produkts.');
    }
  };

  const deleteProduct = (product: Product) => {
    Alert.alert(
      'Produkt löschen',
      `Möchten Sie wirklich das Produkt "${product.name}" löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteProduct(product.id);
              await loadProducts();
              Alert.alert('Erfolg', 'Produkt wurde gelöscht.');
            } catch (error: any) {
              console.error('Error deleting product:', error);
              Alert.alert('Fehler', error.response?.data || 'Fehler beim Löschen des Produkts.');
            }
          },
        },
      ]
    );
  };

  // Reason management functions
  const openReasonModal = (reason?: any) => {
    if (reason) {
      setEditingReason(reason);
      setReasonForm({
        name: reason.name || '',
        orderIndex: reason.orderIndex || 0,
        isActive: reason.isActive !== undefined ? reason.isActive : true,
      });
    } else {
      setEditingReason(null);
      setReasonForm({
        name: '',
        orderIndex: reasons.length > 0 ? Math.max(...reasons.map(r => r.orderIndex || 0)) + 1 : 1,
        isActive: true,
      });
    }
    setReasonModalVisible(true);
  };

  const saveReason = async () => {
    if (!reasonForm.name.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Namen ein.');
      return;
    }

    try {
      if (editingReason) {
        const updateData: UpdateReasonRequest = {
          name: reasonForm.name,
          orderIndex: reasonForm.orderIndex,
          isActive: reasonForm.isActive,
        };
        await apiService.updateReason(editingReason.id, updateData);
      } else {
        const createData: CreateReasonRequest = {
          name: reasonForm.name,
          orderIndex: reasonForm.orderIndex,
        };
        await apiService.createReason(createData);
      }
      setReasonModalVisible(false);
      await loadReasons();
      Alert.alert('Erfolg', editingReason ? 'Entsorgungsgrund wurde aktualisiert.' : 'Entsorgungsgrund wurde erstellt.');
    } catch (error: any) {
      console.error('Error saving reason:', error);
      Alert.alert('Fehler', error.response?.data || 'Fehler beim Speichern des Entsorgungsgrunds.');
    }
  };

  const deleteReason = async (reasonId: number, reasonName: string) => {
    Alert.alert(
      'Entsorgungsgrund löschen',
      `Möchten Sie wirklich den Entsorgungsgrund "${reasonName}" löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteReason(reasonId);
              await loadReasons();
              Alert.alert('Erfolg', 'Entsorgungsgrund wurde gelöscht.');
            } catch (error: any) {
              console.error('Error deleting reason:', error);
              Alert.alert('Fehler', error.response?.data || 'Fehler beim Löschen des Entsorgungsgrunds.');
            }
          },
        },
      ]
    );
  };

  const handleReasonStatusFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setReasonStatusFilter(status);
    setReasonStatusFilterMenuVisible(false);
  };

  const handleJustificationStatusFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setJustificationStatusFilter(status);
    setJustificationStatusFilterMenuVisible(false);
  };

  // Justification management functions
  const openJustificationModal = (justification?: any) => {
    if (justification) {
      setEditingJustification(justification);
      setJustificationForm({
        text: justification.text || '',
        orderIndex: justification.orderIndex || 0,
        isActive: justification.isActive !== undefined ? justification.isActive : true,
      });
    } else {
      setEditingJustification(null);
      setJustificationForm({
        text: '',
        orderIndex: justifications.length > 0 ? Math.max(...justifications.map(j => j.orderIndex || 0)) + 1 : 1,
        isActive: true,
      });
    }
    setJustificationModalVisible(true);
  };

  const saveJustification = async () => {
    if (!justificationForm.text.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Text ein.');
      return;
    }

    try {
      if (editingJustification) {
        const updateData: UpdateJustificationRequest = {
          text: justificationForm.text,
          orderIndex: justificationForm.orderIndex,
          isActive: justificationForm.isActive,
        };
        await apiService.updateJustification(editingJustification.id, updateData);
      } else {
        const createData: CreateJustificationRequest = {
          text: justificationForm.text,
          orderIndex: justificationForm.orderIndex,
        };
        await apiService.createJustification(createData);
      }
      setJustificationModalVisible(false);
      await loadJustifications();
      Alert.alert('Erfolg', editingJustification ? 'Rücklieferungsgrund wurde aktualisiert.' : 'Rücklieferungsgrund wurde erstellt.');
    } catch (error: any) {
      console.error('Error saving justification:', error);
      Alert.alert('Fehler', error.response?.data || 'Fehler beim Speichern des Rücklieferungsgrunds.');
    }
  };

  const deleteJustification = async (justificationId: number, justificationText: string) => {
    Alert.alert(
      'Rücklieferungsgrund löschen',
      `Möchten Sie wirklich den Rücklieferungsgrund "${justificationText.substring(0, 50)}..." löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteJustification(justificationId);
              await loadJustifications();
              Alert.alert('Erfolg', 'Rücklieferungsgrund wurde gelöscht.');
            } catch (error: any) {
              console.error('Error deleting justification:', error);
              Alert.alert('Fehler', error.response?.data || 'Fehler beim Löschen des Rücklieferungsgrunds.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_DARK_BLUE} />
      </View>
    );
  }

  const renderUserItem = (item: SettingsUser) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Paragraph style={styles.listItemTitle}>
          {item.username}
          {item.isAdmin && <Text style={styles.adminBadge}> (Admin)</Text>}
        </Paragraph>
        <Paragraph style={styles.listItemSubtitle}>{item.email}</Paragraph>
        {item.firstName || item.lastName ? (
          <Paragraph style={styles.listItemDetail}>
            {item.firstName} {item.lastName}
          </Paragraph>
        ) : null}
        <Paragraph style={styles.listItemDetail}>
          Status: {item.isActive ? 'Aktiv' : 'Inaktiv'}
        </Paragraph>
        {item.locations ? (
          <Paragraph style={styles.listItemDetail}>
            Standorte: {item.locations}
          </Paragraph>
        ) : null}
      </View>
      <View style={styles.listItemActions}>
        <IconButton
          icon="lock-reset"
          size={20}
          iconColor={BRAND_LIGHT_BLUE}
          onPress={() => openResetPasswordModal(item)}
          accessibilityLabel="Passwort zurücksetzen"
        />
        <IconButton
          icon="pencil"
          size={20}
          iconColor={BRAND_DARK_BLUE}
          onPress={() => openUserModal(item)}
        />
        <IconButton
          icon="delete"
          size={20}
          iconColor="#d32f2f"
          onPress={() => deleteUser(item.id, item.username)}
        />
      </View>
    </View>
  );

  const renderProductItem = (item: Product) => {
    const priceValue = Number(
      item.price ?? (typeof (item as any).price === 'string' ? parseFloat((item as any).price) : 0)
    );
    const locationStockValue = Number(
      item.locationStock ??
        (typeof (item as any).locationStock === 'string'
          ? parseFloat((item as any).locationStock)
          : 0)
    );

    const displayPrice = Number.isFinite(priceValue) ? priceValue.toFixed(2) : '0.00';
    const displayLocationStock = Number.isFinite(locationStockValue)
      ? locationStockValue.toFixed(2)
      : '0.00';

    return (
      <View style={styles.listItem}>
        <View style={styles.listItemContent}>
          <Paragraph style={styles.listItemTitle}>{item.name}</Paragraph>
          <Paragraph style={styles.listItemSubtitle}>SKU: {item.sku}</Paragraph>
          <Paragraph style={styles.listItemDetail}>
            Einheit: {item.unit || '—'} | Bestand: {item.stockQuantity} | Lagebestand:{' '}
            {displayLocationStock}
          </Paragraph>
          <Paragraph style={styles.listItemDetail}>Preis: €{displayPrice}</Paragraph>
          {item.description ? (
            <Paragraph style={styles.listItemDetail} numberOfLines={2}>
              {item.description}
            </Paragraph>
          ) : null}
        </View>
        <View style={styles.listItemActions}>
          <IconButton
            icon="pencil"
            size={20}
            iconColor={BRAND_DARK_BLUE}
            onPress={() => openProductModal(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor="#d32f2f"
            onPress={() => deleteProduct(item)}
          />
        </View>
      </View>
    );
  };

  const renderTabButton = (tabKey: 'users' | 'products' | 'reasons' | 'justifications', label: string) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        key={tabKey}
        style={[styles.tabPill, isActive ? styles.tabPillActive : styles.tabPillInactive]}
        onPress={() => setActiveTab(tabKey)}
        activeOpacity={0.85}
      >
        <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderReasonItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Paragraph style={styles.listItemTitle}>{item.name}</Paragraph>
        <Paragraph style={styles.listItemDetail}>
          Reihenfolge: {item.orderIndex} | Status: {item.isActive ? 'Aktiv' : 'Inaktiv'}
        </Paragraph>
      </View>
      <View style={styles.listItemActions}>
        <IconButton
          icon="pencil"
          size={20}
          iconColor={BRAND_DARK_BLUE}
          onPress={() => openReasonModal(item)}
        />
        <IconButton
          icon="delete"
          size={20}
          iconColor="#d32f2f"
          onPress={() => deleteReason(item.id, item.name)}
        />
      </View>
    </View>
  );

  const renderJustificationItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Paragraph style={styles.listItemTitle}>{item.text}</Paragraph>
        <Paragraph style={styles.listItemDetail}>
          Reihenfolge: {item.orderIndex} | Status: {item.isActive ? 'Aktiv' : 'Inaktiv'}
        </Paragraph>
      </View>
      <View style={styles.listItemActions}>
        <IconButton
          icon="pencil"
          size={20}
          iconColor={BRAND_DARK_BLUE}
          onPress={() => openJustificationModal(item)}
        />
        <IconButton
          icon="delete"
          size={20}
          iconColor="#d32f2f"
          onPress={() => deleteJustification(item.id, item.text)}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('users', 'Benutzer')}
        {renderTabButton('products', 'Produkte')}
        {renderTabButton('reasons', 'Entsorgungsgründe')}
        {renderTabButton('justifications', 'Rücklieferungsgründe')}
      </View>

      {/* Users Tab - nur für Admins */}
      {activeTab === 'users' && isAdmin && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Benutzer-Verwaltung</Title>
            </View>
            <View style={styles.userToolbarContainer}>
              <TextInput
                mode="outlined"
                placeholder="Benutzer suchen..."
                value={userSearchTerm}
                onChangeText={setUserSearchTerm}
                style={styles.userToolbarSearch}
                left={<TextInput.Icon icon="magnify" />}
                dense
              />
              <Menu
                visible={filterMenuVisible}
                onDismiss={() => setFilterMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="filter"
                    size={24}
                    style={styles.userToolbarIconButton}
                    onPress={() => setFilterMenuVisible(true)}
                    iconColor={BRAND_DARK_BLUE}
                  />
                }
                contentStyle={styles.userToolbarMenu}
              >
                <Menu.Item
                  onPress={() => handleRoleFilterChange('all')}
                  title="Alle"
                  leadingIcon={userRoleFilter === 'all' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => handleRoleFilterChange('admin')}
                  title="Admins"
                  leadingIcon={userRoleFilter === 'admin' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => handleRoleFilterChange('user')}
                  title="Benutzer"
                  leadingIcon={userRoleFilter === 'user' ? 'check' : undefined}
                />
              </Menu>
              <IconButton
                icon="plus"
                size={24}
                style={[styles.userToolbarIconButton, styles.userToolbarAddButton]}
                iconColor="#fff"
                onPress={() => openUserModal()}
              />
            </View>
            <Paragraph style={styles.filterCount}>
              {usersLoading ? 'Lade Benutzer...' : `${filteredUsers.length} Benutzer gefunden`}
            </Paragraph>
            {usersLoading && (
              <View style={styles.usersLoadingIndicator}>
                <ActivityIndicator size="small" color={BRAND_DARK_BLUE} />
              </View>
            )}
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Paragraph style={styles.emptyText}>
                  {userSearchTerm.trim().length > 0 || userRoleFilter !== 'all'
                    ? 'Keine Benutzer entsprechen Ihrer Suche oder Filterauswahl.'
                    : 'Keine Benutzer gefunden. Klicken Sie auf "Neuer Benutzer" um einen Benutzer hinzuzufügen.'}
                </Paragraph>
              </View>
            ) : (
              <ScrollView
                style={styles.listScroll}
                contentContainerStyle={styles.listContainer}
              >
                {filteredUsers.map((user, index) => (
                  <View key={user.id}>
                    {renderUserItem(user)}
                    {index < filteredUsers.length - 1 && <Divider />}
                  </View>
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>
      )}
      {activeTab === 'users' && !isAdmin && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Zugriff verweigert</Title>
            <Paragraph style={styles.errorText}>
              Sie haben keine Berechtigung, die Benutzer-Verwaltung zu öffnen. Nur Administratoren können auf diese Funktion zugreifen.
            </Paragraph>
            <Paragraph style={styles.listItemDetail}>
              Ihr Admin-Status: {isAdmin ? 'Admin' : 'Kein Admin'}
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && isAdmin && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Produkt-Verwaltung</Title>
            </View>
            <View style={styles.productToolbarContainer}>
              <TextInput
                mode="outlined"
                placeholder="Produkt suchen..."
                value={productSearchTerm}
                onChangeText={setProductSearchTerm}
                style={styles.productToolbarSearch}
                left={<TextInput.Icon icon="magnify" />}
                dense
              />
              <Menu
                visible={productFilterMenuVisible}
                onDismiss={() => setProductFilterMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="filter"
                    size={24}
                    style={styles.productToolbarIconButton}
                    onPress={() => setProductFilterMenuVisible(true)}
                    iconColor={BRAND_DARK_BLUE}
                  />
                }
                contentStyle={styles.productToolbarMenu}
              >
                <Menu.Item
                  onPress={() => handleProductUnitFilterChange('all')}
                  title="Alle Einheiten"
                  leadingIcon={productUnitFilter === 'all' ? 'check' : undefined}
                />
                {productUnits.map((unit) => (
                  <Menu.Item
                    key={unit}
                    onPress={() => handleProductUnitFilterChange(unit)}
                    title={unit}
                    leadingIcon={
                      productUnitFilter.toLowerCase() === unit.toLowerCase() ? 'check' : undefined
                    }
                  />
                ))}
              </Menu>
              <IconButton
                icon="plus"
                size={24}
                style={[styles.productToolbarIconButton, styles.productToolbarAddButton]}
                iconColor="#fff"
                onPress={() => openProductModal()}
              />
            </View>
            <Paragraph style={styles.filterCount}>
              {productsLoading ? 'Lade Produkte...' : `${filteredProducts.length} Produkte gefunden`}
            </Paragraph>
            {productsLoading && (
              <View style={styles.productsLoadingIndicator}>
                <ActivityIndicator size="small" color={BRAND_DARK_BLUE} />
              </View>
            )}
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Paragraph style={styles.emptyText}>
                  {productSearchTerm.trim().length > 0 || productUnitFilter !== 'all'
                    ? 'Keine Produkte entsprechen Ihrer Suche oder Filterauswahl.'
                    : 'Keine Produkte gefunden. Klicken Sie auf "+" um ein Produkt hinzuzufügen.'}
                </Paragraph>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => renderProductItem(item)}
                ItemSeparatorComponent={() => <Divider />}
                style={styles.list}
                contentContainerStyle={styles.productListContent}
              />
            )}
          </Card.Content>
        </Card>
      )}
      {activeTab === 'products' && !isAdmin && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Zugriff verweigert</Title>
            <Paragraph style={styles.errorText}>
              Sie haben keine Berechtigung, die Produkt-Verwaltung zu öffnen. Nur Administratoren können auf diese Funktion zugreifen.
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Reasons Tab */}
      {activeTab === 'reasons' && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Entsorgungsgründe-Verwaltung</Title>
            </View>
            <View style={styles.reasonToolbarContainer}>
              <TextInput
                mode="outlined"
                placeholder="Entsorgungsgrund suchen..."
                value={reasonSearchTerm}
                onChangeText={setReasonSearchTerm}
                style={styles.reasonToolbarSearch}
                left={<TextInput.Icon icon="magnify" />}
                dense
              />
              <Menu
                visible={reasonStatusFilterMenuVisible}
                onDismiss={() => setReasonStatusFilterMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="filter"
                    size={24}
                    onPress={() => setReasonStatusFilterMenuVisible(true)}
                    mode="contained-tonal"
                    containerColor="#eef2f7"
                    style={styles.reasonFilterButton}
                  />
                }
              >
                <Menu.Item
                  onPress={() => handleReasonStatusFilterChange('all')}
                  title="Alle"
                  leadingIcon={reasonStatusFilter === 'all' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => handleReasonStatusFilterChange('active')}
                  title="Aktive"
                  leadingIcon={reasonStatusFilter === 'active' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => handleReasonStatusFilterChange('inactive')}
                  title="Inaktive"
                  leadingIcon={reasonStatusFilter === 'inactive' ? 'check' : undefined}
                />
              </Menu>
              <IconButton
                icon="plus"
                size={24}
                mode="contained"
                containerColor={BRAND_LIGHT_BLUE}
                iconColor="#fff"
                onPress={() => openReasonModal()}
                style={styles.reasonAddButton}
              />
            </View>
            <FlatList
              style={styles.list}
              contentContainerStyle={styles.reasonListContent}
              data={filteredReasons.slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderReasonItem}
              ItemSeparatorComponent={() => <Divider />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Paragraph style={styles.emptyText}>Keine Entsorgungsgründe vorhanden.</Paragraph>
                </View>
              }
            />
          </Card.Content>
        </Card>
      )}

      {/* Justifications Tab */}
      {activeTab === 'justifications' && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Rücklieferungsgründe-Verwaltung</Title>
            </View>
            <View style={styles.justificationToolbarContainer}>
              <TextInput
                mode="outlined"
                placeholder="Rücklieferungsgrund suchen..."
                value={justificationSearchTerm}
                onChangeText={setJustificationSearchTerm}
                style={styles.justificationToolbarSearch}
                left={<TextInput.Icon icon="magnify" />}
                dense
              />
              <Menu
                visible={justificationStatusFilterMenuVisible}
                onDismiss={() => setJustificationStatusFilterMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="filter"
                    size={24}
                    onPress={() => setJustificationStatusFilterMenuVisible(true)}
                    mode="contained-tonal"
                    containerColor="#eef2f7"
                    style={styles.justificationFilterButton}
                  />
                }
              >
                <Menu.Item
                  onPress={() => handleJustificationStatusFilterChange('all')}
                  title="Alle"
                  leadingIcon={justificationStatusFilter === 'all' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => handleJustificationStatusFilterChange('active')}
                  title="Aktive"
                  leadingIcon={justificationStatusFilter === 'active' ? 'check' : undefined}
                />
                <Menu.Item
                  onPress={() => handleJustificationStatusFilterChange('inactive')}
                  title="Inaktive"
                  leadingIcon={justificationStatusFilter === 'inactive' ? 'check' : undefined}
                />
              </Menu>
              <IconButton
                icon="plus"
                size={24}
                mode="contained"
                containerColor={BRAND_LIGHT_BLUE}
                iconColor="#fff"
                onPress={() => openJustificationModal()}
                style={styles.justificationAddButton}
              />
            </View>
            <FlatList
              data={filteredJustifications.slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderJustificationItem}
              ItemSeparatorComponent={() => <Divider />}
              style={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Paragraph style={styles.emptyText}>Keine Rücklieferungsgründe vorhanden.</Paragraph>
                </View>
              }
            />
          </Card.Content>
        </Card>
      )}

      {/* User Modal */}
      <Portal>
        <Dialog visible={userModalVisible} onDismiss={() => setUserModalVisible(false)}>
          <Dialog.Title>{editingUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogScroll}>
              <View style={styles.formField}>
                <TextInput
                  label="Benutzername *"
                  value={userForm.username}
                  onChangeText={(text) => setUserForm({ ...userForm, username: text })}
                  mode="outlined"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="E-Mail *"
                  value={userForm.email}
                  onChangeText={(text) => setUserForm({ ...userForm, email: text })}
                  mode="outlined"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label={editingUser ? "Passwort (leer lassen, um nicht zu ändern)" : "Passwort *"}
                  value={userForm.password}
                  onChangeText={(text) => setUserForm({ ...userForm, password: text })}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Vorname"
                  value={userForm.firstName}
                  onChangeText={(text) => setUserForm({ ...userForm, firstName: text })}
                  mode="outlined"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Nachname"
                  value={userForm.lastName}
                  onChangeText={(text) => setUserForm({ ...userForm, lastName: text })}
                  mode="outlined"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Lagerorte (komma-separiert)"
                  value={userForm.locations}
                  onChangeText={(text) => setUserForm({ ...userForm, locations: text })}
                  mode="outlined"
                  style={styles.input}
                  placeholder="z.B. Lagerort München, Lagerort Berlin"
                />
              </View>
              <View style={styles.switchField}>
                <Paragraph>Administrator:</Paragraph>
                <Switch
                  value={userForm.isAdmin}
                  onValueChange={(value) => setUserForm({ ...userForm, isAdmin: value })}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setUserModalVisible(false)}>Abbrechen</Button>
            <Button mode="contained" onPress={saveUser}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Product Modal */}
      <Portal>
        <Dialog visible={productModalVisible} onDismiss={() => setProductModalVisible(false)}>
          <Dialog.Title>{editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogScroll}>
              <View style={styles.formField}>
                <TextInput
                  label="Name *"
                  value={productForm.name}
                  onChangeText={(text) => setProductForm({ ...productForm, name: text })}
                  mode="outlined"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Beschreibung"
                  value={productForm.description}
                  onChangeText={(text) => setProductForm({ ...productForm, description: text })}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="SKU (Artikelnummer) *"
                  value={productForm.sku}
                  onChangeText={(text) => setProductForm({ ...productForm, sku: text })}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Preis (€)"
                  value={productForm.price}
                  onChangeText={(text) => setProductForm({ ...productForm, price: text })}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Bestandsmenge"
                  value={productForm.stockQuantity}
                  onChangeText={(text) => setProductForm({ ...productForm, stockQuantity: text })}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Lagebestand"
                  value={productForm.locationStock}
                  onChangeText={(text) => setProductForm({ ...productForm, locationStock: text })}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Einheit *"
                  value={productForm.unit}
                  onChangeText={(text) => setProductForm({ ...productForm, unit: text })}
                  mode="outlined"
                  style={styles.input}
                  placeholder="z.B. Stück, m, L"
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setProductModalVisible(false)}>Abbrechen</Button>
            <Button mode="contained" onPress={saveProduct}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Reason Modal */}
      <Portal>
        <Dialog visible={reasonModalVisible} onDismiss={() => setReasonModalVisible(false)}>
          <Dialog.Title>{editingReason ? 'Entsorgungsgrund bearbeiten' : 'Neuer Entsorgungsgrund'}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.formField}>
              <TextInput
                label="Name *"
                value={reasonForm.name}
                onChangeText={(text) => setReasonForm({ ...reasonForm, name: text })}
                mode="outlined"
                style={styles.input}
              />
            </View>
            <View style={styles.formField}>
              <TextInput
                label="Reihenfolge"
                value={reasonForm.orderIndex.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  setReasonForm({ ...reasonForm, orderIndex: num });
                }}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={styles.switchField}>
              <Paragraph>Aktiv:</Paragraph>
              <Switch
                value={reasonForm.isActive}
                onValueChange={(value) => setReasonForm({ ...reasonForm, isActive: value })}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReasonModalVisible(false)}>Abbrechen</Button>
            <Button mode="contained" onPress={saveReason}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Justification Modal */}
      <Portal>
        <Dialog visible={justificationModalVisible} onDismiss={() => setJustificationModalVisible(false)}>
          <Dialog.Title>{editingJustification ? 'Rücklieferungsgrund bearbeiten' : 'Neuer Rücklieferungsgrund'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogScroll}>
              <View style={styles.formField}>
                <TextInput
                  label="Text *"
                  value={justificationForm.text}
                  onChangeText={(text) => setJustificationForm({ ...justificationForm, text })}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <TextInput
                  label="Reihenfolge"
                  value={justificationForm.orderIndex.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 0;
                    setJustificationForm({ ...justificationForm, orderIndex: num });
                  }}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.switchField}>
                <Paragraph>Aktiv:</Paragraph>
                <Switch
                  value={justificationForm.isActive}
                  onValueChange={(value) => setJustificationForm({ ...justificationForm, isActive: value })}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setJustificationModalVisible(false)}>Abbrechen</Button>
            <Button mode="contained" onPress={saveJustification}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Reset Password Modal */}
      <Portal>
        <Dialog visible={resetPasswordModalVisible} onDismiss={() => setResetPasswordModalVisible(false)}>
          <Dialog.Title>Passwort zurücksetzen</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>
              Neues Passwort für Benutzer: <Text style={styles.boldText}>{userToResetPassword?.username}</Text>
            </Paragraph>
            <View style={styles.formField}>
              <TextInput
                label="Neues Passwort *"
                value={newPassword}
                onChangeText={setNewPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                placeholder="Mindestens 6 Zeichen"
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetPasswordModalVisible(false)}>Abbrechen</Button>
            <Button mode="contained" onPress={resetPassword}>Passwort zurücksetzen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  tabPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillInactive: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  tabPillActive: {
    backgroundColor: BRAND_LIGHT_BLUE,
    borderColor: BRAND_DARK_BLUE,
    shadowColor: BRAND_DARK_BLUE,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  tabPillTextActive: {
    color: '#fff',
  },
  card: {
    flex: 1,
    margin: 16,
    elevation: 2,
    maxHeight: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginLeft: 8,
  },
  userToolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  userToolbarSearch: {
    flex: 1,
    backgroundColor: 'white',
    height: 40,
  },
  userToolbarIconButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    margin: 0,
  },
  userToolbarAddButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
  },
  userToolbarMenu: {
    minWidth: 180,
  },
  filterCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  usersLoadingIndicator: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  productToolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  productToolbarSearch: {
    flex: 1,
    backgroundColor: 'white',
    height: 40,
  },
  productToolbarIconButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    margin: 0,
  },
  productToolbarAddButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
  },
  productToolbarMenu: {
    minWidth: 200,
  },
  productsLoadingIndicator: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  productListContent: {
    paddingBottom: 8,
  },
  listScroll: {
    maxHeight: 400,
  },
  listContainer: {
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listItemDetail: {
    fontSize: 12,
    color: '#999',
  },
  listItemActions: {
    flexDirection: 'row',
  },
  adminBadge: {
    color: BRAND_DARK_BLUE,
    fontWeight: 'bold',
  },
  formField: {
    marginBottom: 16,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
  },
  dialogScroll: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  list: {
    maxHeight: 400,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 16,
  },
  dialogText: {
    marginBottom: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  reasonToolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    marginBottom: 12,
  },
  reasonToolbarSearch: {
    flex: 1,
    backgroundColor: 'white',
  },
  reasonFilterButton: {
    margin: 0,
  },
  reasonAddButton: {
    margin: 0,
  },
  reasonListContent: {
    paddingBottom: 8,
  },
  justificationToolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    marginBottom: 12,
  },
  justificationToolbarSearch: {
    flex: 1,
    backgroundColor: 'white',
  },
  justificationFilterButton: {
    margin: 0,
  },
  justificationAddButton: {
    margin: 0,
  },
});

export default SettingsScreen;
