import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Surface,
  TextInput,
  IconButton,
  Portal,
  Dialog,
  RadioButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { databaseService } from '../services/database';
import {
  Wareneingang,
  Product,
  Booking,
  OrderSummary,
  OrderAssignment,
  ProjectAssignment,
} from '../types';

type AggregatedOrderItem = {
  key: string;
  productId?: number;
  name: string;
  unit: string;
  quantity: number;
  sku?: string;
  supplier?: string;
  type?: string;
  location?: string;
  bookingHistory: Wareneingang[];
  itemType: 'material' | 'device';
  lastTimestamp?: number;
  lastBookingQuantity?: number;
  lastBookingUnit?: string;
  lastBooking?: {
    id: number;
    itemId: number;
    itemType: 'material' | 'device';
    quantity: number;
    unit: string;
    timestamp: string;
  };
  createdAtTimestamp?: number;
};

const WareneingaengeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [wareneingaenge, setWareneingaenge] = useState<Wareneingang[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  
  // Form states - Kopfbereich
  const [lieferantennummer, setLieferantennummer] = useState('');
  const [lieferant, setLieferant] = useState(''); // Neuer Feld für Lieferant (Name)
  const [bereich, setBereich] = useState(''); // Bereich
  const [bemerkung, setBemerkung] = useState(''); // Bemerkung
  const [referenz, setReferenz] = useState(''); // Referenz (Bestellnummer)
  const [availableSuppliersForOrder, setAvailableSuppliersForOrder] = useState<string[]>([]);
  const [supplierDropdownVisible, setSupplierDropdownVisible] = useState(false);
  const [supplierSelectionDialogVisible, setSupplierSelectionDialogVisible] = useState(false);
  const [projektnummer, setProjektnummer] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectMaterials, setProjectMaterials] = useState<any[]>([]);
  const [projectDevices, setProjectDevices] = useState<any[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>(['alle']);
  const [projectAppliedFilter, setProjectAppliedFilter] = useState<string[]>(['alle']);
  const [projectFilterModalVisible, setProjectFilterModalVisible] = useState(false);
  const [projectBookingInProgress, setProjectBookingInProgress] = useState<string | null>(null);
  const [orderSummaryItems, setOrderSummaryItems] = useState<(AggregatedOrderItem & { quantityInput: number })[]>([]);
  const [orderSummarySaving, setOrderSummarySaving] = useState<string | null>(null);
  const [lagerSummaryItems, setLagerSummaryItems] = useState<(AggregatedOrderItem & { quantityInput: number })[]>([]);
  const [lagerSummarySaving, setLagerSummarySaving] = useState<string | null>(null);
  const [ohneBestellungSummaryItems, setOhneBestellungSummaryItems] = useState<(AggregatedOrderItem & { quantityInput: number })[]>([]);
  const [ohneBestellungSummarySaving, setOhneBestellungSummarySaving] = useState<string | null>(null);
  
  // Update quantity for project materials/devices
  const updateProjectQuantity = (id: number, type: 'material' | 'device', change: number) => {
    if (type === 'material') {
      setProjectMaterials(prev => prev.map(item => {
        if (item.id === id) {
          const currentValue = parseFloat(item.quantity.toString());
          const step = item.unit === 'Paket' ? 0.1 : 1;
          const newValue = Math.max(0, currentValue + (change * step));
          const roundedValue = item.unit === 'Paket'
            ? parseFloat(newValue.toFixed(1))
            : Math.round(newValue);
          return { ...item, quantity: roundedValue };
        }
        return item;
      }));
    } else {
      setProjectDevices(prev => prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ));
    }
  };
  const [lagerort, setLagerort] = useState('');
  const [nachLagerort, setNachLagerort] = useState('');
  const [userLagerort, setUserLagerort] = useState<string>('');
  const [userLocations, setUserLocations] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [lagerortDialogVisible, setLagerortDialogVisible] = useState(false);
  const [nachLagerortDialogVisible, setNachLagerortDialogVisible] = useState(false);
  const [vonLagerortDialogVisible, setVonLagerortDialogVisible] = useState(false);
  const [nachLagerortSearchQuery, setNachLagerortSearchQuery] = useState('');
  
  // Form states - Bodybereich (Artikel-Liste)
  interface WareneingangItem {
    id: string;
    artikelnummer: string;
    anzahl: string;
    selectedProduct: any | null;
    selectedUnit: string;
  }
  const [items, setItems] = useState<WareneingangItem[]>([]);
  
  // Legacy single item states (für Kompatibilität)
  const [artikelnummer, setArtikelnummer] = useState('');
  const [anzahl, setAnzahl] = useState<string>('1');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [filter, setFilter] = useState<string[]>([]);
  const [appliedFilter, setAppliedFilter] = useState<string[]>([]);
  
  // Product selection modal search and filter states
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productFilterMenuVisible, setProductFilterMenuVisible] = useState(false);
  const [productFilter, setProductFilter] = useState<string[]>([]);

  // Lieferanten-Artikel-Zuordnung basierend auf echten Produkt-SKUs
  // Ein Produkt kann von mehreren Lieferanten geliefert werden
  const supplierProductMapping: { [key: string]: string[] } = {
    // Dell Produkte - mehrere Lieferanten möglich
    'DELL-XPS13-001': ['DELL-DIRECT-001', 'TECH-CORP-001', 'BUSINESS-SOLUTIONS-001'], // Dell XPS 13 - mehrere Lieferanten
    'DELL-XPS15-001': ['DELL-DIRECT-001', 'TECH-CORP-001', 'PREMIUM-TECH-001'], // Dell XPS 15 - mehrere Lieferanten
    'DELL-OPTIPLEX-7090-001': ['DELL-DIRECT-001', 'BUSINESS-SOLUTIONS-001'], // Dell OptiPlex - Business Lieferanten
    
    // Apple Produkte - mehrere Lieferanten möglich
    'APPLE-MBA-M2-001': ['APPLE-AUTHORIZED-001', 'PREMIUM-TECH-001'], // MacBook Air M2 - Apple + Premium Lieferant
    'APPLE-MBP-16-M3-001': ['APPLE-AUTHORIZED-001', 'PREMIUM-TECH-001'], // MacBook Pro 16 - Apple + Premium Lieferant
    'APPLE-IPHONE17PRO-001': ['APPLE-AUTHORIZED-001', 'MOBILE-EXPERTS-001', 'TECH-CORP-001'], // iPhone 17 Pro - mehrere Lieferanten
    'APPLE-IPHONE17PROMAX-001': ['APPLE-AUTHORIZED-001', 'MOBILE-EXPERTS-001'], // iPhone 17 Pro Max - Apple + Mobile Lieferant
    'APPLE-IPADPRO-129-001': ['APPLE-AUTHORIZED-001', 'TECH-CORP-001'], // iPad Pro - Apple + Tech Lieferant
    'APPLE-AIRPODS-PRO2-001': ['APPLE-AUTHORIZED-001', 'MOBILE-EXPERTS-001'], // AirPods Pro - Apple + Mobile Lieferant
    'APPLE-WATCH-S9-001': ['APPLE-AUTHORIZED-001', 'MOBILE-EXPERTS-001'], // Apple Watch - Apple + Mobile Lieferant
    
    // Samsung Produkte - mehrere Lieferanten möglich
    'SAMSUNG-27-4K-001': ['SAMSUNG-OFFICIAL-001', 'DISPLAY-SPECIALISTS-001', 'TECH-CORP-001'], // Samsung Monitor - mehrere Lieferanten
    'SAMSUNG-GALAXY-TABS9-001': ['SAMSUNG-OFFICIAL-001', 'MOBILE-EXPERTS-001'], // Samsung Galaxy Tab - Samsung + Mobile Lieferant
    'SAMSUNG-GALAXY-WATCH6-001': ['SAMSUNG-OFFICIAL-001', 'MOBILE-EXPERTS-001'], // Samsung Galaxy Watch - Samsung + Mobile Lieferant
    
    // HP Produkte
    'HP-ELITEBOOK-850-001': ['HP-OFFICIAL-001', 'BUSINESS-SOLUTIONS-001', 'TECH-CORP-001'], // HP EliteBook - mehrere Lieferanten
    
    // Lenovo Produkte
    'LENOVO-THINKPAD-X1-001': ['LENOVO-OFFICIAL-001', 'BUSINESS-SOLUTIONS-001', 'TECH-CORP-001'], // Lenovo ThinkPad - mehrere Lieferanten
    
    // LG Produkte
    'LG-ULTRAWIDE-34-001': ['LG-OFFICIAL-001', 'DISPLAY-SPECIALISTS-001'], // LG UltraWide Monitor - LG + Display Lieferant
    
    // Microsoft Produkte
    'MS-SURFACE-PRO9-001': ['MS-OFFICIAL-001', 'TECH-CORP-001', 'BUSINESS-SOLUTIONS-001'], // Microsoft Surface - mehrere Lieferanten
    
    // Sony Produkte
    'SONY-WH1000XM5-001': ['SONY-OFFICIAL-001', 'AUDIO-SPECIALISTS-001'], // Sony Kopfhörer - Sony + Audio Lieferant
    
    // Logitech Produkte
    'LOGITECH-MX-MASTER3S-001': ['LOGITECH-OFFICIAL-001', 'PERIPHERALS-001'], // Logitech Maus - Logitech + Peripherals Lieferant
    
    // Keychron Produkte
    'KEYCHRON-K8-PRO-001': ['KEYCHRON-OFFICIAL-001', 'PERIPHERALS-001'], // Keychron Tastatur - Keychron + Peripherals Lieferant
    
    // Baustellen-Materialien (Paket-Einheiten)
    'SCHRAUBEN-M6X20-001': ['BAUSTOFFE-001', 'HARDWARE-001'], // Schraubenpaket - Baustoffe + Hardware Lieferant
    'DUEBEL-8MM-001': ['BAUSTOFFE-001', 'HARDWARE-001'], // Dübelpaket - Baustoffe + Hardware Lieferant
    'KLEBER-MONTAGE-001': ['BAUSTOFFE-001', 'CHEMIE-001'], // Kleberpaket - Baustoffe + Chemie Lieferant
    'KABEL-NYM-3X25-001': ['ELEKTRO-001', 'BAUSTOFFE-001'], // Kabelpaket - Elektro + Baustoffe Lieferant
  };

  // Lieferanten-Details für bessere Anzeige
  const supplierDetails: { [key: string]: { name: string; description: string } } = {
    // Dell Lieferanten
    'DELL-DIRECT-001': { name: 'Dell Direct', description: 'Offizieller Dell Lieferant' },
    
    // Apple Lieferanten
    'APPLE-AUTHORIZED-001': { name: 'Apple Authorized', description: 'Autorisierter Apple Partner' },
    
    // Samsung Lieferanten
    'SAMSUNG-OFFICIAL-001': { name: 'Samsung Official', description: 'Offizieller Samsung Partner' },
    
    // HP Lieferanten
    'HP-OFFICIAL-001': { name: 'HP Official', description: 'Offizieller HP Partner' },
    
    // Lenovo Lieferanten
    'LENOVO-OFFICIAL-001': { name: 'Lenovo Official', description: 'Offizieller Lenovo Partner' },
    
    // LG Lieferanten
    'LG-OFFICIAL-001': { name: 'LG Official', description: 'Offizieller LG Partner' },
    
    // Microsoft Lieferanten
    'MS-OFFICIAL-001': { name: 'Microsoft Official', description: 'Offizieller Microsoft Partner' },
    
    // Sony Lieferanten
    'SONY-OFFICIAL-001': { name: 'Sony Official', description: 'Offizieller Sony Partner' },
    
    // Logitech Lieferanten
    'LOGITECH-OFFICIAL-001': { name: 'Logitech Official', description: 'Offizieller Logitech Partner' },
    
    // Keychron Lieferanten
    'KEYCHRON-OFFICIAL-001': { name: 'Keychron Official', description: 'Offizieller Keychron Partner' },
    
    // Spezialisierte Lieferanten
    'TECH-CORP-001': { name: 'Tech Corp', description: 'Technologie Großhändler' },
    'BUSINESS-SOLUTIONS-001': { name: 'Business Solutions', description: 'B2B Spezialist' },
    'PREMIUM-TECH-001': { name: 'Premium Tech', description: 'Premium Technologie Lieferant' },
    'MOBILE-EXPERTS-001': { name: 'Mobile Experts', description: 'Mobilfunk Spezialist' },
    'DISPLAY-SPECIALISTS-001': { name: 'Display Specialists', description: 'Monitor Spezialist' },
    'AUDIO-SPECIALISTS-001': { name: 'Audio Specialists', description: 'Audio Equipment Spezialist' },
    'PERIPHERALS-001': { name: 'Peripherals Pro', description: 'Peripheriegeräte Spezialist' },
    
    // Baustoff-Lieferanten
    'BAUSTOFFE-001': { name: 'Baustoffe GmbH', description: 'Baustoffe und Baumaterialien' },
    'HARDWARE-001': { name: 'Hardware Pro', description: 'Schrauben, Dübel und Befestigungstechnik' },
    'CHEMIE-001': { name: 'Chemie & Kleber', description: 'Kleber, Dichtstoffe und Chemieprodukte' },
    'ELEKTRO-001': { name: 'Elektro-Spezialist', description: 'Kabel, Elektroinstallation und Zubehör' },
  };
  const [submitting, setSubmitting] = useState(false);
  const [erfassungstyp, setErfassungstyp] = useState('Bestellung');
  
  // Modal states
  const [supplierDialogVisible, setSupplierDialogVisible] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [orderAssignments, setOrderAssignments] = useState<OrderAssignment[]>([]);
  const [erfassungstypDialogVisible, setErfassungstypDialogVisible] = useState(false);
  const [projectsModalVisible, setProjectsModalVisible] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [currentItemIndexForProductSelection, setCurrentItemIndexForProductSelection] = useState<number | null>(null);
  const [currentItemIndexForScanner, setCurrentItemIndexForScanner] = useState<number | null>(null);
  
  // States für unbekannte Artikel
  const [unknownProductDialogVisible, setUnknownProductDialogVisible] = useState(false);
  const [unknownProductSKU, setUnknownProductSKU] = useState('');
  const [unknownProductItemIndex, setUnknownProductItemIndex] = useState<number | null>(null);
  const [unknownProductName, setUnknownProductName] = useState('');
  const [unknownProductPrice, setUnknownProductPrice] = useState('0');
  const [unknownProductLocationStock, setUnknownProductLocationStock] = useState('0');
  const [unknownProductUnit, setUnknownProductUnit] = useState('Stück');
  const [createProductUnitPickerVisible, setCreateProductUnitPickerVisible] = useState(false);
  const createProductUnitOptions = [
    'Stück',
    'Liter (L)',
    'Meter (m)',
    'Quadratmeter (m2)',
    'Kubikmeter (m3)',
    'Pakete',
    'Kilogramm (kg)',
  ];
  const [creatingProduct, setCreatingProduct] = useState(false);
  const toDisplayUnit = useCallback((unit?: string) => {
    if (!unit) {
      return 'Stück';
    }
    const lower = unit.toLowerCase();
    if (lower === 'paket') {
      return 'Paket';
    }
    if (lower === 'palette') {
      return 'Palette';
    }
    if (lower === 'stück') {
      return 'Stück';
    }
    if (lower.length === 0) {
      return 'Stück';
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }, []);
  const defaultMockOrders = useMemo(
    () => [
      { id: 'PO-2025-001', orderNumber: 'PO-2025-001', supplier: 'Lieferant A', orderDate: '2025-01-15T00:00:00Z', status: 'Offen', items: 5, assignedItemCount: 5 },
      { id: 'PO-2025-002', orderNumber: 'PO-2025-002', supplier: 'Lieferant B', orderDate: '2025-01-14T00:00:00Z', status: 'Teilweise geliefert', items: 3, assignedItemCount: 3 },
      { id: 'PO-2025-003', orderNumber: 'PO-2025-003', supplier: 'Lieferant C', orderDate: '2025-01-13T00:00:00Z', status: 'Offen', items: 3, assignedItemCount: 3 },
      { id: 'PO-2025-004', orderNumber: 'PO-2025-004', supplier: 'Lieferant A', orderDate: '2025-01-12T00:00:00Z', status: 'Offen', items: 3, assignedItemCount: 3 },
      { id: 'PO-2025-005', orderNumber: 'PO-2025-005', supplier: 'Lieferant D', orderDate: '2025-01-11T00:00:00Z', status: 'Abgeschlossen', items: 3, assignedItemCount: 3 },
      { id: 'ORD-001', orderNumber: 'ORD-001', supplier: 'Lieferant B', orderDate: '2025-01-10T00:00:00Z', status: 'Offen', items: 3, assignedItemCount: 3 },
      { id: 'ORD-002', orderNumber: 'ORD-002', supplier: 'Lieferant C', orderDate: '2025-01-09T00:00:00Z', status: 'Offen', items: 3, assignedItemCount: 3 },
      { id: 'BEST-2025-100', orderNumber: 'BEST-2025-100', supplier: 'Lieferant A', orderDate: '2025-01-08T00:00:00Z', status: 'Offen', items: 3, assignedItemCount: 3 },
    ],
    []
  );

  // Erfassungstypen
  const erfassungstypen = ['Bestellung', 'Projekt (Baustelle)', 'Lager', 'Ohne Bestellung'];

  const loadWareneingaenge = async () => {
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated && isOnline) {
        // Load from API
        const apiWareneingaenge = await apiService.getWareneingaenge();
        setWareneingaenge(apiWareneingaenge);
        
        // Save to local database
        for (const wareneingang of apiWareneingaenge) {
          await databaseService.saveWareneingang(wareneingang);
        }
      } else {
        // Load from local database
        const localWareneingaenge = await databaseService.getWareneingaenge();
        setWareneingaenge(localWareneingaenge);
      }
    } catch (error) {
      // Fallback to local database
      try {
        const localWareneingaenge = await databaseService.getWareneingaenge();
        setWareneingaenge(localWareneingaenge);
        setIsOnline(false);
      } catch (localError) {
        Alert.alert('Fehler', 'Wareneingänge konnten nicht geladen werden.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated && isOnline) {
        // Load from API first
        const apiProducts = await apiService.getProducts();
        setAllProducts(apiProducts);
        
        // Save to local database
        for (const product of apiProducts) {
          await databaseService.saveProduct(product);
        }
      } else {
        // Load from local database
        const localProducts = await databaseService.getProducts();
        setAllProducts(localProducts);
      }
    } catch (error) {
      // Fallback to local database
      try {
        const localProducts = await databaseService.getProducts();
        setAllProducts(localProducts);
        setIsOnline(false);
      } catch (localError) {
        // Use empty array as last resort
        setAllProducts([]);
        setIsOnline(false);
      }
    }
  };

  const loadUserLagerort = async () => {
    try {
      const user = await apiService.getStoredUser();
      if (user && user.locations && user.locations.length > 0) {
        setUserLocations(user.locations);
        // Wenn User Locations hat
        if (user.locations.length === 1) {
          // Nur ein Lagerort - automatisch setzen
          const singleLocation = user.locations[0];
          setUserLagerort(singleLocation);
          setLagerort(singleLocation);
        } else {
          // Mehrere Lagerorte - ersten als Standard setzen, aber Dropdown zeigen
          const firstLocation = user.locations[0];
          setUserLagerort(firstLocation);
          setLagerort(firstLocation);
        }
      } else {
        // Kein Lagerort zugewiesen
        setUserLocations([]);
        setUserLagerort('');
        setLagerort('');
      }
    } catch (error) {
      setUserLocations([]);
      setUserLagerort('');
      setLagerort('');
    }
  };

  const loadAllLocations = async () => {
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated) {
        // Load all users to get all locations
        const users = await apiService.getUsers();
        const locationsSet = new Set<string>();
        
        users.forEach((user: any) => {
          if (user.locations) {
            // Handle both array and string formats
            if (Array.isArray(user.locations)) {
              user.locations.forEach((loc: string) => {
                if (loc && loc.trim()) {
                  locationsSet.add(loc.trim());
                }
              });
            } else if (typeof user.locations === 'string') {
              // Split comma-separated locations
              user.locations.split(',').forEach((loc: string) => {
                if (loc && loc.trim()) {
                  locationsSet.add(loc.trim());
                }
              });
            }
          }
        });
        
        const allLocs = Array.from(locationsSet).sort();
        setAllLocations(allLocs);
      } else {
        // Fallback: use user locations
        setAllLocations(userLocations);
      }
    } catch (error) {
      // Fallback: use user locations
      setAllLocations(userLocations);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWareneingaenge();
      loadProducts(); // Produkte beim Laden des Screens laden
      loadUserLagerort(); // Lagerort des Benutzers laden
      loadAllLocations(); // Alle Lagerorte für "Nach Lagerort" laden
    }, [])
  );



  // Scanner functions - Temporäre Mock-Implementierung
  const requestCameraPermission = async () => {
    // Temporäre Mock-Implementierung
    return true;
  };

  const openScanner = async () => {
    try {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        setScannerVisible(true);
      } else {
        Alert.alert('Berechtigung erforderlich', 'Kamera-Berechtigung ist für das Scannen erforderlich.');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Kamera-Berechtigung konnte nicht angefordert werden.');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (currentItemIndexForScanner !== null) {
      // Update item in array
      const newItems = [...items];
      newItems[currentItemIndexForScanner].artikelnummer = data;
      setItems(newItems);
      handleArtikelnummerChange(data, currentItemIndexForScanner);
    } else {
      // Legacy: single item mode
      setArtikelnummer(data);
      searchProductBySKU(data);
    }
    setScannerVisible(false);
    setCurrentItemIndexForScanner(null);
  };

  const searchProductBySKU = async (sku: string) => {
    try {
      const products = await apiService.getProducts();
      const product = products.find(p => p.sku === sku.trim());
      
      if (product) {
        setSelectedProduct(product);
        setSelectedUnit(product.unit || 'Stück');
      } else {
        // Artikel nicht gefunden - Dialog zum Erstellen anzeigen
        setUnknownProductSKU(sku.trim());
        setUnknownProductItemIndex(null); // null bedeutet Legacy-Modus
        setUnknownProductName('');
        setUnknownProductPrice('0');
        setUnknownProductUnit('Stück');
  setCreateProductUnitPickerVisible(false);
        setUnknownProductDialogVisible(true);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Produkt konnte nicht gesucht werden.');
    }
  };

  const openSupplierSearch = async () => {
    setSupplierName('');
    setSupplierDialogVisible(true);
  };

  const handleSupplierSearch = async () => {
    if (supplierName.trim()) {
      setSupplierDialogVisible(false);
      await searchOrdersBySupplier(supplierName.trim());
    }
  };

  const formatOrderDateForDisplay = (value?: string) => {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('de-DE');
  };

  const loadOrderAssignments = useCallback(
    async (orderId?: number, orderNumber?: string) => {
      if (erfassungstyp !== 'Bestellung') {
        setOrderAssignments([]);
        return;
      }

      let effectiveOrderId = orderId;
      const trimmedOrderNumber = (orderNumber || referenz).trim();

      try {
        if (!effectiveOrderId && trimmedOrderNumber.length > 0) {
          const ordersFromApi = await apiService.getOrders(trimmedOrderNumber);
          setIsOnline(true);
          const match =
            ordersFromApi.find(o => o.orderNumber.toLowerCase() === trimmedOrderNumber.toLowerCase()) ||
            ordersFromApi[0];

          if (match) {
            effectiveOrderId = match.id;
            setSelectedOrder(prev => (prev && prev.id === match.id ? prev : match));
          }
        }

        if (!effectiveOrderId) {
          setOrderAssignments([]);
          return;
        }

        const assignments = await apiService.getOrderAssignments(effectiveOrderId);
        setIsOnline(true);
    const normalizedAssignments = assignments
      .map(assignment => ({
        ...assignment,
        createdAt: assignment.createdAt || (assignment as any).CreatedAt || new Date().toISOString(),
      }))
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || new Date().toISOString()).getTime();
        const timeB = new Date(b.createdAt || new Date().toISOString()).getTime();
        return timeA - timeB;
      });
        setOrderAssignments(normalizedAssignments);
        setSelectedOrder(prev =>
          prev ? { ...prev, assignedItemCount: normalizedAssignments.length } : prev
        );
      } catch (error) {
        console.error('Fehler beim Laden der Bestellzuweisungen:', error);
        setOrderAssignments([]);
        setIsOnline(false);
      }
    },
    [erfassungstyp, referenz]
  );

  const loadProjectAssignments = useCallback(
    async (projectKey?: string) => {
      if (erfassungstyp !== 'Projekt (Baustelle)') {
        setProjectAssignments([]);
        return;
      }

      const trimmedKey = (projectKey ?? projektnummer).trim();

      if (!trimmedKey) {
        setProjectAssignments([]);
        return;
      }

      try {
        const assignments = await apiService.getProjectAssignments(trimmedKey);
        setIsOnline(true);
        const normalizedAssignments = assignments
          .map(assignment => ({
            ...assignment,
            createdAt: assignment.createdAt || new Date().toISOString(),
          }))
          .sort((a, b) => {
            const timeA = new Date(a.createdAt || new Date().toISOString()).getTime();
            const timeB = new Date(b.createdAt || new Date().toISOString()).getTime();
            return timeA - timeB;
          });

        setProjectAssignments(normalizedAssignments);
      } catch (error) {
        console.error('Fehler beim Laden der Projektzuweisungen:', error);
        setProjectAssignments([]);
        setIsOnline(false);
      }
    },
    [erfassungstyp, projektnummer]
  );

  const searchOrdersBySupplier = async (supplierName: string) => {
    try {
      const trimmedSupplier = supplierName.trim();
      if (!trimmedSupplier) {
        return;
      }

      let fetchedOrders: any[] = [];

      try {
        const ordersFromApi = await apiService.getOrders();
        setIsOnline(true);
        const lowerSupplier = trimmedSupplier.toLowerCase();
        fetchedOrders = ordersFromApi
          .filter(order => order.supplier?.toLowerCase().includes(lowerSupplier))
          .map(order => {
            const count = order.assignedItemCount ?? 0;
            return {
              ...order,
              date: formatOrderDateForDisplay(order.orderDate),
              assignedItemCount: count,
              items: count,
            };
          });
      } catch (error) {
        console.error('Fehler beim Laden der Bestellungen aus dem Backend:', error);
        setIsOnline(false);
      }

      if (fetchedOrders.length === 0) {
        const fallback = defaultMockOrders
          .filter(order =>
            order.supplier?.toLowerCase().includes(trimmedSupplier.toLowerCase())
          )
          .map(order => ({
            ...order,
            date: formatOrderDateForDisplay(order.orderDate),
            assignedItemCount: order.assignedItemCount ?? order.items ?? 0,
            items: order.items ?? order.assignedItemCount ?? 0,
          }));

        if (fallback.length === 0) {
        Alert.alert('Keine Bestellungen', `Keine Bestellungen für Lieferant "${supplierName}" gefunden.`);
        return;
      }

        fetchedOrders = fallback;
      }

      setOrders(fetchedOrders);
      setOrdersModalVisible(true);
    } catch (error) {
      Alert.alert('Fehler', 'Bestellungen konnten nicht geladen werden.');
    }
  };

  const selectOrder = async (order: any) => {
    // 1:1 Beziehung - nur ein Lieferant pro Bestellung
    const supplier = order.supplier || '';

    const orderNumber = order.orderNumber || order.id || order.referenz || '';
    const numericOrderId =
      typeof order.id === 'number'
        ? order.id
        : typeof order.orderId === 'number'
        ? order.orderId
        : undefined;
    const inferredCount =
      typeof order.assignedItemCount === 'number'
        ? order.assignedItemCount
        : typeof order.items === 'number'
        ? order.items
        : orderAssignments.length;

    setReferenz(orderNumber);
    setOrdersModalVisible(false);
    
    if (erfassungstyp === 'Projekt (Baustelle)') {
      setLieferant('');
      setAvailableSuppliersForOrder([]);
      setSupplierDropdownVisible(false);
      setSupplierSelectionDialogVisible(false);
    } else {
      // 1:1 Beziehung - automatisch den Lieferanten setzen
      if (supplier) {
        setLieferant(supplier);
        setAvailableSuppliersForOrder([]);
        setSupplierDropdownVisible(false);
      } else {
        setLieferant('');
        setAvailableSuppliersForOrder([]);
        setSupplierDropdownVisible(false);
      }
    }

    setSelectedOrder({
      id: numericOrderId ?? 0,
      orderNumber,
      orderDate:
        order.orderDate ||
        (order.date ? new Date(order.date).toISOString() : new Date().toISOString()),
      status: order.status,
      suppliers,
      assignedItemCount: inferredCount,
      createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
      updatedAt: order.updatedAt,
    });

    if (erfassungstyp === 'Bestellung') {
      await loadOrderAssignments(numericOrderId, orderNumber);
    }
  };

  const searchOrdersByReferenz = async (referenzText: string) => {
    try {
      const trimmedReferenz = referenzText.trim();
      let fetchedOrders: any[] = [];

      try {
        const ordersFromApi = await apiService.getOrders(trimmedReferenz);
        setIsOnline(true);
        fetchedOrders = ordersFromApi.map(order => {
          const count = order.assignedItemCount ?? 0;
          return {
            ...order,
            date: formatOrderDateForDisplay(order.orderDate),
            assignedItemCount: count,
            items: count,
          };
        });
      } catch (error) {
        console.error('Fehler beim Laden der Bestellungen nach Referenz:', error);
        setIsOnline(false);
      }

      if (trimmedReferenz.length > 0 && fetchedOrders.length === 0) {
        fetchedOrders = defaultMockOrders
          .filter(order =>
            order.orderNumber.toLowerCase().includes(trimmedReferenz.toLowerCase()) ||
            (typeof order.id === 'string' && order.id.toLowerCase().includes(trimmedReferenz.toLowerCase()))
          )
          .map(order => ({
            ...order,
            date: formatOrderDateForDisplay(order.orderDate),
            assignedItemCount: order.assignedItemCount ?? order.items ?? 0,
            items: order.items ?? order.assignedItemCount ?? 0,
          }));
      } else if (trimmedReferenz.length === 0 && fetchedOrders.length === 0) {
        fetchedOrders = defaultMockOrders.map(order => ({
          ...order,
          date: formatOrderDateForDisplay(order.orderDate),
          assignedItemCount: order.assignedItemCount ?? order.items ?? 0,
          items: order.items ?? order.assignedItemCount ?? 0,
        }));
      }

      if (fetchedOrders.length === 0) {
        Alert.alert('Keine Bestellungen', `Keine Bestellungen gefunden, die "${referenzText}" enthalten.`);
        if (erfassungstyp === 'Projekt (Baustelle)') {
          setLieferant('');
        }
        return;
      }

      if (fetchedOrders.length === 1) {
        await selectOrder(fetchedOrders[0]);
        return;
      }

      setOrders(fetchedOrders);
      setOrdersModalVisible(true);
    } catch (error) {
      Alert.alert('Fehler', 'Bestellungen konnten nicht geladen werden.');
    }
  };

  const selectErfassungstyp = (typ: string) => {
    setErfassungstyp(typ);
    setErfassungstypDialogVisible(false);

    // Reset items when switching erfassungstyp (like Bestellung)
    setItems([]);
    setOrderSummaryItems([]);
    setLagerSummaryItems([]);
    setOhneBestellungSummaryItems([]);
    
    // Reset Referenz- und Bemerkung-Feld immer, wenn Erfassungstyp geändert wird
    setReferenz('');
    setBemerkung('');
    
    // Reset project-related fields when switching away from project type
    if (typ !== 'Projekt (Baustelle)') {
      setProjektnummer('');
      setSelectedProject(null);
      setProjectAssignments([]);
    } else {
      // Bei Projekt: Lieferant initial leer lassen
      setLieferant('');
      setAvailableSuppliersForOrder([]);
      setSupplierDropdownVisible(false);
      setSupplierSelectionDialogVisible(false);
    }
  };

  useEffect(() => {
    if (erfassungstyp !== 'Bestellung') {
      setSelectedOrder(null);
      setOrderAssignments([]);
      return;
    }

    if (referenz.trim().length === 0) {
      setSelectedOrder(null);
      setOrderAssignments([]);
    }
  }, [erfassungstyp, referenz]);

  useEffect(() => {
    if (erfassungstyp !== 'Projekt (Baustelle)') {
      return;
    }

    const trimmed = projektnummer.trim();
    if (!trimmed) {
      setProjectAssignments([]);
      return;
    }

    loadProjectAssignments(trimmed);
  }, [erfassungstyp, projektnummer, loadProjectAssignments]);

  // Lade Artikel für Referenz bei Erfassungstyp "Lager"
  const loadLagerItemsForReferenz = useCallback(async (referenzText: string) => {
    if (erfassungstyp !== 'Lager') {
      return;
    }

    const trimmedReferenz = referenzText.trim();
    if (!trimmedReferenz) {
      // Wenn Referenz leer ist, lösche geladene Artikel aus lagerSummaryItems
      setLagerSummaryItems(prev => prev.filter(item => !item.key.startsWith('lager-ref-')));
      return;
    }

    try {
      // Filtere Wareneingänge nach Referenz (nur Referenz, nicht nach Von/Nach Lagerort)
      const lagerWareneingaenge = wareneingaenge.filter(w => {
        if (w.erfassungstyp !== 'Lager') return false;
        if (!w.referenz) return false;
        return w.referenz.trim() === trimmedReferenz;
      });

      // Konvertiere Wareneingänge in lagerSummaryItems (als gespeicherte Artikel)
      const summaryItemsForReferenz: (AggregatedOrderItem & { quantityInput: number })[] = lagerWareneingaenge.map((w, index) => {
        const product = allProducts.find(p => p.id === w.productId);
        const nowTimestamp = w.createdAt ? new Date(w.createdAt).getTime() : Date.now();
        
        // Unterstütze sowohl 'id' als auch 'Id' (C# Konvention)
        const wareneingangId = (w as any).id ?? (w as any).Id;
        
        if (!wareneingangId) {
          console.warn('Wareneingang ohne ID gefunden:', w);
        }
        
        return {
          key: `lager-ref-${wareneingangId}-${index}`,
          productId: w.productId,
          name: product?.name || w.productName || `Artikel ${index + 1}`,
          unit: product?.unit || 'Stück',
          quantity: w.quantity,
          sku: product?.sku,
          supplier: undefined,
          type: product?.type,
          location: w.location,
          bookingHistory: [],
          itemType: 'material' as const,
          lastTimestamp: w.updatedAt ? new Date(w.updatedAt).getTime() : nowTimestamp,
          lastBookingQuantity: w.quantity,
          lastBookingUnit: product?.unit || 'Stück',
          lastBooking: undefined,
          createdAtTimestamp: nowTimestamp,
          quantityInput: w.quantity,
        };
      });

      // Kombiniere geladene Artikel mit neuen Items (die nicht aus DB geladen wurden)
      setLagerSummaryItems(prev => {
        const newItems = prev.filter(item => !item.key.startsWith('lager-ref-'));
        return [...summaryItemsForReferenz, ...newItems];
      });
    } catch (error) {
      console.error('Fehler beim Laden der Artikel für Referenz:', error);
      // Bei Fehler nur neue Items behalten
      setLagerSummaryItems(prev => prev.filter(item => !item.key.startsWith('lager-ref-')));
    }
  }, [erfassungstyp, wareneingaenge, allProducts]);

  // Lade Artikel für Referenz bei Erfassungstyp "Ohne Bestellung"
  const loadOhneBestellungItemsForReferenz = useCallback(async (referenzText: string) => {
    if (erfassungstyp !== 'Ohne Bestellung') {
      return;
    }

    const trimmedReferenz = referenzText.trim();
    if (!trimmedReferenz) {
      // Wenn Referenz leer ist, lösche geladene Artikel aus ohneBestellungSummaryItems
      setOhneBestellungSummaryItems(prev => prev.filter(item => !item.key.startsWith('ohne-bestellung-ref-')));
      return;
    }

    try {
      // Filtere Wareneingänge nach Referenz (nur Referenz, nicht nach anderen Feldern)
      const ohneBestellungWareneingaenge = wareneingaenge.filter(w => {
        if (w.erfassungstyp !== 'Ohne Bestellung') return false;
        if (!w.referenz) return false;
        return w.referenz.trim() === trimmedReferenz;
      });

      // Konvertiere Wareneingänge in ohneBestellungSummaryItems (als gespeicherte Artikel)
      const summaryItemsForReferenz: (AggregatedOrderItem & { quantityInput: number })[] = ohneBestellungWareneingaenge.map((w, index) => {
        const product = allProducts.find(p => p.id === w.productId);
        const nowTimestamp = w.createdAt ? new Date(w.createdAt).getTime() : Date.now();
        
        // Unterstütze sowohl 'id' als auch 'Id' (C# Konvention)
        const wareneingangId = (w as any).id ?? (w as any).Id;
        
        if (!wareneingangId) {
          console.warn('Wareneingang ohne ID gefunden:', w);
        }
        
        return {
          key: `ohne-bestellung-ref-${wareneingangId}-${index}`,
          productId: w.productId,
          name: product?.name || w.productName || `Artikel ${index + 1}`,
          unit: product?.unit || 'Stück',
          quantity: w.quantity,
          sku: product?.sku,
          supplier: undefined,
          type: product?.type,
          location: w.location,
          bookingHistory: [],
          itemType: 'material' as const,
          lastTimestamp: w.updatedAt ? new Date(w.updatedAt).getTime() : nowTimestamp,
          lastBookingQuantity: w.quantity,
          lastBookingUnit: product?.unit || 'Stück',
          lastBooking: undefined,
          createdAtTimestamp: nowTimestamp,
          quantityInput: w.quantity,
        };
      });

      // Kombiniere geladene Artikel mit neuen Items (die nicht aus DB geladen wurden)
      setOhneBestellungSummaryItems(prev => {
        const newItems = prev.filter(item => !item.key.startsWith('ohne-bestellung-ref-'));
        return [...summaryItemsForReferenz, ...newItems];
      });
    } catch (error) {
      console.error('Fehler beim Laden der Artikel für Referenz:', error);
      // Bei Fehler nur neue Items behalten
      setOhneBestellungSummaryItems(prev => prev.filter(item => !item.key.startsWith('ohne-bestellung-ref-')));
    }
  }, [erfassungstyp, wareneingaenge, allProducts]);

  useEffect(() => {
    if (erfassungstyp !== 'Lager') {
      setItems([]);
      setLagerSummaryItems([]);
      return;
    }

    loadLagerItemsForReferenz(referenz);
  }, [erfassungstyp, referenz, loadLagerItemsForReferenz]);

  // Lade Artikel neu, wenn wareneingaenge aktualisiert wird und eine Referenz vorhanden ist
  useEffect(() => {
    if (erfassungstyp !== 'Lager') {
      return;
    }

    if (referenz.trim().length > 0) {
      loadLagerItemsForReferenz(referenz);
    }
  }, [wareneingaenge, erfassungstyp, referenz, loadLagerItemsForReferenz]);

  useEffect(() => {
    if (erfassungstyp !== 'Ohne Bestellung') {
      setItems([]);
      setOhneBestellungSummaryItems([]);
      return;
    }

    loadOhneBestellungItemsForReferenz(referenz);
  }, [erfassungstyp, referenz, loadOhneBestellungItemsForReferenz]);

  // Lade Artikel neu, wenn wareneingaenge aktualisiert wird und eine Referenz vorhanden ist
  useEffect(() => {
    if (erfassungstyp !== 'Ohne Bestellung') {
      return;
    }

    if (referenz.trim().length > 0) {
      loadOhneBestellungItemsForReferenz(referenz);
    }
  }, [wareneingaenge, erfassungstyp, referenz, loadOhneBestellungItemsForReferenz]);


  const openProjectSearch = () => {
    setProjectsModalVisible(true);
    // Mock projects data - in real app, this would come from API
    const allProjects = [
      { 
        id: 1, 
        name: 'PROJ-2025-001', 
        description: 'Bürogebäude München',
        startDate: '2025-01-15',
        endDate: '2025-12-31',
        status: 'Aktiv'
      },
      { 
        id: 2, 
        name: 'PROJ-2025-002', 
        description: 'Wohnkomplex Berlin',
        startDate: '2025-03-01',
        endDate: '2025-06-30',
        status: 'Aktiv'
      },
      { 
        id: 3, 
        name: 'PROJ-2025-003', 
        description: 'Industriehalle Hamburg',
        startDate: '2025-02-10',
        endDate: '2025-11-15',
        status: 'Pausiert'
      },
      { 
        id: 4, 
        name: 'PROJ-2025-004', 
        description: 'Schule Köln',
        startDate: '2025-04-01',
        endDate: '2025-03-31',
        status: 'Aktiv'
      },
      { 
        id: 5, 
        name: 'PROJ-2025-005', 
        description: 'Krankenhaus Frankfurt',
        startDate: '2023-11-01',
        endDate: '2025-10-31',
        status: 'Abgeschlossen'
      },
    ];

    // Filter projects based on entered project number
    if (projektnummer.trim()) {
      const filteredProjects = allProjects.filter(project => 
        project.name.toLowerCase().includes(projektnummer.toLowerCase()) ||
        project.description.toLowerCase().includes(projektnummer.toLowerCase())
      );
      setProjects(filteredProjects);
    } else {
      setProjects(allProjects);
    }
  };

  const selectProject = (project: any) => {
    setProjektnummer(project.name);
    setSelectedProject(project);
    setProjectsModalVisible(false);
    // Reset items when selecting a project to show project materials
    setItems([]);
    loadProjectAssignments(project.name);
  };

  const addNewItem = useCallback(() => {
    if (erfassungstyp === 'Projekt (Baustelle)' && !projektnummer.trim()) {
      Alert.alert('Hinweis', 'Bitte wählen Sie zuerst ein Projekt aus.');
      return;
    }

    setItems((prevItems) => [
      ...prevItems,
      {
        id: Date.now().toString(),
        artikelnummer: '',
          anzahl: erfassungstyp === 'Bestellung' ? '0' : '1',
        selectedProduct: null,
        selectedUnit: '',
      },
    ]);
  }, [erfassungstyp, projektnummer]);

  const renderItemForms = () => {
    if (items.length === 0) {
      // Leerer Zustand für Erfassungstyp "Lager" - nur wenn keine Artikel in items UND lagerSummaryItems
      if (erfassungstyp === 'Lager' && lagerSummaryItems.length === 0) {
      return (
        <View style={styles.emptyState}>
                <Paragraph style={styles.emptyStateText}>
              Keine Artikel hinzugefügt. Klicken Sie auf '+ Artikel hinzufügen' um zu beginnen.
                </Paragraph>
            <Button
              mode="contained"
              icon="plus"
              onPress={addNewItem}
              style={[styles.addButton, { marginTop: 16 }]}
              buttonColor={BRAND_LIGHT_BLUE}
            >
              Artikel hinzufügen
            </Button>
        </View>
      );
      }
      // Leerer Zustand für Erfassungstyp "Ohne Bestellung" - nur wenn keine Artikel in items UND ohneBestellungSummaryItems
      if (erfassungstyp === 'Ohne Bestellung' && ohneBestellungSummaryItems.length === 0) {
      return (
        <View style={styles.emptyState}>
                <Paragraph style={styles.emptyStateText}>
              Keine Artikel hinzugefügt. Klicken Sie auf '+ Artikel hinzufügen' um zu beginnen.
                </Paragraph>
            <Button
              mode="contained"
              icon="plus"
              onPress={addNewItem}
              style={[styles.addButton, { marginTop: 16 }]}
              buttonColor={BRAND_LIGHT_BLUE}
            >
              Artikel hinzufügen
            </Button>
        </View>
      );
      }
      return null;
    }

    const renderFormForItem = (item: WareneingangItem, index: number) => {
      const originalIndex = items.indexOf(item);
      const quantityValue = parseQuantityInput(item.anzahl) || 0;

      return (
        <Card key={item.id} style={styles.itemFormCard}>
          <Card.Content>
          <View style={styles.itemHeader}>
            <Title style={styles.itemTitle}>
              {item.selectedProduct?.name
                ? `${item.selectedProduct.name}${item.selectedProduct.isUnknown || (item as any).isUnknownProduct ? ' (Unbekannter Artikel)' : ''}`
                : `Artikel ${originalIndex + 1}`}
            </Title>
            <View style={styles.itemHeaderButtons}>
                <IconButton
                  icon="content-save"
                  size={24}
                iconColor={
                  erfassungstyp === 'Bestellung' &&
                  (quantityValue <= 0 || !item.selectedProduct)
                    ? '#9e9e9e'
                    : BRAND_DARK_BLUE
                }
                disabled={
                  erfassungstyp === 'Bestellung' &&
                  (quantityValue <= 0 || !item.selectedProduct)
                }
                onPress={() => handleSaveItem(originalIndex)}
                  style={styles.iconButton}
                />
              <IconButton
                icon="close"
                size={24}
                iconColor="#d32f2f"
                onPress={() => {
                  const articleName = item.selectedProduct?.name || `Artikel ${originalIndex + 1}`;
                  Alert.alert(
                    'Artikel löschen',
                    `Möchten Sie wirklich "${articleName}" löschen?`,
                    [
                      {
                        text: 'Abbrechen',
                        style: 'cancel',
                      },
                      {
                        text: 'Löschen',
                        style: 'destructive',
                        onPress: () => {
                          setItems(items.filter((_, i) => i !== originalIndex));
                        },
                      },
                    ],
                  );
                }}
                style={styles.iconButton}
              />
            </View>
          </View>

          {/* Artikelnummer */}
          <View style={styles.formField}>
            <Paragraph style={styles.fieldLabel}>Artikelnummer:</Paragraph>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.artikelnummerInput}
                value={item.artikelnummer}
                onChangeText={(text) => {
                  const newItems = [...items];
                  newItems[originalIndex].artikelnummer = text;
                  setItems(newItems);
                  handleArtikelnummerChange(text, originalIndex);
                }}
                placeholder="z.B. DELL-XPS13-001"
                mode="outlined"
                dense
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <IconButton
                icon="magnify"
                size={24}
                iconColor={BRAND_DARK_BLUE}
                onPress={async () => {
                  try {
                    if (allProducts.length === 0) {
                      await loadProducts();
                    }
                    setCurrentItemIndexForProductSelection(originalIndex);
                    setProductsModalVisible(true);
                  } catch (error) {
                  }
                }}
                style={styles.iconButton}
              />
              <IconButton
                icon="barcode-scan"
                size={24}
                iconColor={BRAND_DARK_BLUE}
                onPress={async () => {
                  setCurrentItemIndexForScanner(originalIndex);
                  await openScanner();
                }}
                style={styles.iconButton}
              />
            </View>
          </View>

          {/* Anzahl und Einheit */}
          <View style={styles.formField}>
            <View style={styles.quantityAndUnitContainer}>
              {/* Anzahl Spalte */}
              <View style={styles.columnContainer}>
                <Paragraph style={styles.fieldLabel}>Menge:</Paragraph>
                <View style={styles.quantityContainer}>
                  <IconButton
                    icon="minus"
                    mode="contained"
                    size={20}
                    onPress={() => {
                      const newItems = [...items];
                      const current = parseFloat(newItems[originalIndex].anzahl.replace(',', '.')) || 0;
                      const step = item.selectedUnit === 'Paket' ? 0.1 : 1;
                      const minValue = erfassungstyp === 'Bestellung' ? 0 : 1;
                      const newValue = Math.max(minValue, current - step);
                      const formattedValue =
                        item.selectedUnit === 'Paket'
                          ? newValue.toFixed(1).replace('.', ',')
                          : Math.round(newValue).toString();
                      newItems[originalIndex].anzahl = formattedValue;
                      setItems(newItems);
                    }}
                    style={styles.quantityButton}
                    iconColor="white"
                  />
                  <TextInput
                    style={styles.quantityInput}
                    value={item.anzahl}
                    onChangeText={(text) => {
                      const newItems = [...items];
                      const numericValue = parseQuantityInput(text);
                      const minValue = erfassungstyp === 'Bestellung' ? 0 : 1;
                      const clampedValue = Math.max(minValue, numericValue);
                      const formattedValue =
                        item.selectedUnit === 'Paket'
                          ? clampedValue.toFixed(1).replace('.', ',')
                          : Math.round(clampedValue).toString();
                      newItems[originalIndex].anzahl = formattedValue;
                      setItems(newItems);
                    }}
                    mode="outlined"
                    dense
                    keyboardType="numeric"
                  />
                  <IconButton
                    icon="plus"
                    mode="contained"
                    size={20}
                    onPress={() => {
                      const newItems = [...items];
                      const current = parseFloat(newItems[originalIndex].anzahl.replace(',', '.')) || 0;
                      const step = item.selectedUnit === 'Paket' ? 0.1 : 1;
                      const newValue = current + step;
                      const formattedValue =
                        item.selectedUnit === 'Paket'
                          ? newValue.toFixed(1).replace('.', ',')
                          : Math.round(newValue).toString();
                      newItems[originalIndex].anzahl = formattedValue;
                      setItems(newItems);
                    }}
                    style={styles.quantityButton}
                    iconColor="white"
                  />
                </View>
              </View>

              {/* Einheit Spalte */}
                {(item.selectedProduct || item.artikelnummer.trim().length > 0) && (
                <View style={styles.columnContainer}>
                  <Paragraph style={styles.fieldLabel}>Einheit:</Paragraph>
                  <Menu
                    visible={unitMenuVisible && currentItemIndexForProductSelection === originalIndex}
                    onDismiss={() => {
                      setUnitMenuVisible(false);
                      // Reset after a small delay to ensure menu can reopen
                      setTimeout(() => {
                        if (currentItemIndexForProductSelection === originalIndex) {
                          setCurrentItemIndexForProductSelection(null);
                        }
                      }, 100);
                    }}
                    anchor={
                      <TouchableOpacity
                        style={styles.unitDropdownButton}
                        onPress={() => {
                          // If menu is already open for this item, close it first
                          if (unitMenuVisible && currentItemIndexForProductSelection === originalIndex) {
                            setUnitMenuVisible(false);
                            setCurrentItemIndexForProductSelection(null);
                          } else {
                            // Set index first, then open menu
                            setCurrentItemIndexForProductSelection(originalIndex);
                            setTimeout(() => {
                              setUnitMenuVisible(true);
                            }, 50);
                          }
                        }}
                      >
                        <Paragraph style={styles.unitDropdownText}>
                          {item.selectedUnit || item.selectedProduct?.unit || 'Stück'}
                        </Paragraph>
                        <MaterialCommunityIcons 
                          name="chevron-down" 
                          size={20} 
                          color={BRAND_DARK_BLUE} 
                        />
                      </TouchableOpacity>
                    }
                  >
                    {(() => {
                        const units = ['Stück', 'Palette'];
                      if (item.selectedProduct?.unit && !units.includes(item.selectedProduct.unit)) {
                        units.push(item.selectedProduct.unit);
                      }
                      if (erfassungstyp === 'Bestellung') {
                        if (!units.includes('Palette')) units.push('Palette');
                        if (!units.includes('Paket')) units.push('Paket');
                      }
                      return units.map((unit) => (
                        <Menu.Item
                          key={unit}
                          onPress={() => {
                            const newItems = [...items];
                            newItems[originalIndex].selectedUnit = unit;
                            newItems[originalIndex].anzahl = '0';
                            setItems(newItems);
                            setUnitMenuVisible(false);
                            setCurrentItemIndexForProductSelection(null);
                          }}
                          title={unit}
                          titleStyle={styles.menuItemText}
                        />
                      ));
                    })()}
                  </Menu>
                </View>
              )}
            </View>

            {/* Palette-Umrechnungshinweis */}
            {item.selectedProduct && item.selectedUnit === 'Palette' && (
              <View style={styles.paletteInfoContainer}>
                <Paragraph style={styles.paletteInfoText}>
                  * 1 Palette = 80 Stück
                </Paragraph>
              </View>
            )}

            {/* Paket-Hinweis */}
            {item.selectedProduct && item.selectedUnit === 'Paket' && (
              <View style={styles.paletteInfoContainer}>
                <Paragraph style={styles.paletteInfoText}>
                  * Dezimalzahlen möglich (z.B. 0,5 für halbes Paket)
                </Paragraph>
              </View>
            )}
          </View>
          </Card.Content>
        </Card>
      );
    };

    return getFilteredItems().map(renderFormForItem);
  };

  // Load project materials and devices from wareneingaenge and project assignments
  const loadProjectMaterials = useCallback(() => {
    const trimmedProject = projektnummer.trim();

    if (!trimmedProject) {
      setProjectMaterials([]);
      setProjectDevices([]);
      return;
    }
    
    const projectWareneingaenge = wareneingaenge.filter(w => {
      if (w.erfassungstyp !== 'Projekt (Baustelle)') {
        return false;
      }

      const referenzMatch =
        (w.notes?.includes(`Projekt: ${trimmedProject}`) ?? false) ||
        w.referenz === trimmedProject ||
        (w.referenz?.includes(trimmedProject) ?? false);

      return referenzMatch;
    });

    const materialsMap: { [key: string]: any } = {};
    const devicesMap: { [key: string]: any } = {};
    
    projectWareneingaenge.forEach(w => {
      const info = getProjectWareneingangInfo(w);
      const mapKey = info.aggregationKey;

      if (info.itemType === 'material') {
        if (!materialsMap[mapKey]) {
          const createdAtTimestamp =
            info.createdAtTimestamp ??
            (info.createdAt ? new Date(info.createdAt).getTime() : undefined);

          materialsMap[mapKey] = {
            id:
              info.product?.id ||
              info.original.productId ||
              info.original.id ||
              Date.now(),
            productId: info.original.productId,
            name: info.name,
            quantity: 0,
            unit: info.unit,
            supplier: info.supplier || '',
            sku: info.sku,
            assignedDate: info.createdAt
              ? new Date(info.createdAt).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            bookingHistory: [],
            totalQuantity: 0,
            location: info.location,
            referenz: info.referenz,
            createdAt: info.createdAt,
            createdAtTimestamp,
            lastTimestamp: info.lastTimestamp,
            lastBooking: undefined,
          };
        }

        materialsMap[mapKey].totalQuantity += info.quantity;
        if (info.createdAt) {
          materialsMap[mapKey].bookingHistory.push({
            id: info.original.id || Date.now(),
            itemId: materialsMap[mapKey].id,
            itemType: 'material',
            quantity: info.quantity,
            unit: info.unit,
            timestamp: info.createdAt,
          });
        }

        if (
          info.createdAtTimestamp &&
          (!materialsMap[mapKey].createdAtTimestamp ||
            info.createdAtTimestamp < materialsMap[mapKey].createdAtTimestamp)
        ) {
          materialsMap[mapKey].createdAtTimestamp = info.createdAtTimestamp;
        }

        if (
          info.lastTimestamp &&
          (!materialsMap[mapKey].lastTimestamp ||
            info.lastTimestamp > materialsMap[mapKey].lastTimestamp)
        ) {
          materialsMap[mapKey].lastTimestamp = info.lastTimestamp;
        }
      } else {
        if (!devicesMap[mapKey]) {
          devicesMap[mapKey] = {
            id: info.product?.id || (info.original.id || Date.now()) + 1000,
            productId: info.original.productId,
            name: info.name,
            type: info.name,
            location: info.location || 'Lager',
            sku: info.sku,
            assignedDate: info.createdAt
              ? new Date(info.createdAt).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            quantity: 0,
            bookingHistory: [],
            totalQuantity: 0,
            referenz: info.referenz,
            createdAt: info.createdAt,
            createdAtTimestamp:
              info.createdAtTimestamp ??
              (info.createdAt ? new Date(info.createdAt).getTime() : undefined),
            lastTimestamp: info.lastTimestamp,
            lastBooking: undefined,
          };
        }
        devicesMap[mapKey].totalQuantity += info.quantity;
        if (info.createdAt) {
          devicesMap[mapKey].bookingHistory.push({
            id: info.original.id || Date.now(),
            itemId: devicesMap[mapKey].id,
            itemType: 'device',
            quantity: info.quantity,
            unit: info.unit,
            timestamp: info.createdAt,
          });
        }

        if (
          info.createdAtTimestamp &&
          (!devicesMap[mapKey].createdAtTimestamp ||
            info.createdAtTimestamp < devicesMap[mapKey].createdAtTimestamp)
        ) {
          devicesMap[mapKey].createdAtTimestamp = info.createdAtTimestamp;
        }

        if (
          info.lastTimestamp &&
          (!devicesMap[mapKey].lastTimestamp ||
            info.lastTimestamp > devicesMap[mapKey].lastTimestamp)
        ) {
          devicesMap[mapKey].lastTimestamp = info.lastTimestamp;
        }
      }
    });
    
    const sortBookingHistory = (history: any[] = []) =>
      [...history].sort(
        (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    
    const materials = Object.values(materialsMap).map((m: any) => {
      const sortedHistory = sortBookingHistory(m.bookingHistory);
      return {
      ...m,
        quantity: 0,
        bookingHistory: sortedHistory,
        lastBooking:
          sortedHistory.length > 0
            ? sortedHistory[sortedHistory.length - 1]
            : undefined,
        itemType: 'material',
      };
    });
    
    const devices = Object.values(devicesMap).map((d: any) => {
      const sortedHistory = sortBookingHistory(d.bookingHistory);
      return {
      ...d,
        quantity: 0,
        bookingHistory: sortedHistory,
        lastBooking:
          sortedHistory.length > 0
            ? sortedHistory[sortedHistory.length - 1]
            : undefined,
        itemType: 'device',
      };
    });

    const assignmentKey = trimmedProject.toLowerCase();
    const relevantAssignments = projectAssignments.filter(
      assignment =>
        (assignment.projectKey || '').toLowerCase().trim() === assignmentKey
    );

    const materialKeyMap = new Map<string, any>();
    materials.forEach(material => {
      const key =
        material.productId != null
          ? `id-${material.productId}`
          : material.sku
          ? `sku-${material.sku.toLowerCase()}`
          : material.name
          ? `name-${material.name.toLowerCase()}`
          : `material-${material.id}`;

      if (!material.createdAtTimestamp && material.createdAt) {
        material.createdAtTimestamp = new Date(material.createdAt).getTime();
      }

      materialKeyMap.set(key, material);
    });

    relevantAssignments.forEach(assignment => {
      const key =
        assignment.productId != null
          ? `id-${assignment.productId}`
          : assignment.productSku
          ? `sku-${assignment.productSku.toLowerCase()}`
          : `assignment-${assignment.id}`;

      const product = allProducts.find(p => p.id === assignment.productId);
      const createdAt = assignment.createdAt || new Date().toISOString();
      const createdAtTimestamp = new Date(createdAt).getTime();
      const displayUnit = toDisplayUnit(
        assignment.unit || product?.unit || 'Stück'
      );

      if (materialKeyMap.has(key)) {
        const existing = materialKeyMap.get(key);
        existing.unit = displayUnit;
        existing.productId = assignment.productId ?? existing.productId;
        existing.name =
          existing.name ||
          assignment.productName ||
          product?.name ||
          'Zugewiesener Artikel';
        existing.sku =
          existing.sku || assignment.productSku || product?.sku || '';
        existing.assignedDate =
          existing.assignedDate || createdAt.split('T')[0];
        existing.createdAt = existing.createdAt || createdAt;
        if (
          !existing.createdAtTimestamp ||
          createdAtTimestamp < existing.createdAtTimestamp
        ) {
          existing.createdAtTimestamp = createdAtTimestamp;
        }
      } else {
        const newMaterial = {
          id: assignment.productId ?? assignment.id,
          productId: assignment.productId,
          name:
            assignment.productName ||
            product?.name ||
            'Zugewiesener Artikel',
          quantity: 0,
          unit: displayUnit,
          supplier: product?.defaultSupplier || '',
          sku: assignment.productSku || product?.sku || '',
          assignedDate: createdAt.split('T')[0],
          bookingHistory: [],
          totalQuantity: 0,
          location: undefined,
          referenz: trimmedProject,
          createdAt,
          createdAtTimestamp,
          lastBooking: undefined,
          lastTimestamp: undefined,
          itemType: 'material',
        };

        materials.push(newMaterial);
        materialKeyMap.set(key, newMaterial);
      }
    });

    const sortByTimestamp = (a: any, b: any) => {
      const timeA =
        a.lastTimestamp ??
        a.createdAtTimestamp ??
        Number.MAX_SAFE_INTEGER;
      const timeB =
        b.lastTimestamp ??
        b.createdAtTimestamp ??
        Number.MAX_SAFE_INTEGER;

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return (a.name || '').localeCompare(b.name || '');
    };

    materials.sort(sortByTimestamp);
    devices.sort(sortByTimestamp);
    
    setProjectMaterials(materials);
    setProjectDevices(devices);
  }, [projektnummer, wareneingaenge, allProducts, projectAssignments, toDisplayUnit]);

  useEffect(() => {
    if (erfassungstyp === 'Projekt (Baustelle)' && projektnummer.trim()) {
      loadProjectMaterials();
    } else {
      setProjectMaterials([]);
      setProjectDevices([]);
    }
  }, [erfassungstyp, projektnummer, loadProjectMaterials]);

  const getProjectFilteredData = () => {
    if (projectAppliedFilter.includes('alle')) {
      return [
        ...projectMaterials.map(item => ({ type: 'material', data: item })),
        ...projectDevices.map(item => ({ type: 'device', data: item }))
      ];
    }
    
    const filteredItems = [];
    
    if (projectAppliedFilter.includes('materialien')) {
      filteredItems.push(...projectMaterials.map(item => ({ type: 'material', data: item })));
    }
    
    if (projectAppliedFilter.includes('geräte')) {
      filteredItems.push(...projectDevices.map(item => ({ type: 'device', data: item })));
    }
    
    return filteredItems;
  };

  const getProjectFilterLabel = (filterValue: string) => {
    switch (filterValue) {
      case 'alle': return 'Alle';
      case 'materialien': return 'Materialien';
      case 'geräte': return 'Geräte';
      default: return filterValue;
    }
  };

  const getProjectFilterCount = (filterValue: string) => {
    switch (filterValue) {
      case 'alle': return projectMaterials.length + projectDevices.length;
      case 'materialien': return projectMaterials.length;
      case 'geräte': return projectDevices.length;
      default: return 0;
    }
  };

  const parseQuantityInput = (value: string | number | undefined | null) => {
    if (value == null) {
      return 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatQuantityForUnit = (value: number, unit: string) => {
    if (unit === 'Paket') {
      const formatted = value.toLocaleString('de-DE', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      return formatted;
    }
    return Math.round(value).toString();
  };

  const getUnitLabel = (unit: string, quantity: number) => {
    const normalized = (unit || '').toLowerCase();
    const pluralMap: Record<
      string,
      { singular: string; plural: string }
    > = {
      paket: { singular: 'Paket', plural: 'Pakete' },
      palette: { singular: 'Palette', plural: 'Paletten' },
      sack: { singular: 'Sack', plural: 'Säcke' },
      stück: { singular: 'Stück', plural: 'Stück' },
      trommel: { singular: 'Trommel', plural: 'Trommeln' },
      eimer: { singular: 'Eimer', plural: 'Eimer' },
      stange: { singular: 'Stange', plural: 'Stangen' },
      bündel: { singular: 'Bündel', plural: 'Bündel' },
      rolle: { singular: 'Rolle', plural: 'Rollen' },
      set: { singular: 'Set', plural: 'Sets' },
      kanister: { singular: 'Kanister', plural: 'Kanister' },
    };

    const entry = pluralMap[normalized];
    if (entry) {
      return quantity === 1 ? entry.singular : entry.plural;
    }

    const display = toDisplayUnit(unit);
    return display;
  };

  const ensureProductForProjectItem = (projectItem: any, type: 'material' | 'device') => {
    let product = allProducts.find(p => p.id === projectItem.productId);
    if (!product && projectItem.sku) {
      product = allProducts.find(p => p.sku === projectItem.sku);
    }

    if (product) {
      return product;
    }

    if (!projectItem.productId) {
      return null;
    }

    return {
      id: projectItem.productId,
      name: projectItem.name || 'Projektartikel',
      description: projectItem.description || '',
      sku: projectItem.sku || `PROJEKT-${projectItem.productId}`,
      price: 0,
      stockQuantity: 0,
      locationStock: 0,
      unit: projectItem.unit === 'Paket' ? 'Paket' : 'Stück',
      defaultSupplier: projectItem.supplier,
      itemType: type === 'material' ? 'Material' : 'Gerät',
      createdAt: projectItem.createdAt || new Date().toISOString(),
      updatedAt: projectItem.createdAt || new Date().toISOString(),
    };
  };

  const getProjectWareneingangInfo = (wareneingang: Wareneingang) => {
    const product = wareneingang.productId
      ? allProducts.find((p: Product) => p.id === wareneingang.productId)
      : null;

    const name = (wareneingang.productName || product?.name || 'Unbekanntes Produkt').trim();
    const sku = (product?.sku || wareneingang.productSku || '').trim();
    const notes = wareneingang.notes || '';
    const productUnit = (product?.unit || '').trim().toLowerCase();
    const productType = (wareneingang.productType || product?.itemType || '').trim().toLowerCase();

    const notesUnit = (() => {
      if (/paletten?/i.test(notes)) {
        return 'palette';
      }
      if (/paket/i.test(notes)) {
        return 'paket';
      }
      return '';
    })();

    let resolvedUnit = productUnit || 'stück';
    if (notesUnit) {
      resolvedUnit = notesUnit;
    } else if (!productUnit) {
      if (name.toLowerCase().includes('paket')) {
      resolvedUnit = 'paket';
      } else if (name.toLowerCase().includes('palette')) {
      resolvedUnit = 'palette';
      }
    }

    const isMaterial =
      productType === 'material' ||
      resolvedUnit !== 'stück';

    let normalizedQuantity = wareneingang.quantity || 0;

    if (resolvedUnit === 'paket') {
      const paketMatch = notes.match(/Eingabe:\s*([\d.,]+)\s*Paket/i);
      if (paketMatch) {
        normalizedQuantity = parseFloat(paketMatch[1].replace(',', '.'));
      }
    } else if (resolvedUnit === 'palette') {
      const paletteMatch = notes.match(/Eingabe:\s*([\d.,]+)\s*Paletten?/i);
      if (paletteMatch) {
        normalizedQuantity = parseFloat(paletteMatch[1].replace(',', '.'));
      } else if (normalizedQuantity) {
        normalizedQuantity = normalizedQuantity / 80;
      }
    }

    const aggregationKey = wareneingang.productId
      ? `id-${wareneingang.productId}`
      : sku
        ? `sku-${sku.toLowerCase()}`
        : `name-${name.toLowerCase()}`;

    const timestamp =
      new Date(
        wareneingang.updatedAt || wareneingang.createdAt || new Date().toISOString()
      ).getTime();

    return {
      aggregationKey,
      name,
      unit: toDisplayUnit(resolvedUnit || product?.unit || wareneingang.unit || ''),
      quantity: normalizedQuantity,
      product,
      itemType: isMaterial ? 'material' : 'device',
      sku,
      supplier: wareneingang.supplier,
      location: wareneingang.location,
      referenz: wareneingang.referenz,
      createdAt: wareneingang.createdAt,
      original: wareneingang,
      lastTimestamp: timestamp,
      createdAtTimestamp: timestamp,
    };
  };

  const aggregateProjectGroupItems = (entries: Wareneingang[]): AggregatedOrderItem[] => {
    const aggregated = new Map<string, AggregatedOrderItem>();

    entries.forEach(entry => {
      const info = getProjectWareneingangInfo(entry);
      const existing = aggregated.get(info.aggregationKey);
      const timestamp = new Date(info.original.updatedAt || info.original.createdAt).getTime();

      if (existing) {
        existing.quantity += info.quantity;
        existing.bookingHistory.push(info.original);

        if (timestamp > (existing.lastTimestamp || 0)) {
          existing.lastTimestamp = timestamp;
          existing.lastBookingQuantity = info.quantity;
          existing.lastBookingUnit = info.unit;
          existing.lastBooking = {
            id: info.original.id || Date.now(),
            itemId: info.original.productId || existing.productId || Date.now(),
            itemType: info.itemType,
            quantity: info.quantity,
            unit: info.unit,
            timestamp:
              info.original.updatedAt ||
              info.original.createdAt ||
              new Date().toISOString(),
          };
          existing.createdAtTimestamp = Math.min(existing.createdAtTimestamp ?? timestamp, timestamp);
        }
      } else {
        aggregated.set(info.aggregationKey, {
          key: info.aggregationKey,
          productId: info.original.productId,
          name: info.name,
          unit: info.unit,
          quantity: info.quantity,
          sku: info.sku,
          supplier: info.supplier,
          type: info.product?.description || info.product?.itemType,
          location: info.original.location,
          bookingHistory: [info.original],
          itemType: info.itemType,
          lastTimestamp: timestamp,
          lastBookingQuantity: info.quantity,
          lastBookingUnit: info.unit,
          lastBooking: {
            id: info.original.id || Date.now(),
            itemId: info.original.productId || Date.now(),
            itemType: info.itemType,
            quantity: info.quantity,
            unit: info.unit,
            timestamp:
              info.original.updatedAt ||
              info.original.createdAt ||
              new Date().toISOString(),
          },
          createdAtTimestamp: timestamp,
        });
      }
    });

    return Array.from(aggregated.values());
  };

  const addProjectItemToBooking = async (projectItem: any, type: 'material' | 'device') => {
    const unit = type === 'material'
      ? (projectItem.unit === 'Paket' ? 'Paket' : 'Stück')
      : 'Stück';

    const quantityValue = parseQuantityInput(projectItem.quantity);

    if (quantityValue <= 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie eine Menge größer als 0 aus.');
      return;
    }

    const product = ensureProductForProjectItem(projectItem, type);

    if (!product) {
      Alert.alert('Fehler', 'Zu diesem Projektartikel konnte kein Produkt gefunden werden.');
      return;
    }

    const bookingKey = `${type}-${projectItem.id}`;
    if (projectBookingInProgress === bookingKey) {
      return;
    }

    setProjectBookingInProgress(bookingKey);

    try {
      let notes = `Erfassungstyp: Projekt (Baustelle)`;
      if (projektnummer.trim()) {
        notes += `, Projektnummer: ${projektnummer.trim()}`;
      }
      if (selectedProject?.name) {
        notes += `, Projektname: ${selectedProject.name}`;
      }

      if (unit === 'Paket') {
        notes += `, Eingabe: ${formatQuantityForUnit(quantityValue, unit)} Paket`;
      } else if (unit === 'Palette') {
        notes += `, Eingabe: ${formatQuantityForUnit(quantityValue, unit)} Paletten`;
      }

      const actualQuantity =
        unit === 'Palette'
          ? quantityValue * 80
          : quantityValue;

      const now = new Date();
      const nowIso = now.toISOString();

      const wareneingangPayload = {
        productId: product.id,
        quantity: actualQuantity,
        unitPrice: product.price || 0,
        erfassungstyp: 'Projekt (Baustelle)',
        referenz: projektnummer.trim() || projectItem.referenz || undefined,
        location: projectItem.location || lagerort || undefined,
        supplier: projectItem.supplier || lieferant || product.defaultSupplier || undefined,
        batchNumber: undefined,
        expiryDate: undefined,
        notes,
      };

      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated && isOnline) {
        await apiService.createWareneingang(wareneingangPayload);
      } else {
        await databaseService.saveWareneingang(
          {
            id: Date.now(),
            productId: wareneingangPayload.productId,
            productName: product.name,
            quantity: wareneingangPayload.quantity,
            unitPrice: wareneingangPayload.unitPrice,
            totalPrice: wareneingangPayload.unitPrice * wareneingangPayload.quantity,
            erfassungstyp: wareneingangPayload.erfassungstyp,
            referenz: wareneingangPayload.referenz,
            location: wareneingangPayload.location,
            supplier: wareneingangPayload.supplier,
            batchNumber: wareneingangPayload.batchNumber,
            expiryDate: wareneingangPayload.expiryDate,
            notes: wareneingangPayload.notes,
            createdAt: nowIso,
          },
          true
        );
      }

      const bookingEntry = {
        id: Date.now(),
        itemId: projectItem.id,
        itemType: type,
        quantity: quantityValue,
        unit,
        timestamp: nowIso,
      };

      if (type === 'material') {
        setProjectMaterials(prev => {
          let found = false;
          const updated = prev.map(material => {
            if (material.id === projectItem.id) {
              found = true;
              const history = [...(material.bookingHistory || []), bookingEntry];
              return {
                ...material,
                quantity: 0,
                lastBooking: bookingEntry,
                bookingHistory: history,
                totalQuantity: (material.totalQuantity || 0) + bookingEntry.quantity,
              };
            }
            return material;
          });

          if (!found) {
            return [
              ...updated,
              {
                ...projectItem,
                quantity: 0,
                lastBooking: bookingEntry,
                bookingHistory: [...(projectItem.bookingHistory || []), bookingEntry],
                totalQuantity: bookingEntry.quantity,
              },
            ];
          }

          return updated;
        });
      } else {
        setProjectDevices(prev => {
          let found = false;
          const updated = prev.map(device => {
            if (device.id === projectItem.id) {
              found = true;
              const history = [...(device.bookingHistory || []), bookingEntry];
              return {
                ...device,
                quantity: 0,
                lastBooking: bookingEntry,
                bookingHistory: history,
                totalQuantity: (device.totalQuantity || 0) + bookingEntry.quantity,
              };
            }
            return device;
          });

          if (!found) {
            return [
              ...updated,
              {
                ...projectItem,
                quantity: 0,
                lastBooking: bookingEntry,
                bookingHistory: [...(projectItem.bookingHistory || []), bookingEntry],
                totalQuantity: bookingEntry.quantity,
              },
            ];
          }

          return updated;
        });
      }

      await loadWareneingaenge();
    } catch (error) {
      Alert.alert('Fehler', 'Projektbuchung konnte nicht gespeichert werden.');
    } finally {
      setProjectBookingInProgress(null);
    }
  };

  const mapWareneingaengeToBookings = (
    entries: Wareneingang[] | undefined,
    fallbackType: 'material' | 'device',
    fallbackUnit: string
  ): Booking[] => {
    if (!entries || entries.length === 0) {
      return [];
    }

    return entries.map(entry => ({
      id: entry.id ?? Date.now(),
      itemId: entry.productId ?? entry.id ?? Date.now(),
      itemType: fallbackType,
      quantity: entry.quantity ?? 0,
      unit: fallbackUnit,
      timestamp: entry.updatedAt || entry.createdAt || new Date().toISOString(),
    }));
  };

  const openHistoryModal = (
    name: string,
    itemType: 'material' | 'device',
    sku: string | undefined,
    bookings: Booking[],
    fallbackId?: number
  ) => {
    if (bookings.length === 0) {
      Alert.alert('Hinweis', 'Für diesen Artikel existieren noch keine Buchungen.');
      return;
    }

    const firstBooking = bookings[0];
    navigation.navigate(
      'ItemHistory' as never,
      {
        itemId: fallbackId ?? firstBooking.itemId ?? firstBooking.id,
        itemType,
        itemName: name,
        productSku: sku,
        bookingHistory: bookings,
      } as never
    );
  };

  const handleOpenHistoryForAggregatedItem = (item: AggregatedOrderItem) => {
    const bookings = mapWareneingaengeToBookings(
      item.bookingHistory,
      item.itemType,
      item.unit || 'Stück'
    );
    openHistoryModal(item.name, item.itemType, item.sku, bookings, item.productId);
  };

  const toggleProjectFilter = (filterValue: string) => {
    if (filterValue === 'alle') {
      setProjectFilter(['alle']);
    } else {
      const newFilter = projectFilter.filter(f => f !== 'alle');
      if (newFilter.includes(filterValue)) {
        const updatedFilter = newFilter.filter(f => f !== filterValue);
        setProjectFilter(updatedFilter.length > 0 ? updatedFilter : ['alle']);
      } else {
        setProjectFilter([...newFilter, filterValue]);
      }
    }
  };

  const applyProjectFilter = () => {
    setProjectAppliedFilter([...projectFilter]);
    setProjectFilterModalVisible(false);
  };

  const getProjectFilterDisplayText = () => {
    if (projectAppliedFilter.includes('alle')) {
      return 'Alle';
    }
    if (projectAppliedFilter.length === 1) {
      return getProjectFilterLabel(projectAppliedFilter[0]);
    }
    return `${projectAppliedFilter.length} Filter`;
  };

  const formatProjectDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderProjectMaterial = ({ item }: { item: any }) => (
    <Card style={styles.projectMaterialItemCard}>
      <Card.Content>
        <View style={styles.projectMaterialItemHeader}>
          <View style={styles.projectMaterialItemInfo}>
            <Title style={styles.projectMaterialItemName}>{item.name}</Title>
            {item.sku && (
              <Paragraph style={styles.projectMaterialItemDetails}>
                {item.sku}
              </Paragraph>
            )}
          </View>
          <View style={styles.projectMaterialActionButtons}>
            <IconButton
              icon="content-save"
              size={24}
              iconColor={
                (item.quantity === 0 || projectBookingInProgress === `material-${item.id}`)
                  ? '#9e9e9e'
                  : BRAND_DARK_BLUE
              }
              disabled={item.quantity === 0 || projectBookingInProgress === `material-${item.id}`}
              onPress={() => addProjectItemToBooking(item, 'material')}
              style={styles.iconButton}
            />
          </View>
        </View>
        
        <View style={styles.projectMaterialQuantityContainer}>
          <Paragraph style={styles.projectMaterialQuantityLabel}>Menge:</Paragraph>
          <View style={styles.projectMaterialQuantityControls}>
            <IconButton
              icon="minus"
              size={20}
              iconColor="white"
              style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateProjectQuantity(item.id, 'material', -1)}
            />
            <TextInput
              style={styles.projectMaterialQuantityInput}
              value={
                item.unit === 'Paket'
                  ? item.quantity.toFixed(1).replace('.', ',')
                  : item.quantity.toString()
              }
              mode="outlined"
              dense
              keyboardType="numeric"
              onChangeText={(text) => {
                // Allow decimal numbers with comma for Paket unit
                if (item.unit === 'Paket') {
                  const decimalRegex = /^\d*(,\d{0,1})?$/;
                  const integerRegex = /^\d+$/;
                  
                  if (text === '' || integerRegex.test(text) || decimalRegex.test(text)) {
                    const newQuantity = parseFloat(text.replace(',', '.')) || 0;
                    const roundedQuantity = parseFloat(newQuantity.toFixed(1));
                    setProjectMaterials(prev => prev.map(m => 
                      m.id === item.id ? { ...m, quantity: Math.max(0, roundedQuantity) } : m
                    ));
                  }
                } else {
                  const newQuantity = parseInt(text) || 0;
                  setProjectMaterials(prev => prev.map(m => 
                    m.id === item.id ? { ...m, quantity: Math.max(0, newQuantity) } : m
                  ));
                }
              }}
            />
            <IconButton
              icon="plus"
              size={20}
              iconColor="white"
              style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateProjectQuantity(item.id, 'material', 1)}
            />
          </View>
          <Paragraph style={styles.projectMaterialUnitText}>{item.unit}</Paragraph>
        </View>

        {item.lastBooking && (
          <View style={styles.projectMaterialLastBookingContainer}>
            <View style={styles.projectMaterialLastBookingRow}>
            <Paragraph style={styles.projectMaterialLastBookingText}>
                Letzte Wareneingang: {item.lastBooking.quantity} {item.lastBooking.unit} • {formatProjectDate(item.lastBooking.timestamp)} {new Date(item.lastBooking.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Paragraph>
              <TouchableOpacity
                style={styles.projectMaterialHistoryButton}
                onPress={() => {
                  const resolvedSku =
                    item.sku ||
                    (allProducts.find(p => p.id === item.productId)?.sku ?? '');
                  navigation.navigate(
                    'ItemHistory' as never,
                    {
                      itemId: item.id,
                      itemType: 'material',
                      itemName: item.name,
                      productSku: resolvedSku,
                      bookingHistory: item.bookingHistory || [],
                    } as never
                  );
                }}
              >
                <MaterialCommunityIcons 
                  name="dots-vertical" 
                  size={24} 
                  color={BRAND_DARK_BLUE} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderProjectDevice = ({ item }: { item: any }) => (
    <Card style={styles.projectMaterialItemCard}>
      <Card.Content>
        <View style={styles.projectMaterialItemHeader}>
          <View style={styles.projectMaterialItemInfo}>
            <Title style={styles.projectMaterialItemName}>{item.name}</Title>
            {(() => {
              const subtitleParts: string[] = [];
              if (
                item.type &&
                item.type.trim() &&
                item.name &&
                item.type.trim().toLowerCase() !== item.name.trim().toLowerCase()
              ) {
                subtitleParts.push(item.type.trim());
              }
              if (subtitleParts.length === 0) {
                return null;
              }
              return (
            <Paragraph style={styles.projectMaterialItemDetails}>
                  {subtitleParts.join(' • ')}
            </Paragraph>
              );
            })()}
            {item.sku && (
              <Paragraph style={styles.projectMaterialItemDetails}>
                {item.sku}
              </Paragraph>
            )}
          </View>
          <View style={styles.projectMaterialActionButtons}>
            <IconButton
              icon="content-save"
              size={24}
              iconColor={
                (item.quantity === 0 || projectBookingInProgress === `device-${item.id}`)
                  ? '#9e9e9e'
                  : BRAND_DARK_BLUE
              }
              disabled={item.quantity === 0 || projectBookingInProgress === `device-${item.id}`}
              onPress={() => addProjectItemToBooking(item, 'device')}
              style={styles.iconButton}
            />
          </View>
        </View>
        
        <View style={styles.projectMaterialQuantityContainer}>
          <Paragraph style={styles.projectMaterialQuantityLabel}>Menge:</Paragraph>
          <View style={styles.projectMaterialQuantityControls}>
            <IconButton
              icon="minus"
              size={20}
              iconColor="white"
              style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateProjectQuantity(item.id, 'device', -1)}
            />
            <TextInput
              style={styles.projectMaterialQuantityInput}
              value={item.quantity.toString()}
              mode="outlined"
              dense
              keyboardType="numeric"
              onChangeText={(text) => {
                const newQuantity = parseInt(text) || 0;
                setProjectDevices(prev => prev.map(d => 
                  d.id === item.id ? { ...d, quantity: Math.max(0, newQuantity) } : d
                ));
              }}
            />
            <IconButton
              icon="plus"
              size={20}
              iconColor="white"
              style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateProjectQuantity(item.id, 'device', 1)}
            />
          </View>
          <Paragraph style={styles.projectMaterialUnitText}>Stück</Paragraph>
        </View>

        {item.lastBooking && (
          <View style={styles.projectMaterialLastBookingContainer}>
            <View style={styles.projectMaterialLastBookingRow}>
              <Paragraph style={styles.projectMaterialLastBookingText}>
                Letzte Wareneingang: {item.lastBooking.quantity} {item.lastBooking.unit} • {formatProjectDate(item.lastBooking.timestamp)} {new Date(item.lastBooking.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </Paragraph>
            <TouchableOpacity
              style={styles.projectMaterialHistoryButton}
              onPress={() => {
                const resolvedSku =
                  item.sku ||
                  (allProducts.find(p => p.id === item.productId)?.sku ?? '');
                navigation.navigate(
                  'ItemHistory' as never,
                  {
                    itemId: item.id,
                    itemType: 'device',
                    itemName: item.name,
                    productSku: resolvedSku,
                    bookingHistory: item.bookingHistory || [],
                  } as never
                );
              }}
            >
              <MaterialCommunityIcons 
                name="dots-vertical" 
                size={24} 
                color={BRAND_DARK_BLUE} 
              />
            </TouchableOpacity>
          </View>
        </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderOrderSummaryItem = (
    item: AggregatedOrderItem & { quantityInput: number },
  ) => {
    const timestamp = item.lastTimestamp ? new Date(item.lastTimestamp) : undefined;

    const disableSave = item.quantityInput <= 0;

    return (
      <Card key={item.key} style={styles.orderSummaryCard}>
        <Card.Content>
          <View style={styles.projectMaterialItemHeader}>
            <View style={styles.projectMaterialItemInfo}>
              <Title style={styles.projectMaterialItemName}>{item.name}</Title>
              {item.sku && (
                <Paragraph style={styles.projectMaterialItemDetails}>
                  {item.sku}
                </Paragraph>
              )}
            </View>
            <View style={styles.projectMaterialActionButtons}>
              <IconButton
                icon="content-save"
                size={22}
                iconColor={BRAND_DARK_BLUE}
                onPress={() => saveOrderSummaryItem(item)}
                disabled={orderSummarySaving === item.key || item.quantityInput <= 0}
              />
            </View>
          </View>

          <View style={styles.projectMaterialQuantityContainer}>
            <Paragraph style={styles.projectMaterialQuantityLabel}>Menge:</Paragraph>
            <View style={styles.projectMaterialQuantityControls}>
              <IconButton
                icon="minus"
                size={20}
                iconColor="white"
                style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                onPress={() => adjustOrderSummaryQuantity(item.key, -1)}
              />
              <TextInput
                style={styles.projectMaterialQuantityInput}
                value={
                  item.unit === 'Paket'
                    ? item.quantityInput.toFixed(1).replace('.', ',')
                    : Math.round(item.quantityInput).toString()
                }
                mode="outlined"
                dense
                keyboardType="numeric"
              editable={false}
              />
              <IconButton
                icon="plus"
                size={20}
                iconColor="white"
                style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                onPress={() => adjustOrderSummaryQuantity(item.key, 1)}
              />
            </View>
            <Paragraph style={styles.projectMaterialUnitText}>
              {getUnitLabel(item.unit, item.quantityInput)}
            </Paragraph>
          </View>

            {timestamp && (
              <View style={styles.projectMaterialLastBookingContainer}>
              <View style={styles.projectMaterialLastBookingRow}>
                <Paragraph style={styles.projectMaterialLastBookingText}>
                  Letzte Wareneingang: {formatQuantityValue(item.lastBookingQuantity ?? item.quantity)}{' '}
                  {getUnitLabel(item.lastBookingUnit || item.unit, item.lastBookingQuantity ?? item.quantity)} •{' '}
                  {timestamp.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}{' '}
                  {timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Paragraph>
                <TouchableOpacity
                  style={styles.projectMaterialHistoryButton}
                  onPress={() => handleOpenHistoryForAggregatedItem(item)}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color={BRAND_DARK_BLUE}
                  />
                </TouchableOpacity>
              </View>
              </View>
            )}
          </Card.Content>
        </Card>
      );
    };

  const renderLagerSummaryItem = (
    item: AggregatedOrderItem & { quantityInput: number },
  ) => {
    const timestamp = item.lastTimestamp ? new Date(item.lastTimestamp) : undefined;

    return (
      <Card key={item.key} style={styles.orderSummaryCard}>
        <Card.Content>
          <View style={styles.projectMaterialItemHeader}>
            <View style={styles.projectMaterialItemInfo}>
              <Title style={styles.projectMaterialItemName}>{item.name}</Title>
              {item.sku && (
                <Paragraph style={styles.projectMaterialItemDetails}>
                  {item.sku}
                </Paragraph>
              )}
            </View>
            <View style={styles.projectMaterialActionButtons}>
              <IconButton
                icon="content-save"
                size={22}
                iconColor={BRAND_DARK_BLUE}
                onPress={() => saveLagerSummaryItem(item)}
                disabled={lagerSummarySaving === item.key || item.quantityInput <= 0}
              />
              <IconButton
                icon="close"
                size={22}
                iconColor="#d32f2f"
                onPress={() => {
                  Alert.alert(
                    'Artikel entfernen',
                    `Möchten Sie wirklich "${item.name}" entfernen?${item.key.startsWith('lager-ref-') ? ' Der Artikel wird auch aus der Datenbank gelöscht.' : ''}`,
                    [
                      {
                        text: 'Abbrechen',
                        style: 'cancel',
                      },
                      {
                        text: 'Entfernen',
                        style: 'destructive',
                        onPress: () => {
                          deleteLagerSummaryItem(item);
                        },
                      },
                    ],
                  );
                }}
              />
            </View>
          </View>

          <View style={styles.projectMaterialQuantityContainer}>
            <Paragraph style={styles.projectMaterialQuantityLabel}>Menge:</Paragraph>
            <View style={styles.projectMaterialQuantityControls}>
              <IconButton
                icon="minus"
                size={20}
                iconColor="white"
                style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                onPress={() => adjustLagerSummaryQuantity(item.key, -1)}
              />
              <TextInput
                style={styles.projectMaterialQuantityInput}
                value={
                  item.unit === 'Paket'
                    ? item.quantityInput.toFixed(1).replace('.', ',')
                    : Math.round(item.quantityInput).toString()
                }
                mode="outlined"
                dense
                keyboardType="numeric"
                editable={false}
              />
              <IconButton
                icon="plus"
                size={20}
                iconColor="white"
                style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                onPress={() => adjustLagerSummaryQuantity(item.key, 1)}
              />
            </View>
            <Paragraph style={styles.projectMaterialUnitText}>
              {getUnitLabel(item.unit, item.quantityInput)}
            </Paragraph>
          </View>

            {timestamp && (
              <View style={styles.projectMaterialLastBookingContainer}>
              <View style={styles.projectMaterialLastBookingRow}>
                <Paragraph style={styles.projectMaterialLastBookingText}>
                  Letzte Wareneingang: {formatQuantityValue(item.lastBookingQuantity ?? item.quantity)}{' '}
                  {getUnitLabel(item.lastBookingUnit || item.unit, item.lastBookingQuantity ?? item.quantity)} •{' '}
                  {timestamp.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}{' '}
                  {timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </Paragraph>
                <TouchableOpacity
                  style={styles.projectMaterialHistoryButton}
                  onPress={() => handleOpenHistoryForAggregatedItem(item)}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color={BRAND_DARK_BLUE}
                  />
                </TouchableOpacity>
              </View>
              </View>
            )}
          </Card.Content>
        </Card>
      );
    };

  const renderOhneBestellungSummaryItem = (
    item: AggregatedOrderItem & { quantityInput: number },
  ) => {
    const timestamp = item.lastTimestamp ? new Date(item.lastTimestamp) : undefined;

    return (
      <Card key={item.key} style={styles.orderSummaryCard}>
        <Card.Content>
          <View style={styles.projectMaterialItemHeader}>
            <View style={styles.projectMaterialItemInfo}>
              <Title style={styles.projectMaterialItemName}>{item.name}</Title>
              {item.sku && (
                <Paragraph style={styles.projectMaterialItemDetails}>
                  {item.sku}
                </Paragraph>
              )}
            </View>
            <View style={styles.projectMaterialActionButtons}>
              <IconButton
                icon="content-save"
                size={22}
                iconColor={BRAND_DARK_BLUE}
                onPress={() => saveOhneBestellungSummaryItem(item)}
                disabled={ohneBestellungSummarySaving === item.key || item.quantityInput <= 0}
              />
              <IconButton
                icon="close"
                size={22}
                iconColor="#d32f2f"
                onPress={() => {
                  Alert.alert(
                    'Artikel entfernen',
                    `Möchten Sie wirklich "${item.name}" entfernen?${item.key.startsWith('ohne-bestellung-ref-') ? ' Der Artikel wird auch aus der Datenbank gelöscht.' : ''}`,
                    [
                      {
                        text: 'Abbrechen',
                        style: 'cancel',
                      },
                      {
                        text: 'Entfernen',
                        style: 'destructive',
                        onPress: () => {
                          deleteOhneBestellungSummaryItem(item);
                        },
                      },
                    ],
                  );
                }}
              />
            </View>
          </View>

          <View style={styles.projectMaterialQuantityContainer}>
            <Paragraph style={styles.projectMaterialQuantityLabel}>Menge:</Paragraph>
            <View style={styles.projectMaterialQuantityControls}>
              <IconButton
                icon="minus"
                size={20}
                iconColor="white"
                style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                onPress={() => adjustOhneBestellungSummaryQuantity(item.key, -1)}
              />
              <TextInput
                style={styles.projectMaterialQuantityInput}
                value={
                  item.unit === 'Paket'
                    ? item.quantityInput.toFixed(1).replace('.', ',')
                    : Math.round(item.quantityInput).toString()
                }
                mode="outlined"
                dense
                keyboardType="numeric"
                editable={false}
              />
              <IconButton
                icon="plus"
                size={20}
                iconColor="white"
                style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                onPress={() => adjustOhneBestellungSummaryQuantity(item.key, 1)}
              />
            </View>
            <Paragraph style={styles.projectMaterialUnitText}>
              {getUnitLabel(item.unit, item.quantityInput)}
            </Paragraph>
          </View>

            {timestamp && (
              <View style={styles.projectMaterialLastBookingContainer}>
              <View style={styles.projectMaterialLastBookingRow}>
                <Paragraph style={styles.projectMaterialLastBookingText}>
                  Letzte Wareneingang: {formatQuantityValue(item.lastBookingQuantity ?? item.quantity)}{' '}
                  {getUnitLabel(item.lastBookingUnit || item.unit, item.lastBookingQuantity ?? item.quantity)} •{' '}
                  {timestamp.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}{' '}
                  {timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </Paragraph>
                <TouchableOpacity
                  style={styles.projectMaterialHistoryButton}
                  onPress={() => handleOpenHistoryForAggregatedItem(item)}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color={BRAND_DARK_BLUE}
                  />
                </TouchableOpacity>
              </View>
              </View>
            )}
          </Card.Content>
        </Card>
      );
    };

  const renderProjectItem = ({ item }: { item: { type: string; data: any } }) => {
    if (item.type === 'material') {
      return renderProjectMaterial({ item: item.data });
    } else {
      return renderProjectDevice({ item: item.data });
    }
  };

  async function assignItemToProject(itemIndex: number) {
    if (erfassungstyp !== 'Projekt (Baustelle)') {
      return;
    }

    if (!projektnummer.trim()) {
      Alert.alert('Hinweis', 'Bitte wählen Sie zuerst ein Projekt aus.');
      return;
    }

    const item = items[itemIndex];
    if (!item) {
      return;
    }

    let product = item.selectedProduct;

    if (!product && item.artikelnummer.trim()) {
      product = allProducts.find(p => p.sku === item.artikelnummer.trim());
      if (!product) {
        try {
          await loadProducts();
          product = allProducts.find(p => p.sku === item.artikelnummer.trim());
        } catch (error) {
        }
      }
    }

    if (!product) {
      Alert.alert('Hinweis', 'Bitte wählen Sie zuerst einen Artikel aus.');
      return;
    }

    const quantityValue = parseQuantityInput(item.anzahl) || 0;
    const unit = item.selectedUnit || product.unit || 'Stück';
    const assignedDate = new Date().toISOString().split('T')[0];

    const isMaterial =
      (product.itemType || '').toLowerCase() === 'material' ||
      unit === 'Paket' ||
      unit === 'Palette';

    if (isMaterial) {
      const materialItem: any = {
        id: product.id,
        productId: product.id,
        name: product.name,
        quantity: quantityValue,
        unit,
        supplier: product.defaultSupplier || '',
        sku: product.sku,
        assignedDate,
        bookingHistory: [],
        lastBooking: undefined,
        totalQuantity: quantityValue,
        location: lagerort || undefined,
        referenz: projektnummer.trim(),
        createdAt: new Date().toISOString(),
      };

      await addProjectItemToBooking(materialItem, 'material');
    } else {
      const deviceItem: any = {
        id: product.id,
        productId: product.id,
        name: product.name,
        quantity: quantityValue,
        unit: 'Stück',
        type: product.description || 'Gerät',
        location: lagerort || 'Lager',
        sku: product.sku,
        assignedDate,
        bookingHistory: [],
        lastBooking: undefined,
        totalQuantity: quantityValue,
        referenz: projektnummer.trim(),
        createdAt: new Date().toISOString(),
      };

      await addProjectItemToBooking(deviceItem, 'device');
    }

    setItems(prev => prev.filter((_, idx) => idx !== itemIndex));
  }

  const handleSaveItem = async (itemIndex: number) => {
    const item = items[itemIndex];
    if (!item) {
      return;
    }

    if (!item.selectedProduct) {
      Alert.alert('Hinweis', `Bitte wählen Sie zuerst einen Artikel für Position ${itemIndex + 1} aus.`);
      return;
    }

    const quantityValue = parseQuantityInput(item.anzahl) || 0;
    if (quantityValue <= 0) {
      Alert.alert('Hinweis', 'Bitte gib eine Menge größer als 0 ein.');
      return;
    }

    if (erfassungstyp === 'Bestellung') {
      const product = item.selectedProduct;
      const unit = item.selectedUnit || product.unit || 'Stück';
      const rawType = (product.itemType || product.type || '').toString().toLowerCase();
      const derivedItemType: 'material' | 'device' =
        rawType.includes('device') || rawType.includes('gerät') || rawType.includes('tool')
          ? 'device'
          : 'material';

      const tempKey = `temp-${product.id}-${Date.now()}`;
      const nowTimestamp = Date.now();

      const payloadForSave: AggregatedOrderItem & { quantityInput: number } = {
        key: tempKey,
        productId: product.id,
        name: product.name || `Artikel ${itemIndex + 1}`,
        unit,
        quantity: quantityValue,
        sku: product.sku,
        supplier: product.defaultSupplier || lieferant || undefined,
        type: product.type,
        location: lagerort || undefined,
        bookingHistory: [],
        itemType: derivedItemType,
        lastTimestamp: undefined,
        lastBookingQuantity: undefined,
        lastBookingUnit: undefined,
        lastBooking: undefined,
        quantityInput: quantityValue,
        createdAtTimestamp: nowTimestamp,
      };

      await saveOrderSummaryItem(payloadForSave);

      setItems((prev) => prev.filter((_, idx) => idx !== itemIndex));

      return;
    }

    if (erfassungstyp === 'Lager') {
      // Validierung für Lager
      if (!lagerort.trim()) {
        Alert.alert('Fehler', 'Bitte geben Sie einen "Von Lagerort" ein.');
        return;
      }
      if (!nachLagerort.trim()) {
        Alert.alert('Fehler', 'Bitte wählen Sie einen "Nach Lagerort" aus.');
        return;
      }
      if (lagerort.trim() === nachLagerort.trim()) {
        Alert.alert('Fehler', '"Von Lagerort" und "Nach Lagerort" dürfen nicht gleich sein.');
        return;
      }

      const product = item.selectedProduct;
      const unit = item.selectedUnit || product.unit || 'Stück';
      const tempKey = `lager-${product.id}-${Date.now()}`;
      const nowTimestamp = Date.now();

      const payloadForSave: AggregatedOrderItem & { quantityInput: number } = {
        key: tempKey,
        productId: product.id,
        name: product.name || `Artikel ${itemIndex + 1}`,
        unit,
        quantity: quantityValue,
        sku: product.sku,
        supplier: undefined,
        type: product.type,
        location: lagerort || undefined,
        bookingHistory: [],
        itemType: 'material',
        lastTimestamp: undefined,
        lastBookingQuantity: undefined,
        lastBookingUnit: undefined,
        lastBooking: undefined,
        quantityInput: quantityValue,
        createdAtTimestamp: nowTimestamp,
      };

      // Artikel zu lagerSummaryItems hinzufügen
      setLagerSummaryItems((prev) => [...prev, payloadForSave]);

      // Artikel aus der Liste entfernen
      setItems((prev) => prev.filter((_, idx) => idx !== itemIndex));

      return;
    }

    if (erfassungstyp === 'Ohne Bestellung') {
      const product = item.selectedProduct;
      const unit = item.selectedUnit || product.unit || 'Stück';
      const tempKey = `ohne-bestellung-${product.id}-${Date.now()}`;
      const nowTimestamp = Date.now();

      const payloadForSave: AggregatedOrderItem & { quantityInput: number } = {
        key: tempKey,
        productId: product.id,
        name: product.name || `Artikel ${itemIndex + 1}`,
        unit,
        quantity: quantityValue,
        sku: product.sku,
        supplier: lieferant || undefined,
        type: product.type,
        location: lagerort || undefined,
        bookingHistory: [],
        itemType: 'material',
        lastTimestamp: undefined,
        lastBookingQuantity: undefined,
        lastBookingUnit: undefined,
        lastBooking: undefined,
        quantityInput: quantityValue,
        createdAtTimestamp: nowTimestamp,
      };

      // Artikel zu ohneBestellungSummaryItems hinzufügen
      setOhneBestellungSummaryItems((prev) => [...prev, payloadForSave]);

      // Artikel aus der Liste entfernen
      setItems((prev) => prev.filter((_, idx) => idx !== itemIndex));

      return;
    }

    await assignItemToProject(itemIndex);
  };

  const openProductSearch = async (itemIndex?: number) => {
    try {
      // Verwende die bereits geladenen Produkte oder lade sie neu
      if (allProducts.length === 0) {
        await loadProducts();
      }
      setProductsModalVisible(true);
    } catch (error) {
      Alert.alert('Fehler', 'Produktliste konnte nicht geladen werden.');
    }
  };

  const getAvailableUnits = () => {
    const units = ['Stück'];
    
    if (selectedProduct) {
      // Add product's default unit if it's not already in the list
      const productUnit = selectedProduct.unit || 'Stück';
      if (!units.includes(productUnit)) {
        units.push(productUnit);
      }
    }
    
    // Always add Palette and Paket for Bestellung
    if (erfassungstyp === 'Bestellung') {
      if (!units.includes('Palette')) {
        units.push('Palette');
      }
      if (!units.includes('Paket')) {
        units.push('Paket');
      }
    }
    
    return units;
  };

  const changeUnit = (newUnit: string) => {
    setSelectedUnit(newUnit);
    setUnitMenuVisible(false);
    
    // Reset anzahl when changing unit
    setAnzahl('0');
  };

  const setSuppliersForProduct = (productId: string) => {
    const suppliers = supplierProductMapping[productId] || [];
    setAvailableSuppliers(suppliers);
    
    
    if (suppliers.length === 0) {
      // Kein Lieferant gefunden
      setSelectedSupplier('');
      setLieferantennummer('');
    } else if (suppliers.length === 1) {
      // Nur ein Lieferant - automatisch setzen
      setSelectedSupplier(suppliers[0]);
      setLieferantennummer(suppliers[0]);
    } else {
      // Mehrere Lieferanten - zur Auswahl bereitstellen
      setSelectedSupplier('');
      setLieferantennummer('');
      setSupplierDialogVisible(true); // Automatically open supplier dialog
    }
  };

  // Get available products (exclude already selected products and apply search/filter)
  const getAvailableProducts = () => {
    // Get IDs of already selected products (excluding current item)
    const projectAssignedProductIds = new Set<number>();
    if (erfassungstyp === 'Projekt (Baustelle)') {
      projectMaterials.forEach(material => {
        if (material.productId) {
          projectAssignedProductIds.add(material.productId);
        }
      });
      projectDevices.forEach(device => {
        if (device.productId) {
          projectAssignedProductIds.add(device.productId);
        }
      });
    }

    const selectedProductIds = items
      .filter((item, index) => 
        item.selectedProduct !== null && 
        index !== currentItemIndexForProductSelection &&
        item.selectedProduct?.id != null
      )
      .map(item => item.selectedProduct.id);
    
    const assignedOrderProductIds = new Set<number>();
    const assignedOrderSkus = new Set<string>();
    if (erfassungstyp === 'Bestellung') {
      orderSummaryItems.forEach(orderItem => {
        if (orderItem.productId != null) {
          assignedOrderProductIds.add(orderItem.productId);
        }
        if (orderItem.sku) {
          assignedOrderSkus.add(orderItem.sku.toLowerCase());
        }
      });
    }

    const assignedLagerProductIds = new Set<number>();
    const assignedLagerSkus = new Set<string>();
    if (erfassungstyp === 'Lager') {
      lagerSummaryItems.forEach(lagerItem => {
        if (lagerItem.productId != null) {
          assignedLagerProductIds.add(lagerItem.productId);
        }
        if (lagerItem.sku) {
          assignedLagerSkus.add(lagerItem.sku.toLowerCase());
        }
      });
    }

    const assignedOhneBestellungProductIds = new Set<number>();
    const assignedOhneBestellungSkus = new Set<string>();
    if (erfassungstyp === 'Ohne Bestellung') {
      ohneBestellungSummaryItems.forEach(ohneBestellungItem => {
        if (ohneBestellungItem.productId != null) {
          assignedOhneBestellungProductIds.add(ohneBestellungItem.productId);
        }
        if (ohneBestellungItem.sku) {
          assignedOhneBestellungSkus.add(ohneBestellungItem.sku.toLowerCase());
        }
      });
    }

    // Filter out already selected products
    let filtered = allProducts.filter(product => 
      !selectedProductIds.includes(product.id) &&
      !projectAssignedProductIds.has(product.id) &&
      !assignedOrderProductIds.has(product.id) &&
      !assignedLagerProductIds.has(product.id) &&
      !assignedOhneBestellungProductIds.has(product.id) &&
      !(product.sku && assignedOrderSkus.has(product.sku.toLowerCase())) &&
      !(product.sku && assignedLagerSkus.has(product.sku.toLowerCase())) &&
      !(product.sku && assignedOhneBestellungSkus.has(product.sku.toLowerCase()))
    );
    
    // Apply search query if present
    if (productSearchQuery.trim() !== '') {
      const query = productSearchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply filter if present (can be extended later)
    if (productFilter.length > 0 && !productFilter.includes('alle')) {
      // Filter logic can be added here based on product categories
      // For now, we'll just return the filtered results
    }
    
    return filtered;
  };

  const selectProduct = (product: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      // Update item in items array
      const newItems = [...items];
      newItems[itemIndex].selectedProduct = product;
      newItems[itemIndex].artikelnummer = product.sku;
      newItems[itemIndex].anzahl = '0';
      newItems[itemIndex].selectedUnit = product.unit || newItems[itemIndex].selectedUnit || 'Stück';
      setItems(newItems);
      
      // Auto-fill supplier in header if not already set
      if (product.defaultSupplier && !lieferant) {
        setLieferant(product.defaultSupplier);
      }
    } else {
      // Legacy: single item mode
    setArtikelnummer(product.sku);
    setSelectedProduct(product);
    const defaultUnit = product.unit || 'Stück';
    setSelectedUnit(defaultUnit);
    setAnzahl('0');
    
    // Use defaultSupplier from product if available
    if (product.defaultSupplier) {
      setSelectedSupplier(product.defaultSupplier);
      setLieferantennummer(product.defaultSupplier);
      setAvailableSuppliers([]);
    } else {
      // No default supplier - use old mapping logic for multiple suppliers
      setSuppliersForProduct(product.sku);
      }
    }
    
    setProductsModalVisible(false);
    setCurrentItemIndexForProductSelection(null);
  };

  const selectSupplier = (supplier: string) => {
    setSelectedSupplier(supplier);
    setLieferantennummer(supplier);
    setSupplierDialogVisible(false);
  };


  const renderErfassungstyp = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.erfassungstypOption,
        erfassungstyp === item && styles.selectedErfassungstypOption
      ]}
      onPress={() => selectErfassungstyp(item)}
    >
      <Paragraph style={[
        styles.erfassungstypOptionText,
        erfassungstyp === item && styles.selectedErfassungstypOptionText
      ]}>
        {item}
      </Paragraph>
    </TouchableOpacity>
  );

  const renderProject = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.projectOption}
      onPress={() => selectProject(item)}
    >
      <View style={styles.projectInfo}>
        <View style={styles.projectHeader}>
          <Title style={styles.projectMaterialsTitle}>{item.name}</Title>
          <Chip 
            mode="outlined" 
            style={[
              styles.projectStatusChip,
              item.status === 'Aktiv' && styles.statusActive,
              item.status === 'Pausiert' && styles.statusPaused,
              item.status === 'Abgeschlossen' && styles.statusCompleted
            ]}
            textStyle={[
              styles.projectStatusText,
              item.status === 'Aktiv' && styles.statusActiveText,
              item.status === 'Pausiert' && styles.statusPausedText,
              item.status === 'Abgeschlossen' && styles.statusCompletedText
            ]}
          >
            {item.status}
          </Chip>
        </View>
        <Paragraph style={styles.projectDescription}>{item.description}</Paragraph>
        <Paragraph style={styles.projectDateRange}>
          Von {formatProjectDate(item.startDate)} bis {formatProjectDate(item.endDate)}
        </Paragraph>
      </View>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: any }) => {
    if (!item) {
      return null;
    }
    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => selectProduct(item, currentItemIndexForProductSelection ?? undefined)}
      >
        <Card style={styles.projectCardContent}>
          <Card.Content>
            <Title style={styles.projectCardTitle}>{item.name || 'Unbekanntes Produkt'}</Title>
            <Paragraph style={styles.projectCardDescription}>
              {`SKU: ${item.sku || 'N/A'}`}
            </Paragraph>
            <View style={styles.projectCardDetails}>
              <Paragraph style={styles.projectCardDetail}>
                {`Einheit: ${item.unit || 'Stück'}`}
              </Paragraph>
              {item.price != null && (
                <Paragraph style={styles.projectCardDetail}>
                  {`Preis: €${item.price.toFixed(2)}`}
                </Paragraph>
              )}
              {item.stockQuantity != null && (
                <Paragraph style={styles.projectCardDetail}>
                  {`Lagerbestand: ${item.stockQuantity}`}
                </Paragraph>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };



  const renderOrder = ({ item }: { item: any }) => {
    // 1:1 Beziehung - nur ein Lieferant pro Bestellung
    const supplier = item.supplier || '';
    const supplierText = supplier ? `Lieferant: ${supplier}` : 'Kein Lieferant';
    const displayDate = item.date || formatOrderDateForDisplay(item.orderDate);
    const itemCount =
      typeof item.assignedItemCount === 'number'
        ? item.assignedItemCount
        : typeof item.items === 'number'
        ? item.items
        : 0;
    
    return (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => selectOrder(item)}
    >
      <Card style={styles.projectCardContent}>
        <Card.Content>
          <Title style={styles.projectCardTitle}>{item.orderNumber || item.id}</Title>
          <Paragraph style={styles.projectCardDescription}>
            {supplierText}
          </Paragraph>
          <View style={styles.projectCardDetails}>
            <Paragraph style={styles.projectCardDetail}>
              Datum: {displayDate || '-'}
            </Paragraph>
            <Paragraph style={styles.projectCardDetail}>
              Status: {item.status || 'Unbekannt'}
            </Paragraph>
              <Paragraph style={styles.projectCardDetail}>
              Artikelanzahl: {itemCount}
            </Paragraph>
            {item.items === undefined && typeof item.assignedItemCount !== 'number' && (
              <Paragraph style={styles.projectCardDetail}>
                Hinweis: Anzahl geschätzt
              </Paragraph>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
    );
  };

  const incrementAnzahl = () => {
    const currentValue = parseFloat(anzahl.replace(',', '.'));
    const step = selectedUnit === 'Paket' ? 0.1 : 1;
    const newValue = currentValue + step;
    if (selectedUnit === 'Paket') {
      setAnzahl(newValue.toFixed(1).replace('.', ','));
    } else {
      setAnzahl(newValue.toString());
    }
  };

  const decrementAnzahl = () => {
    const currentValue = parseFloat(anzahl.replace(',', '.'));
    const step = selectedUnit === 'Paket' ? 0.1 : 1;
    const minValue = selectedUnit === 'Paket' ? 0.1 : 1;
    
    if (currentValue > minValue) {
      const newValue = currentValue - step;
      if (selectedUnit === 'Paket') {
        setAnzahl(newValue.toFixed(1).replace('.', ','));
      } else {
        setAnzahl(newValue.toString());
      }
    }
  };

  const handleAnzahlTextChange = (text: string) => {
    // Allow decimal numbers with comma for Paket unit
    if (selectedUnit === 'Paket') {
      // Allow numbers with comma (e.g., "0,5", "1,5", "2,5")
      const decimalRegex = /^\d*(,\d{0,1})?$/;
      const integerRegex = /^\d+$/;
      
      if (text === '' || integerRegex.test(text) || decimalRegex.test(text)) {
        setAnzahl(text);
      }
    } else {
      // For other units, only allow integers
    const number = parseInt(text);
    if (!isNaN(number) && number >= 1) {
        setAnzahl(number.toString());
    } else if (text === '') {
        setAnzahl('1');
      }
    }
  };

  const handleArtikelnummerChange = async (text: string, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      // Update item in array
      const newItems = [...items];
      newItems[itemIndex].artikelnummer = text;
      setItems(newItems);
      
      // Find product when artikelnummer is entered
      if (text.trim() && erfassungstyp !== 'Projekt (Baustelle)') {
        await searchProductForItem(text, itemIndex);
      }
      return;
    }
    
    // Legacy: single item mode
    setArtikelnummer(text);
    
    // Find product when artikelnummer is entered
    if (text.trim() && erfassungstyp !== 'Projekt (Baustelle)') {
      
      // Search in already loaded products first
      const product = allProducts.find(p => p.sku === text.trim());
      if (product) {
        setSelectedProduct(product);
        setSuppliersForProduct(product.sku);
        return;
      }
      
      // If not found, try to load from API
      try {
        const apiProducts = await apiService.getProducts();
        const apiProduct = apiProducts.find(p => p.sku === text.trim());
        if (apiProduct) {
          setSelectedProduct(apiProduct);
          setSuppliersForProduct(apiProduct.sku);
          // Update allProducts for future searches
          setAllProducts([...allProducts, apiProduct]);
          return;
        }
      } catch (error) {
      }
      
      // Artikel nicht gefunden - Dialog zum Erstellen anzeigen
      setUnknownProductSKU(text.trim());
      setUnknownProductItemIndex(null); // null bedeutet Legacy-Modus
      setUnknownProductName('');
      setUnknownProductPrice('0');
      setUnknownProductLocationStock('0');
      setUnknownProductUnit('Stück');
      setUnknownProductDialogVisible(true);
    }
  };

  // Funktion zum Erstellen eines neuen Artikels
  const createUnknownProduct = async () => {
    if (!unknownProductName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Artikelnamen ein.');
      return;
    }

    if (!unknownProductSKU.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Artikelnummer ein.');
      return;
    }

    const parsedPrice = parseFloat(unknownProductPrice.replace(',', '.')) || 0;
    if (parsedPrice < 0) {
      Alert.alert('Fehler', 'Der Preis darf nicht negativ sein.');
      return;
    }

    const parsedLocationStock = parseFloat(unknownProductLocationStock.replace(',', '.')) || 0;
    if (parsedLocationStock < 0) {
      Alert.alert('Fehler', 'Der Lagebestand darf nicht negativ sein.');
      return;
    }

    setCreatingProduct(true);
    try {
      const newProduct = {
        name: unknownProductName.trim(),
        sku: unknownProductSKU.trim(),
        price: parsedPrice,
        unit: unknownProductUnit || 'Stück',
        locationStock: parsedLocationStock,
        stockQuantity: 0,
        description: '',
        isUnknown: true,
      };

      const createdProduct = await apiService.createProduct(newProduct);
      const enrichedProduct = { ...createdProduct, isUnknown: true };
      
      // Produkt zu allProducts hinzufügen
      setAllProducts([...allProducts, enrichedProduct]);
      
      // Produkt auswählen
      if (unknownProductItemIndex !== null) {
        // Items-Array-Modus
        const newItems = [...items];
        newItems[unknownProductItemIndex].selectedProduct = enrichedProduct;
        newItems[unknownProductItemIndex].isUnknownProduct = true;
        setItems(newItems);
      } else {
        // Legacy-Modus
        setSelectedProduct(enrichedProduct);
        setSelectedUnit(enrichedProduct.unit || 'Stück');
      }
      
      // Dialog schließen
      setUnknownProductDialogVisible(false);
      setCreateProductUnitPickerVisible(false);
      setUnknownProductLocationStock('0');
      Alert.alert('Erfolg', 'Artikel erfolgreich erstellt und ausgewählt!');
    } catch (error: any) {
      Alert.alert('Fehler', error.response?.data?.message || 'Fehler beim Erstellen des Artikels.');
    } finally {
      setCreatingProduct(false);
    }
  };

  // Filter functions
  const filterOptions = ['alle', 'materialien', 'geräte', 'filter3', 'filter4'];
  
  const getFilterLabel = (filterValue: string) => {
    switch (filterValue) {
      case 'alle':
        return 'Alle';
      case 'materialien':
        return 'Materialien';
      case 'geräte':
        return 'Geräte';
      case 'filter3':
        return 'Filter 3';
      case 'filter4':
        return 'Filter 4';
      default:
        return filterValue;
    }
  };

  const getFilterCount = (filterValue: string) => {
    if (filterValue === 'alle') {
      return items.length;
    }
    
    // Für jetzt gibt es keine echte Kategorisierung, alle Artikel werden gezählt
    // Später kann man basierend auf Produkt-Typen filtern
    switch (filterValue) {
      case 'materialien':
        return items.filter(item => {
          // Hier kann später die Logik für Materialien hinzugefügt werden
          // z.B. basierend auf Produkt-Kategorien
          return item.selectedProduct !== null;
        }).length;
      case 'geräte':
        return items.filter(item => {
          // Hier kann später die Logik für Geräte hinzugefügt werden
          return item.selectedProduct !== null;
        }).length;
      case 'filter3':
        return items.length;
      case 'filter4':
        return items.length;
      default:
        return 0;
    }
  };

  const toggleFilter = (filterValue: string) => {
    if (filterValue === 'alle') {
      setFilter(['alle']);
    } else {
      const newFilter = filter.filter(f => f !== 'alle');
      if (newFilter.includes(filterValue)) {
        const updatedFilter = newFilter.filter(f => f !== filterValue);
        setFilter(updatedFilter.length > 0 ? updatedFilter : ['alle']);
      } else {
        setFilter([...newFilter, filterValue]);
      }
    }
  };

  const applyFilter = () => {
    setAppliedFilter([...filter]);
    setFilterMenuVisible(false);
  };

  const getFilteredItems = () => {
    let filtered = items.filter((item) => {
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.artikelnummer.toLowerCase().includes(query) ||
          item.selectedProduct?.name?.toLowerCase().includes(query) ||
          item.selectedProduct?.sku?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Applied filter
      if (appliedFilter.length === 0 || appliedFilter.includes('alle')) {
        return true;
      }

      // Für jetzt werden alle Filter gleich behandelt, da es keine Kategorisierung gibt
      // Später kann man basierend auf Produkt-Typen filtern
      if (appliedFilter.includes('materialien')) {
        // Hier kann später die Logik für Materialien hinzugefügt werden
        return item.selectedProduct !== null;
      }
      if (appliedFilter.includes('geräte')) {
        // Hier kann später die Logik für Geräte hinzugefügt werden
        return item.selectedProduct !== null;
      }
      if (appliedFilter.includes('filter3')) {
        return true;
      }
      if (appliedFilter.includes('filter4')) {
        return true;
      }

      return false;
    });

    return filtered;
  };

  const searchProductForItem = async (artikelnummer: string, itemIndex: number) => {
    const product = allProducts.find(p => p.sku === artikelnummer.trim());
    if (product) {
      const newItems = [...items];
      newItems[itemIndex].selectedProduct = product;
      setItems(newItems);
      return;
    }
    // Try API
    try {
      const apiProducts = await apiService.getProducts();
      const apiProduct = apiProducts.find(p => p.sku === artikelnummer.trim());
      if (apiProduct) {
        const newItems = [...items];
        newItems[itemIndex].selectedProduct = apiProduct;
        setItems(newItems);
        // Update allProducts for future searches
        setAllProducts([...allProducts, apiProduct]);
        return;
      }
    } catch (error) {
    }
    
    // Artikel nicht gefunden - Dialog zum Erstellen anzeigen
    setUnknownProductSKU(artikelnummer.trim());
    setUnknownProductItemIndex(itemIndex);
    setUnknownProductName('');
    setUnknownProductPrice('0');
    setUnknownProductUnit('Stück');
    setUnknownProductDialogVisible(true);
  };

  const handleSubmitMultiple = async () => {
    if (items.length === 0) {
      Alert.alert('Fehler', 'Bitte fügen Sie mindestens einen Artikel hinzu.');
      return;
    }
    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.selectedProduct) {
        Alert.alert('Fehler', `Bitte wählen Sie ein Produkt für Artikel ${i + 1} aus.`);
        return;
      }
    }
    if (!lagerort.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Lagerort ein.');
      return;
    }
    
    // Bei "Lager" auch "Nach Lagerort" validieren
    if (erfassungstyp === 'Lager' && !nachLagerort.trim()) {
      Alert.alert('Fehler', 'Bitte wählen Sie einen "Nach Lagerort" aus.');
      return;
    }
    
    setSubmitting(true);
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      for (const item of items) {
        if (!item.selectedProduct) continue;
        
        // Bei "Lager" den "Nach Lagerort" in notes speichern
        let notes = '';
        if (erfassungstyp === 'Lager' && nachLagerort) {
          notes = `Von: ${lagerort}, Nach: ${nachLagerort}`;
        }
        
        // Bemerkung hinzufügen - nur bei "Ohne Bestellung"
        if (erfassungstyp === 'Ohne Bestellung' && bereich.trim()) {
          if (notes) {
            notes += ` | Bemerkung: ${bereich}`;
          } else {
            notes = `Bemerkung: ${bereich}`;
          }
        }
        
        // Bemerkung hinzufügen - nur bei "Lager"
        if (erfassungstyp === 'Lager' && bemerkung.trim()) {
          if (notes) {
            notes += ` | Bemerkung: ${bemerkung}`;
          } else {
            notes = `Bemerkung: ${bemerkung}`;
          }
        }
        
        const wareneingangData = {
          productId: item.selectedProduct.id,
          quantity: parseFloat(item.anzahl) || 1,
          unitPrice: item.selectedProduct.price,
          erfassungstyp: erfassungstyp,
          referenz: referenz || undefined,
          location: lagerort || undefined,
          supplier: lieferant || undefined,
          batchNumber: undefined,
          expiryDate: undefined,
          notes: notes || undefined,
        };
        if (isAuthenticated) {
          await apiService.createWareneingang(wareneingangData);
        } else {
          await databaseService.saveWareneingang({...wareneingangData, id: Date.now(), productName: item.selectedProduct.name, totalPrice: item.selectedProduct.price * (parseFloat(item.anzahl) || 1), createdAt: new Date().toISOString()}, true);
        }
      }
      Alert.alert('Erfolg', `${items.length} Wareneingang${items.length > 1 ? 'e' : ''} wurde${items.length > 1 ? 'n' : ''} erfolgreich erstellt!`);
      setItems([]);
      setReferenz(''); // Reset referenz field
      setBemerkung(''); // Reset bemerkung field
      setBereich(''); // Reset bereich field
      await loadWareneingaenge();
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Erstellen des Wareneingangs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProject = async () => {
    // Validation
    if (!projektnummer.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Projektnummer ein.');
      return;
    }
    
    if (items.length === 0) {
      Alert.alert('Fehler', 'Bitte fügen Sie mindestens einen Artikel/Material hinzu.');
      return;
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.selectedProduct) {
        Alert.alert('Fehler', `Bitte wählen Sie ein Produkt für Artikel ${i + 1} aus.`);
        return;
      }
    }
    
    // Validate lagerort for projects
    if (!lagerort.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Lagerort ein.');
      return;
    }
    
    setSubmitting(true);
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      // Speichere alle Materialien/Geräte des Projekts
      for (const item of items) {
        if (!item.selectedProduct) continue;
        
        // Projekt-Notes mit allen Informationen
        let projectNotes = `Projekt: ${projektnummer}`;
        
        // Add unit information if Palette or Paket is selected
        if (item.selectedUnit === 'Palette') {
          projectNotes += `, Eingabe: ${item.anzahl} Paletten`;
        } else if (item.selectedUnit === 'Paket') {
          projectNotes += `, Eingabe: ${item.anzahl} Paket`;
        }
        
        // Calculate actual quantity based on unit
        let actualQuantity = parseFloat(item.anzahl.replace(',', '.')) || 1;
        if (item.selectedUnit === 'Palette') {
          actualQuantity = actualQuantity * 80; // Convert Palette to Stück
        }
        
        const wareneingangData = {
          productId: item.selectedProduct.id,
          quantity: actualQuantity,
          unitPrice: item.selectedProduct.price,
          erfassungstyp: 'Projekt (Baustelle)',
          referenz: referenz || projektnummer, // Verwende Referenz oder Projektnummer als Referenz
          location: lagerort || undefined, // Lagerort auch bei Projekten
          supplier: lieferant || undefined,
          batchNumber: undefined,
          expiryDate: undefined,
          notes: projectNotes, // Speichere Projektnummer, Einheit und alle Informationen in notes
        };
        
        if (isAuthenticated) {
          await apiService.createWareneingang(wareneingangData);
        } else {
          await databaseService.saveWareneingang({
            ...wareneingangData,
            id: Date.now(),
            productName: item.selectedProduct.name,
            totalPrice: item.selectedProduct.price * (parseFloat(item.anzahl) || 1),
            createdAt: new Date().toISOString()
          }, true);
        }
      }
      
      Alert.alert(
        'Erfolg',
        `Projekt "${projektnummer}" wurde erfolgreich gebucht mit ${items.length} Material${items.length > 1 ? 'ien' : ''}!`,
        [
          {
            text: 'OK',
            onPress: async () => {
              // Reset form
              setItems([]);
              setProjektnummer('');
              setReferenz('');
              setLieferant('');
              setBemerkung('');
              setBereich('');
              await loadWareneingaenge();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Buchen des Projekts.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validation based on erfassungstyp
    if (erfassungstyp !== 'Projekt (Baustelle)' && !artikelnummer.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Artikelnummer ein.');
      return;
    }

    if (erfassungstyp === 'Bestellung' && !lieferantennummer.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Lieferantennummer ein.');
      return;
    }

    if (erfassungstyp === 'Projekt (Baustelle)' && !projektnummer.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Projektnummer ein.');
      return;
    }

    if (!lagerort.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Lagerort ein.');
      return;
    }

    // Bei "Lager" auch "Nach Lagerort" validieren
    if (erfassungstyp === 'Lager' && !nachLagerort.trim()) {
      Alert.alert('Fehler', 'Bitte wählen Sie einen "Nach Lagerort" aus.');
      return;
    }

    if (erfassungstyp !== 'Projekt (Baustelle)' && parseFloat(anzahl.replace(',', '.')) < (selectedUnit === 'Paket' ? 0.5 : 1)) {
      Alert.alert('Fehler', `Bitte geben Sie mindestens ${selectedUnit === 'Paket' ? '0,5' : '1'} ein.`);
      return;
    }

    setSubmitting(true);
    try {
      let product = null;
      
      // Only find product if not a project
      if (erfassungstyp !== 'Projekt (Baustelle)') {
        
        // Search in already loaded products first
        product = allProducts.find(p => p.sku === artikelnummer.trim());
        
        // Falls nicht gefunden, in der API suchen
        if (!product) {
          try {
            const apiProducts = await apiService.getProducts();
            product = apiProducts.find(p => p.sku === artikelnummer.trim());
            if (product) {
            }
          } catch (error) {
          }
        } else {
        }
      
        if (!product) {
          // Artikel nicht gefunden - Dialog zum Erstellen anzeigen
          setUnknownProductSKU(artikelnummer.trim());
          setUnknownProductItemIndex(null); // null bedeutet Legacy-Modus
          setUnknownProductName('');
          setUnknownProductPrice('0');
          setUnknownProductUnit('Stück');
          setUnknownProductDialogVisible(true);
          setSubmitting(false);
          return;
        }
      }

      // Build notes string based on erfassungstyp
      let notes = `Erfassungstyp: ${erfassungstyp}`;
      if (erfassungstyp === 'Bestellung' && lieferantennummer) {
        notes += `, Lieferantennummer: ${lieferantennummer}`;
      }
      if (erfassungstyp === 'Projekt (Baustelle)' && projektnummer) {
        notes += `, Projektnummer: ${projektnummer}`;
      }
      if (erfassungstyp !== 'Projekt (Baustelle)' && lagerort) {
        notes += `, Lagerort: ${lagerort}`;
      }
      
      // Add unit information if Palette or Paket is selected
      if (selectedUnit === 'Palette' && selectedProduct) {
        notes += `, Eingabe: ${anzahl} Paletten`;
      } else if (selectedUnit === 'Paket' && selectedProduct) {
        notes += `, Eingabe: ${anzahl} Paket`;
      }
      
      // Bemerkung hinzufügen - nur bei "Ohne Bestellung"
      if (erfassungstyp === 'Ohne Bestellung' && bereich.trim()) {
        notes += ` | Bemerkung: ${bereich}`;
      }
      
      // Bemerkung hinzufügen - nur bei "Lager"
      if (erfassungstyp === 'Lager' && bemerkung.trim()) {
        notes += ` | Bemerkung: ${bemerkung}`;
      }
      

      // Use the input quantity directly - backend will handle Palette conversion
      const anzahlValue = parseFloat(anzahl.replace(',', '.'));
      const actualQuantity = anzahlValue;

      const wareneingangData: Wareneingang = {
        id: Date.now(), // Temporary ID for local storage
        productId: product?.id || 0, // Use 0 for projects
        productName: product?.name || 'Projekt', // Use "Projekt" for projects
        quantity: erfassungstyp === 'Projekt (Baustelle)' ? 1 : actualQuantity, // Use calculated quantity
        unitPrice: product?.price || 0, // Use 0 for projects
        totalPrice: (product?.price || 0) * (erfassungstyp === 'Projekt (Baustelle)' ? 1 : actualQuantity),
        supplier: lieferantennummer || '', // Include supplier information
        batchNumber: '',
        notes: notes,
        createdAt: new Date().toISOString(),
      };

      // Try to save to API first, but fallback to local storage if it fails
      let savedToApi = false;
      try {
        const isAuthenticated = await apiService.isAuthenticated();
        
        if (isAuthenticated && isOnline && product) {
          // Create API request object
          const apiRequest = {
            productId: wareneingangData.productId,
            quantity: parseFloat(anzahl.replace(',', '.')), // Backend will handle Palette conversion
            unitPrice: wareneingangData.unitPrice,
            supplier: wareneingangData.supplier,
            batchNumber: wareneingangData.batchNumber,
            notes: wareneingangData.notes,
          };
          const createdWareneingang = await apiService.createWareneingang(apiRequest);
          // Save to local database
          await databaseService.saveWareneingang(createdWareneingang);
          savedToApi = true;
        } else {
        }
      } catch (apiError) {
      }

      // Always save to local database as backup
      if (!savedToApi) {
        await databaseService.saveWareneingang(wareneingangData, true);
      }

      Alert.alert('Erfolg', 'Wareneingang wurde erfolgreich gebucht!');
      
      // Reload the wareneingaenge list to show the new entry
      await loadWareneingaenge();
      
      // Reset form
      setLieferantennummer('');
      setProjektnummer('');
      setArtikelnummer('');
      setAnzahl('1');
      setSelectedProduct(null);
      setBemerkung(''); // Reset bemerkung field
      setBereich(''); // Reset bereich field
      setSelectedUnit('');
      setAvailableSuppliers([]);
      setSelectedSupplier('');
      // Lagerort nicht zurücksetzen - bleibt beim Benutzer-Lagerort
      setErfassungstyp('Bestellung');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Buchen des Wareneingangs.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Add 2 hours for German timezone (UTC+2)
    const germanTime = new Date(date.getTime() + (2 * 60 * 60 * 1000));
    
    return germanTime.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group wareneingaenge by referenz (bestellnummer)
  const groupWareneingaengeByReferenz = (wareneingaenge: Wareneingang[]) => {
    const grouped: { [key: string]: Wareneingang[] } = {};
    
    wareneingaenge.forEach(item => {
      const key = item.referenz || 'Ohne Referenz';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .map(([referenz, items]) => ({
        referenz,
        items: items.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      createdAt: items[0].createdAt,
      lastUpdatedAt: items.reduce((latest, current) => {
        const currentTime = new Date(current.updatedAt || current.createdAt).getTime();
        return currentTime > latest ? currentTime : latest;
      }, 0),
      }))
      .sort((a, b) => 
      (b.lastUpdatedAt || new Date(b.createdAt).getTime()) -
      (a.lastUpdatedAt || new Date(a.createdAt).getTime())
      );
  };

  const extractProjectNumberFromNotes = (notes?: string | null) => {
    if (!notes) {
      return undefined;
    }
    const match = notes.match(/Projekt:\s*([^,|]+)/i);
    return match && match[1] ? match[1].trim() : undefined;
  };

  const cleanProjectTitle = (value?: string) => {
    if (!value) {
      return '';
    }
    let cleaned = value;
    cleaned = cleaned.replace(/,\s*Eingabe:.*$/i, '');
    cleaned = cleaned.replace(/Kategorie\s*:?[^,|]*/gi, '');
    cleaned = cleaned.replace(/Paket\s*[^,|]*/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^[,•-]+/, '').replace(/[,•-]+$/, '').trim();
    return cleaned || value.trim();
  };

  const matchesSelectedProject = (value: string | undefined | null, selectedProject: string) => {
    if (!value) {
      return false;
    }
    const cleanedValue = value.trim().toLowerCase();
    const cleanedSelected = selectedProject.trim().toLowerCase();
    if (!cleanedValue || !cleanedSelected) {
      return false;
    }
    return cleanedValue === cleanedSelected;
  };

  const getProjectDisplayName = (group: { referenz: string; items: Wareneingang[] }) => {
    const itemWithNotes = group.items.find(item => item.notes);
    if (itemWithNotes?.notes) {
      const projectNumber = extractProjectNumberFromNotes(itemWithNotes.notes);
      if (projectNumber) {
        return cleanProjectTitle(projectNumber);
      }
    }
    return cleanProjectTitle(group.referenz) || 'Projekt';
  };

  const formatQuantityValue = (value: number) => {
    if (Number.isInteger(value)) {
      return `${value}`;
    }
    return value.toString().replace('.', ',');
  };

  const getProjectItemDisplay = (wareneingang: Wareneingang) => {
    const info = getProjectWareneingangInfo(wareneingang);
    const quantityLabel = formatQuantityValue(info.quantity);
    const unitLabel = getUnitLabel(info.unit, info.quantity);
    return { quantityLabel, unitLabel, unit: info.unit };
  };

  const renderWareneingang = ({ item }: { item: Wareneingang }) => (
    <Card style={styles.wareneingangCard}>
      <Card.Content>
        <Title>{item.productName}</Title>
        <View style={styles.infoRow}>
          <Paragraph style={styles.label}>Menge:</Paragraph>
          <Chip mode="outlined" style={styles.chip}>
            {item.quantity} Stück
          </Chip>
        </View>
        {item.notes && (item.notes.includes('Palette') || item.notes.includes('Paket')) && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Eingabe:</Paragraph>
            <Paragraph style={styles.value}>
              {(() => {
                const paletteMatch = item.notes.match(/(\d+(?:,\d+)?) Paletten/);
                const paketMatch = item.notes.match(/(\d+(?:,\d+)?) Paket/);
                if (paletteMatch) return `${paletteMatch[1]} Paletten`;
                if (paketMatch) return `${paketMatch[1]} Paket`;
                return 'Unbekannt';
              })()}
            </Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Palette') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Umrechnung:</Paragraph>
            <Paragraph style={styles.conversionInfoBlue}>
              {(() => {
                const paletteMatch = item.notes.match(/(\d+(?:,\d+)?) Paletten/);
                if (paletteMatch) {
                  const inputPalettes = parseFloat(paletteMatch[1].replace(',', '.'));
                  const calculatedStueck = inputPalettes * 80;
                  return `${paletteMatch[1]} Paletten × 80 = ${calculatedStueck} Stück`;
                }
                return '1 Palette = 80 Stück';
              })()}
            </Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Paket') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Info:</Paragraph>
            <Paragraph style={styles.conversionInfo}>
              Teilweise verbrauchte Pakete
            </Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Erfassungstyp:') && (
        <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Erfassungstyp:</Paragraph>
            <Paragraph style={styles.value}>
              {item.notes.split('Erfassungstyp: ')[1]?.split(',')[0]}
          </Paragraph>
        </View>
        )}
        {item.supplier && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Lieferant:</Paragraph>
            <Paragraph style={styles.value}>
              {supplierDetails[item.supplier]?.name || item.supplier}
            </Paragraph>
          </View>
        )}
        {item.batchNumber && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Chargennummer:</Paragraph>
            <Paragraph style={styles.value}>{item.batchNumber}</Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Lagerort:') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Lagerort:</Paragraph>
            <Paragraph style={styles.value}>
              {item.notes.split('Lagerort: ')[1]?.split(',')[0] || 'Unbekannt'}
            </Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Lieferantennummer:') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Lieferantennummer:</Paragraph>
            <Paragraph style={styles.value}>
              {item.notes.split('Lieferantennummer: ')[1]?.split(',')[0] || 'Unbekannt'}
            </Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Projektnummer:') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Projektnummer:</Paragraph>
            <Paragraph style={styles.value}>
              {item.notes.split('Projektnummer: ')[1]?.split(',')[0] || 'Unbekannt'}
            </Paragraph>
          </View>
        )}
        <Paragraph style={styles.date}>
          {formatDate(item.createdAt)}
        </Paragraph>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Title>Keine Wareneingänge gefunden</Title>
      <Paragraph style={styles.emptyText}>
        Noch keine Wareneingänge vorhanden. Erstellen Sie Ihren ersten Wareneingang.
      </Paragraph>
    </View>
  );

  const currentOrderGroup = useMemo(() => {
    if (erfassungstyp !== 'Bestellung') {
      return null;
    }
    const trimmedReferenz = referenz.trim();
    if (!trimmedReferenz) {
      return null;
    }
    const groups = groupWareneingaengeByReferenz(wareneingaenge);
    return groups.find(group => group.referenz === trimmedReferenz) || null;
  }, [erfassungstyp, referenz, wareneingaenge]);

  const currentOrderItems = useMemo(() => {
    if (!currentOrderGroup) {
      return [];
    }
    return aggregateProjectGroupItems(currentOrderGroup.items).sort((a, b) => {
      const timeA = a.lastTimestamp ?? Number.MAX_SAFE_INTEGER;
      const timeB = b.lastTimestamp ?? Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });
  }, [currentOrderGroup]);

  const currentOrderTotalQuantity = useMemo(() => {
    if (!currentOrderItems || currentOrderItems.length === 0) {
      return 0;
    }
    return currentOrderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [currentOrderItems]);

  const currentOrderUnitSummary = useMemo(() => {
    if (!currentOrderItems || currentOrderItems.length === 0) {
      return '';
    }
    const uniqueUnits = new Set(
      currentOrderItems
        .map(item => (item.unit || '').toLowerCase())
        .filter(Boolean)
    );
    if (uniqueUnits.size === 1) {
      const unitValue = currentOrderItems[0].unit || 'Stück';
      return getUnitLabel(unitValue, currentOrderTotalQuantity);
    }
    return 'Einheiten (gemischt)';
  }, [currentOrderItems, currentOrderTotalQuantity]);

  const mapAssignmentToAggregated = useCallback(
    (assignment: OrderAssignment): AggregatedOrderItem => {
      const product = allProducts.find(p => p.id === assignment.productId);
      const rawUnit = (assignment.unit || product?.unit || 'Stück').toString();
      const displayUnit = toDisplayUnit(rawUnit);
      const name =
        assignment.productName ||
        product?.name ||
        (assignment.productSku ? `Artikel ${assignment.productSku}` : `Artikel ${assignment.productId}`);
      const sku = assignment.productSku || product?.sku;
      const itemType: 'material' | 'device' =
        (product?.itemType || '').toLowerCase().includes('gerät') ? 'device' : 'material';
      const createdAtSource =
        assignment.createdAt ||
        (assignment as any).CreatedAt ||
        (assignment.updatedAt || (assignment as any).UpdatedAt) ||
        new Date().toISOString();
      const createdAtTimestamp = new Date(createdAtSource).getTime();

      return {
        key: `assignment-${assignment.id}`,
        productId: assignment.productId,
        name,
        unit: displayUnit,
        quantity: 0,
        sku,
        supplier: product?.defaultSupplier,
        type: product?.description || product?.itemType,
        location: undefined,
        bookingHistory: [],
        itemType,
        lastTimestamp: undefined,
        lastBookingQuantity: undefined,
        lastBookingUnit: undefined,
        lastBooking: undefined,
        createdAtTimestamp: createdAtTimestamp,
      };
    },
    [allProducts, toDisplayUnit]
  );

  const displayOrderItems = useMemo(() => {
    if (erfassungstyp !== 'Bestellung') {
      return currentOrderItems;
    }

    const merged = new Map<string, AggregatedOrderItem>();

    currentOrderItems.forEach(item => {
      const key = item.productId != null ? `id-${item.productId}` : item.key;
      merged.set(key, item);
    });

    orderAssignments.forEach(assignment => {
      const key =
        assignment.productId != null ? `id-${assignment.productId}` : `assignment-${assignment.id}`;
      if (!merged.has(key)) {
        merged.set(key, mapAssignmentToAggregated(assignment));
      }
    });

    return Array.from(merged.values()).sort((a, b) => {
      const timeA =
        a.lastTimestamp ??
        a.createdAtTimestamp ??
        Number.MAX_SAFE_INTEGER;
      const timeB =
        b.lastTimestamp ??
        b.createdAtTimestamp ??
        Number.MAX_SAFE_INTEGER;

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      const createdA = a.createdAtTimestamp ?? Number.MAX_SAFE_INTEGER;
      const createdB = b.createdAtTimestamp ?? Number.MAX_SAFE_INTEGER;
      if (createdA !== createdB) {
        return createdA - createdB;
      }

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [erfassungstyp, currentOrderItems, orderAssignments, mapAssignmentToAggregated]);

  useEffect(() => {
    if (erfassungstyp !== 'Bestellung') {
    if (!currentOrderGroup || currentOrderItems.length === 0) {
      setOrderSummaryItems([]);
      return;
    }
    setOrderSummaryItems(
      currentOrderItems.map(item => ({
        ...item,
          quantityInput: 0,
      }))
    );
      return;
    }

    if (displayOrderItems.length === 0) {
      setOrderSummaryItems([]);
      return;
    }

    setOrderSummaryItems(prev => {
      const previousQuantityInputs = new Map(prev.map(item => [item.key, item.quantityInput ?? 0]));
      return displayOrderItems.map(item => ({
        ...item,
        quantityInput: previousQuantityInputs.get(item.key) ?? 0,
      }));
    });
  }, [erfassungstyp, currentOrderGroup, currentOrderItems, displayOrderItems]);

  useEffect(() => {
    if (erfassungstyp !== 'Bestellung') {
      return;
    }

    const trimmedRef = referenz.trim().toLowerCase();
    if (!trimmedRef) {
      return;
    }

    const currentCount = displayOrderItems.length;

    setSelectedOrder(prev =>
      prev
        ? {
            ...prev,
            assignedItemCount: currentCount,
          }
        : prev
    );

    setOrders(prev =>
      prev.map(order => {
        const identifier = (
          order.orderNumber ??
          order.id ??
          order.referenz ??
          ''
        )
          .toString()
          .toLowerCase();

        if (identifier === trimmedRef) {
          return {
            ...order,
            assignedItemCount: currentCount,
            items: currentCount,
          };
        }

        return order;
      })
    );
  }, [displayOrderItems, erfassungstyp, referenz]);

  const adjustOrderSummaryQuantity = (key: string, change: number) => {
    setOrderSummaryItems(prev =>
      prev.map(item => {
        if (item.key !== key) {
          return item;
        }
        const step = item.unit === 'Paket' ? 0.1 : 1;
        const newValue = Math.max(
          0,
          parseFloat((item.quantityInput + change * step).toFixed(item.unit === 'Paket' ? 1 : 0))
        );
        return { ...item, quantityInput: newValue };
      })
    );
  };

  const saveOrderSummaryItem = async (item: AggregatedOrderItem & { quantityInput: number }) => {
    if (item.quantityInput <= 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie eine Menge größer als 0 aus.');
      return;
    }

    setOrderSummarySaving(item.key);

    try {
      let product =
        allProducts.find(p => p.id === item.productId) ||
        (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);

      if (!product) {
        try {
          await loadProducts();
          product =
            allProducts.find(p => p.id === item.productId) ||
            (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);
        } catch (error) {
          // ignore, handled below
        }
      }

      if (!product) {
        Alert.alert('Fehler', 'Produkt für diese Bestellung wurde nicht gefunden.');
        return;
      }

      const unit = item.unit;
      const quantityValue = item.quantityInput;
      let actualQuantity = quantityValue;
      if (unit === 'Palette') {
        actualQuantity = quantityValue * 80;
      }

      let notes = `Erfassungstyp: Bestellung`;
      if (referenz.trim()) {
        notes += `, Referenz: ${referenz.trim()}`;
      }
      if (unit === 'Paket') {
        notes += `, Eingabe: ${formatQuantityForUnit(quantityValue, unit)} Paket`;
      } else if (unit === 'Palette') {
        notes += `, Eingabe: ${formatQuantityForUnit(quantityValue, unit)} Paletten`;
      }

      const nowIso = new Date().toISOString();

      const payload = {
        productId: product.id,
        quantity: actualQuantity,
        unitPrice: product.price || 0,
        erfassungstyp: 'Bestellung',
        referenz: referenz.trim() || undefined,
        location: lagerort || undefined,
        supplier: item.supplier || lieferant || product.defaultSupplier || undefined,
        batchNumber: undefined,
        expiryDate: undefined,
        notes,
      };

      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated && isOnline) {
        await apiService.createWareneingang(payload);
      } else {
        await databaseService.saveWareneingang(
          {
            id: Date.now(),
            productId: payload.productId,
            productName: product.name,
            quantity: payload.quantity,
            unitPrice: payload.unitPrice,
            totalPrice: payload.unitPrice * payload.quantity,
            erfassungstyp: payload.erfassungstyp,
            referenz: payload.referenz,
            location: payload.location,
            supplier: payload.supplier,
            batchNumber: payload.batchNumber,
            expiryDate: payload.expiryDate,
            notes: payload.notes,
            createdAt: nowIso,
          },
          true
        );
      }

      await loadWareneingaenge();
    } catch (error) {
      Alert.alert('Fehler', 'Bestellartikel konnte nicht gespeichert werden.');
    } finally {
      setOrderSummarySaving(null);
    }
  };

  const adjustLagerSummaryQuantity = (key: string, change: number) => {
    setLagerSummaryItems(prev =>
      prev.map(item => {
        if (item.key !== key) {
          return item;
        }
        const step = item.unit === 'Paket' ? 0.1 : 1;
        const newValue = Math.max(
          0,
          parseFloat((item.quantityInput + change * step).toFixed(item.unit === 'Paket' ? 1 : 0))
        );
        return { ...item, quantityInput: newValue };
      })
    );
  };

  const deleteLagerSummaryItem = async (item: AggregatedOrderItem & { quantityInput: number }) => {
    // Prüfe, ob der Artikel aus der DB geladen wurde (key beginnt mit "lager-ref-")
    if (item.key.startsWith('lager-ref-')) {
      // Extrahiere die ID aus dem key (z.B. "lager-ref-123-0" -> "123")
      const match = item.key.match(/lager-ref-(\d+)/);
      if (match && match[1]) {
        const wareneingangId = parseInt(match[1], 10);
        
        // Validiere, dass die ID eine gültige Zahl ist
        if (isNaN(wareneingangId) || wareneingangId <= 0) {
          console.error('Ungültige Wareneingang-ID:', match[1], 'aus key:', item.key);
          Alert.alert('Fehler', 'Ungültige Artikel-ID. Der Artikel konnte nicht gelöscht werden.');
          return;
        }
        
        console.log('Lösche Wareneingang mit ID:', wareneingangId, 'aus key:', item.key);
        
        try {
          const isAuthenticated = await apiService.isAuthenticated();
          if (isAuthenticated) {
            // Lösche den Wareneingang aus der DB
            await apiService.deleteWareneingang(wareneingangId);
            // Lade Wareneingaenge neu, damit die Historie aktualisiert wird
            await loadWareneingaenge();
            // Lade Artikel für Referenz neu, damit der Bodybereich aktualisiert wird
            if (referenz.trim().length > 0) {
              await loadLagerItemsForReferenz(referenz);
            }
            // Artikel wurde bereits aus DB gelöscht, entferne ihn nicht aus lagerSummaryItems
            // (wird durch loadLagerItemsForReferenz aktualisiert)
            return;
          } else {
            // Im Offline-Modus: Zeige Fehlermeldung
            Alert.alert('Fehler', 'Im Offline-Modus können Artikel nicht gelöscht werden. Bitte verbinden Sie sich mit dem Internet.');
            return;
          }
        } catch (error: any) {
          console.error('Fehler beim Löschen des Wareneingangs:', error);
          const errorMessage = error?.response?.status === 404 
            ? 'Der Artikel wurde nicht in der Datenbank gefunden. Möglicherweise wurde er bereits gelöscht.'
            : error?.response?.status === 401
            ? 'Sie sind nicht autorisiert, diesen Artikel zu löschen.'
            : 'Der Artikel konnte nicht aus der Datenbank gelöscht werden.';
          Alert.alert('Fehler', errorMessage);
          return;
        }
      } else {
        console.error('Konnte ID nicht aus key extrahieren:', item.key);
        Alert.alert('Fehler', 'Die Artikel-ID konnte nicht ermittelt werden.');
        return;
      }
    }
    
    // Entferne den Artikel aus lagerSummaryItems (nur wenn nicht aus DB geladen)
    setLagerSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
  };

  const saveLagerSummaryItem = async (item: AggregatedOrderItem & { quantityInput: number }) => {
    if (item.quantityInput <= 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie eine Menge größer als 0 aus.');
      return;
    }

    // Validierung für Lager
    if (!lagerort.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen "Von Lagerort" ein.');
      return;
    }
    if (!nachLagerort.trim()) {
      Alert.alert('Fehler', 'Bitte wählen Sie einen "Nach Lagerort" aus.');
      return;
    }
    if (lagerort.trim() === nachLagerort.trim()) {
      Alert.alert('Fehler', '"Von Lagerort" und "Nach Lagerort" dürfen nicht gleich sein.');
      return;
    }

    setLagerSummarySaving(item.key);

    try {
      let product =
        allProducts.find(p => p.id === item.productId) ||
        (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);

      if (!product) {
        try {
          await loadProducts();
          product =
            allProducts.find(p => p.id === item.productId) ||
            (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);
        } catch (error) {
          // ignore, handled below
        }
      }

      if (!product) {
        Alert.alert('Fehler', 'Produkt für diese Lagerumbuchung wurde nicht gefunden.');
        return;
      }

      const quantityValue = item.quantityInput;

      // Notes zusammenstellen
      let notes = `Von: ${lagerort}, Nach: ${nachLagerort}`;
      if (bemerkung.trim()) {
        notes += ` | Bemerkung: ${bemerkung}`;
      }

      const nowIso = new Date().toISOString();

      const payload = {
        productId: product.id,
        quantity: quantityValue,
        unitPrice: product.price || 0,
        erfassungstyp: 'Lager',
        referenz: referenz.trim() || undefined,
        location: lagerort || undefined,
        supplier: undefined,
        batchNumber: undefined,
        expiryDate: undefined,
        notes,
      };

      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated && isOnline) {
        await apiService.createWareneingang(payload);
      } else {
        await databaseService.saveWareneingang(
          {
            id: Date.now(),
            productId: payload.productId,
            productName: product.name,
            quantity: payload.quantity,
            unitPrice: payload.unitPrice,
            totalPrice: payload.unitPrice * payload.quantity,
            erfassungstyp: payload.erfassungstyp,
            referenz: payload.referenz,
            location: payload.location,
            supplier: payload.supplier,
            batchNumber: payload.batchNumber,
            expiryDate: payload.expiryDate,
            notes: payload.notes,
            createdAt: nowIso,
          },
          true
        );
      }

      await loadWareneingaenge();

      // Artikel aus lagerSummaryItems entfernen
      setLagerSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
    } catch (error) {
      Alert.alert('Fehler', 'Lagerartikel konnte nicht gespeichert werden.');
    } finally {
      setLagerSummarySaving(null);
    }
  };

  const adjustOhneBestellungSummaryQuantity = (key: string, change: number) => {
    setOhneBestellungSummaryItems(prev =>
      prev.map(item => {
        if (item.key !== key) {
          return item;
        }
        const step = item.unit === 'Paket' ? 0.1 : 1;
        const newValue = Math.max(
          0,
          parseFloat((item.quantityInput + change * step).toFixed(item.unit === 'Paket' ? 1 : 0))
        );
        return { ...item, quantityInput: newValue };
      })
    );
  };

  const deleteOhneBestellungSummaryItem = async (item: AggregatedOrderItem & { quantityInput: number }) => {
    // Prüfe, ob der Artikel aus der DB geladen wurde (key beginnt mit "ohne-bestellung-ref-")
    if (item.key.startsWith('ohne-bestellung-ref-')) {
      // Extrahiere die ID aus dem key (z.B. "ohne-bestellung-ref-123-0" -> "123")
      const match = item.key.match(/ohne-bestellung-ref-(\d+)/);
      if (match && match[1]) {
        const wareneingangId = parseInt(match[1], 10);
        
        // Validiere, dass die ID eine gültige Zahl ist
        if (isNaN(wareneingangId) || wareneingangId <= 0) {
          console.error('Ungültige Wareneingang-ID:', match[1], 'aus key:', item.key);
          Alert.alert('Fehler', 'Ungültige Artikel-ID. Der Artikel konnte nicht gelöscht werden.');
          return;
        }
        
        console.log('Lösche Wareneingang mit ID:', wareneingangId, 'aus key:', item.key);
        
        try {
          const isAuthenticated = await apiService.isAuthenticated();
          if (isAuthenticated) {
            // Lösche den Wareneingang aus der DB
            await apiService.deleteWareneingang(wareneingangId);
            // Lade Wareneingaenge neu, damit die Historie aktualisiert wird
            await loadWareneingaenge();
            // Lade Artikel für Referenz neu, damit der Bodybereich aktualisiert wird
            if (referenz.trim().length > 0) {
              await loadOhneBestellungItemsForReferenz(referenz);
            }
            // Artikel wurde bereits aus DB gelöscht, entferne ihn nicht aus ohneBestellungSummaryItems
            // (wird durch loadOhneBestellungItemsForReferenz aktualisiert)
            return;
          } else {
            // Im Offline-Modus: Zeige Fehlermeldung
            Alert.alert('Fehler', 'Im Offline-Modus können Artikel nicht gelöscht werden. Bitte verbinden Sie sich mit dem Internet.');
            return;
          }
        } catch (error: any) {
          console.error('Fehler beim Löschen des Wareneingangs:', error);
          const errorMessage = error?.response?.status === 404 
            ? 'Der Artikel wurde nicht in der Datenbank gefunden. Möglicherweise wurde er bereits gelöscht.'
            : error?.response?.status === 401
            ? 'Sie sind nicht autorisiert, diesen Artikel zu löschen.'
            : 'Der Artikel konnte nicht aus der Datenbank gelöscht werden.';
          Alert.alert('Fehler', errorMessage);
          return;
        }
      } else {
        console.error('Konnte ID nicht aus key extrahieren:', item.key);
        Alert.alert('Fehler', 'Die Artikel-ID konnte nicht ermittelt werden.');
        return;
      }
    }
    
    // Entferne den Artikel aus ohneBestellungSummaryItems (nur wenn nicht aus DB geladen)
    setOhneBestellungSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
  };

  const saveOhneBestellungSummaryItem = async (item: AggregatedOrderItem & { quantityInput: number }) => {
    if (item.quantityInput <= 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie eine Menge größer als 0 aus.');
      return;
    }

    setOhneBestellungSummarySaving(item.key);

    try {
      let product =
        allProducts.find(p => p.id === item.productId) ||
        (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);

      if (!product) {
        try {
          await loadProducts();
          product =
            allProducts.find(p => p.id === item.productId) ||
            (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);
        } catch (error) {
          // ignore, handled below
        }
      }

      if (!product) {
        Alert.alert('Fehler', 'Produkt wurde nicht gefunden.');
        return;
      }

      const quantityValue = item.quantityInput;

      // Notes zusammenstellen - alle Informationen für die Historie
      const notesParts: string[] = [];
      if (lieferant && lieferant.trim()) {
        notesParts.push(`Lieferant: ${lieferant.trim()}`);
      }
      if (lagerort && lagerort.trim()) {
        notesParts.push(`Lagerort: ${lagerort.trim()}`);
      }
      if (bereich && bereich.trim()) {
        notesParts.push(`Bemerkung: ${bereich.trim()}`);
      }
      const notes = notesParts.length > 0 ? notesParts.join(' | ') : undefined;

      const nowIso = new Date().toISOString();

      const payload = {
        productId: product.id,
        quantity: quantityValue,
        unitPrice: product.price || 0,
        erfassungstyp: 'Ohne Bestellung',
        referenz: referenz.trim() || undefined,
        location: lagerort || undefined,
        supplier: lieferant || undefined,
        batchNumber: undefined,
        expiryDate: undefined,
        notes: notes || undefined,
      };

      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated && isOnline) {
        await apiService.createWareneingang(payload);
      } else {
        await databaseService.saveWareneingang(
          {
            id: Date.now(),
            productId: payload.productId,
            productName: product.name,
            quantity: payload.quantity,
            unitPrice: payload.unitPrice,
            totalPrice: payload.unitPrice * payload.quantity,
            erfassungstyp: payload.erfassungstyp,
            referenz: payload.referenz,
            location: payload.location,
            supplier: payload.supplier,
            batchNumber: payload.batchNumber,
            expiryDate: payload.expiryDate,
            notes: payload.notes,
            createdAt: nowIso,
          },
          true
        );
      }

      await loadWareneingaenge();

      // Artikel aus ohneBestellungSummaryItems entfernen (wird durch Neuladen ersetzt)
      setOhneBestellungSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
      
      // Lade Artikel für Referenz neu, damit der Bodybereich aktualisiert wird
      if (referenz.trim().length > 0) {
        await loadOhneBestellungItemsForReferenz(referenz);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Artikel konnte nicht gespeichert werden.');
    } finally {
      setOhneBestellungSummarySaving(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_DARK_BLUE} />
      </View>
    );
  }

  // Funktion zur Bestimmung der Hintergrundfarbe basierend auf Erfassungstyp
  const getHeaderBackgroundColor = () => {
    switch (erfassungstyp) {
      case 'Bestellung':
        return '#90CAF9'; // dunkleres blau
      case 'Projekt (Baustelle)':
        return '#A5D6A7'; // dunkleres grün
      case 'Lager':
        return '#FFF59D'; // dunkleres gelb
      case 'Ohne Bestellung':
        return '#FFCC80'; // deutlich dunkleres orange
      default:
        return 'white';
    }
  };

  // Funktion zur Bestimmung der Farbe für einen gegebenen Erfassungstyp
  const getErfassungstypColor = (typ: string) => {
    switch (typ) {
      case 'Bestellung':
        return '#90CAF9'; // dunkleres blau
      case 'Projekt (Baustelle)':
        return '#A5D6A7'; // dunkleres grün
      case 'Lager':
        return '#FFF59D'; // dunkleres gelb
      case 'Ohne Bestellung':
        return '#FFCC80'; // deutlich dunkleres orange
      default:
        return '#CCCCCC';
    }
  };

  const trimmedReferenz = referenz.trim();
  const hasProjectContext =
    erfassungstyp === 'Projekt (Baustelle)' &&
    (selectedProject || projektnummer.trim().length > 0);
  const hasOrderContext =
    erfassungstyp === 'Bestellung' &&
    (trimmedReferenz.length > 0 || items.length > 0 || orderSummaryItems.length > 0);
  const hasOtherContext =
    items.length > 0 &&
    (erfassungstyp === 'Projekt (Baustelle)' ||
      erfassungstyp === 'Lager' ||
      erfassungstyp === 'Ohne Bestellung');
  
  const hasLagerContext =
    erfassungstyp === 'Lager' &&
    (items.length > 0 || lagerSummaryItems.length > 0);
  
  const hasOhneBestellungContext =
    erfassungstyp === 'Ohne Bestellung' &&
    (items.length > 0 || ohneBestellungSummaryItems.length > 0);
  
  const showStickyBar = hasProjectContext || hasOrderContext || hasOtherContext || hasLagerContext || hasOhneBestellungContext;

  return (
    <View style={styles.container}>
      <Surface style={[styles.header, { backgroundColor: getHeaderBackgroundColor() }]}>
        <Title style={styles.headerTitle}>Wareneingang buchen</Title>
        {!isOnline && (
          <Chip mode="outlined" icon="wifi-off" style={styles.offlineChip}>
            Offline-Modus
          </Chip>
        )}
      </Surface>

      {/* Sticky Search/Filter/Add Bar */}
      {showStickyBar && (
        <View style={styles.stickyBar}>
          <View style={styles.stickyBarContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Artikel suchen..."
              mode="outlined"
              dense
              left={<TextInput.Icon icon="magnify" />}
            />
            <IconButton
              icon="filter"
              size={24}
              iconColor={BRAND_DARK_BLUE}
              onPress={() => {
                setFilterMenuVisible(true);
                if (filter.length === 0) {
                  setFilter(['alle']);
                }
              }}
              mode="contained-tonal"
              containerColor="#eef2f7"
              style={styles.stickyIconButton}
            />
            <IconButton
              icon="plus"
              size={24}
              iconColor="#fff"
              onPress={addNewItem}
              mode="contained"
              containerColor={BRAND_LIGHT_BLUE}
              style={[styles.stickyIconButton, styles.stickyAddButton]}
            />
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.formContainer} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Kopfbereich */}
        <Card style={styles.headerCard}>
          <Card.Content>
            {/* Erfassungstyp Dropdown */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Erfassungstyp:</Paragraph>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setErfassungstypDialogVisible(true)}
                >
                  <Paragraph
                    style={[
                      styles.dropdownText,
                      erfassungstypDialogVisible ? null : styles.dropdownTextSelected,
                    ]}
                  >
                    {erfassungstyp}
                  </Paragraph>
                  <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Referenz */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>
                {erfassungstyp === 'Lager' || erfassungstyp === 'Projekt (Baustelle)' || erfassungstyp === 'Ohne Bestellung'
                  ? 'Referenz:'
                  : 'Referenz (Bestellnummer):'}
              </Paragraph>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={referenz}
                  onChangeText={(text) => {
                    setReferenz(text);
                    // Bei Projekt: Lieferant zurücksetzen wenn Referenz geändert wird
                    if (erfassungstyp === 'Projekt (Baustelle)') {
                      setLieferant('');
                    }
                    // Reset supplier info if user manually changes reference
                    if (supplierDropdownVisible || availableSuppliersForOrder.length > 0) {
                      setAvailableSuppliersForOrder([]);
                      setSupplierDropdownVisible(false);
                      setSupplierSelectionDialogVisible(false);
                      if (availableSuppliersForOrder.length > 1) {
                        setLieferant('');
                      }
                    }
                  }}
                  placeholder="z.B. PO-2025-001"
                  mode="outlined"
                  dense
                />
                {erfassungstyp !== 'Projekt (Baustelle)' && erfassungstyp !== 'Lager' && erfassungstyp !== 'Ohne Bestellung' && (
                <IconButton
                  icon="magnify"
                  size={24}
                  iconColor={BRAND_DARK_BLUE}
                  onPress={() => {
                    if (erfassungstyp === 'Projekt (Baustelle)' && referenz.trim()) {
                      // Bei Projekt: Automatisch nach Bestellung suchen und Lieferant setzen
                      searchOrdersByReferenz(referenz);
                    } else {
                      searchOrdersByReferenz(referenz);
                    }
                  }}
                  style={styles.iconButton}
                />
                )}
              </View>
            </View>

            {/* Projektnummer - nur bei Projekt (Baustelle) */}
            {erfassungstyp === 'Projekt (Baustelle)' && (
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Projektnummer:</Paragraph>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={projektnummer}
                    onChangeText={setProjektnummer}
                    placeholder="z.B. PROJ-2025-001"
                    mode="outlined"
                    dense
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType="default"
                    returnKeyType="done"
                  />
                  <IconButton
                    icon="magnify"
                    size={24}
                    iconColor={BRAND_DARK_BLUE}
                    onPress={openProjectSearch}
                    style={styles.iconButton}
                  />
                </View>
              </View>
            )}

            {/* Lagerort - Bei "Lager" zwei Felder: Von Lagerort und Nach Lagerort */}
            {erfassungstyp === 'Lager' ? (
              <>
                {/* Von Lagerort */}
                <View style={styles.formField}>
                  <Paragraph style={styles.fieldLabel}>Von Lagerort:</Paragraph>
                  {userLocations.length > 1 ? (
                    // Mehrere Lagerorte - Dropdown anzeigen
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          setVonLagerortDialogVisible(true);
                        }}
                      >
                        <Paragraph style={styles.dropdownText}>{lagerort || 'Lagerort auswählen'}</Paragraph>
                        <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // Ein oder kein Lagerort - TextInput (disabled wenn automatisch gesetzt)
                    <TextInput
                      style={styles.textInput}
                      value={lagerort}
                      onChangeText={setLagerort}
                      mode="outlined"
                      dense
                      placeholder="Von Lagerort"
                      editable={userLocations.length === 0}
                    />
                  )}
                </View>
                
                {/* Nach Lagerort */}
                <View style={styles.formField}>
                  <Paragraph style={styles.fieldLabel}>Nach Lagerort (Benutzer):</Paragraph>
                  {userLocations.length > 1 ? (
                    // Mehrere Lagerorte - Dropdown anzeigen
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                        onPress={() => setLagerortDialogVisible(true)}
                    >
                      <Paragraph style={styles.dropdownText}>{nachLagerort || 'Lagerort auswählen'}</Paragraph>
                        <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
                    </TouchableOpacity>
                  </View>
                  ) : (
                    // Ein oder kein Lagerort - TextInput (disabled wenn automatisch gesetzt)
                    <TextInput
                      style={styles.textInput}
                      value={nachLagerort}
                      onChangeText={setNachLagerort}
                      mode="outlined"
                      dense
                      placeholder="Nach Lagerort (Benutzer)"
                      editable={userLocations.length === 0}
                    />
                  )}
                </View>
              </>
            ) : erfassungstyp !== 'Projekt (Baustelle)' ? (
              /* Normales Lagerort-Feld für andere Erfassungstypen */
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Lagerort:</Paragraph>
                {userLocations.length > 1 ? (
                  // Mehrere Lagerorte - Dropdown anzeigen
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setLagerortDialogVisible(true)}
                    >
                      <Paragraph style={styles.dropdownText}>{lagerort || 'Lagerort auswählen'}</Paragraph>
                      <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Ein oder kein Lagerort - TextInput (disabled wenn automatisch gesetzt)
                  <TextInput
                    style={styles.textInput}
                    value={lagerort}
                    onChangeText={setLagerort}
                    mode="outlined"
                    dense
                    placeholder="Lagerort"
                    editable={userLocations.length === 0}
                  />
                )}
              </View>
            ) : null}

            {/* Lieferant */}
            {erfassungstyp !== 'Projekt (Baustelle)' && erfassungstyp !== 'Lager' && (
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Lieferant:</Paragraph>
              {supplierDropdownVisible && availableSuppliersForOrder.length > 1 ? (
                // Multiple suppliers - show dropdown like Lagerort
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setSupplierSelectionDialogVisible(true)}
                  >
                    <Paragraph style={styles.dropdownText}>{lieferant || 'Lieferant auswählen'}</Paragraph>
                    <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
                  </TouchableOpacity>
                </View>
              ) : (
                // Single supplier or manual input - show TextInput
                <TextInput
                  style={styles.textInput}
                  value={lieferant}
                  onChangeText={(text) => {
                    setLieferant(text);
                    // If user manually changes supplier, disable dropdown
                    if (supplierDropdownVisible) {
                      setSupplierDropdownVisible(false);
                      setAvailableSuppliersForOrder([]);
                    }
                  }}
                  placeholder="Lieferant Name"
                  mode="outlined"
                  dense
                />
              )}
            </View>
            )}

            {/* Bemerkung - nur bei Erfassungstyp "Ohne Bestellung" */}
            {erfassungstyp === 'Ohne Bestellung' && (
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Bemerkung:</Paragraph>
                <TextInput
                  style={styles.textInput}
                  value={bereich}
                  onChangeText={setBereich}
                  placeholder="Bemerkung (optional)"
                  mode="outlined"
                  dense
                />
              </View>
            )}

            {/* Bemerkung - nur bei Erfassungstyp "Lager" (optional) */}
            {erfassungstyp === 'Lager' && (
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Bemerkung:</Paragraph>
                <TextInput
                  style={styles.textInput}
                  value={bemerkung}
                  onChangeText={setBemerkung}
                  placeholder="Bemerkung (optional)"
                  mode="outlined"
                  dense
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

          </Card.Content>
        </Card>

        {/* Bodybereich */}
        <Card style={styles.bodyCard}>
          <Card.Content>
            
            {/* Project Materials View - wenn Projekt ausgewählt */}
            {erfassungstyp === 'Projekt (Baustelle)' && projektnummer.trim() && (
              <View>
                <Surface style={styles.projectMaterialsHeader}>
                  <View style={styles.projectHeaderRow}>
                  <Title style={styles.projectMaterialsTitle}>
                    {selectedProject?.name || projektnummer}
                  </Title>
                  {selectedProject?.status && (
                      <Chip
                        mode="outlined"
                        style={[
                          styles.projectStatusChip,
                          selectedProject.status === 'Aktiv' && styles.statusActive,
                          selectedProject.status === 'Pausiert' && styles.statusPaused,
                          selectedProject.status === 'Abgeschlossen' && styles.statusCompleted
                        ]}
                        textStyle={[
                          styles.projectStatusText,
                          selectedProject.status === 'Aktiv' && styles.statusActiveText,
                          selectedProject.status === 'Pausiert' && styles.statusPausedText,
                          selectedProject.status === 'Abgeschlossen' && styles.statusCompletedText
                        ]}
                      >
                        {selectedProject.status}
                      </Chip>
                      )}
                    </View>
                  {selectedProject?.description && (
                    <Paragraph style={styles.projectMaterialsDescription}>
                      {selectedProject.description}
                    </Paragraph>
                  )}
                  {selectedProject?.startDate && selectedProject?.endDate && (
                    <Paragraph style={styles.projectMaterialsDates}>
                      {`Von ${formatProjectDate(selectedProject.startDate)} bis ${formatProjectDate(selectedProject.endDate)}`}
                    </Paragraph>
                  )}
                </Surface>

                {getProjectFilteredData().length === 0 ? (
                  <View style={styles.emptyState}>
                    <Paragraph style={styles.emptyStateText}>
                      Noch keine Materialien oder Geräte für dieses Projekt zugewiesen.
                    </Paragraph>
                  </View>
                ) : (
                  <View style={styles.projectMaterialsListContainer}>
                    {getProjectFilteredData().map((item, index) => (
                      <View key={`${item.type}-${item.data.id}-${index}`}>
                        {renderProjectItem({ item })}
                      </View>
                    ))}
              </View>
            )}

                          </View>
                        )}

            {/* Order Materials View - wenn Bestellung ausgewählt */}
            {erfassungstyp === 'Bestellung' && referenz.trim() && (
              <View>
                <Surface style={styles.projectMaterialsHeader}>
                  <View style={styles.projectHeaderRow}>
                    <Title style={styles.projectMaterialsTitle}>
                      Bestellung: {referenz.trim()}
                    </Title>
                  </View>
                  <Paragraph style={styles.projectMaterialsDescription}>
                    {lieferant ? `Lieferant: ${lieferant}` : 'Keine Lieferantenauswahl'}
                  </Paragraph>
                  {currentOrderGroup && (
                    <Paragraph style={styles.projectMaterialsDates}>
                      Letzte Änderung: {(() => {
                        const timestamp =
                          currentOrderGroup.lastUpdatedAt && currentOrderGroup.lastUpdatedAt > 0
                            ? new Date(currentOrderGroup.lastUpdatedAt)
                            : new Date(currentOrderGroup.createdAt);
                        return `${timestamp.toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })} ${timestamp.toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`;
                      })()}
                    </Paragraph>
                  )}
                </Surface>

                {orderSummaryItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Paragraph style={styles.emptyStateText}>
                      Noch keine Artikel für diese Bestellung zugewiesen.
                    </Paragraph>
                  </View>
                ) : (
                  <View style={styles.projectMaterialsListContainer}>
                    {orderSummaryItems.map((item, index) => (
                      <View key={`${item.key}-${index}`}>
                        {renderOrderSummaryItem(item)}
                      </View>
                    ))}
                  </View>
                )}
                          </View>
                        )}

            {/* Lager Materials View - wenn Erfassungstyp "Lager" und Artikel vorhanden */}
            {erfassungstyp === 'Lager' && (items.length > 0 || lagerSummaryItems.length > 0) && (
              <View>
                <Surface style={styles.projectMaterialsHeader}>
                  <View style={styles.projectHeaderRow}>
                    <Title style={styles.projectMaterialsTitle}>
                      Lagerumbuchung
                    </Title>
                  </View>
                  {referenz.trim() && (
                    <Paragraph style={styles.projectMaterialsDescription}>
                      Referenz: {referenz.trim()}
                    </Paragraph>
                  )}
                  {lagerort && nachLagerort && (
                    <Paragraph style={styles.projectMaterialsDescription}>
                      Von: {lagerort} → Nach: {nachLagerort}
                    </Paragraph>
                  )}
                </Surface>

                {lagerSummaryItems.length > 0 && (
                  <View style={styles.projectMaterialsListContainer}>
                    {lagerSummaryItems.map((item, index) => (
                      <View key={`${item.key}-${index}`}>
                        {renderLagerSummaryItem(item)}
                      </View>
                    ))}
                  </View>
                )}
                          </View>
                        )}

            {/* Ohne Bestellung Materials View - wenn Erfassungstyp "Ohne Bestellung" und Artikel vorhanden */}
            {erfassungstyp === 'Ohne Bestellung' && (items.length > 0 || ohneBestellungSummaryItems.length > 0) && (
              <View>
                <Surface style={styles.projectMaterialsHeader}>
                  <View style={styles.projectHeaderRow}>
                    <Title style={styles.projectMaterialsTitle}>
                      Ohne Bestellung
                    </Title>
                  </View>
                  {referenz.trim() && (
                    <Paragraph style={styles.projectMaterialsDescription}>
                      Referenz: {referenz.trim()}
                    </Paragraph>
                  )}
                  {bereich.trim() && (
                    <Paragraph style={styles.projectMaterialsDescription}>
                      Bemerkung: {bereich.trim()}
                    </Paragraph>
                  )}
                </Surface>

                {ohneBestellungSummaryItems.length > 0 && (
                  <View style={styles.projectMaterialsListContainer}>
                    {ohneBestellungSummaryItems.map((item, index) => (
                      <View key={`${item.key}-${index}`}>
                        {renderOhneBestellungSummaryItem(item)}
                      </View>
                    ))}
                  </View>
                )}
                          </View>
                        )}

            {/* Artikel-Liste oder Einzel-Formular */}
            {renderItemForms()}

            {/* Submit Button für Artikel-Liste */}
          </Card.Content>
        </Card>

        {/* Historie */}
        {erfassungstyp !== 'Bestellung' && erfassungstyp !== 'Projekt (Baustelle)' && erfassungstyp !== 'Lager' && erfassungstyp !== 'Ohne Bestellung' && (
        <Card style={styles.historyCard}>
          <Card.Content>
              <Title style={styles.historyTitle}>
                Letzte Wareneingänge
              </Title>
              
              {(() => {
                // Filtere Wareneingänge nach aktuellem Erfassungstyp
                const trimmedProjekt = projektnummer.trim();

                if (erfassungstyp === 'Projekt (Baustelle)' && !trimmedProjekt) {
                  return (
                    <Paragraph style={styles.emptyText}>
                      Kein Projekt ausgewählt.
                    </Paragraph>
                  );
                }

                const filteredWareneingaenge = wareneingaenge.filter(w => {
                  if (erfassungstyp === 'Projekt (Baustelle)') {
                    if (!trimmedProjekt) {
                      return false;
                    }
                    const projectFromNotes = extractProjectNumberFromNotes(w.notes);
                    return (
                      w.erfassungstyp === 'Projekt (Baustelle)' &&
                      (
                        matchesSelectedProject(projectFromNotes, trimmedProjekt) ||
                        matchesSelectedProject(w.referenz, trimmedProjekt)
                      )
                    );
                  } else if (erfassungstyp === 'Bestellung') {
                    return w.erfassungstyp === 'Bestellung';
                  } else if (erfassungstyp === 'Lager') {
                    return w.erfassungstyp === 'Lager';
                  } else if (erfassungstyp === 'Ohne Bestellung') {
                    return w.erfassungstyp === 'Ohne Bestellung';
                  } else {
                    // Bei anderen Erfassungstypen alle anzeigen, die nicht Projekte sind
                    return w.erfassungstyp !== 'Projekt (Baustelle)';
                  }
                });

                if (erfassungstyp === 'Projekt (Baustelle)') {
                  const trimmedProject = projektnummer.trim();
                  const projectKeyLower = trimmedProject.toLowerCase();
                  const projectGroups = groupWareneingaengeByReferenz(filteredWareneingaenge);
                  const selectedGroup =
                    projectGroups.find(group =>
                      (group.referenz || '').toLowerCase() === projectKeyLower
                    ) || projectGroups[0];

                  let aggregatedItems: AggregatedOrderItem[] = [];
                  let projectTitle =
                    selectedProject?.name || trimmedProject || 'Projekt';
                  let changeDate: Date | null = null;

                  if (selectedGroup) {
                    aggregatedItems = aggregateProjectGroupItems(selectedGroup.items);
                    projectTitle = getProjectDisplayName(selectedGroup);
                    changeDate =
                      selectedGroup.lastUpdatedAt && selectedGroup.lastUpdatedAt > 0
                        ? new Date(selectedGroup.lastUpdatedAt)
                        : new Date(selectedGroup.createdAt);
                  }

                  const assignmentsForProject = projectAssignments.filter(
                    assignment =>
                      (assignment.projectKey || '').toLowerCase().trim() === projectKeyLower
                  );

                  const aggregatedMap = new Map<string, AggregatedOrderItem>();
                  aggregatedItems.forEach(item => {
                    aggregatedMap.set(
                      item.productId != null
                        ? `id-${item.productId}`
                        : item.key
                        ? item.key
                        : item.name
                        ? `name-${item.name.toLowerCase()}`
                        : `item-${item.bookingHistory[0]?.id ?? Math.random()}`,
                      item
                    );
                  });

                  assignmentsForProject.forEach(assignment => {
                    const key =
                      assignment.productId != null
                        ? `id-${assignment.productId}`
                        : assignment.productSku
                        ? `sku-${assignment.productSku.toLowerCase()}`
                        : `assignment-${assignment.id}`;

                    const product = allProducts.find(p => p.id === assignment.productId);
                    const createdAt = assignment.createdAt || new Date().toISOString();
                    const createdAtTimestamp = new Date(createdAt).getTime();
                    const displayUnit = toDisplayUnit(
                      assignment.unit || product?.unit || 'Stück'
                    );

                    if (aggregatedMap.has(key)) {
                      const existing = aggregatedMap.get(key)!;
                      existing.unit = displayUnit;
                      existing.productId = assignment.productId ?? existing.productId;
                      existing.name =
                        existing.name ||
                        assignment.productName ||
                        product?.name ||
                        'Zugewiesener Artikel';
                      existing.sku =
                        existing.sku || assignment.productSku || product?.sku || '';
                      existing.createdAtTimestamp =
                        existing.createdAtTimestamp != null
                          ? Math.min(existing.createdAtTimestamp, createdAtTimestamp)
                          : createdAtTimestamp;
                    } else {
                      const aggregatedAssignment: AggregatedOrderItem = {
                        key,
                        productId: assignment.productId,
                        name:
                          assignment.productName ||
                          product?.name ||
                          'Zugewiesener Artikel',
                        unit: displayUnit,
                        quantity: 0,
                        sku: assignment.productSku || product?.sku,
                        supplier: product?.defaultSupplier,
                        type: product?.description || product?.itemType,
                        location: undefined,
                        bookingHistory: [],
                        itemType: 'material',
                        lastTimestamp: undefined,
                        lastBookingQuantity: undefined,
                        lastBookingUnit: undefined,
                        lastBooking: undefined,
                        createdAtTimestamp,
                      };

                      aggregatedItems.push(aggregatedAssignment);
                      aggregatedMap.set(key, aggregatedAssignment);
                    }
                  });

                  if (aggregatedItems.length === 0) {
                return (
                      <Paragraph style={styles.emptyText}>
                        Noch keine Projekte vorhanden.
                      </Paragraph>
                    );
                  }

                  const latestAssignmentDate =
                    assignmentsForProject.length > 0
                      ? new Date(
                          Math.max(
                            ...assignmentsForProject.map(assignment =>
                              new Date(
                                assignment.createdAt || new Date().toISOString()
                              ).getTime()
                            )
                          )
                        )
                      : null;

                  const effectiveChangeDate = changeDate ?? latestAssignmentDate;

                  const lastChangeText = effectiveChangeDate
                    ? `${effectiveChangeDate.toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })} ${effectiveChangeDate.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : '-';

                  aggregatedItems.sort((a, b) => {
                    const timeA =
                      a.lastTimestamp ??
                      a.createdAtTimestamp ??
                      Number.MAX_SAFE_INTEGER;
                    const timeB =
                      b.lastTimestamp ??
                      b.createdAtTimestamp ??
                      Number.MAX_SAFE_INTEGER;
                    if (timeA !== timeB) {
                      return timeA - timeB;
                    }
                    return (a.name || '').localeCompare(b.name || '');
                  });

                    return (
                      <Card style={styles.wareneingangCard}>
                        <Card.Content>
                        <Title style={styles.bestellungTitle}>Projekt: {projectTitle}</Title>
                        <View style={styles.infoRow}>
                          <Paragraph style={styles.label}>Letzte Änderung:</Paragraph>
                          <Paragraph style={styles.value}>{lastChangeText}</Paragraph>
                        </View>
                        <View style={styles.infoRow}>
                          <Paragraph style={styles.label}>Anzahl Artikel:</Paragraph>
                          <Paragraph style={styles.value}>{aggregatedItems.length}</Paragraph>
                        </View>
                        <Divider style={styles.bestellungDivider} />

                        {aggregatedItems.map((aggregatedItem, index) => {
                          const quantityLabel = formatQuantityValue(aggregatedItem.quantity);
                          const unitLabel = getUnitLabel(aggregatedItem.unit, aggregatedItem.quantity);
                          return (
                            <View
                              key={`${aggregatedItem.name}-${index}`}
                              style={styles.artikelItem}
                            >
                              <View style={styles.artikelHeader}>
                                <Paragraph style={styles.artikelName}>
                                  {aggregatedItem.name}
                                </Paragraph>
                              </View>
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Menge:</Paragraph>
                                <Chip mode="outlined" style={styles.chip}>
                                  {quantityLabel} {unitLabel}
                                </Chip>
                              </View>
                              {index < aggregatedItems.length - 1 && (
                                <Divider style={styles.artikelDivider} />
                              )}
                            </View>
                          );
                        })}
                        </Card.Content>
                      </Card>
                    );
                  }

                if (filteredWareneingaenge.length === 0) {
                  return (
                    <Paragraph style={styles.emptyText}>
                      {erfassungstyp === 'Bestellung'
                        ? 'Noch keine Bestellungen vorhanden.'
                        : 'Noch keine Wareneingänge vorhanden.'}
                    </Paragraph>
                  );
                }

                if (erfassungstyp === 'Bestellung') {
                  // Historie für Bestellung ist ausgeblendet
                  return null;
                }

                  // Spezielle Behandlung für "Lager"
                  if (erfassungstyp === 'Lager') {
                    // Filtere nach aktueller Lagerumbuchung (Referenz, Von Lagerort, Nach Lagerort, Bemerkung)
                    const currentReferenz = (referenz || '').trim();
                    const currentVonLagerort = (lagerort || '').trim();
                    const currentNachLagerort = (nachLagerort || '').trim();
                    const currentBemerkung = (bemerkung || '').trim();
                    
                    // Wenn keine Referenz vorhanden ist, zeige nichts in der Historie an
                    if (!currentReferenz) {
                      return (
                        <Paragraph style={styles.emptyText}>
                          Keine Referenz eingegeben. Bitte geben Sie eine Referenz ein, um die Historie anzuzeigen.
                        </Paragraph>
                      );
                    }
                    
                    // Erstelle erwartete Notes für aktuelle Lagerumbuchung
                    let expectedNotes = `Von: ${currentVonLagerort}, Nach: ${currentNachLagerort}`;
                    if (currentBemerkung) {
                      expectedNotes += ` | Bemerkung: ${currentBemerkung}`;
                    }
                    
                    // Filtere Wareneingänge nach aktueller Lagerumbuchung
                    // Da wir bereits prüfen, dass eine Referenz vorhanden ist, filtern wir nur nach Referenz
                    const currentLagerWareneingaenge = filteredWareneingaenge.filter(w => {
                      if (w.erfassungstyp !== 'Lager') return false;
                      // Nur nach Referenz filtern
                      return w.referenz === currentReferenz;
                    });
                    
                    // Kombiniere gespeicherte Wareneingänge mit aktuellen lagerSummaryItems
                    // Aber vermeide Doppelungen: Wenn Artikel bereits in lagerSummaryItems sind (aus DB geladen),
                    // zeige sie nicht in der Historie an
                    const lagerSummaryItemIds = new Set(
                      lagerSummaryItems
                        .filter(item => item.key.startsWith('lager-ref-'))
                        .map(item => {
                          // Extrahiere die ID aus dem key (z.B. "lager-ref-123-0" -> "123")
                          const match = item.key.match(/lager-ref-(\d+)/);
                          return match ? parseInt(match[1]) : null;
                        })
                        .filter(id => id !== null)
                    );
                    
                    // Filtere Artikel, die bereits in lagerSummaryItems sind
                    const filteredLagerWareneingaenge = currentLagerWareneingaenge.filter(w => {
                      // Wenn eine Referenz vorhanden ist und der Artikel bereits in lagerSummaryItems ist,
                      // zeige ihn nicht in der Historie an (wird bereits im Bodybereich angezeigt)
                      if (currentReferenz && lagerSummaryItemIds.has(w.id)) {
                        return false;
                      }
                      return true;
                    });
                    
                    const allLagerItems: any[] = [...filteredLagerWareneingaenge];
                    
                    // Extrahiere Werte aus gespeicherten Items, falls aktuelle Werte leer sind
                    let extractedVonLagerort = currentVonLagerort;
                    let extractedNachLagerort = currentNachLagerort;
                    let extractedBemerkung = currentBemerkung;
                    
                    // Versuche Werte aus gespeicherten Items zu extrahieren
                    for (const item of currentLagerWareneingaenge) {
                      if (item?.notes) {
                        const notes = item.notes;
                        // Verbesserte Regex-Patterns für bessere Extraktion
                        const vonMatch = notes.match(/Von:\s*([^,|]+)/);
                        const nachMatch = notes.match(/Nach:\s*([^|]+?)(?:\s*\||$)/);
                        const bemerkungMatch = notes.match(/\|\s*Bemerkung:\s*(.+)/);
                        
                        if (!extractedVonLagerort && vonMatch) {
                          extractedVonLagerort = vonMatch[1].trim();
                        }
                        if (!extractedNachLagerort && nachMatch) {
                          extractedNachLagerort = nachMatch[1].trim();
                        }
                        if (!extractedBemerkung && bemerkungMatch) {
                          extractedBemerkung = bemerkungMatch[1].trim();
                        }
                        
                        // Wenn alle Werte gefunden wurden, kann die Schleife beendet werden
                        if (extractedVonLagerort && extractedNachLagerort) {
                          break;
                        }
                      }
                    }
                    
                    // Priorisiere IMMER aktuelle Werte aus dem State, dann extrahierte Werte
                    // Verwende die State-Werte direkt - sie haben immer Vorrang
                    let effectiveVonLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : extractedVonLagerort;
                    let effectiveNachLagerort = (nachLagerort && nachLagerort.trim()) ? nachLagerort.trim() : extractedNachLagerort;
                    let effectiveBemerkung = (bemerkung && bemerkung.trim()) ? bemerkung.trim() : extractedBemerkung;
                    
                    // Erstelle erwartete Notes mit effektiven Werten
                    let effectiveNotes = `Von: ${effectiveVonLagerort}, Nach: ${effectiveNachLagerort}`;
                    if (effectiveBemerkung) {
                      effectiveNotes += ` | Bemerkung: ${effectiveBemerkung}`;
                    }
                    
                    // Füge nur neue lagerSummaryItems hinzu (die nicht aus DB geladen wurden)
                    // Artikel, die bereits in der DB gespeichert sind (lager-ref-*), werden nicht hinzugefügt,
                    // da sie bereits im Bodybereich angezeigt werden
                    if (lagerSummaryItems.length > 0) {
                      lagerSummaryItems.forEach(item => {
                        // Überspringe Artikel, die aus der DB geladen wurden (werden bereits im Bodybereich angezeigt)
                        if (item.key.startsWith('lager-ref-')) {
                          return;
                        }
                        
                        // Finde Produkt-Informationen
                        const product = allProducts.find(p => p.id === item.productId);
                        if (product) {
                          // Verwende effektive Werte
                          const itemVonLagerort = effectiveVonLagerort || item.location || '-';
                          const itemNachLagerort = effectiveNachLagerort || '-';
                          
                          allLagerItems.push({
                            id: `temp-${item.key}`,
                            productId: item.productId,
                            productName: item.name,
                            quantity: item.quantityInput,
                            erfassungstyp: 'Lager',
                            referenz: currentReferenz || undefined,
                            location: itemVonLagerort,
                            notes: effectiveNotes,
                            createdAt: new Date(item.createdAtTimestamp || Date.now()).toISOString(),
                            updatedAt: new Date().toISOString(),
                          });
                        }
                      });
                    }
                    
                    // Falls noch nicht gefunden, versuche auch aus allLagerItems zu extrahieren (nachdem lagerSummaryItems hinzugefügt wurden)
                    if ((!effectiveVonLagerort || !effectiveNachLagerort) && allLagerItems.length > 0) {
                      for (const item of allLagerItems) {
                        if (item?.notes) {
                          const notes = item.notes;
                          const vonMatch = notes.match(/Von:\s*([^,|]+)/);
                          const nachMatch = notes.match(/Nach:\s*([^|]+?)(?:\s*\||$)/);
                          const bemerkungMatch = notes.match(/\|\s*Bemerkung:\s*(.+)/);
                          
                          if (!effectiveVonLagerort && vonMatch) {
                            effectiveVonLagerort = vonMatch[1].trim();
                          }
                          if (!effectiveNachLagerort && nachMatch) {
                            effectiveNachLagerort = nachMatch[1].trim();
                          }
                          if (!effectiveBemerkung && bemerkungMatch) {
                            effectiveBemerkung = bemerkungMatch[1].trim();
                          }
                          
                          if (effectiveVonLagerort && effectiveNachLagerort) {
                            break;
                          }
                        }
                      }
                    }
                    
                    // Wenn keine Artikel vorhanden sind, zeige leere Nachricht
                    if (allLagerItems.length === 0 && currentLagerWareneingaenge.length === 0) {
                      return (
                        <Paragraph style={styles.emptyText}>
                          Noch keine Artikel für diese Lagerumbuchung vorhanden.
                        </Paragraph>
                      );
                    }
                    
                    // Wenn nur lagerSummaryItems vorhanden sind (noch nicht gespeichert), zeige diese an
                    if (lagerSummaryItems.length > 0 && currentLagerWareneingaenge.length === 0) {
                      // Verwende effektive Werte (bereits oben extrahiert)
                      const displayVonLagerort = effectiveVonLagerort || '-';
                      const displayNachLagerort = effectiveNachLagerort || '-';
                      const displayBemerkung = effectiveBemerkung || '';
                      const displayReferenz = currentReferenz || '';
                      
                      // Bestimme Zeitstempel (neuestes Item)
                      const latestTimestamp = allLagerItems.length > 0
                        ? new Date(allLagerItems[0].createdAt || allLagerItems[0].updatedAt || Date.now())
                        : new Date();
                      
                      const lastChangeText = `${latestTimestamp.toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })} ${latestTimestamp.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`;

                      return (
                        <Card style={styles.wareneingangCard}>
                          <Card.Content>
                            <Title style={styles.bestellungTitle}>
                              {displayReferenz ? `Referenz: ${displayReferenz}` : 'Lagerumbuchung'}
                            </Title>
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Von Lagerort:</Paragraph>
                              <Paragraph style={styles.value}>{displayVonLagerort}</Paragraph>
                            </View>
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Nach Lagerort:</Paragraph>
                              <Paragraph style={styles.value}>{displayNachLagerort}</Paragraph>
                            </View>
                            {displayBemerkung && (
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Bemerkung:</Paragraph>
                                <Paragraph style={styles.value}>{displayBemerkung}</Paragraph>
                              </View>
                            )}
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Letzte Änderung:</Paragraph>
                              <Paragraph style={styles.value}>{lastChangeText}</Paragraph>
                            </View>
                            <Divider style={styles.bestellungDivider} />
                            
                            {allLagerItems.map((wareneingang, index) => (
                              <View key={wareneingang.id || `item-${index}`} style={styles.artikelItem}>
                                <View style={styles.artikelHeader}>
                                  <Paragraph style={styles.artikelName}>
                                    {wareneingang.productName}
                                  </Paragraph>
                                </View>
                                <View style={styles.infoRow}>
                                  <Paragraph style={styles.label}>Menge:</Paragraph>
                                  <Chip mode="outlined" style={styles.chip}>
                                    {wareneingang.quantity} Stück
                                  </Chip>
                                </View>
                                {index < allLagerItems.length - 1 && <Divider style={styles.artikelDivider} />}
                              </View>
                            ))}
                          </Card.Content>
                        </Card>
                      );
                    }
                    
                    // Sortiere nach Zeitstempel (neueste zuerst)
                    allLagerItems.sort((a, b) => {
                      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
                      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
                      return timeB - timeA;
                    });
                    
                    // Wenn eine Referenz vorhanden ist und mehrere Lagerumbuchungen existieren,
                    // extrahiere Header-Informationen aus der neuesten Lagerumbuchung
                    if (currentReferenz && allLagerItems.length > 0) {
                      const newestItem = allLagerItems[0];
                      if (newestItem?.notes) {
                        const notes = newestItem.notes;
                        const vonMatch = notes.match(/Von:\s*([^,|]+)/);
                        const nachMatch = notes.match(/Nach:\s*([^|]+?)(?:\s*\||$)/);
                        const bemerkungMatch = notes.match(/\|\s*Bemerkung:\s*(.+)/);
                        
                        if (vonMatch && !effectiveVonLagerort) {
                          effectiveVonLagerort = vonMatch[1].trim();
                        }
                        if (nachMatch && !effectiveNachLagerort) {
                          effectiveNachLagerort = nachMatch[1].trim();
                        }
                        if (bemerkungMatch && !effectiveBemerkung) {
                          effectiveBemerkung = bemerkungMatch[1].trim();
                        }
                      }
                    }
                    
                    // Verwende IMMER zuerst die State-Werte, dann effektive Werte
                    // State-Werte haben absoluten Vorrang, auch wenn sie leer erscheinen
                    const displayVonLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : (effectiveVonLagerort || '-');
                    const displayNachLagerort = (nachLagerort && nachLagerort.trim()) ? nachLagerort.trim() : (effectiveNachLagerort || '-');
                    const displayBemerkung = (bemerkung && bemerkung.trim()) ? bemerkung.trim() : (effectiveBemerkung || '');
                    
                    // Bestimme Zeitstempel (neuestes Item oder aktueller Zeitpunkt)
                    const latestTimestamp = allLagerItems.length > 0
                      ? new Date(allLagerItems[0].createdAt || allLagerItems[0].updatedAt || Date.now())
                      : new Date();
                    
                    const lastChangeText = `${latestTimestamp.toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })} ${latestTimestamp.toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`;

                    return (
                      <Card style={styles.wareneingangCard}>
                        <Card.Content>
                          <Title style={styles.bestellungTitle}>
                            {currentReferenz ? `Referenz: ${currentReferenz}` : 'Lagerumbuchung'}
                          </Title>
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Von Lagerort:</Paragraph>
                            <Paragraph style={styles.value}>{displayVonLagerort}</Paragraph>
                          </View>
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Nach Lagerort:</Paragraph>
                            <Paragraph style={styles.value}>{displayNachLagerort}</Paragraph>
                          </View>
                          {displayBemerkung && (
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Bemerkung:</Paragraph>
                              <Paragraph style={styles.value}>{displayBemerkung}</Paragraph>
                            </View>
                          )}
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Letzte Änderung:</Paragraph>
                            <Paragraph style={styles.value}>{lastChangeText}</Paragraph>
                          </View>
                          <Divider style={styles.bestellungDivider} />
                          
                          {allLagerItems.map((wareneingang, index) => (
                            <View key={wareneingang.id || `item-${index}`} style={styles.artikelItem}>
                              <View style={styles.artikelHeader}>
                                <Paragraph style={styles.artikelName}>
                                  {wareneingang.productName}
                                </Paragraph>
                              </View>
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Menge:</Paragraph>
                                <Chip mode="outlined" style={styles.chip}>
                                  {wareneingang.quantity} Stück
                                </Chip>
                              </View>
                              {index < allLagerItems.length - 1 && <Divider style={styles.artikelDivider} />}
                            </View>
                          ))}
                        </Card.Content>
                      </Card>
                    );
                  }

                  // Spezielle Behandlung für "Ohne Bestellung"
                  if (erfassungstyp === 'Ohne Bestellung') {
                    // Filtere nach aktueller Referenz
                    const currentReferenz = (referenz || '').trim();
                    const currentBemerkung = (bereich || '').trim();
                    
                    // Wenn keine Referenz vorhanden ist, zeige nichts in der Historie an
                    if (!currentReferenz) {
                      return (
                        <Paragraph style={styles.emptyText}>
                          Keine Referenz eingegeben. Bitte geben Sie eine Referenz ein, um die Historie anzuzeigen.
                        </Paragraph>
                      );
                    }
                    
                    // Filtere Wareneingänge nach aktueller Referenz
                    const currentOhneBestellungWareneingaenge = filteredWareneingaenge.filter(w => {
                      if (w.erfassungstyp !== 'Ohne Bestellung') return false;
                      // Nur nach Referenz filtern
                      return w.referenz === currentReferenz;
                    });
                    
                    // Kombiniere gespeicherte Wareneingänge mit aktuellen ohneBestellungSummaryItems
                    // Aber vermeide Doppelungen: Wenn Artikel bereits in ohneBestellungSummaryItems sind (aus DB geladen),
                    // zeige sie nicht in der Historie an
                    const ohneBestellungSummaryItemIds = new Set(
                      ohneBestellungSummaryItems
                        .filter(item => item.key.startsWith('ohne-bestellung-ref-'))
                        .map(item => {
                          // Extrahiere die ID aus dem key (z.B. "ohne-bestellung-ref-123-0" -> "123")
                          const match = item.key.match(/ohne-bestellung-ref-(\d+)/);
                          return match ? parseInt(match[1]) : null;
                        })
                        .filter(id => id !== null)
                    );
                    
                    // Filtere Artikel, die bereits in ohneBestellungSummaryItems sind
                    const filteredOhneBestellungWareneingaenge = currentOhneBestellungWareneingaenge.filter(w => {
                      // Wenn eine Referenz vorhanden ist und der Artikel bereits in ohneBestellungSummaryItems ist,
                      // zeige ihn nicht in der Historie an (wird bereits im Bodybereich angezeigt)
                      if (currentReferenz && ohneBestellungSummaryItemIds.has(w.id)) {
                        return false;
                      }
                      return true;
                    });
                    
                    const allOhneBestellungItems: any[] = [...filteredOhneBestellungWareneingaenge];
                    
                    // Extrahiere Bemerkung, Lieferant und Lagerort aus gespeicherten Items, falls aktuelle Werte leer sind
                    let extractedBemerkung = currentBemerkung;
                    let extractedLieferant = (lieferant || '').trim();
                    let extractedLagerort = (lagerort || '').trim();
                    
                    // Versuche Werte aus gespeicherten Items zu extrahieren
                    for (const item of currentOhneBestellungWareneingaenge) {
                      if (item?.notes) {
                        const notes = item.notes;
                        const bemerkungMatch = notes.match(/Bemerkung:\s*(.+)/);
                        const lieferantMatch = notes.match(/Lieferant:\s*(.+)/);
                        const lagerortMatch = notes.match(/Lagerort:\s*(.+)/);
                        
                        if (!extractedBemerkung && bemerkungMatch) {
                          extractedBemerkung = bemerkungMatch[1].trim();
                        }
                        if (!extractedLieferant && lieferantMatch) {
                          extractedLieferant = lieferantMatch[1].trim();
                        }
                        if (!extractedLagerort && lagerortMatch) {
                          extractedLagerort = lagerortMatch[1].trim();
                        }
                      }
                      
                      // Extrahiere Lieferant und Lagerort aus den Item-Daten (falls nicht in notes)
                      if (!extractedLieferant && item.supplier) {
                        extractedLieferant = item.supplier.trim();
                      }
                      if (!extractedLagerort && item.location) {
                        extractedLagerort = item.location.trim();
                      }
                      
                      if (extractedBemerkung && extractedLieferant && extractedLagerort) {
                        break;
                      }
                    }
                    
                    // Priorisiere IMMER aktuelle Werte aus dem State, dann extrahierte Werte
                    const effectiveBemerkung = (bereich && bereich.trim()) ? bereich.trim() : extractedBemerkung;
                    const effectiveLieferant = (lieferant && lieferant.trim()) ? lieferant.trim() : extractedLieferant;
                    const effectiveLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : extractedLagerort;
                    
                    // Füge nur neue ohneBestellungSummaryItems hinzu (die nicht aus DB geladen wurden)
                    // Artikel, die bereits in der DB gespeichert sind (ohne-bestellung-ref-*), werden nicht hinzugefügt,
                    // da sie bereits im Bodybereich angezeigt werden
                    if (ohneBestellungSummaryItems.length > 0) {
                      ohneBestellungSummaryItems.forEach(item => {
                        // Überspringe Artikel, die aus der DB geladen wurden (werden bereits im Bodybereich angezeigt)
                        if (item.key.startsWith('ohne-bestellung-ref-')) {
                          return;
                        }
                        
                        // Finde Produkt-Informationen
                        const product = allProducts.find(p => p.id === item.productId);
                        if (product) {
                          allOhneBestellungItems.push({
                            id: `temp-${item.key}`,
                            productId: item.productId,
                            productName: item.name,
                            quantity: item.quantityInput,
                            erfassungstyp: 'Ohne Bestellung',
                            referenz: currentReferenz || undefined,
                            location: item.location,
                            notes: effectiveBemerkung ? `Bemerkung: ${effectiveBemerkung}` : undefined,
                            createdAt: new Date(item.createdAtTimestamp || Date.now()).toISOString(),
                            updatedAt: new Date().toISOString(),
                          });
                        }
                      });
                    }
                    
                    // Sortiere nach Zeitstempel (neueste zuerst)
                    allOhneBestellungItems.sort((a, b) => {
                      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
                      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
                      return timeB - timeA;
                    });
                    
                    // Wenn nur ohneBestellungSummaryItems vorhanden sind (noch nicht gespeichert), zeige diese an
                    if (ohneBestellungSummaryItems.length > 0 && currentOhneBestellungWareneingaenge.length === 0) {
                      const displayBemerkung = effectiveBemerkung || '';
                      const displayReferenz = currentReferenz || '';
                      const displayLieferant = effectiveLieferant || '';
                      const displayLagerort = effectiveLagerort || '';
                      
                      // Bestimme Zeitstempel (neuestes Item)
                      const latestTimestamp = allOhneBestellungItems.length > 0
                        ? new Date(allOhneBestellungItems[0].createdAt || allOhneBestellungItems[0].updatedAt || Date.now())
                        : new Date();
                      
                      const lastChangeText = `${latestTimestamp.toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })} ${latestTimestamp.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`;

                      return (
                        <Card style={styles.wareneingangCard}>
                          <Card.Content>
                            <Title style={styles.bestellungTitle}>
                              {displayReferenz ? `Referenz: ${displayReferenz}` : 'Ohne Bestellung'}
                            </Title>
                            {displayLieferant && (
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Lieferant:</Paragraph>
                                <Paragraph style={styles.value}>{displayLieferant}</Paragraph>
                              </View>
                            )}
                            {displayLagerort && (
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Lagerort:</Paragraph>
                                <Paragraph style={styles.value}>{displayLagerort}</Paragraph>
                              </View>
                            )}
                            {displayBemerkung && (
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Bemerkung:</Paragraph>
                                <Paragraph style={styles.value}>{displayBemerkung}</Paragraph>
                              </View>
                            )}
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Letzte Änderung:</Paragraph>
                              <Paragraph style={styles.value}>{lastChangeText}</Paragraph>
                            </View>
                            <Divider style={styles.bestellungDivider} />
                            
                            {allOhneBestellungItems.map((wareneingang, index) => (
                              <View key={wareneingang.id || `item-${index}`} style={styles.artikelItem}>
                                <View style={styles.artikelHeader}>
                                  <Paragraph style={styles.artikelName}>
                                    {wareneingang.productName}
                                  </Paragraph>
                                </View>
                                <View style={styles.infoRow}>
                                  <Paragraph style={styles.label}>Menge:</Paragraph>
                                  <Chip mode="outlined" style={styles.chip}>
                                    {wareneingang.quantity} Stück
                                  </Chip>
                                </View>
                                {index < allOhneBestellungItems.length - 1 && <Divider style={styles.artikelDivider} />}
                              </View>
                            ))}
                          </Card.Content>
                        </Card>
                      );
                    }
                    
                    if (allOhneBestellungItems.length === 0 && currentOhneBestellungWareneingaenge.length === 0) {
                      return (
                        <Paragraph style={styles.emptyText}>
                          Noch keine Artikel für diese Referenz vorhanden.
                        </Paragraph>
                      );
                    }
                    
                    // Verwende IMMER zuerst die State-Werte, dann effektive Werte
                    const displayBemerkung = (bereich && bereich.trim()) ? bereich.trim() : (effectiveBemerkung || '');
                    const displayLieferant = (lieferant && lieferant.trim()) ? lieferant.trim() : (effectiveLieferant || '');
                    const displayLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : (effectiveLagerort || '');
                    
                    // Bestimme Zeitstempel (neuestes Item oder aktueller Zeitpunkt)
                    const latestTimestamp = allOhneBestellungItems.length > 0
                      ? new Date(allOhneBestellungItems[0].createdAt || allOhneBestellungItems[0].updatedAt || Date.now())
                      : new Date();
                    
                    const lastChangeText = `${latestTimestamp.toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })} ${latestTimestamp.toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`;

                    return (
                      <Card style={styles.wareneingangCard}>
                        <Card.Content>
                          <Title style={styles.bestellungTitle}>
                            {currentReferenz ? `Referenz: ${currentReferenz}` : 'Ohne Bestellung'}
                          </Title>
                          {displayLieferant && (
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Lieferant:</Paragraph>
                              <Paragraph style={styles.value}>{displayLieferant}</Paragraph>
                            </View>
                          )}
                          {displayLagerort && (
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Lagerort:</Paragraph>
                              <Paragraph style={styles.value}>{displayLagerort}</Paragraph>
                            </View>
                          )}
                          {displayBemerkung && (
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Bemerkung:</Paragraph>
                              <Paragraph style={styles.value}>{displayBemerkung}</Paragraph>
                            </View>
                          )}
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Letzte Änderung:</Paragraph>
                            <Paragraph style={styles.value}>{lastChangeText}</Paragraph>
                          </View>
                          <Divider style={styles.bestellungDivider} />
                          
                          {allOhneBestellungItems.map((wareneingang, index) => (
                            <View key={wareneingang.id || `item-${index}`} style={styles.artikelItem}>
                              <View style={styles.artikelHeader}>
                                <Paragraph style={styles.artikelName}>
                                  {wareneingang.productName}
                                </Paragraph>
                              </View>
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Menge:</Paragraph>
                                <Chip mode="outlined" style={styles.chip}>
                                  {wareneingang.quantity} Stück
                                </Chip>
                              </View>
                              {index < allOhneBestellungItems.length - 1 && <Divider style={styles.artikelDivider} />}
                            </View>
                          ))}
                        </Card.Content>
                      </Card>
                    );
                  }

                  return (
                  <FlatList
                    data={groupWareneingaengeByReferenz(filteredWareneingaenge)
                      .filter(group => group.items[0]?.erfassungstyp !== 'Projekt (Baustelle)')
                      .slice(0, 5)}
                    renderItem={({ item: group }) => (
                    <Card style={styles.wareneingangCard}>
                      <Card.Content>
                        <Title style={styles.bestellungTitle}>Bestellung: {group.referenz}</Title>
                        <View style={styles.infoRow}>
                          <Paragraph style={styles.label}>Datum:</Paragraph>
                          <Paragraph style={styles.value}>
                            {new Date(group.createdAt).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </Paragraph>
                        </View>
                        <View style={styles.infoRow}>
                          <Paragraph style={styles.label}>Anzahl Artikel:</Paragraph>
                          <Paragraph style={styles.value}>{group.items.length}</Paragraph>
                        </View>
                        <Divider style={styles.bestellungDivider} />
                        
                        {group.items.map((wareneingang, index) => (
                          <View key={wareneingang.id} style={styles.artikelItem}>
                            <View style={styles.artikelHeader}>
                              <Paragraph style={styles.artikelName}>
                                {wareneingang.productName}
                              </Paragraph>
                            </View>
                            <View style={styles.infoRow}>
                              <Paragraph style={styles.label}>Menge:</Paragraph>
                              <Chip mode="outlined" style={styles.chip}>
                                  {wareneingang.quantity}{' '}
                                  {wareneingang.notes?.includes('Palette')
                                    ? 'Paletten'
                                    : wareneingang.notes?.includes('Paket')
                                    ? 'Paket'
                                    : 'Stück'}
                              </Chip>
                            </View>
                              {wareneingang.notes &&
                                (wareneingang.notes.includes('Palette') ||
                                  wareneingang.notes.includes('Paket')) && (
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Eingabe:</Paragraph>
                                <Paragraph style={styles.value}>
                                  {(() => {
                                    const paletteMatch = wareneingang.notes.match(/(\d+(?:,\d+)?) Paletten/);
                                    const paketMatch = wareneingang.notes.match(/(\d+(?:,\d+)?) Paket/);
                                    if (paletteMatch) return `${paletteMatch[1]} Paletten`;
                                    if (paketMatch) return `${paketMatch[1]} Paket`;
                                    return 'Unbekannt';
                                  })()}
                                </Paragraph>
                              </View>
                            )}
                            {wareneingang.supplier && (
                              <View style={styles.infoRow}>
                                <Paragraph style={styles.label}>Lieferant:</Paragraph>
                                <Paragraph style={styles.value}>{wareneingang.supplier}</Paragraph>
                              </View>
                            )}
                            {index < group.items.length - 1 && <Divider style={styles.artikelDivider} />}
                          </View>
                        ))}
                      </Card.Content>
                    </Card>
                    )}
                    keyExtractor={(item) => item.referenz}
                    scrollEnabled={false}
                  />
                );
              })()}
          </Card.Content>
        </Card>
        )}
      </ScrollView>

      {/* Erfassungstyp Selection Dialog */}
      <Portal>
        <Dialog visible={erfassungstypDialogVisible} onDismiss={() => setErfassungstypDialogVisible(false)}>
          <Dialog.Title>Erfassungstyp wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group value={erfassungstyp}>
              {erfassungstypen.map((typ) => (
                <TouchableOpacity
                  key={typ}
                  style={styles.erfassungstypOption}
                  onPress={() => selectErfassungstyp(typ)}
                >
                  <View style={styles.erfassungstypLabelContainer}>
                    <View
                      style={[
                        styles.erfassungstypColorDot,
                        { backgroundColor: getErfassungstypColor(typ) },
                      ]}
                    />
                    <Text style={styles.erfassungstypLabelText}>{typ}</Text>
                  </View>
                  <RadioButton value={typ} />
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErfassungstypDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Unbekannter Artikel Dialog */}
      <Portal>
        <Dialog
          visible={unknownProductDialogVisible}
          onDismiss={() => {
            setUnknownProductDialogVisible(false);
            setCreateProductUnitPickerVisible(false);
            setUnknownProductLocationStock('0');
          }}
        >
          <Dialog.Title>Neuen Artikel erstellen</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ marginBottom: 16 }}>
              Der Artikel mit der Nummer "{unknownProductSKU}" wurde nicht gefunden. Möchten Sie einen neuen Artikel erstellen?
            </Paragraph>
            
            <View style={styles.unknownProductForm}>
              <TextInput
                label="Artikelname *"
                value={unknownProductName}
                onChangeText={setUnknownProductName}
                mode="outlined"
                style={{ marginBottom: 12 }}
                disabled={creatingProduct}
              />
              
              <TextInput
                label="Artikelnummer (SKU) *"
                value={unknownProductSKU}
                onChangeText={setUnknownProductSKU}
                mode="outlined"
                style={{ marginBottom: 12 }}
                disabled={creatingProduct}
                autoCapitalize="characters"
              />
              
              <TextInput
                label="Preis (€)"
                value={unknownProductPrice}
                onChangeText={setUnknownProductPrice}
                onFocus={() => {
                  if (unknownProductPrice === '0') {
                    setUnknownProductPrice('');
                  }
                }}
                mode="outlined"
                keyboardType="decimal-pad"
                style={{ marginBottom: 12 }}
                disabled={creatingProduct}
              />

              <TextInput
                label="Lagebestand"
                value={unknownProductLocationStock}
                onChangeText={setUnknownProductLocationStock}
                onFocus={() => {
                  if (unknownProductLocationStock === '0') {
                    setUnknownProductLocationStock('');
                  }
                }}
                mode="outlined"
                keyboardType="decimal-pad"
                style={{ marginBottom: 12 }}
                disabled={creatingProduct}
              />
              
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (!creatingProduct) {
                    setCreateProductUnitPickerVisible((prev) => !prev);
                  }
                }}
                disabled={creatingProduct}
                style={{ marginBottom: 12 }}
              >
                <TextInput
                  label="Einheit"
                  value={unknownProductUnit}
                  mode="outlined"
                  editable={false}
                  right={<TextInput.Icon icon={createProductUnitPickerVisible ? 'chevron-up' : 'chevron-down'} />}
                  disabled={creatingProduct}
                  pointerEvents="none"
                />
              </TouchableOpacity>

              {createProductUnitPickerVisible && (
                <View style={styles.unitPickerContainer}>
                  {createProductUnitOptions.map((option, index) => {
                    const isLast = index === createProductUnitOptions.length - 1;
                    const isSelected = option === unknownProductUnit;
                    return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.unitOption,
                        isSelected && styles.unitOptionSelected,
                        isLast && styles.unitOptionLast,
                      ]}
                      onPress={() => {
                        setUnknownProductUnit(option);
                        setCreateProductUnitPickerVisible(false);
                      }}
                    >
                      <Text style={styles.unitOptionText}>{option}</Text>
                    </TouchableOpacity>
                  );
                  })}
                </View>
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setUnknownProductDialogVisible(false);
                setCreateProductUnitPickerVisible(false);
                setUnknownProductLocationStock('0');
              }}
              disabled={creatingProduct}
            >
              Abbrechen
            </Button>
            <Button 
              onPress={createUnknownProduct}
              loading={creatingProduct}
              disabled={creatingProduct}
              mode="contained"
            >
              Artikel erstellen
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Projects Selection Modal */}
      <Modal
        visible={projectsModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setProjectsModalVisible(false)}
      >
        <View style={styles.fullScreenModalContainer}>
          <View style={styles.fullScreenModalHeader}>
            <Title style={styles.fullScreenModalTitle}>Projekt auswählen</Title>
            <Paragraph style={styles.fullScreenModalSubtitle}>
              Wählen Sie ein Projekt aus:
            </Paragraph>
          </View>
          
          <View style={styles.fullScreenModalContent}>
            <FlatList
              data={projects}
              renderItem={renderProject}
              keyExtractor={(item) => item.id.toString()}
              style={styles.fullScreenProjectsList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.fullScreenListContent}
            />
          </View>
          
          <View style={styles.fullScreenModalFooter}>
            <Button
              mode="outlined"
              onPress={() => setProjectsModalVisible(false)}
              style={styles.fullScreenCancelButton}
            >
              Abbrechen
            </Button>
          </View>
        </View>
      </Modal>

      {/* Supplier Selection Dialog */}
      <Portal>
        <Dialog visible={supplierDialogVisible} onDismiss={() => setSupplierDialogVisible(false)}>
          <Dialog.Title>Lieferant auswählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => {
              selectSupplier(value);
            }} value={selectedSupplier}>
              {availableSuppliers.map((supplier) => {
                const supplierInfo = supplierDetails[supplier];
                return (
                  <RadioButton.Item 
                    key={supplier} 
                    label={supplierInfo ? supplierInfo.name : supplier} 
                    value={supplier} 
                  />
                );
              })}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSupplierDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Products Selection Modal */}
      <Modal
        visible={productsModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setProductsModalVisible(false);
          setProductSearchQuery('');
          setProductFilter([]);
        }}
      >
        <View style={styles.fullScreenModalContainer}>
          <View style={styles.fullScreenModalHeader}>
            <Title style={styles.fullScreenModalTitle}>Artikel auswählen</Title>
            <Paragraph style={styles.fullScreenModalSubtitle}>
              Wählen Sie einen Artikel aus:
            </Paragraph>
            <View style={styles.productModalSearchContainer}>
              <View style={styles.productModalSearchRow}>
                <TextInput
                  style={styles.productModalSearchInput}
                  value={productSearchQuery}
                  onChangeText={setProductSearchQuery}
                  placeholder="Artikel suchen..."
                  mode="outlined"
                  left={<TextInput.Icon icon="magnify" />}
                />
                <IconButton
                  icon="filter"
                  size={24}
                  iconColor={BRAND_DARK_BLUE}
                  onPress={() => {
                    if (productFilter.length === 0) {
                      setProductFilter(['alle']);
                    }
                    setProductFilterMenuVisible(true);
                  }}
                  mode="contained-tonal"
                  containerColor="#eef2f7"
                  style={styles.productModalFilterButton}
                />
                <IconButton
                  icon="plus"
                  size={24}
                  iconColor="#fff"
                  onPress={() => {
                    setProductsModalVisible(false);
                    setProductSearchQuery('');
                    setUnknownProductSKU('');
                    setUnknownProductItemIndex(null);
                    setUnknownProductName('');
                    setUnknownProductPrice('0');
                    setUnknownProductUnit('Stück');
                    setUnknownProductDialogVisible(true);
                  }}
                  mode="contained"
                  containerColor={BRAND_LIGHT_BLUE}
                  style={styles.productModalAddButton}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.fullScreenModalContent}>
            <FlatList
              data={getAvailableProducts()}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              style={styles.fullScreenProjectsList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Paragraph style={styles.emptyStateText}>
                    {productSearchQuery.trim() !== ''
                      ? 'Keine Produkte gefunden.'
                      : items.filter(item => item.selectedProduct !== null).length === items.length && items.length > 0
                      ? 'Alle verfügbaren Produkte wurden bereits ausgewählt.'
                      : 'Keine Produkte verfügbar.'}
                  </Paragraph>
                </View>
              }
            />
          </View>
          
          <View style={styles.fullScreenModalFooter}>
            <Button
              mode="outlined"
              onPress={() => {
                setProductsModalVisible(false);
                setProductSearchQuery('');
                setProductFilter([]);
              }}
              style={styles.fullScreenCancelButton}
            >
              Abbrechen
            </Button>
          </View>
        </View>
      </Modal>
      
      {/* Product Filter Modal */}
      <Modal
        visible={productFilterMenuVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setProductFilterMenuVisible(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalHeader}>
            <Title style={styles.filterModalTitle}>Filter wählen</Title>
            <TouchableOpacity
              style={styles.filterCloseButton}
              onPress={() => setProductFilterMenuVisible(false)}
            >
              <Text style={styles.filterCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterModalContent}>
            {filterOptions.map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterOption,
                  productFilter.includes(filterOption) && styles.selectedFilterOption
                ]}
                onPress={() => {
                  if (filterOption === 'alle') {
                    setProductFilter(['alle']);
                  } else {
                    const newFilter = productFilter.filter(f => f !== 'alle');
                    if (newFilter.includes(filterOption)) {
                      setProductFilter(newFilter.filter(f => f !== filterOption));
                    } else {
                      setProductFilter([...newFilter, filterOption]);
                    }
                  }
                }}
              >
                <View style={styles.filterOptionContent}>
                  <View style={styles.checkbox}>
                    {productFilter.includes(filterOption) && <View style={styles.checkboxSelected} />}
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    productFilter.includes(filterOption) && styles.selectedFilterOptionText
                  ]}>
                    {getFilterLabel(filterOption)} ({getFilterCount(filterOption)})
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Search Button */}
            <View style={styles.searchButtonContainer}>
              <Button
                mode="contained"
                onPress={() => {
                  setProductFilterMenuVisible(false);
                }}
                style={styles.searchButton}
                labelStyle={styles.searchButtonLabel}
                icon="magnify"
              >
                Suchen
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Orders List Modal */}
      <Modal
        visible={ordersModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setOrdersModalVisible(false)}
      >
        <View style={styles.fullScreenModalContainer}>
          <View style={styles.fullScreenModalHeader}>
            <Title style={styles.fullScreenModalTitle}>Bestellungen</Title>
            <Paragraph style={styles.fullScreenModalSubtitle}>
              Wählen Sie eine Bestellung aus:
            </Paragraph>
          </View>
          
          <View style={styles.fullScreenModalContent}>
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={(item) => item.id}
              style={styles.fullScreenProjectsList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.fullScreenListContent}
            />
          </View>
          
          <View style={styles.fullScreenModalFooter}>
            <Button
              mode="outlined"
              onPress={() => setOrdersModalVisible(false)}
              style={styles.fullScreenCancelButton}
            >
              Abbrechen
            </Button>
          </View>
        </View>
      </Modal>

      {/* Lagerort Selection Dialog - für Nach Lagerort (Benutzer) bei "Lager" oder normales Lagerort-Feld bei anderen Erfassungstypen */}
      <Portal>
        <Dialog visible={lagerortDialogVisible} onDismiss={() => setLagerortDialogVisible(false)}>
          <Dialog.Title>
            {erfassungstyp === 'Lager' ? 'Benutzer Lagerort wählen' : 'Lagerort wählen'}
          </Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => {
              if (erfassungstyp === 'Lager') {
                // Bei "Lager": Setze "Nach Lagerort" und filtere "Von Lagerort" aus
                setNachLagerort(value);
              } else {
                // Bei anderen Erfassungstypen (z.B. "Ohne Bestellung"): Setze "Lagerort"
              setLagerort(value);
              }
              setLagerortDialogVisible(false);
            }} value={erfassungstyp === 'Lager' ? nachLagerort : lagerort}>
              {erfassungstyp === 'Lager' 
                ? userLocations
                    .filter(location => location !== lagerort && location !== 'Schließen')
                    .map((location, index) => (
                <RadioButton.Item key={index} label={location} value={location} />
                    ))
                : userLocations
                    .filter(location => location !== 'Schließen')
                    .map((location, index) => (
                    <RadioButton.Item key={index} label={location} value={location} />
                  ))
              }
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Von Lagerort Selection Dialog */}
      <Portal>
        <Dialog 
          visible={vonLagerortDialogVisible} 
          onDismiss={() => {
            setVonLagerortDialogVisible(false);
          }}
        >
          <Dialog.Title>Von Lagerort wählen</Dialog.Title>
          <Dialog.Content>
              <RadioButton.Group 
                onValueChange={(value) => {
                setLagerort(value);
                setVonLagerortDialogVisible(false);
              }} 
              value={lagerort}
            >
              {userLocations.map((location, index) => (
                    <RadioButton.Item key={index} label={location} value={location} />
                  ))}
              </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Lieferant Selection Dialog */}
      <Portal>
        <Dialog visible={supplierSelectionDialogVisible} onDismiss={() => setSupplierSelectionDialogVisible(false)}>
          <Dialog.Title>Lieferant wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => {
              setLieferant(value);
              setSupplierSelectionDialogVisible(false);
            }} value={lieferant}>
              {availableSuppliersForOrder.map((supplier, index) => (
                <RadioButton.Item key={index} label={supplier} value={supplier} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSupplierSelectionDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Filter Modal */}
      <Modal
        visible={filterMenuVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setFilterMenuVisible(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalHeader}>
            <Title style={styles.filterModalTitle}>Filter wählen</Title>
            <TouchableOpacity
              style={styles.filterCloseButton}
              onPress={() => setFilterMenuVisible(false)}
            >
              <Text style={styles.filterCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterModalContent}>
            {filterOptions.map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterOption,
                  filter.includes(filterOption) && styles.selectedFilterOption
                ]}
                onPress={() => toggleFilter(filterOption)}
              >
                <View style={styles.filterOptionContent}>
                  <View style={styles.checkbox}>
                    {filter.includes(filterOption) && <View style={styles.checkboxSelected} />}
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    filter.includes(filterOption) && styles.selectedFilterOptionText
                  ]}>
                    {getFilterLabel(filterOption)} ({getFilterCount(filterOption)})
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Search Button */}
            <View style={styles.searchButtonContainer}>
              <Button
                mode="contained"
                onPress={applyFilter}
                style={styles.searchButton}
                labelStyle={styles.searchButtonLabel}
                icon="magnify"
              >
                Suchen
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Project Materials Filter Modal */}
      <Modal
        visible={projectFilterModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setProjectFilterModalVisible(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalHeader}>
            <Title style={styles.filterModalTitle}>Filter wählen</Title>
            <TouchableOpacity
              style={styles.filterCloseButton}
              onPress={() => setProjectFilterModalVisible(false)}
            >
              <Text style={styles.filterCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterModalContent}>
            {['alle', 'materialien', 'geräte'].map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterOption,
                  projectFilter.includes(filterOption) && styles.selectedFilterOption
                ]}
                onPress={() => toggleProjectFilter(filterOption)}
              >
                <View style={styles.filterOptionContent}>
                  <View style={styles.checkbox}>
                    {projectFilter.includes(filterOption) && <View style={styles.checkboxSelected} />}
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    projectFilter.includes(filterOption) && styles.selectedFilterOptionText
                  ]}>
                    {getProjectFilterLabel(filterOption)} ({getProjectFilterCount(filterOption)})
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Search Button */}
            <View style={styles.searchButtonContainer}>
              <Button
                mode="contained"
                onPress={applyProjectFilter}
                style={styles.searchButton}
                labelStyle={styles.searchButtonLabel}
                icon="magnify"
              >
                Suchen
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Title style={styles.scannerTitle}>Barcode scannen</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setScannerVisible(false)}
              iconColor="white"
            />
          </View>
          <View style={styles.scannerWrapper}>
            {hasPermission && (
              <CameraView
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'code128', 'code39'],
                }}
                style={styles.scanner}
              />
            )}
          </View>
          <View style={styles.scannerFooter}>
            <Paragraph style={styles.scannerHint}>
              Richten Sie die Kamera auf den Barcode
            </Paragraph>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    padding: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  offlineChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContentContainer: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  formCard: {
    marginBottom: 16,
    elevation: 2,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  artikelnummerInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  iconButton: {
    margin: 0,
    padding: 4,
  },
  barcodeButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    borderRadius: 8,
    minWidth: 80,
    marginLeft: 8,
  },
  barcodeButtonLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityAndUnitContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  columnContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 120,
  },
  unitDropdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  paletteInfoContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_LIGHT_BLUE,
  },
  paletteInfoText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  supplierDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  supplierDropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  supplierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  supplierItemContent: {
    flex: 1,
    flexDirection: 'column',
  },
  supplierItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  supplierItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  supplierItemCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  singleSupplierContainer: {
    marginTop: 8,
  },
  singleSupplierNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  conversionInfo: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  conversionInfoBlue: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  unitDisplay: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  quantityButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    margin: 0,
    marginHorizontal: 0,
  },
  quantityInput: {
    width: 60,
    textAlign: 'center',
    marginHorizontal: 8,
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    marginTop: 20,
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  projectSearchButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    marginTop: 12,
    paddingVertical: 8,
  },
  projectSearchButtonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  projectSubmitButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    marginTop: 16,
    paddingVertical: 12,
  },
  historyCard: {
    elevation: 2,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bestellungTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
    marginBottom: 12,
  },
  bestellungDivider: {
    marginVertical: 12,
    backgroundColor: '#e0e0e0',
  },
  artikelItem: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  artikelHeader: {
    marginBottom: 8,
  },
  artikelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  artikelDivider: {
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#e0e0e0',
  },
  wareneingangCard: {
    marginBottom: 12,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontWeight: '500',
    color: '#666',
  },
  value: {
    color: '#333',
  },
  chip: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  bodyCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: BRAND_DARK_BLUE,
  },
  bodyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    borderRadius: 8,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemFormCard: {
    marginBottom: 16,
    elevation: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  itemDivider: {
    marginTop: 16,
    marginBottom: 16,
  },
  submitContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  projectCard: {
    marginBottom: 12,
  },
  projectCardContent: {
    elevation: 2,
  },
  projectCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  projectCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  projectCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  projectCardDetail: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    marginTop: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  modalInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  ordersModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    minHeight: '60%',
    flexDirection: 'column',
  },
  ordersListContainer: {
    flex: 1,
    marginTop: 8,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  ordersModalFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    width: '100%',
    borderColor: '#666',
  },
  selectOrderButton: {
    marginTop: 12,
  },
  selectButton: {
    backgroundColor: BRAND_DARK_BLUE,
  },
  dropdownContainer: {
    marginTop: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  erfassungstypModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '60%',
    minHeight: '40%',
  },
  erfassungstypList: {
    flex: 1,
    marginVertical: 16,
  },
  erfassungstypOption: {
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedErfassungstypOption: {
    backgroundColor: BRAND_LIGHT_BLUE,
    borderColor: BRAND_DARK_BLUE,
  },
  erfassungstypOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedErfassungstypOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  chipContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 32,
  },
  statusChip: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectOption: {
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  projectInfo: {
    flex: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  projectDateRange: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  projectStatusChip: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusActive: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  statusActiveText: {
    color: '#2e7d32',
  },
  statusPaused: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  statusPausedText: {
    color: '#f57c00',
  },
  statusCompleted: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  statusCompletedText: {
    color: '#1976d2',
  },
  // Full Screen Modal Styles
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fullScreenModalHeader: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60, // Account for status bar
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullScreenModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  fullScreenModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fullScreenModalContent: {
    flex: 1,
    padding: 16,
  },
  fullScreenProjectsList: {
    flex: 1,
  },
  fullScreenListContent: {
    paddingBottom: 20,
  },
  fullScreenModalFooter: {
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 40, // Account for home indicator
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullScreenCancelButton: {
    width: '100%',
    borderColor: '#666',
    height: 50,
  },
  productModalSearchContainer: {
    marginTop: 16,
    width: '100%',
  },
  productModalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  productModalSearchInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  productModalFilterButton: {
    margin: 0,
  },
  productModalAddButton: {
    margin: 0,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BRAND_DARK_BLUE,
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scannerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scannerWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  scanner: {
    flex: 1,
  },
  scannerFooter: {
    padding: 16,
    backgroundColor: '#000',
  },
  scannerHint: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  stickyBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1000,
  },
  stickyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    marginRight: 0,
    marginBottom: 0,
  },
  stickyIconButton: {
    margin: 0,
  },
  stickyAddButton: {
    margin: 0,
  },
  dialogScroll: {
    maxHeight: 400,
    paddingHorizontal: 4,
  },
  filterButton: {
    margin: 0,
  },
  addIconButton: {
    margin: 0,
  },
  projectMaterialsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
    marginBottom: 8,
  },
  projectMaterialsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  projectMaterialCard: {
    marginBottom: 12,
    elevation: 2,
  },
  projectMaterialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectMaterialName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  projectMaterialChip: {
    marginLeft: 'auto',
  },
  projectMaterialLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  projectMaterialSupplier: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  projectMaterialReferenz: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  projectMaterialDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  projectMaterialsHeader: {
    padding: 16,
    elevation: 2,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectMaterialsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  projectMaterialsStatusChip: {
    marginRight: 8,
  },
  projectMaterialsDates: {
    fontSize: 14,
    color: '#666',
  },
  projectMaterialsFilterContainer: {
    padding: 16,
    elevation: 2,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  projectMaterialsFilterButtonContainer: {
    width: '100%',
  },
  projectMaterialsFilterDropdownButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
  },
  projectMaterialsFilterDropdownButtonLabel: {
    color: 'white',
  },
  projectMaterialItemCard: {
    width: '100%',
    marginTop: 0,
    marginBottom: 16,
    elevation: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  projectMaterialItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectMaterialItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  projectMaterialItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  projectMaterialItemDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  projectMaterialActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  projectMaterialBookingButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    borderRadius: 8,
  },
  projectMaterialBookingButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  projectMaterialBookingButtonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  projectMaterialBookingButtonLabelDisabled: {
    color: '#666666',
  },
  projectMaterialQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectMaterialFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  projectMaterialQuantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  projectMaterialQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectMaterialQuantityButton: {
    margin: 0,
    borderRadius: 20,
  },
  projectMaterialQuantityInput: {
    width: 60,
    marginHorizontal: 8,
    textAlign: 'center',
  },
  projectMaterialUnitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  projectMaterialLastBookingContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: BRAND_LIGHT_BLUE,
  },
  projectMaterialLastBookingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
    marginRight: 12,
  },
  lastBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  projectMaterialLastBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectMaterialsListContainer: {
    paddingBottom: 16,
    width: '100%',
  },
  orderSummaryCard: {
    marginTop: 0,
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  addArticleButtonContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addArticleButton: {
    borderRadius: 8,
  },
  // Filter Modal Styles
  filterModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterModalHeader: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCloseButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  filterModalContent: {
    flex: 1,
    padding: 16,
  },
  filterOption: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedFilterOption: {
    borderWidth: 2,
    borderColor: BRAND_LIGHT_BLUE,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 14,
    height: 14,
    backgroundColor: BRAND_LIGHT_BLUE,
    borderRadius: 2,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedFilterOptionText: {
    color: BRAND_DARK_BLUE,
    fontWeight: '600',
  },
  searchButtonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  searchButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    paddingVertical: 8,
  },
  searchButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  erfassungstypOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  erfassungstypLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  erfassungstypColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  erfassungstypLabelText: {
    fontSize: 16,
  },
  unknownProductForm: {
    marginTop: 8,
  },
  dropdownTextSelected: {
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  unitPickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 12,
    overflow: 'hidden',
  },
  unitOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unitOptionLast: {
    borderBottomWidth: 0,
  },
  unitOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  unitOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default WareneingaengeScreen;
