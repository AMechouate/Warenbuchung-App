/**
 * WarenausgaengeScreen.tsx
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
  RadioButton,
  Portal,
  Dialog,
  Divider,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { databaseService } from '../services/database';
import { Warenausgang } from '../types';

const WarenausgaengeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [warenausgaenge, setWarenausgaenge] = useState<Warenausgang[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Form states
  const [auswahlGrund, setAuswahlGrund] = useState('Kommission');
  const [artikelnummer, setArtikelnummer] = useState('');
  const [anzahl, setAnzahl] = useState(1);
  const [lagerort, setLagerort] = useState('');
  const [userLagerort, setUserLagerort] = useState<string>('');
  const [userLocations, setUserLocations] = useState<string[]>([]);
  const [lagerortDialogVisible, setLagerortDialogVisible] = useState(false);
  const [warenausgangstyp, setWarenausgangstyp] = useState('Rücksendung Lieferant');
  const [referenz, setReferenz] = useState('');
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [warenausgangstypDialogVisible, setWarenausgangstypDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState('Stück');
  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [productFilterMenuVisible, setProductFilterMenuVisible] = useState(false);
  const [projectsModalVisible, setProjectsModalVisible] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projektnummer, setProjektnummer] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [begruendung, setBegruendung] = useState('');
  const [begruendungDialogVisible, setBegruendungDialogVisible] = useState(false);
  const [showBegruendungField, setShowBegruendungField] = useState(false);
  const [auswahlGrundDialogVisible, setAuswahlGrundDialogVisible] = useState(false);
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [showArticleCard, setShowArticleCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string[]>([]);
  
  // States für alle Warenausgangstypen
  const [ruecksendungSummaryItems, setRuecksendungSummaryItems] = useState<any[]>([]);
  const [ruecksendungSummarySaving, setRuecksendungSummarySaving] = useState<string | null>(null);
  const [projektSummaryItems, setProjektSummaryItems] = useState<any[]>([]);
  const [projektSummarySaving, setProjektSummarySaving] = useState<string | null>(null);
  const [lagerSummaryItems, setLagerSummaryItems] = useState<any[]>([]);
  const [lagerSummarySaving, setLagerSummarySaving] = useState<string | null>(null);
  const [entsorgungSummaryItems, setEntsorgungSummaryItems] = useState<any[]>([]);
  const [entsorgungSummarySaving, setEntsorgungSummarySaving] = useState<string | null>(null);
  const [lieferant, setLieferant] = useState('');
  const [bemerkung, setBemerkung] = useState('');

  // Available reasons
  const [gruende, setGruende] = useState<string[]>(['Kommission', 'Auftrag', 'Umbuchung', 'Beschädigung']);
  const [begruendungsVorlagen, setBegruendungsVorlagen] = useState<string[]>([
    'Notfall-Entnahme für dringenden Auftrag',
    'Nachbestellung bereits veranlasst',
    'Lieferant bestätigt Nachschub',
    'Interne Umbuchung zwischen Standorten',
    'Qualitätsprüfung erforderlich',
    'Kundenspezifische Anpassung',
    'Wartungsarbeiten am Lager',
    'Inventur-Korrektur',
  ]);
  
  // Available attributes
  const warenausgangstypen = ['Rücksendung Lieferant', 'Projekt', 'Lager', 'Entsorgung'];

  // Mock-Projekte für die Auswahl
  const mockProjects = [
    { id: 1, name: 'Bürogebäude Köln', description: 'Neubau Bürogebäude in Köln', status: 'Aktiv', startDate: '2025-01-15', endDate: '2025-12-31' },
    { id: 2, name: 'Wohnkomplex Düsseldorf', description: 'Wohnkomplex mit 50 Einheiten', status: 'Aktiv', startDate: '2025-03-01', endDate: '2025-06-30' },
    { id: 3, name: 'Schule Berlin', description: 'Grundschule Neubau', status: 'Planung', startDate: '2025-06-01', endDate: '2025-08-31' },
    { id: 4, name: 'Krankenhaus Hamburg', description: 'Erweiterung Krankenhaus', status: 'Aktiv', startDate: '2025-02-15', endDate: '2025-03-31' },
    { id: 5, name: 'Einkaufszentrum München', description: 'Shopping Center Neubau', status: 'Abgeschlossen', startDate: '2023-09-01', endDate: '2025-05-31' },
  ];

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
          console.log('🏢 Einziger Lagerort gesetzt:', singleLocation);
        } else {
          // Mehrere Lagerorte - ersten als Standard setzen, aber Dropdown zeigen
          const firstLocation = user.locations[0];
          setUserLagerort(firstLocation);
          setLagerort(firstLocation);
          console.log('🏢 Mehrere Lagerorte verfügbar:', user.locations);
        }
      } else {
        // Kein Lagerort zugewiesen
        setUserLocations([]);
        setUserLagerort('');
        setLagerort('');
        console.log('🏢 Kein Lagerort für User zugewiesen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des User-Lagerorts:', error);
      setUserLocations([]);
      setUserLagerort('');
      setLagerort('');
    }
  };

  const loadWarenausgaenge = async () => {
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated && isOnline) {
        // Load from API
        const apiWarenausgaenge = await apiService.getWarenausgaenge();
        setWarenausgaenge(apiWarenausgaenge);
        
        // Save to local database
        for (const warenausgang of apiWarenausgaenge) {
          await databaseService.saveWarenausgang(warenausgang);
        }
      } else {
        // Load from local database
        const localWarenausgaenge = await databaseService.getWarenausgaenge();
        setWarenausgaenge(localWarenausgaenge);
      }
    } catch (error) {
      console.error('Error loading warenausgaenge:', error);
      // Fallback to local database
      try {
        const localWarenausgaenge = await databaseService.getWarenausgaenge();
        setWarenausgaenge(localWarenausgaenge);
        setIsOnline(false);
      } catch (localError) {
        console.error('Error loading local warenausgaenge:', localError);
        Alert.alert('Fehler', 'Warenausgänge konnten nicht geladen werden.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Lade Artikel für Referenz bei Warenausgangstyp "Rücksendung Lieferant"
  const loadRuecksendungItemsForReferenz = useCallback(async (referenzText: string) => {
    if (warenausgangstyp !== 'Rücksendung Lieferant') {
      return;
    }

    const trimmedReferenz = referenzText.trim();
    if (!trimmedReferenz) {
      // Wenn Referenz leer ist, lösche geladene Artikel aus ruecksendungSummaryItems
      setRuecksendungSummaryItems(prev => prev.filter(item => !item.key.startsWith('ruecksendung-ref-')));
      return;
    }

    try {
      // Filtere Warenausgänge nach Referenz (nur Referenz, nicht nach anderen Feldern)
      const ruecksendungWarenausgaenge = warenausgaenge.filter(w => {
        if (w.attribut !== 'Rücksendung Lieferant') return false;
        if (!w.notes) return false;
        // Extrahiere Referenz aus notes oder verwende orderNumber
        const referenzMatch = w.notes.match(/Referenz:\s*(.+?)(?:\s*\||$)/);
        const extractedReferenz = referenzMatch ? referenzMatch[1].trim() : (w.orderNumber || '').trim();
        return extractedReferenz === trimmedReferenz;
      });

      // Konvertiere Warenausgänge in ruecksendungSummaryItems (als gespeicherte Artikel)
      const summaryItemsForReferenz = ruecksendungWarenausgaenge.map((w, index) => {
        const product = allProducts.find(p => p.id === w.productId);
        const nowTimestamp = w.createdAt ? new Date(w.createdAt).getTime() : Date.now();
        
        return {
          key: `ruecksendung-ref-${w.id}-${index}`,
          productId: w.productId,
          name: product?.name || w.productName || `Artikel ${index + 1}`,
          unit: product?.unit || 'Stück',
          quantity: w.quantity,
          sku: product?.sku,
          supplier: undefined,
          type: product?.type,
          location: undefined,
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
      setRuecksendungSummaryItems(prev => {
        const newItems = prev.filter(item => !item.key.startsWith('ruecksendung-ref-'));
        return [...summaryItemsForReferenz, ...newItems];
      });
    } catch (error) {
      console.error('Fehler beim Laden der Artikel für Referenz:', error);
      // Bei Fehler nur neue Items behalten
      setRuecksendungSummaryItems(prev => prev.filter(item => !item.key.startsWith('ruecksendung-ref-')));
    }
  }, [warenausgangstyp, warenausgaenge, allProducts]);

  // Generische Funktion zum Laden von Items für alle Warenausgangstypen
  const loadItemsForReferenz = useCallback(async (typ: string, referenzText: string) => {
    if (warenausgangstyp !== typ) {
      return;
    }

    const trimmedReferenz = referenzText.trim();
    const prefix = `${typ.toLowerCase().replace(/\s+/g, '-')}-ref-`;
    
    // Setze die entsprechenden States zurück
    if (typ === 'Projekt') {
      if (!trimmedReferenz) {
        setProjektSummaryItems(prev => prev.filter(item => !item.key.startsWith(prefix)));
        return;
      }
    } else if (typ === 'Lager') {
      if (!trimmedReferenz) {
        setLagerSummaryItems(prev => prev.filter(item => !item.key.startsWith(prefix)));
        return;
      }
    } else if (typ === 'Entsorgung') {
      if (!trimmedReferenz) {
        setEntsorgungSummaryItems(prev => prev.filter(item => !item.key.startsWith(prefix)));
        return;
      }
    }

    try {
      // Filtere Warenausgänge nach Attribut und Referenz
      const filteredWarenausgaenge = warenausgaenge.filter(w => {
        if (w.attribut !== typ) return false;
        if (!w.notes && !w.orderNumber) return false;
        const referenzMatch = w.notes?.match(/Referenz:\s*(.+?)(?:\s*\||$)/);
        const extractedReferenz = referenzMatch ? referenzMatch[1].trim() : (w.orderNumber || '').trim();
        return extractedReferenz === trimmedReferenz;
      });

      // Konvertiere Warenausgänge in Summary Items
      const summaryItemsForReferenz = filteredWarenausgaenge.map((w, index) => {
        const product = allProducts.find(p => p.id === w.productId);
        const nowTimestamp = w.createdAt ? new Date(w.createdAt).getTime() : Date.now();
        
        return {
          key: `${prefix}${w.id}-${index}`,
          productId: w.productId,
          name: product?.name || w.productName || `Artikel ${index + 1}`,
          unit: product?.unit || 'Stück',
          quantity: w.quantity,
          sku: product?.sku,
          supplier: undefined,
          type: product?.type,
          location: undefined,
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

      // Aktualisiere die entsprechenden States
      if (typ === 'Projekt') {
        setProjektSummaryItems(prev => {
          const newItems = prev.filter(item => !item.key.startsWith(prefix));
          return [...summaryItemsForReferenz, ...newItems];
        });
      } else if (typ === 'Lager') {
        setLagerSummaryItems(prev => {
          const newItems = prev.filter(item => !item.key.startsWith(prefix));
          return [...summaryItemsForReferenz, ...newItems];
        });
      } else if (typ === 'Entsorgung') {
        setEntsorgungSummaryItems(prev => {
          const newItems = prev.filter(item => !item.key.startsWith(prefix));
          return [...summaryItemsForReferenz, ...newItems];
        });
      }
    } catch (error) {
      console.error(`Fehler beim Laden der Artikel für ${typ}:`, error);
      if (typ === 'Projekt') {
        setProjektSummaryItems(prev => prev.filter(item => !item.key.startsWith(prefix)));
      } else if (typ === 'Lager') {
        setLagerSummaryItems(prev => prev.filter(item => !item.key.startsWith(prefix)));
      } else if (typ === 'Entsorgung') {
        setEntsorgungSummaryItems(prev => prev.filter(item => !item.key.startsWith(prefix)));
      }
    }
  }, [warenausgangstyp, warenausgaenge, allProducts]);

  const loadReasons = async () => {
    try {
      const reasons = await apiService.getReasons();
      const activeReasons = reasons.filter(r => r.isActive).map(r => r.name);
      if (activeReasons.length > 0) {
        setGruende(activeReasons);
      }
    } catch (error) {
      console.error('Error loading reasons:', error);
      // Fallback to default reasons on error
    }
  };

  const loadJustifications = async () => {
    try {
      const justifications = await apiService.getJustifications();
      const activeJustifications = justifications.filter(j => j.isActive).map(j => j.text);
      if (activeJustifications.length > 0) {
        setBegruendungsVorlagen(activeJustifications);
      }
    } catch (error) {
      console.error('Error loading justifications:', error);
      // Fallback to default justifications on error
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWarenausgaenge();
      loadUserLagerort(); // Lagerort des Benutzers laden
      loadReasons(); // Ausgangsgründe laden
    loadJustifications(); // Rücklieferungsgründe laden
    }, [])
  );

  // Lade Artikel für Referenz, wenn sich warenausgangstyp oder referenz ändert
  useEffect(() => {
    if (warenausgangstyp === 'Rücksendung Lieferant') {
      loadRuecksendungItemsForReferenz(referenz);
    } else if (warenausgangstyp === 'Projekt') {
      loadItemsForReferenz('Projekt', referenz);
    } else if (warenausgangstyp === 'Lager') {
      loadItemsForReferenz('Lager', referenz);
    } else if (warenausgangstyp === 'Entsorgung') {
      loadItemsForReferenz('Entsorgung', referenz);
    } else {
      // Reset alle Summary Items wenn Typ nicht unterstützt wird
      setRuecksendungSummaryItems([]);
      setProjektSummaryItems([]);
      setLagerSummaryItems([]);
      setEntsorgungSummaryItems([]);
    }
  }, [warenausgangstyp, referenz, loadRuecksendungItemsForReferenz, loadItemsForReferenz]);

  // Lade Artikel neu, wenn warenausgaenge aktualisiert wird und eine Referenz vorhanden ist
  useEffect(() => {
    if (referenz.trim().length > 0) {
      if (warenausgangstyp === 'Rücksendung Lieferant') {
        loadRuecksendungItemsForReferenz(referenz);
      } else if (warenausgangstyp === 'Projekt') {
        loadItemsForReferenz('Projekt', referenz);
      } else if (warenausgangstyp === 'Lager') {
        loadItemsForReferenz('Lager', referenz);
      } else if (warenausgangstyp === 'Entsorgung') {
        loadItemsForReferenz('Entsorgung', referenz);
      }
    }
  }, [warenausgaenge, warenausgangstyp, referenz, loadRuecksendungItemsForReferenz, loadItemsForReferenz]);

  useEffect(() => {
    if ((artikelnummer && artikelnummer.trim().length > 0) || selectedProduct) {
      setShowArticleCard(true);
    }
  }, [artikelnummer, selectedProduct]);

  const handleArticleSearch = () => {
    if (warenausgangstyp === 'Rücksendung Lieferant') {
      setShowArticleCard(true);
      return;
    }

    if (!articleSearchTerm.trim()) {
      loadAllProducts();
      return;
    }

    setArtikelnummer(articleSearchTerm.trim());
    setShowArticleCard(true);
  };

  const handleArticleFilterPress = () => {
    Alert.alert('Filter', 'Die Filterfunktion wird derzeit noch nicht unterstützt.');
  };

  const getFilteredProducts = () => {
    let filtered = allProducts;

    // Filter nach Suchbegriff
    if (productSearchQuery.trim() !== '') {
      const query = productSearchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }

    // Filter nach Typ (falls Filter gesetzt)
    if (productFilter.length > 0 && !productFilter.includes('alle')) {
      // Hier kann später die Filterlogik erweitert werden
    }

    return filtered;
  };

  const loadAllProducts = async () => {
    try {
      const products = await apiService.getProducts();
      setAllProducts(products);
      
      // Filtere bereits hinzugefügte Artikel für Rücksendung Lieferant
      if (warenausgangstyp === 'Rücksendung Lieferant') {
        const assignedRuecksendungProductIds = new Set<number>();
        const assignedRuecksendungSkus = new Set<string>();
        ruecksendungSummaryItems.forEach(ruecksendungItem => {
          if (ruecksendungItem.productId != null) {
            assignedRuecksendungProductIds.add(ruecksendungItem.productId);
          }
          if (ruecksendungItem.sku) {
            assignedRuecksendungSkus.add(ruecksendungItem.sku.toLowerCase());
          }
        });
        
        const filteredProducts = products.filter(product => 
          !assignedRuecksendungProductIds.has(product.id) &&
          !(product.sku && assignedRuecksendungSkus.has(product.sku.toLowerCase()))
        );
        
        setAllProducts(filteredProducts);
      }
      
      setProductsModalVisible(true);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Fehler', 'Fehler beim Laden der Produkte');
    }
  };

  const handleAddArticleCard = () => {
    // Für alle Typen: Artikel direkt zu den entsprechenden Summary Items hinzufügen
    if (!selectedProduct && artikelnummer.trim()) {
      // Versuche Produkt zu finden
      searchProductBySKU(artikelnummer.trim());
      return;
    }
    
    if (selectedProduct) {
      const typPrefix = warenausgangstyp.toLowerCase().replace(/\s+/g, '-');
      const tempKey = `${typPrefix}-${selectedProduct.id}-${Date.now()}`;
      const nowTimestamp = Date.now();
      const quantityValue = anzahl || 1;

      const payloadForSave = {
        key: tempKey,
        productId: selectedProduct.id,
        name: selectedProduct.name || `Artikel`,
        unit: selectedUnit || selectedProduct.unit || 'Stück',
        quantity: quantityValue,
        sku: selectedProduct.sku,
        supplier: lieferant || undefined,
        type: selectedProduct.type,
        location: lagerort || undefined,
        bookingHistory: [],
        itemType: 'material' as const,
        lastTimestamp: undefined,
        lastBookingQuantity: undefined,
        lastBookingUnit: undefined,
        lastBooking: undefined,
        quantityInput: quantityValue > 0 ? quantityValue : 1,
        createdAtTimestamp: nowTimestamp,
      };

      // Artikel zu den entsprechenden Summary Items hinzufügen
      if (warenausgangstyp === 'Rücksendung Lieferant') {
        setRuecksendungSummaryItems((prev) => [...prev, payloadForSave]);
      } else if (warenausgangstyp === 'Projekt') {
        setProjektSummaryItems((prev) => [...prev, payloadForSave]);
      } else if (warenausgangstyp === 'Lager') {
        setLagerSummaryItems((prev) => [...prev, payloadForSave]);
      } else if (warenausgangstyp === 'Entsorgung') {
        setEntsorgungSummaryItems((prev) => [...prev, payloadForSave]);
      }

      // Reset form
      setArtikelnummer('');
      setSelectedProduct(null);
      setSelectedUnit('Stück');
      setAnzahl(1);
      setShowArticleCard(false);
    } else {
      setShowArticleCard(true);
      if (!selectedProduct) {
        loadAllProducts();
      }
    }
  };

  const clearArticleCard = () => {
    setShowArticleCard(false);
    setArtikelnummer('');
    setSelectedProduct(null);
    setSelectedUnit('Stück');
    setAnzahl(1);
    setBegruendung('');
    setShowBegruendungField(false);
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setArtikelnummer(product.sku);
    setSelectedUnit(product.unit || 'Stück');
    setProductsModalVisible(false);
    
    // Reset justification field when selecting new product
    setBegruendung('');
    setShowBegruendungField(false);
    
    // Show warning if stock is low or negative
    if (product.stockQuantity <= 0) {
      Alert.alert(
        'Lagerbestand niedrig',
        `Achtung: Der Lagerbestand für "${product.name}" ist ${product.stockQuantity <= 0 ? 'negativ oder null' : 'sehr niedrig'} (${product.stockQuantity} Stück).`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const loadAllProjects = async () => {
    try {
      // Mock-Projekte laden
      setAllProjects(mockProjects);
      setProjectsModalVisible(true);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Fehler', 'Fehler beim Laden der Projekte');
    }
  };

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
    setSelectedProject(project);
    setProjektnummer(project.name);
    setProjectsModalVisible(false);
    
    // Navigate to Project Materials screen
    (navigation as any).navigate('ProjectMaterials', { project });
  };

  const renderProduct = ({ item }: { item: any }) => {
    console.log('Rendering product:', item);
    return (
      <TouchableOpacity
        style={styles.productListItem}
        onPress={() => selectProduct(item)}
      >
        <View style={styles.productListItemContent}>
          <Paragraph style={styles.productListItemName}>{item.name}</Paragraph>
          <Paragraph style={styles.productListItemSku}>SKU: {item.sku}</Paragraph>
          <Paragraph style={styles.productListItemUnit}>Einheit: {item.unit || 'Stück'}</Paragraph>
          {item.price && (
            <Paragraph style={styles.productListItemPrice}>Preis: €{item.price.toFixed(2)}</Paragraph>
          )}
          {item.stockQuantity !== undefined && (
            <Paragraph style={[
              styles.productListItemStock,
              item.stockQuantity < 0 && styles.negativeStockText
            ]}>
              Lagerbestand: {item.stockQuantity} {item.stockQuantity < 0 && '(Negativ)'}
            </Paragraph>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderProject = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.projectListItem}
        onPress={() => selectProject(item)}
      >
        <View style={styles.projectListItemContent}>
          <Paragraph style={styles.projectListItemName}>{item.name}</Paragraph>
          <Paragraph style={styles.projectListItemDescription}>{item.description}</Paragraph>
          <View style={styles.projectListItemDetails}>
            <Chip mode="outlined" style={styles.projectStatusChip}>
              {item.status}
            </Chip>
            <Paragraph style={styles.projectListItemDates}>
              {item.startDate} - {item.endDate}
            </Paragraph>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getWarenausgangHeaderColor = () => {
    switch (warenausgangstyp) {
      case 'Rücksendung Lieferant':
        return '#90CAF9';
      case 'Projekt':
        return '#A5D6A7';
      case 'Lager':
        return '#FFF59D';
      case 'Entsorgung':
        return '#FFCC80';
      default:
        return 'white';
    }
  };

  const getWarenausgangstypColor = (typ: string) => {
    switch (typ) {
      case 'Rücksendung Lieferant':
        return '#90CAF9';
      case 'Projekt':
        return '#A5D6A7';
      case 'Lager':
        return '#FFF59D';
      case 'Entsorgung':
        return '#FFCC80';
      default:
        return '#CCCCCC';
    }
  };

  // Form functions
  const incrementAnzahl = () => {
    const newAnzahl = anzahl + 1;
    setAnzahl(newAnzahl);
    
    // Check if quantity exceeds stock and show justification dialog
    if (selectedProduct && newAnzahl > selectedProduct.stockQuantity) {
      setShowBegruendungField(true);
      Alert.alert(
        'Lagerbestand überschritten',
        `Sie haben ${newAnzahl} Stück eingegeben, aber nur ${selectedProduct.stockQuantity} Stück sind verfügbar. Eine Übersteuerung ist möglich, aber eine Begründung ist erforderlich.`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Begründung eingeben', onPress: () => setBegruendungDialogVisible(true) }
        ]
      );
    }
  };

  const decrementAnzahl = () => {
    if (anzahl > 1) {
      setAnzahl(prev => prev - 1);
    }
  };

  const handleAnzahlTextChange = (text: string) => {
    const number = parseInt(text);
    if (!isNaN(number) && number >= 1) {
      setAnzahl(number);
      
      // Check if quantity exceeds stock and show justification dialog
      if (selectedProduct && number > selectedProduct.stockQuantity) {
        setShowBegruendungField(true);
        Alert.alert(
          'Lagerbestand überschritten',
          `Sie haben ${number} Stück eingegeben, aber nur ${selectedProduct.stockQuantity} Stück sind verfügbar. Eine Übersteuerung ist möglich, aber eine Begründung ist erforderlich.`,
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Begründung eingeben', onPress: () => setBegruendungDialogVisible(true) }
          ]
        );
      }
    } else if (text === '') {
      setAnzahl(1);
    }
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
      console.error('Error requesting camera permission:', error);
      Alert.alert('Fehler', 'Kamera-Berechtigung konnte nicht angefordert werden.');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setArtikelnummer(data);
    setScannerVisible(false);
    // Try to find and select the product
    searchProductBySKU(data);
  };

  const searchProductBySKU = async (sku: string) => {
    try {
      const products = await apiService.getProducts();
      const product = products.find(p => p.sku === sku.trim());
      
      if (product) {
        setSelectedProduct(product);
        setSelectedUnit(product.unit || 'Stück');
      } else {
        Alert.alert('Produkt nicht gefunden', `Kein Produkt mit SKU "${sku}" gefunden.`);
      }
    } catch (error) {
      console.error('Error searching product:', error);
      Alert.alert('Fehler', 'Produkt konnte nicht gesucht werden.');
    }
  };

  const openGrundDialog = () => {
    setAuswahlGrundDialogVisible(true);
  };

  const selectGrund = (grund: string) => {
    setAuswahlGrund(grund);
    setAuswahlGrundDialogVisible(false);
  };

  const openUnitDialog = () => {
    if (selectedProduct) {
      setUnitDialogVisible(true);
    }
  };

  const selectUnit = (unit: string) => {
    setSelectedUnit(unit);
    setUnitDialogVisible(false);
  };

  // Funktionen für Rücksendung Lieferant
  const adjustRuecksendungSummaryQuantity = (key: string, change: number) => {
    setRuecksendungSummaryItems(prev =>
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

  // Generische Funktion zum Anpassen der Menge für alle Typen
  const adjustSummaryQuantity = (typ: string, key: string, change: number) => {
    const updateItem = (item: any) => {
      if (item.key !== key) {
        return item;
      }
      const step = item.unit === 'Paket' ? 0.1 : 1;
      const newValue = Math.max(
        0,
        parseFloat((item.quantityInput + change * step).toFixed(item.unit === 'Paket' ? 1 : 0))
      );
      return { ...item, quantityInput: newValue };
    };

    if (typ === 'Projekt') {
      setProjektSummaryItems(prev => prev.map(updateItem));
    } else if (typ === 'Lager') {
      setLagerSummaryItems(prev => prev.map(updateItem));
    } else if (typ === 'Entsorgung') {
      setEntsorgungSummaryItems(prev => prev.map(updateItem));
    }
  };

  const deleteRuecksendungSummaryItem = async (item: any) => {
    // Prüfe, ob der Artikel aus der DB geladen wurde (key beginnt mit "ruecksendung-ref-")
    if (item.key.startsWith('ruecksendung-ref-')) {
      // Extrahiere die ID aus dem key (z.B. "ruecksendung-ref-123-0" -> "123")
      const match = item.key.match(/ruecksendung-ref-(\d+)/);
      if (match && match[1]) {
        const warenausgangId = parseInt(match[1], 10);
        
        // Validiere, dass die ID eine gültige Zahl ist
        if (isNaN(warenausgangId) || warenausgangId <= 0) {
          console.error('Ungültige Warenausgang-ID:', match[1], 'aus key:', item.key);
          Alert.alert('Fehler', 'Ungültige Artikel-ID. Der Artikel konnte nicht gelöscht werden.');
          return;
        }
        
        console.log('Lösche Warenausgang mit ID:', warenausgangId, 'aus key:', item.key);
        
        try {
          const isAuthenticated = await apiService.isAuthenticated();
          if (isAuthenticated) {
            // Lösche den Warenausgang aus der DB
            await apiService.deleteWarenausgang(warenausgangId);
            // Lade Warenausgänge neu, damit die Historie aktualisiert wird
            await loadWarenausgaenge();
            // Lade Artikel für Referenz neu, damit der Bodybereich aktualisiert wird
            if (referenz.trim().length > 0) {
              await loadRuecksendungItemsForReferenz(referenz);
            }
            return;
          } else {
            // Im Offline-Modus: Zeige Fehlermeldung
            Alert.alert('Fehler', 'Im Offline-Modus können Artikel nicht gelöscht werden. Bitte verbinden Sie sich mit dem Internet.');
            return;
          }
        } catch (error: any) {
          console.error('Fehler beim Löschen des Warenausgangs:', error);
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
    
    // Entferne den Artikel aus ruecksendungSummaryItems (nur wenn nicht aus DB geladen)
    setRuecksendungSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
  };

  const saveRuecksendungSummaryItem = async (item: any) => {
    if (item.quantityInput <= 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie eine Menge größer als 0 aus.');
      return;
    }

    setRuecksendungSummarySaving(item.key);

    try {
      let product =
        allProducts.find(p => p.id === item.productId) ||
        (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);

      if (!product) {
        try {
          const products = await apiService.getProducts();
          setAllProducts(products);
          product =
            products.find(p => p.id === item.productId) ||
            (item.sku ? products.find(p => p.sku === item.sku) : undefined);
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
      if (referenz && referenz.trim()) {
        notesParts.push(`Referenz: ${referenz.trim()}`);
      }
      if (lieferant && lieferant.trim()) {
        notesParts.push(`Lieferant: ${lieferant.trim()}`);
      }
      if (lagerort && lagerort.trim()) {
        notesParts.push(`Lagerort: ${lagerort.trim()}`);
      }
      if (bemerkung && bemerkung.trim()) {
        notesParts.push(`Bemerkung: ${bemerkung.trim()}`);
      }
      const notes = notesParts.length > 0 ? notesParts.join(' | ') : undefined;

      const warenausgangData: Warenausgang = {
        id: Date.now(), // Temporary ID for local storage
        productId: product.id,
        productName: product.name,
        quantity: quantityValue,
        unitPrice: product.price || 0,
        totalPrice: (product.price || 0) * quantityValue,
        customer: '',
        orderNumber: referenz.trim() || '',
        notes: notes || undefined,
        attribut: 'Rücksendung Lieferant',
        projectName: '',
        begruendung: undefined,
        createdAt: new Date().toISOString(),
      };

      let savedWarenausgangId: number | string = warenausgangData.id;
      
      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated && isOnline) {
        try {
          const apiRequest = {
            productId: warenausgangData.productId,
            quantity: warenausgangData.quantity,
            unitPrice: warenausgangData.unitPrice,
            customer: warenausgangData.customer,
            orderNumber: warenausgangData.orderNumber,
            notes: warenausgangData.notes,
            attribut: warenausgangData.attribut,
            projectName: warenausgangData.projectName,
            begruendung: warenausgangData.begruendung,
          };
          
          const createdWarenausgang = await apiService.createWarenausgang(apiRequest);
          savedWarenausgangId = createdWarenausgang.id;
          await databaseService.saveWarenausgang(createdWarenausgang);
        } catch (apiError) {
          console.error('API Error, falling back to local storage:', apiError);
          await databaseService.saveWarenausgang(warenausgangData, true);
        }
      } else {
        await databaseService.saveWarenausgang(warenausgangData, true);
      }

      await loadWarenausgaenge();

      // Aktualisiere den Key des Artikels, damit er als gespeichert markiert wird
      // und die +/- Buttons verschwinden
      setRuecksendungSummaryItems((prev) => 
        prev.map((i) => {
          if (i.key === item.key) {
            // Aktualisiere den Key, damit er als gespeichert markiert wird
            return {
              ...i,
              key: `ruecksendung-ref-${savedWarenausgangId}-0`,
              quantityInput: quantityValue,
            };
          }
          return i;
        })
      );
      
      // Lade Artikel für Referenz neu, damit der Bodybereich aktualisiert wird
      if (referenz.trim().length > 0) {
        await loadRuecksendungItemsForReferenz(referenz);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Artikel konnte nicht gespeichert werden.');
    } finally {
      setRuecksendungSummarySaving(null);
    }
  };

  // Generische Save-Funktion für alle Warenausgangstypen
  const saveSummaryItem = async (item: any, typ: string) => {
    if (item.quantityInput <= 0) {
      Alert.alert('Hinweis', 'Bitte wählen Sie eine Menge größer als 0 aus.');
      return;
    }

    const prefix = `${typ.toLowerCase().replace(/\s+/g, '-')}-ref-`;
    
    // Setze den entsprechenden Saving-State
    if (typ === 'Projekt') {
      setProjektSummarySaving(item.key);
    } else if (typ === 'Lager') {
      setLagerSummarySaving(item.key);
    } else if (typ === 'Entsorgung') {
      setEntsorgungSummarySaving(item.key);
    }

    try {
      let product =
        allProducts.find(p => p.id === item.productId) ||
        (item.sku ? allProducts.find(p => p.sku === item.sku) : undefined);

      if (!product) {
        try {
          const products = await apiService.getProducts();
          setAllProducts(products);
          product =
            products.find(p => p.id === item.productId) ||
            (item.sku ? products.find(p => p.sku === item.sku) : undefined);
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
      if (referenz && referenz.trim()) {
        notesParts.push(`Referenz: ${referenz.trim()}`);
      }
      if (lagerort && lagerort.trim()) {
        notesParts.push(`Lagerort: ${lagerort.trim()}`);
      }
      if (typ === 'Projekt' && projektnummer && projektnummer.trim()) {
        notesParts.push(`Projektnummer: ${projektnummer.trim()}`);
      }
      if (bemerkung && bemerkung.trim()) {
        notesParts.push(`Bemerkung: ${bemerkung.trim()}`);
      }
      if (typ === 'Entsorgung' && auswahlGrund && auswahlGrund.trim()) {
        notesParts.push(`Grund: ${auswahlGrund.trim()}`);
      }
      const notes = notesParts.length > 0 ? notesParts.join(' | ') : undefined;

      const warenausgangData: Warenausgang = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        quantity: quantityValue,
        unitPrice: product.price || 0,
        totalPrice: (product.price || 0) * quantityValue,
        customer: '',
        orderNumber: referenz.trim() || '',
        notes: notes || undefined,
        attribut: typ,
        projectName: typ === 'Projekt' ? projektnummer.trim() : '',
        begruendung: typ === 'Entsorgung' ? auswahlGrund : undefined,
        createdAt: new Date().toISOString(),
      };

      let savedWarenausgangId: number | string = warenausgangData.id;
      
      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated && isOnline) {
        try {
          const apiRequest = {
            productId: warenausgangData.productId,
            quantity: warenausgangData.quantity,
            unitPrice: warenausgangData.unitPrice,
            customer: warenausgangData.customer,
            orderNumber: warenausgangData.orderNumber,
            notes: warenausgangData.notes,
            attribut: warenausgangData.attribut,
            projectName: warenausgangData.projectName,
            begruendung: warenausgangData.begruendung,
          };
          
          const createdWarenausgang = await apiService.createWarenausgang(apiRequest);
          savedWarenausgangId = createdWarenausgang.id;
          await databaseService.saveWarenausgang(createdWarenausgang);
        } catch (apiError) {
          console.error('API Error, falling back to local storage:', apiError);
          await databaseService.saveWarenausgang(warenausgangData, true);
        }
      } else {
        await databaseService.saveWarenausgang(warenausgangData, true);
      }

      await loadWarenausgaenge();

      // Aktualisiere den Key des Artikels, damit er als gespeichert markiert wird
      const updateItems = (prev: any[]) => 
        prev.map((i) => {
          if (i.key === item.key) {
            return {
              ...i,
              key: `${prefix}${savedWarenausgangId}-0`,
              quantityInput: quantityValue,
            };
          }
          return i;
        });

      if (typ === 'Projekt') {
        setProjektSummaryItems(updateItems);
      } else if (typ === 'Lager') {
        setLagerSummaryItems(updateItems);
      } else if (typ === 'Entsorgung') {
        setEntsorgungSummaryItems(updateItems);
      }
      
      // Lade Artikel für Referenz neu
      if (referenz.trim().length > 0) {
        await loadItemsForReferenz(typ, referenz);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Artikel konnte nicht gespeichert werden.');
    } finally {
      if (typ === 'Projekt') {
        setProjektSummarySaving(null);
      } else if (typ === 'Lager') {
        setLagerSummarySaving(null);
      } else if (typ === 'Entsorgung') {
        setEntsorgungSummarySaving(null);
      }
    }
  };

  // Generische Delete-Funktion für alle Warenausgangstypen
  const deleteSummaryItem = async (item: any, typ: string) => {
    const prefix = `${typ.toLowerCase().replace(/\s+/g, '-')}-ref-`;
    
    // Prüfe, ob der Artikel aus der DB geladen wurde
    if (item.key.startsWith(prefix)) {
      const match = item.key.match(new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)`));
      if (match && match[1]) {
        const warenausgangId = parseInt(match[1], 10);
        
        if (isNaN(warenausgangId) || warenausgangId <= 0) {
          console.error('Ungültige Warenausgang-ID:', match[1], 'aus key:', item.key);
          Alert.alert('Fehler', 'Ungültige Artikel-ID. Der Artikel konnte nicht gelöscht werden.');
          return;
        }
        
        try {
          const isAuthenticated = await apiService.isAuthenticated();
          if (isAuthenticated) {
            await apiService.deleteWarenausgang(warenausgangId);
            await loadWarenausgaenge();
            if (referenz.trim().length > 0) {
              await loadItemsForReferenz(typ, referenz);
            }
            return;
          } else {
            Alert.alert('Fehler', 'Im Offline-Modus können Artikel nicht gelöscht werden. Bitte verbinden Sie sich mit dem Internet.');
            return;
          }
        } catch (error: any) {
          console.error('Fehler beim Löschen des Warenausgangs:', error);
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
    
    // Entferne den Artikel aus den entsprechenden Summary Items
    if (typ === 'Projekt') {
      setProjektSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
    } else if (typ === 'Lager') {
      setLagerSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
    } else if (typ === 'Entsorgung') {
      setEntsorgungSummaryItems((prev) => prev.filter((i) => i.key !== item.key));
    }
  };

  // Get current project status when "Projekt" is selected
  const getProjectStatus = () => {
    if (warenausgangstyp === 'Projekt') {
      const projectWarenausgaenge = warenausgaenge.filter(w => w.attribut === 'Projekt');
      return projectWarenausgaenge;
    }
    return [];
  };

  const getAvailableUnits = () => {
    if (!selectedProduct) {
      return [];
    }
    
    const units = ['Stück'];
    
    // Add product's default unit if it's not already included
    if (selectedProduct.unit && !units.includes(selectedProduct.unit)) {
      units.push(selectedProduct.unit);
    }
    
    // Add Palette as option
    if (!units.includes('Palette')) {
      units.push('Palette');
    }
    
    return units;
  };

  const handleSubmit = async () => {
    if (!artikelnummer.trim() || !lagerort.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (anzahl < 1) {
      Alert.alert('Fehler', 'Die Anzahl muss mindestens 1 betragen.');
      return;
    }

    setSubmitting(true);
    try {
      // Find product by SKU
      const products = await apiService.getProducts();
      const product = products.find(p => p.sku === artikelnummer.trim());
      
      if (!product) {
        Alert.alert('Fehler', 'Produkt mit dieser Artikelnummer nicht gefunden.');
        return;
      }

      // Set selected product for unit display
      setSelectedProduct(product);
      setSelectedUnit(product.unit || 'Stück'); // Set default unit

      console.log('Found product:', product);
      console.log('Product price:', product.price);
      console.log('Product ID:', product.id);

      // Validate product data
      if (!product.id || !product.price) {
        Alert.alert('Fehler', 'Produktdaten sind unvollständig.');
        return;
      }

      // Check if stock is exceeded and justification is required
      if (anzahl > product.stockQuantity && !begruendung.trim()) {
        Alert.alert('Fehler', 'Bitte geben Sie eine Begründung für die Überschreitung des Lagerbestands ein');
        return;
      }

      const warenausgangData: Warenausgang = {
        id: Date.now(), // Temporary ID for local storage
        productId: product.id,
        productName: product.name,
        quantity: anzahl,
        unitPrice: product.price,
        totalPrice: product.price * anzahl,
        customer: '',
        orderNumber: '',
        notes: `Grund: ${auswahlGrund}, Lagerort: ${lagerort}`,
        attribut: warenausgangstyp,
        projectName: selectedProject?.name || '',
        begruendung: begruendung,
        createdAt: new Date().toISOString(),
      };

      // Add auswahlGrund for local storage
      (warenausgangData as any).auswahlGrund = auswahlGrund;

      const isAuthenticated = await apiService.isAuthenticated();
      console.log('Is authenticated:', isAuthenticated);
      console.log('Is online:', isOnline);
      
      if (isAuthenticated && isOnline) {
        try {
          // Create API request object
          const apiRequest = {
            productId: warenausgangData.productId,
            quantity: warenausgangData.quantity,
            unitPrice: warenausgangData.unitPrice,
            customer: warenausgangData.customer,
            orderNumber: warenausgangData.orderNumber,
            notes: warenausgangData.notes,
            attribut: warenausgangData.attribut,
            projectName: warenausgangData.projectName,
            begruendung: warenausgangData.begruendung,
          };
          
          console.log('Sending API request:', apiRequest);
          console.log('Product found:', product);
          
          // Validate API request data
          if (!apiRequest.productId || !apiRequest.quantity || !apiRequest.unitPrice) {
            throw new Error('API request data is incomplete');
          }
          
          const createdWarenausgang = await apiService.createWarenausgang(apiRequest);
          console.log('Created warenausgang:', createdWarenausgang);
          
          // Save to local database
          await databaseService.saveWarenausgang(createdWarenausgang);
        } catch (apiError) {
          console.error('API Error, falling back to local storage:', apiError);
          
          // Check if it's a stock quantity error
          if (apiError.response?.status === 400 && apiError.response?.data?.includes('Insufficient stock quantity')) {
            Alert.alert(
              'Lagerbestand nicht ausreichend', 
              `Das ist nicht möglich, weil ${anzahl} Stück gefordert sind, allerdings sind nur ${product.stockQuantity} Stück im Lager verfügbar.`,
              [{ text: 'OK', style: 'default' }]
            );
            return;
          }
          
          // Fallback to local storage if API fails
          await databaseService.saveWarenausgang(warenausgangData, true);
        }
      } else {
        console.log('Saving to local database only');
        // Save directly to local database
        await databaseService.saveWarenausgang(warenausgangData, true);
      }

      Alert.alert('Erfolg', 'Warenausgang wurde erfolgreich gebucht!');
      
      // Reset form
      setAuswahlGrund('Kommission');
      setArtikelnummer('');
      setAnzahl(1);
      setLagerort('Köln S04');
      setWarenausgangstyp('');
      setSelectedProduct(null);
      setSelectedUnit('Stück');
      setSelectedProject(null);
      setBegruendung('');
      setShowBegruendungField(false);
      
      // Reload data to show in history
      await loadWarenausgaenge();
    } catch (error) {
      console.error('Error creating warenausgang:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      Alert.alert('Fehler', 'Fehler beim Buchen des Warenausgangs.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Utility-Funktionen für Rücksendung Lieferant
  const getUnitLabel = (unit: string, quantity: number) => {
    if (unit === 'Palette') {
      return quantity === 1 ? 'Palette' : 'Paletten';
    }
    if (unit === 'Paket') {
      return quantity === 1 ? 'Paket' : 'Pakete';
    }
    return quantity === 1 ? 'Stück' : 'Stück';
  };

  const formatQuantityValue = (value: number) => {
    if (value % 1 === 0) {
      return Math.round(value).toString();
    }
    return value.toFixed(1).replace('.', ',');
  };

  const renderRuecksendungSummaryItem = (item: any) => {
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
              {!item.key.startsWith('ruecksendung-ref-') && (
                <IconButton
                  icon="content-save"
                  size={22}
                  iconColor={BRAND_DARK_BLUE}
                  onPress={() => saveRuecksendungSummaryItem(item)}
                  disabled={ruecksendungSummarySaving === item.key || (item.quantityInput ?? 0) <= 0}
                />
              )}
              <IconButton
                icon="close"
                size={22}
                iconColor="#d32f2f"
                onPress={() => {
                  Alert.alert(
                    'Artikel entfernen',
                    `Möchten Sie wirklich "${item.name}" entfernen?${item.key.startsWith('ruecksendung-ref-') ? ' Der Artikel wird auch aus der Datenbank gelöscht.' : ''}`,
                    [
                      {
                        text: 'Abbrechen',
                        style: 'cancel',
                      },
                      {
                        text: 'Entfernen',
                        style: 'destructive',
                        onPress: () => {
                          deleteRuecksendungSummaryItem(item);
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
              {!item.key.startsWith('ruecksendung-ref-') && (
                <>
                  <IconButton
                    icon="minus"
                    size={20}
                    iconColor="white"
                    style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                    onPress={() => adjustRuecksendungSummaryQuantity(item.key, -1)}
                  />
                  <TextInput
                    style={[styles.projectMaterialQuantityInput, { 
                      width: 55, 
                      marginHorizontal: 4 
                    }]}
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
                    onPress={() => adjustRuecksendungSummaryQuantity(item.key, 1)}
                  />
                </>
              )}
              {item.key.startsWith('ruecksendung-ref-') && (
                <TextInput
                  style={[styles.projectMaterialQuantityInput, { 
                    width: 55, 
                    marginHorizontal: 0 
                  }]}
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
              )}
            </View>
            <Paragraph style={styles.projectMaterialUnitText}>
              {getUnitLabel(item.unit, item.quantityInput)}
            </Paragraph>
          </View>

          {timestamp && (
            <View style={styles.projectMaterialLastBookingContainer}>
              <View style={styles.projectMaterialLastBookingRow}>
                <Paragraph style={styles.projectMaterialLastBookingText}>
                  Letzter Warenausgang: {formatQuantityValue(item.lastBookingQuantity ?? item.quantity)}{' '}
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
                  onPress={() => {
                    // History für diesen Artikel öffnen
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
  };

  // Generische Render-Funktion für alle Warenausgangstypen
  const renderSummaryItem = (item: any, typ: string) => {
    const timestamp = item.lastTimestamp ? new Date(item.lastTimestamp) : undefined;
    const prefix = `${typ.toLowerCase().replace(/\s+/g, '-')}-ref-`;
    const isSaved = item.key.startsWith(prefix);
    
    // Bestimme die entsprechenden States und Funktionen basierend auf Typ
    let savingState: string | null = null;
    let onSave: (item: any) => void = () => {};
    let onDelete: (item: any) => void = () => {};
    let onAdjustQuantity: (key: string, change: number) => void = () => {};
    
    if (typ === 'Rücksendung Lieferant') {
      savingState = ruecksendungSummarySaving;
      onSave = saveRuecksendungSummaryItem;
      onDelete = deleteRuecksendungSummaryItem;
      onAdjustQuantity = adjustRuecksendungSummaryQuantity;
    } else if (typ === 'Projekt') {
      savingState = projektSummarySaving;
      onSave = (item) => saveSummaryItem(item, 'Projekt');
      onDelete = (item) => deleteSummaryItem(item, 'Projekt');
      onAdjustQuantity = (key, change) => adjustSummaryQuantity('Projekt', key, change);
    } else if (typ === 'Lager') {
      savingState = lagerSummarySaving;
      onSave = (item) => saveSummaryItem(item, 'Lager');
      onDelete = (item) => deleteSummaryItem(item, 'Lager');
      onAdjustQuantity = (key, change) => adjustSummaryQuantity('Lager', key, change);
    } else if (typ === 'Entsorgung') {
      savingState = entsorgungSummarySaving;
      onSave = (item) => saveSummaryItem(item, 'Entsorgung');
      onDelete = (item) => deleteSummaryItem(item, 'Entsorgung');
      onAdjustQuantity = (key, change) => adjustSummaryQuantity('Entsorgung', key, change);
    }

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
              {!isSaved && (
                <IconButton
                  icon="content-save"
                  size={22}
                  iconColor={BRAND_DARK_BLUE}
                  onPress={() => onSave(item)}
                  disabled={savingState === item.key || (item.quantityInput ?? 0) <= 0}
                />
              )}
              <IconButton
                icon="close"
                size={22}
                iconColor="#d32f2f"
                onPress={() => {
                  Alert.alert(
                    'Artikel entfernen',
                    `Möchten Sie wirklich "${item.name}" entfernen?${isSaved ? ' Der Artikel wird auch aus der Datenbank gelöscht.' : ''}`,
                    [
                      {
                        text: 'Abbrechen',
                        style: 'cancel',
                      },
                      {
                        text: 'Entfernen',
                        style: 'destructive',
                        onPress: () => {
                          onDelete(item);
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
              {!isSaved && (
                <>
                  <IconButton
                    icon="minus"
                    size={20}
                    iconColor="white"
                    style={[styles.projectMaterialQuantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
                    onPress={() => onAdjustQuantity(item.key, -1)}
                  />
                  <TextInput
                    style={[styles.projectMaterialQuantityInput, { 
                      width: 55, 
                      marginHorizontal: 4 
                    }]}
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
                    onPress={() => onAdjustQuantity(item.key, 1)}
                  />
                </>
              )}
              {isSaved && (
                <TextInput
                  style={[styles.projectMaterialQuantityInput, { 
                    width: 55, 
                    marginHorizontal: 0 
                  }]}
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
              )}
            </View>
            <Paragraph style={styles.projectMaterialUnitText}>
              {getUnitLabel(item.unit, item.quantityInput)}
            </Paragraph>
          </View>

          {timestamp && (
            <View style={styles.projectMaterialLastBookingContainer}>
              <View style={styles.projectMaterialLastBookingRow}>
                <Paragraph style={styles.projectMaterialLastBookingText}>
                  Letzter Warenausgang: {formatQuantityValue(item.lastBookingQuantity ?? item.quantity)}{' '}
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
                  onPress={() => {
                    // History für diesen Artikel öffnen
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
  };

  const renderWarenausgang = ({ item }: { item: Warenausgang }) => (
    <Card style={styles.warenausgangCard}>
      <Card.Content>
        <Title>{item.productName}</Title>
        <View style={styles.infoRow}>
          <Paragraph style={styles.label}>Menge:</Paragraph>
          <Chip mode="outlined" style={styles.chip}>
            {item.quantity}
          </Chip>
        </View>
        {item.customer && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Kunde:</Paragraph>
            <Paragraph style={styles.value}>{item.customer}</Paragraph>
          </View>
        )}
        {item.orderNumber && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Bestellnummer:</Paragraph>
            <Paragraph style={styles.value}>{item.orderNumber}</Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Grund:') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Grund:</Paragraph>
            <Paragraph style={styles.value}>
              {item.notes.split(',')[0].replace('Grund: ', '')}
            </Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Lagerort:') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Lagerort:</Paragraph>
            <Paragraph style={styles.value}>
              {item.notes.split(',')[1]?.replace(' Lagerort: ', '') || ''}
            </Paragraph>
          </View>
        )}
        {item.attribut && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Warenausgangstyp:</Paragraph>
            <Paragraph style={styles.value}>{item.attribut}</Paragraph>
          </View>
        )}
        {item.attribut === 'Projekt' && item.projectName && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Projekt:</Paragraph>
            <Paragraph style={styles.projectNameText}>{item.projectName}</Paragraph>
          </View>
        )}
        {item.begruendung && (
          <View style={styles.begruendungContainer}>
            <Paragraph style={styles.label}>Begründung:</Paragraph>
            <Paragraph style={styles.begruendungText}>{item.begruendung}</Paragraph>
          </View>
        )}
        {item.begruendung && (
          <View style={styles.warningContainer}>
            <Paragraph style={styles.label}>⚠️ Lagerüberschreitung:</Paragraph>
            <Paragraph style={styles.warningText}>Dieser Warenausgang hat den Lagerbestand ins Negative gebracht</Paragraph>
          </View>
        )}
        <Paragraph style={styles.date}>
          {formatDate(item.createdAt)}
        </Paragraph>
      </Card.Content>
    </Card>
  );

  const handleReferenzSearch = () => {
    if (!referenz.trim()) {
      Alert.alert('Hinweis', 'Bitte gib zuerst eine Referenz ein.');
      return;
    }

    searchWarenausgangOrdersByReferenz(referenz.trim());
  };

  const selectWarenausgangOrder = (order: any) => {
    const orderReferenz = order.id || order.orderNumber || order.referenz;
    setReferenz(orderReferenz);
    setOrdersModalVisible(false);

    // Optional: Automatisch Typ setzen, falls Bestellung klar zugeordnet ist
    if (order.type && warenausgangstyp !== order.type) {
      setWarenausgangstyp(order.type);
    }
  };

  const searchWarenausgangOrdersByReferenz = async (referenzText: string) => {
    try {
      const allMockOrders = [
        { id: 'WA-2025-001', orderNumber: 'WA-2025-001', type: 'Rücksendung Lieferant', suppliers: ['Lieferant A'], date: '2025-02-15', status: 'Erstellt', items: 4 },
        { id: 'WA-2025-002', orderNumber: 'WA-2025-002', type: 'Projekt', suppliers: ['Projektteam Nord', 'Projektteam Süd'], date: '2025-02-13', status: 'Unterwegs', items: 6 },
        { id: 'WA-2025-003', orderNumber: 'WA-2025-003', type: 'Lager', suppliers: ['Lager S02'], date: '2025-02-11', status: 'Abgeschlossen', items: 3 },
        { id: 'WA-2025-004', orderNumber: 'WA-2025-004', type: 'Entsorgung', suppliers: ['Entsorger GmbH'], date: '2025-02-09', status: 'Geplant', items: 2 },
      ];

      const filteredOrders = allMockOrders.filter((order) => {
        const compare = (order.orderNumber || order.id || '').toLowerCase();
        return compare.includes(referenzText.toLowerCase());
      });

      if (filteredOrders.length === 0) {
        Alert.alert('Keine Treffer', `Keine Warenausgänge mit Referenz "${referenzText}" gefunden.`);
        return;
      }

      setOrders(filteredOrders);
      setOrdersModalVisible(true);
    } catch (error) {
      Alert.alert('Fehler', 'Referenzen konnten nicht geladen werden.');
    }
  };

  const renderWarenausgangOrder = ({ item }: { item: any }) => {
    const suppliers = item.suppliers || (item.supplier ? [item.supplier] : []);
    const supplierText = suppliers.length > 0
      ? (suppliers.length === 1 ? `Lieferant: ${suppliers[0]}` : `Lieferanten: ${suppliers.join(', ')}`)
      : 'Kein Lieferant';

    return (
      <TouchableOpacity
        style={styles.productListItem}
        onPress={() => selectWarenausgangOrder(item)}
      >
        <View style={styles.productListItemContent}>
          <Paragraph style={styles.productListItemName}>{item.orderNumber || item.id}</Paragraph>
          <Paragraph style={styles.productListItemSku}>{supplierText}</Paragraph>
          <View style={styles.projectListItemDetails}>
            <Paragraph style={styles.projectListItemDates}>Datum: {item.date}</Paragraph>
            <Paragraph style={styles.projectListItemDescription}>Status: {item.status}</Paragraph>
          </View>
          {item.items && (
            <Paragraph style={styles.projectListItemDescription}>Posten: {item.items}</Paragraph>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Title>Keine Warenausgänge gefunden</Title>
      <Paragraph style={styles.emptyText}>
        Noch keine Warenausgänge vorhanden. Erstellen Sie Ihren ersten Warenausgang.
      </Paragraph>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_DARK_BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={[styles.header, { backgroundColor: getWarenausgangHeaderColor() }]}>
        <Title style={styles.headerTitle}>Warenausgang buchen</Title>
        {!isOnline && (
          <Chip mode="outlined" icon="wifi-off" style={styles.offlineChip}>
            Offline-Modus
          </Chip>
        )}
      </Surface>

      {/* Sticky Search/Filter/Add Bar - für alle Typen wenn Artikel hinzufügen Formular sichtbar */}
      {showArticleCard === true && (
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
                if (filter.length === 0) {
                  setFilter(['alle']);
                }
                // TODO: Filter-Menü öffnen
              }}
              mode="contained-tonal"
              containerColor="#eef2f7"
              style={styles.stickyIconButton}
            />
            <IconButton
              icon="plus"
              size={24}
              iconColor="#fff"
              onPress={() => {
                // Artikel hinzufügen - öffne Produktliste
                loadAllProducts();
              }}
              mode="contained"
              containerColor={BRAND_LIGHT_BLUE}
              style={[styles.stickyIconButton, styles.stickyAddButton]}
            />
          </View>
        </View>
      )}

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Formular */}
        <Card style={styles.formCard}>
          <Card.Content>
            {/* Warenausgangstyp */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Warenausgangstyp:</Paragraph>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setWarenausgangstypDialogVisible(true)}
              >
                <Paragraph
                  style={[
                    styles.dropdownText,
                    warenausgangstyp ? styles.dropdownTextSelected : null,
                  ]}
                >
                  {warenausgangstyp || 'Warenausgangstyp wählen'}
                </Paragraph>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={BRAND_DARK_BLUE}
                />
              </TouchableOpacity>
            </View>

            {/* Referenz */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Referenz:</Paragraph>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={referenz}
                  onChangeText={(text) => {
                    setReferenz(text);
                    // Reset summary items wenn Referenz geändert wird
                    if (warenausgangstyp === 'Rücksendung Lieferant') {
                      setRuecksendungSummaryItems([]);
                    } else if (warenausgangstyp === 'Projekt') {
                      setProjektSummaryItems([]);
                    } else if (warenausgangstyp === 'Lager') {
                      setLagerSummaryItems([]);
                    } else if (warenausgangstyp === 'Entsorgung') {
                      setEntsorgungSummaryItems([]);
                    }
                  }}
                  placeholder="z.B. WA-2025-001"
                  mode="outlined"
                  dense
                />
                {warenausgangstyp !== 'Rücksendung Lieferant' && warenausgangstyp !== 'Projekt' && warenausgangstyp !== 'Lager' && warenausgangstyp !== 'Entsorgung' && (
                <IconButton
                  icon="magnify"
                  size={24}
                  iconColor={BRAND_DARK_BLUE}
                  onPress={handleReferenzSearch}
                  style={styles.iconButton}
                />
                )}
              </View>
            </View>

            {/* Lieferant - nur bei Rücksendung Lieferant */}
            {warenausgangstyp === 'Rücksendung Lieferant' && (
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Lieferant:</Paragraph>
                <TextInput
                  style={styles.textInput}
                  value={lieferant}
                  onChangeText={setLieferant}
                  placeholder="Lieferant Name"
                  mode="outlined"
                  dense
                />
              </View>
            )}

            {/* Bemerkung - nur bei Rücksendung Lieferant */}
            {warenausgangstyp === 'Rücksendung Lieferant' && (
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

            {/* Projekt-Auswahl - nur bei Projekt */}
            {warenausgangstyp === 'Projekt' && (
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Projektnummer:</Paragraph>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={projektnummer}
                    onChangeText={setProjektnummer}
                    placeholder="z.B. PROJ-2025-001 oder Bürogebäude"
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

            {/* Lagerort */}
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

            {/* Begründung für negative Lager */}
            {showBegruendungField && (
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Begründung für Übersteuerung:</Paragraph>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.begruendungInput]}
                    value={begruendung}
                    onChangeText={setBegruendung}
                    placeholder="Begründung eingeben oder Vorlage wählen..."
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    dense
                    autoCapitalize="sentences"
                    autoCorrect={true}
                    keyboardType="default"
                    returnKeyType="done"
                  />
                  <Button
                    mode="outlined"
                    icon="format-list-bulleted"
                    onPress={() => setBegruendungDialogVisible(true)}
                    style={styles.vorlageButton}
                    labelStyle={styles.vorlageButtonLabel}
                  >
                    Vorlage
                  </Button>
                </View>
              </View>
            )}

          </Card.Content>
        </Card>

        {/* Rücksendung Lieferant Materials View - wenn Warenausgangstyp "Rücksendung Lieferant" */}
        {warenausgangstyp === 'Rücksendung Lieferant' ? (
          <Card style={[styles.articleCard, styles.articleCardSpacing]}>
            <Card.Content>
              {/* Titel nur anzeigen wenn Artikel hinzufügen geklickt wurde oder Artikel vorhanden sind */}
              {(showArticleCard === true || ruecksendungSummaryItems.length > 0) && (
                <Surface style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Title style={{ fontSize: 18, fontWeight: 'bold' }}>
                      Rücksendung Lieferant
                    </Title>
          </View>
                  {referenz.trim().length > 0 && (
                    <Paragraph style={{ marginTop: 8, color: '#666' }}>
                      Referenz: {referenz.trim()}
                    </Paragraph>
                  )}
                  {bemerkung.trim().length > 0 && (
                    <Paragraph style={{ marginTop: 4, color: '#666' }}>
                      Bemerkung: {bemerkung.trim()}
                    </Paragraph>
                  )}
                </Surface>
              )}

              {ruecksendungSummaryItems.length > 0 && (
                <View style={styles.projectMaterialsListContainer}>
                  {ruecksendungSummaryItems.map((item, index) => (
                    <View key={`${item.key}-${index}`}>
                      {renderRuecksendungSummaryItem(item)}
                    </View>
                  ))}
                </View>
              )}

              {/* Artikel hinzufügen Button - nur wenn keine Artikel vorhanden */}
              {ruecksendungSummaryItems.length === 0 && showArticleCard === false ? (
              <View style={styles.articleEmptyState}>
                <Paragraph style={styles.articleEmptyText}>
                    Keine Artikel hinzugefügt. Klicken Sie auf „Artikel hinzufügen" um zu beginnen.
                </Paragraph>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={handleAddArticleCard}
                  style={styles.articleAddButton}
                  buttonColor={BRAND_LIGHT_BLUE}
                  compact
                >
                  Artikel hinzufügen
                </Button>
              </View>
              ) : null}

              {/* Artikel hinzufügen Formular */}
              {showArticleCard === true ? (
              <View style={styles.articleItemCard}>
                <View style={styles.articleItemHeader}>
                    <Title style={styles.articleItemTitle}>
                      {selectedProduct ? selectedProduct.name : 'Artikel hinzufügen'}
                    </Title>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton
                      icon="content-save"
                      size={20}
                      iconColor={BRAND_DARK_BLUE}
                      onPress={() => {
                        if (warenausgangstyp === 'Rücksendung Lieferant') {
                          handleAddArticleCard();
                        }
                      }}
                      disabled={!selectedProduct && !artikelnummer.trim()}
                    />
                    <IconButton
                      icon="close"
                    size={20}
                    iconColor="#d32f2f"
                    onPress={clearArticleCard}
                  />
                </View>
                </View>
                  <>
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Artikelnummer:</Paragraph>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.artikelnummerInput}
                    value={artikelnummer}
                    onChangeText={(text) => {
                      setArtikelnummer(text);
                            setSelectedProduct(null);
                    }}
                    placeholder="z.B. DELL-XPS13-001"
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
                    onPress={loadAllProducts}
                    style={styles.iconButton}
                  />
                  <IconButton
                    icon="barcode-scan"
                    size={24}
                    iconColor={BRAND_DARK_BLUE}
                    onPress={openScanner}
                    style={styles.iconButton}
                  />
                </View>
              </View>

            <View style={styles.formField}>
              <View style={styles.quantityAndUnitRow}>
                <View style={styles.quantitySection}>
                  <Paragraph style={styles.fieldLabel}>Menge:</Paragraph>
                  <View style={styles.quantityContainer}>
                    <IconButton
                      icon="minus"
                      mode="contained"
                      size={20}
                      onPress={decrementAnzahl}
                      style={styles.quantityButton}
                      iconColor="white"
                    />
                    <TextInput
                      style={styles.quantityInput}
                      value={anzahl.toString()}
                      onChangeText={handleAnzahlTextChange}
                      mode="outlined"
                      dense
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <IconButton
                      icon="plus"
                      mode="contained"
                      size={20}
                      onPress={incrementAnzahl}
                      style={styles.quantityButton}
                      iconColor="white"
                    />
                  </View>
                  
                  {selectedProduct && (
                    <View style={styles.stockInfoContainer}>
                              <Paragraph
                                style={[
                        styles.stockInfoText,
                                  anzahl > selectedProduct.stockQuantity && styles.stockExceededText,
                                ]}
                              >
                        Verfügbar: {selectedProduct.stockQuantity} Stück
                        {anzahl > selectedProduct.stockQuantity && ' ⚠️ Überschritten!'}
                      </Paragraph>
                    </View>
                  )}
                </View>
                
                {selectedProduct && (
                  <View style={styles.unitSection}>
                    <Paragraph style={styles.fieldLabel}>Einheit:</Paragraph>
                    <TouchableOpacity
                      style={styles.unitDropdownButton}
                      onPress={() => setUnitDialogVisible(true)}
                    >
                      <Paragraph style={styles.unitDropdownText}>
                        {selectedUnit || 'Einheit wählen'}
                      </Paragraph>
                      <MaterialCommunityIcons 
                        name="chevron-down" 
                        size={20} 
                        color={BRAND_DARK_BLUE} 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
                  </>
            </View>
              ) : null}
          </Card.Content>
        </Card>
        ) : null}

        {/* Bodybereich für alle Warenausgangstypen */}
        {warenausgangstyp && warenausgangstyp !== 'Rücksendung Lieferant' && (
          <Card style={[styles.articleCard, styles.articleCardSpacing]}>
            <Card.Content>
              {/* Titel nur anzeigen wenn Artikel hinzufügen geklickt wurde oder Artikel vorhanden sind */}
              {(showArticleCard === true || 
                (warenausgangstyp === 'Projekt' && projektSummaryItems.length > 0) ||
                (warenausgangstyp === 'Lager' && lagerSummaryItems.length > 0) ||
                (warenausgangstyp === 'Entsorgung' && entsorgungSummaryItems.length > 0)) && (
                <Surface style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Title style={{ fontSize: 18, fontWeight: 'bold' }}>
                      {warenausgangstyp}
                    </Title>
                  </View>
                  {referenz.trim().length > 0 && (
                    <Paragraph style={{ marginTop: 8, color: '#666' }}>
                      Referenz: {referenz.trim()}
                    </Paragraph>
                  )}
                  {warenausgangstyp === 'Projekt' && projektnummer.trim().length > 0 && (
                    <Paragraph style={{ marginTop: 4, color: '#666' }}>
                      Projektnummer: {projektnummer.trim()}
                    </Paragraph>
                  )}
                  {bemerkung.trim().length > 0 && (
                    <Paragraph style={{ marginTop: 4, color: '#666' }}>
                      Bemerkung: {bemerkung.trim()}
                    </Paragraph>
                  )}
                </Surface>
              )}

              {/* Summary Items für Projekt */}
              {warenausgangstyp === 'Projekt' && projektSummaryItems.length > 0 && (
                <View style={styles.projectMaterialsListContainer}>
                  {projektSummaryItems.map((item, index) => (
                    <View key={`${item.key}-${index}`}>
                      {renderSummaryItem(item, 'Projekt')}
                    </View>
                  ))}
                </View>
              )}

              {/* Summary Items für Lager */}
              {warenausgangstyp === 'Lager' && lagerSummaryItems.length > 0 && (
                <View style={styles.projectMaterialsListContainer}>
                  {lagerSummaryItems.map((item, index) => (
                    <View key={`${item.key}-${index}`}>
                      {renderSummaryItem(item, 'Lager')}
                    </View>
                  ))}
                </View>
              )}

              {/* Summary Items für Entsorgung */}
              {warenausgangstyp === 'Entsorgung' && entsorgungSummaryItems.length > 0 && (
                <View style={styles.projectMaterialsListContainer}>
                  {entsorgungSummaryItems.map((item, index) => (
                    <View key={`${item.key}-${index}`}>
                      {renderSummaryItem(item, 'Entsorgung')}
                    </View>
                  ))}
                </View>
              )}

              {/* Artikel hinzufügen Button - nur wenn keine Artikel vorhanden */}
              {((warenausgangstyp === 'Projekt' && projektSummaryItems.length === 0) ||
                (warenausgangstyp === 'Lager' && lagerSummaryItems.length === 0) ||
                (warenausgangstyp === 'Entsorgung' && entsorgungSummaryItems.length === 0)) && 
                showArticleCard === false ? (
                <View style={styles.articleEmptyState}>
                  <Paragraph style={styles.articleEmptyText}>
                    Keine Artikel hinzugefügt. Klicken Sie auf „Artikel hinzufügen" um zu beginnen.
                  </Paragraph>
                  <Button
                    mode="contained"
                    icon="plus"
                    onPress={handleAddArticleCard}
                    style={styles.articleAddButton}
                    buttonColor={BRAND_LIGHT_BLUE}
                    compact
                  >
                    Artikel hinzufügen
                  </Button>
                </View>
              ) : null}

              {/* Artikel hinzufügen Formular */}
              {showArticleCard === true ? (
                <View style={styles.articleItemCard}>
                  <View style={styles.articleItemHeader}>
                    <Title style={styles.articleItemTitle}>
                      {selectedProduct ? selectedProduct.name : 'Artikel hinzufügen'}
                    </Title>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <IconButton
                        icon="content-save"
                        size={20}
                        iconColor={BRAND_DARK_BLUE}
                        onPress={handleAddArticleCard}
                        disabled={!selectedProduct && !artikelnummer.trim()}
                      />
                      <IconButton
                        icon="close"
                        size={20}
                        iconColor="#d32f2f"
                        onPress={clearArticleCard}
                      />
                    </View>
                  </View>
                  <>
                    <View style={styles.formField}>
                      <Paragraph style={styles.fieldLabel}>Artikelnummer:</Paragraph>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.artikelnummerInput}
                          value={artikelnummer}
                          onChangeText={(text) => {
                            setArtikelnummer(text);
                            setSelectedProduct(null);
                          }}
                          placeholder="z.B. DELL-XPS13-001"
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
                          onPress={loadAllProducts}
                          style={styles.iconButton}
                        />
                        <IconButton
                          icon="barcode-scan"
                          size={24}
                          iconColor={BRAND_DARK_BLUE}
                          onPress={openScanner}
                          style={styles.iconButton}
                        />
                      </View>
                    </View>

                    <View style={styles.formField}>
                      <View style={styles.quantityAndUnitRow}>
                        <View style={styles.quantitySection}>
                          <Paragraph style={styles.fieldLabel}>Menge:</Paragraph>
                          <View style={styles.quantityContainer}>
                            <IconButton
                              icon="minus"
                              mode="contained"
                              size={20}
                              onPress={decrementAnzahl}
                              style={styles.quantityButton}
                              iconColor="white"
                            />
                            <TextInput
                              style={styles.quantityInput}
                              value={anzahl.toString()}
                              onChangeText={handleAnzahlTextChange}
                              mode="outlined"
                              dense
                              keyboardType="numeric"
                              selectTextOnFocus
                            />
                            <IconButton
                              icon="plus"
                              mode="contained"
                              size={20}
                              onPress={incrementAnzahl}
                              style={styles.quantityButton}
                              iconColor="white"
                            />
                          </View>
                          
                          {selectedProduct && (
                            <View style={styles.stockInfoContainer}>
                              <Paragraph
                                style={[
                                  styles.stockInfoText,
                                  anzahl > selectedProduct.stockQuantity && styles.stockExceededText,
                                ]}
                              >
                                Verfügbar: {selectedProduct.stockQuantity} Stück
                                {anzahl > selectedProduct.stockQuantity && ' ⚠️ Überschritten!'}
                              </Paragraph>
                            </View>
                          )}
                        </View>
                        
                        {selectedProduct && (
                          <View style={styles.unitSection}>
                            <Paragraph style={styles.fieldLabel}>Einheit:</Paragraph>
                            <TouchableOpacity
                              style={styles.unitDropdownButton}
                              onPress={() => setUnitDialogVisible(true)}
                            >
                              <Paragraph style={styles.unitDropdownText}>
                                {selectedUnit || 'Einheit wählen'}
                              </Paragraph>
                              <MaterialCommunityIcons 
                                name="chevron-down" 
                                size={20} 
                                color={BRAND_DARK_BLUE} 
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </>
                </View>
              ) : null}
            </Card.Content>
          </Card>
        )}

        {warenausgangstyp !== 'Rücksendung Lieferant' && warenausgangstyp !== 'Projekt' && warenausgangstyp !== 'Lager' && warenausgangstyp !== 'Entsorgung' && (
        <Card style={[styles.historyCard, styles.articleCardSpacing]}>
          <Card.Content>
            <Title style={styles.historyTitle}>
              Letzte Warenausgänge
            </Title>
            {(() => {
              // Spezielle Behandlung für "Rücksendung Lieferant"
              if (warenausgangstyp === 'Rücksendung Lieferant') {
                // Filtere nach aktueller Referenz
                // Historie für Rücksendung Lieferant ist ausgeblendet
                return null;
              }
              if (false) {
                const currentReferenz = (referenz || '').trim();
                
                // Wenn keine Referenz vorhanden ist, zeige nichts in der Historie an
                if (!currentReferenz) {
                  return (
                    <Paragraph style={styles.emptyText}>
                      Keine Referenz eingegeben. Bitte geben Sie eine Referenz ein, um die Historie anzuzeigen.
                    </Paragraph>
                  );
                }
                
                // Filtere Warenausgänge nach aktueller Referenz
                const currentRuecksendungWarenausgaenge = warenausgaenge.filter(w => {
                  if (w.attribut !== 'Rücksendung Lieferant') return false;
                  if (!w.notes && !w.orderNumber) return false;
                  // Extrahiere Referenz aus notes oder verwende orderNumber
                  const referenzMatch = w.notes?.match(/Referenz:\s*(.+?)(?:\s*\||$)/);
                  const extractedReferenz = referenzMatch ? referenzMatch[1].trim() : (w.orderNumber || '').trim();
                  return extractedReferenz === currentReferenz;
                });
                
                // Kombiniere gespeicherte Warenausgänge mit aktuellen ruecksendungSummaryItems
                // Aber vermeide Doppelungen: Wenn Artikel bereits in ruecksendungSummaryItems sind (aus DB geladen),
                // zeige sie nicht in der Historie an
                const ruecksendungSummaryItemIds = new Set(
                  ruecksendungSummaryItems
                    .filter(item => item.key.startsWith('ruecksendung-ref-'))
                    .map(item => {
                      // Extrahiere die ID aus dem key (z.B. "ruecksendung-ref-123-0" -> "123")
                      const match = item.key.match(/ruecksendung-ref-(\d+)/);
                      return match ? parseInt(match[1]) : null;
                    })
                    .filter(id => id !== null)
                );
                
                // Filtere Artikel, die bereits in ruecksendungSummaryItems sind
                const filteredRuecksendungWarenausgaenge = currentRuecksendungWarenausgaenge.filter(w => {
                  // Wenn eine Referenz vorhanden ist und der Artikel bereits in ruecksendungSummaryItems ist,
                  // zeige ihn nicht in der Historie an (wird bereits im Bodybereich angezeigt)
                  if (currentReferenz && ruecksendungSummaryItemIds.has(w.id)) {
                    return false;
                  }
                  return true;
                });
                
                const allRuecksendungItems: any[] = [...filteredRuecksendungWarenausgaenge];
                
                // Extrahiere Bemerkung, Lieferant und Lagerort aus gespeicherten Items, falls aktuelle Werte leer sind
                let extractedBemerkung = (bemerkung || '').trim();
                let extractedLieferant = (lieferant || '').trim();
                let extractedLagerort = (lagerort || '').trim();
                
                // Versuche Werte aus gespeicherten Items zu extrahieren
                // Priorisiere die neuesten Items (die zuerst in der Liste stehen, da sie nach Zeitstempel sortiert sind)
                for (const item of currentRuecksendungWarenausgaenge) {
                  if (item?.notes) {
                    const notes = item.notes;
                    const bemerkungMatch = notes.match(/Bemerkung:\s*(.+?)(?:\s*\||$)/);
                    const lieferantMatch = notes.match(/Lieferant:\s*(.+?)(?:\s*\||$)/);
                    const lagerortMatch = notes.match(/Lagerort:\s*(.+?)(?:\s*\||$)/);
                    
                    // Verwende extrahierte Werte nur wenn State-Werte leer sind
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
                  
                  // Wenn alle Werte gefunden wurden, können wir früher stoppen
                  if (extractedBemerkung && extractedLieferant && extractedLagerort) {
                    break;
                  }
                }
                
                // Falls immer noch Werte fehlen, versuche sie aus dem neuesten Item zu extrahieren
                if (currentRuecksendungWarenausgaenge.length > 0 && (!extractedBemerkung || !extractedLieferant || !extractedLagerort)) {
                  const newestItem = currentRuecksendungWarenausgaenge[0];
                  if (newestItem?.notes) {
                    const notes = newestItem.notes;
                    const bemerkungMatch = notes.match(/Bemerkung:\s*(.+?)(?:\s*\||$)/);
                    const lieferantMatch = notes.match(/Lieferant:\s*(.+?)(?:\s*\||$)/);
                    const lagerortMatch = notes.match(/Lagerort:\s*(.+?)(?:\s*\||$)/);
                    
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
                }
                
                // Priorisiere IMMER aktuelle Werte aus dem State, dann extrahierte Werte
                const effectiveBemerkung = (bemerkung && bemerkung.trim()) ? bemerkung.trim() : extractedBemerkung;
                const effectiveLieferant = (lieferant && lieferant.trim()) ? lieferant.trim() : extractedLieferant;
                const effectiveLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : extractedLagerort;
                
                // Füge nur neue ruecksendungSummaryItems hinzu (die nicht aus DB geladen wurden)
                if (ruecksendungSummaryItems.length > 0) {
                  ruecksendungSummaryItems.forEach(item => {
                    // Überspringe Artikel, die aus der DB geladen wurden (werden bereits im Bodybereich angezeigt)
                    if (item.key.startsWith('ruecksendung-ref-')) {
                      return;
                    }
                    
                    // Finde Produkt-Informationen
                    const product = allProducts.find(p => p.id === item.productId);
                    if (product) {
                      // Erstelle notes mit allen Informationen
                      const tempNotesParts: string[] = [];
                      if (currentReferenz) {
                        tempNotesParts.push(`Referenz: ${currentReferenz}`);
                      }
                      if (effectiveLieferant) {
                        tempNotesParts.push(`Lieferant: ${effectiveLieferant}`);
                      }
                      if (effectiveLagerort) {
                        tempNotesParts.push(`Lagerort: ${effectiveLagerort}`);
                      }
                      if (effectiveBemerkung) {
                        tempNotesParts.push(`Bemerkung: ${effectiveBemerkung}`);
                      }
                      const tempNotes = tempNotesParts.length > 0 ? tempNotesParts.join(' | ') : undefined;
                      
                      allRuecksendungItems.push({
                        id: `temp-${item.key}`,
                        productId: item.productId,
                        productName: item.name,
                        quantity: item.quantityInput,
                        attribut: 'Rücksendung Lieferant',
                        orderNumber: currentReferenz || '',
                        notes: tempNotes,
                        createdAt: new Date(item.createdAtTimestamp || Date.now()).toISOString(),
                        updatedAt: new Date().toISOString(),
                      });
                    }
                  });
                }
                
                // Sortiere nach Zeitstempel (neueste zuerst)
                allRuecksendungItems.sort((a, b) => {
                  const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
                  const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
                  return timeB - timeA;
                });
                
                if (allRuecksendungItems.length === 0 && currentRuecksendungWarenausgaenge.length === 0) {
                  return (
                    <Paragraph style={styles.emptyText}>
                      Noch keine Artikel für diese Referenz vorhanden.
                    </Paragraph>
                  );
                }
                
                // Verwende IMMER zuerst die State-Werte, dann effektive Werte
                const displayBemerkung = (bemerkung && bemerkung.trim()) ? bemerkung.trim() : (effectiveBemerkung || '');
                const displayLieferant = (lieferant && lieferant.trim()) ? lieferant.trim() : (effectiveLieferant || '');
                const displayLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : (effectiveLagerort || '');
                
                // Bestimme Zeitstempel (neuestes Item oder aktueller Zeitpunkt)
                const latestTimestamp = allRuecksendungItems.length > 0
                  ? new Date(allRuecksendungItems[0].createdAt || allRuecksendungItems[0].updatedAt || Date.now())
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
                  <Card style={styles.warenausgangCard}>
                    <Card.Content>
                      <Title style={styles.bestellungTitle}>
                        {currentReferenz ? `Referenz: ${currentReferenz}` : 'Rücksendung Lieferant'}
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
                      <Divider style={{ marginVertical: 16 }} />
                      
                      {allRuecksendungItems.map((warenausgang, index) => (
                        <View key={warenausgang.id || `item-${index}`} style={{ marginBottom: 12 }}>
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Artikel:</Paragraph>
                            <Paragraph style={styles.value}>{warenausgang.productName}</Paragraph>
                          </View>
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Menge:</Paragraph>
                            <Chip mode="outlined" style={styles.chip}>
                              {warenausgang.quantity} Stück
                            </Chip>
                          </View>
                          {index < allRuecksendungItems.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
              );
            }

              // Historie für Projekt, Lager und Entsorgung
              if (warenausgangstyp === 'Projekt' || warenausgangstyp === 'Lager' || warenausgangstyp === 'Entsorgung') {
                const currentReferenz = (referenz || '').trim();
                
                // Wenn keine Referenz vorhanden ist, zeige nichts in der Historie an
                if (!currentReferenz) {
                  return (
                    <Paragraph style={styles.emptyText}>
                      Keine Referenz eingegeben. Bitte geben Sie eine Referenz ein, um die Historie anzuzeigen.
                    </Paragraph>
                  );
                }
                
                // Filtere Warenausgänge nach aktueller Referenz und Typ
                const filteredWarenausgaenge = warenausgaenge.filter(w => {
                  if (w.attribut !== warenausgangstyp) return false;
                  if (!w.notes && !w.orderNumber) return false;
                  const referenzMatch = w.notes?.match(/Referenz:\s*(.+?)(?:\s*\||$)/);
                  const extractedReferenz = referenzMatch ? referenzMatch[1].trim() : (w.orderNumber || '').trim();
                  return extractedReferenz === currentReferenz;
                });
                
                // Bestimme die entsprechenden Summary Items
                let summaryItems: any[] = [];
                let prefix = '';
                if (warenausgangstyp === 'Projekt') {
                  summaryItems = projektSummaryItems;
                  prefix = 'projekt-ref-';
                } else if (warenausgangstyp === 'Lager') {
                  summaryItems = lagerSummaryItems;
                  prefix = 'lager-ref-';
                } else if (warenausgangstyp === 'Entsorgung') {
                  summaryItems = entsorgungSummaryItems;
                  prefix = 'entsorgung-ref-';
                }
                
                // Filtere Artikel, die bereits in Summary Items sind
                const summaryItemIds = new Set(
                  summaryItems
                    .filter(item => item.key.startsWith(prefix))
                    .map(item => {
                      const match = item.key.match(new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)`));
                      return match ? parseInt(match[1]) : null;
                    })
                    .filter(id => id !== null)
                );
                
                const filteredItems = filteredWarenausgaenge.filter(w => {
                  if (currentReferenz && summaryItemIds.has(w.id)) {
                    return false;
                  }
                  return true;
                });
                
                const allItems: any[] = [...filteredItems];
                
                // Extrahiere Informationen aus notes
                let extractedBemerkung = (bemerkung || '').trim();
                let extractedLagerort = (lagerort || '').trim();
                let extractedProjektnummer = (projektnummer || '').trim();
                
                for (const item of filteredWarenausgaenge) {
                  if (item?.notes) {
                    const notes = item.notes;
                    const bemerkungMatch = notes.match(/Bemerkung:\s*(.+?)(?:\s*\||$)/);
                    const lagerortMatch = notes.match(/Lagerort:\s*(.+?)(?:\s*\||$)/);
                    const projektnummerMatch = notes.match(/Projektnummer:\s*(.+?)(?:\s*\||$)/);
                    
                    if (!extractedBemerkung && bemerkungMatch) {
                      extractedBemerkung = bemerkungMatch[1].trim();
                    }
                    if (!extractedLagerort && lagerortMatch) {
                      extractedLagerort = lagerortMatch[1].trim();
                    }
                    if (!extractedProjektnummer && projektnummerMatch) {
                      extractedProjektnummer = projektnummerMatch[1].trim();
                    }
                  }
                }
                
                const effectiveBemerkung = (bemerkung && bemerkung.trim()) ? bemerkung.trim() : extractedBemerkung;
                const effectiveLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : extractedLagerort;
                const effectiveProjektnummer = (projektnummer && projektnummer.trim()) ? projektnummer.trim() : extractedProjektnummer;
                
                // Füge neue Summary Items hinzu (die nicht aus DB geladen wurden)
                if (summaryItems.length > 0) {
                  summaryItems.forEach(item => {
                    if (item.key.startsWith(prefix)) {
                      return;
                    }
                    
                    const product = allProducts.find(p => p.id === item.productId);
                    if (product) {
                      const tempNotesParts: string[] = [];
                      if (currentReferenz) {
                        tempNotesParts.push(`Referenz: ${currentReferenz}`);
                      }
                      if (effectiveLagerort) {
                        tempNotesParts.push(`Lagerort: ${effectiveLagerort}`);
                      }
                      if (warenausgangstyp === 'Projekt' && effectiveProjektnummer) {
                        tempNotesParts.push(`Projektnummer: ${effectiveProjektnummer}`);
                      }
                      if (effectiveBemerkung) {
                        tempNotesParts.push(`Bemerkung: ${effectiveBemerkung}`);
                      }
                      const tempNotes = tempNotesParts.length > 0 ? tempNotesParts.join(' | ') : undefined;
                      
                      allItems.push({
                        id: `temp-${item.key}`,
                        productId: item.productId,
                        productName: item.name,
                        quantity: item.quantityInput,
                        attribut: warenausgangstyp,
                        orderNumber: currentReferenz || '',
                        notes: tempNotes,
                        createdAt: new Date(item.createdAtTimestamp || Date.now()).toISOString(),
                        updatedAt: new Date().toISOString(),
                      });
                    }
                  });
                }
                
                // Sortiere nach Zeitstempel (neueste zuerst)
                allItems.sort((a, b) => {
                  const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
                  const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
                  return timeB - timeA;
                });
                
                if (allItems.length === 0 && filteredWarenausgaenge.length === 0) {
                  return (
                    <Paragraph style={styles.emptyText}>
                      Noch keine Artikel für diese Referenz vorhanden.
                    </Paragraph>
                  );
                }
                
                const displayBemerkung = (bemerkung && bemerkung.trim()) ? bemerkung.trim() : (effectiveBemerkung || '');
                const displayLagerort = (lagerort && lagerort.trim()) ? lagerort.trim() : (effectiveLagerort || '');
                const displayProjektnummer = (projektnummer && projektnummer.trim()) ? projektnummer.trim() : (effectiveProjektnummer || '');
                
                const latestTimestamp = allItems.length > 0
                  ? new Date(allItems[0].createdAt || allItems[0].updatedAt || Date.now())
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
                  <Card style={styles.warenausgangCard}>
                    <Card.Content>
                      <Title style={styles.bestellungTitle}>
                        {currentReferenz ? `Referenz: ${currentReferenz}` : warenausgangstyp}
                      </Title>
                      {displayLagerort && (
                        <View style={styles.infoRow}>
                          <Paragraph style={styles.label}>Lagerort:</Paragraph>
                          <Paragraph style={styles.value}>{displayLagerort}</Paragraph>
                        </View>
                      )}
                      {warenausgangstyp === 'Projekt' && displayProjektnummer && (
                        <View style={styles.infoRow}>
                          <Paragraph style={styles.label}>Projektnummer:</Paragraph>
                          <Paragraph style={styles.value}>{displayProjektnummer}</Paragraph>
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
                      <Divider style={{ marginVertical: 16 }} />
                      
                      {allItems.map((warenausgang, index) => (
                        <View key={warenausgang.id || `item-${index}`} style={{ marginBottom: 12 }}>
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Artikel:</Paragraph>
                            <Paragraph style={styles.value}>{warenausgang.productName}</Paragraph>
                          </View>
                          <View style={styles.infoRow}>
                            <Paragraph style={styles.label}>Menge:</Paragraph>
                            <Chip mode="outlined" style={styles.chip}>
                              {warenausgang.quantity} Stück
                            </Chip>
                          </View>
                          {index < allItems.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
                );
              }

              // Standard-Historie für andere Warenausgangstypen
              if (warenausgaenge.length === 0) {
                return (
              <Paragraph style={styles.emptyText}>
                Noch keine Warenausgänge vorhanden.
              </Paragraph>
                );
              }

              return (
              <FlatList
                data={warenausgaenge.slice(0, 5)} // Show only last 5
                renderItem={renderWarenausgang}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
              );
            })()}
          </Card.Content>
        </Card>
        )}
      </ScrollView>


      {/* Vollbild-Modal für Produktliste */}
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
                    // TODO: Öffne Dialog zum Erstellen eines neuen Artikels
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
              data={getFilteredProducts()}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              style={styles.fullScreenProjectsList}
              showsVerticalScrollIndicator={true}
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

      {/* Vollbild-Modal für Projektliste */}
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
              data={projects.length > 0 ? projects : allProjects}
              renderItem={renderProject}
              keyExtractor={(item) => item.id.toString()}
              style={styles.fullScreenProjectsList}
              showsVerticalScrollIndicator={true}
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

      {/* Warenausgangstyp Selection Dialog */}
      <Portal>
        <Dialog visible={warenausgangstypDialogVisible} onDismiss={() => setWarenausgangstypDialogVisible(false)}>
          <Dialog.Title>Warenausgangstyp wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => {
                setWarenausgangstyp(value);
                setWarenausgangstypDialogVisible(false);
                
                // Reset fields when switching warenausgangstyp
                if (value !== 'Rücksendung Lieferant') {
                  setRuecksendungSummaryItems([]);
                  setReferenz('');
                  setBemerkung('');
                  setLieferant('');
                }
              }}
              value={warenausgangstyp}
            >
              {warenausgangstypen.map((typ) => (
                <TouchableOpacity
                  key={typ}
                  style={[
                    styles.warenausgangstypOption,
                    warenausgangstyp === typ && styles.selectedWarenausgangstypOption,
                  ]}
                  onPress={() => {
                    setWarenausgangstyp(typ);
                    setWarenausgangstypDialogVisible(false);
                  }}
                >
                  <View style={styles.warenausgangstypLabelContainer}>
                    <View
                      style={[
                        styles.warenausgangstypColorDot,
                        { backgroundColor: getWarenausgangstypColor(typ) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.warenausgangstypLabelText,
                        warenausgangstyp === typ && styles.selectedWarenausgangstypLabelText,
                      ]}
                    >
                      {typ}
                    </Text>
                  </View>
                  <RadioButton value={typ} />
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWarenausgangstypDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Begründungs-Vorlagen Dialog */}
      <Portal>
        <Dialog visible={begruendungDialogVisible} onDismiss={() => setBegruendungDialogVisible(false)}>
          <Dialog.Title>Begründungs-Vorlage wählen</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              {begruendungsVorlagen.map((vorlage, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.vorlageItem}
                  onPress={() => {
                    setBegruendung(vorlage);
                    setBegruendungDialogVisible(false);
                  }}
                >
                  <Text style={styles.vorlageText}>{vorlage}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setBegruendungDialogVisible(false)}>Abbrechen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Lagerort Selection Dialog */}
      <Portal>
        <Dialog visible={lagerortDialogVisible} onDismiss={() => setLagerortDialogVisible(false)}>
          <Dialog.Title>Lagerort wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => {
              setLagerort(value);
              setLagerortDialogVisible(false);
            }} value={lagerort}>
              {userLocations.map((location, index) => (
                <RadioButton.Item key={index} label={location} value={location} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Entsorgungsgrund Selection Dialog */}
      <Portal>
        <Dialog visible={auswahlGrundDialogVisible} onDismiss={() => setAuswahlGrundDialogVisible(false)}>
        <Dialog.Title>Entsorgungsgrund wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => {
              setAuswahlGrund(value);
              setAuswahlGrundDialogVisible(false);
            }} value={auswahlGrund}>
              {gruende.map((grund) => (
                <RadioButton.Item key={grund} label={grund} value={grund} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAuswahlGrundDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Unit Selection Dialog */}
      <Portal>
        <Dialog visible={unitDialogVisible} onDismiss={() => setUnitDialogVisible(false)}>
          <Dialog.Title>Einheit wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => {
              setSelectedUnit(value);
              setUnitDialogVisible(false);
            }} value={selectedUnit}>
              {getAvailableUnits().map((unit) => (
                <RadioButton.Item key={unit} label={unit} value={unit} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUnitDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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

      {/* Vollbild-Modal für Warenausgangsbestellungen */}
      <Modal
        visible={ordersModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setOrdersModalVisible(false)}
      >
        <View style={styles.fullScreenModalContainer}>
          <View style={styles.fullScreenModalHeader}>
            <Title style={styles.fullScreenModalTitle}>Warenausgangsbestellungen</Title>
            <Paragraph style={styles.fullScreenModalSubtitle}>
              Wählen Sie eine Warenausgangsbestellung aus:
            </Paragraph>
          </View>
          
          <View style={styles.fullScreenModalContent}>
            <FlatList
              data={orders}
              renderItem={renderWarenausgangOrder}
              keyExtractor={(item) => item.id.toString()}
              style={styles.fullScreenProjectsList}
              showsVerticalScrollIndicator={true}
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
  articleCard: {
    marginTop: 16,
    backgroundColor: '#f9f2ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 0,
  },
  articleCardSpacing: {
    marginBottom: 16,
  },
  articleToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  articleSearchInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  articleAddButton: {
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  articleEmptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  articleEmptyText: {
    textAlign: 'center',
    color: '#666',
  },
  articleItemCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fafafa',
    gap: 12,
  },
  articleItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  articleInfoText: {
    color: '#666',
    fontStyle: 'italic',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    margin: 0,
  },
  quantityInput: {
    width: 55,
    textAlign: 'center',
    marginHorizontal: 4,
    backgroundColor: 'white',
  },
  quantityAndUnitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quantitySection: {
    flex: 1,
    marginRight: 16,
  },
  unitSection: {
    flex: 1,
    marginLeft: 16,
  },
  unitInput: {
    backgroundColor: '#f5f5f5',
  },
  unitDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    minWidth: 120,
  },
  unitDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
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
  historyCard: {
    elevation: 2,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  warenausgangCard: {
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
  totalPrice: {
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedModalOption: {
    backgroundColor: BRAND_LIGHT_BLUE + '20',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedModalOptionText: {
    color: BRAND_LIGHT_BLUE,
    fontWeight: 'bold',
  },
  modalCancel: {
    padding: 15,
    marginTop: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullScreenModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
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
    paddingBottom: 20, // Add some padding at the bottom for the footer
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
    padding: 8,
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
  fullScreenModalFooter: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  // Product List Item Styles (wie im Bild)
  productListItem: {
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  productListItemContent: {
    padding: 16,
  },
  productListItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productListItemSku: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  productListItemUnit: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  productListItemPrice: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  productListItemStock: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  negativeStockText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  // Project Status Styles
  projectStatusCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 1,
  },
  projectStatusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
    marginBottom: 8,
  },
  projectStatusItem: {
    marginBottom: 4,
  },
  projectStatusItemText: {
    fontSize: 13,
    color: '#333',
  },
  projectStatusMore: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyProjectText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Dropdown Styles
  dropdownContainer: {
    marginTop: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    marginTop: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownTextSelected: {
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  warenausgangstypOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  selectedWarenausgangstypOption: {
    borderColor: BRAND_DARK_BLUE,
    backgroundColor: '#e3f2fd',
  },
  warenausgangstypLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warenausgangstypColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  warenausgangstypLabelText: {
    fontSize: 16,
    color: '#333',
  },
  selectedWarenausgangstypLabelText: {
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  // Project List Item Styles
  projectListItem: {
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  projectListItemContent: {
    padding: 16,
  },
  projectListItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectListItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  projectListItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectStatusChip: {
    backgroundColor: '#e3f2fd',
  },
  projectListItemDates: {
    fontSize: 12,
    color: '#666',
  },
  projectNameText: {
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  begruendungContainer: {
    marginBottom: 8,
  },
  begruendungText: {
    fontStyle: 'italic',
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  warningContainer: {
    marginBottom: 8,
  },
  warningText: {
    color: '#ff9800',
    fontWeight: 'bold',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  begruendungInput: {
    flex: 1,
    marginRight: 8,
  },
  vorlageButton: {
    alignSelf: 'flex-start',
  },
  vorlageButtonLabel: {
    fontSize: 12,
  },
  vorlageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  vorlageText: {
    fontSize: 14,
    color: '#333',
  },
  stockInfoContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  stockInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  stockExceededText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    backgroundColor: '#ffebee',
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
  // Styles für Rücksendung Lieferant (wie Ohne Bestellung)
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
  projectMaterialQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    width: 45,
    marginHorizontal: 4,
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
  projectMaterialLastBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectMaterialHistoryButton: {
    padding: 4,
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
  projectMaterialsListContainer: {
    paddingBottom: 16,
    width: '100%',
  },
  // Sticky Bar Styles
  stickyBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stickyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  stickyIconButton: {
    margin: 0,
  },
  stickyAddButton: {
    marginLeft: 0,
  },
});

export default WarenausgaengeScreen;
