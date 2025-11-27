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

  const loadAllProducts = async () => {
    try {
      const products = await apiService.getProducts();
      setAllProducts(products);
      setProductsModalVisible(true);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Fehler', 'Fehler beim Laden der Produkte');
    }
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
                  onChangeText={setReferenz}
                  placeholder="z.B. WA-2025-001"
                  mode="outlined"
                  dense
                />
                <IconButton
                  icon="magnify"
                  size={24}
                  iconColor={BRAND_DARK_BLUE}
                  onPress={handleReferenzSearch}
                  style={styles.iconButton}
                />
              </View>
            </View>

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
                  <Button
                    mode="contained"
                    icon="magnify"
                    onPress={openProjectSearch}
                    style={styles.barcodeButton}
                    labelStyle={styles.barcodeButtonLabel}
                  >
                    Projekt suchen
                  </Button>
                </View>
              </View>
            )}

            {/* Artikelnummer - nicht bei Projekt */}
            {warenausgangstyp !== 'Projekt' && (
              <View style={styles.formField}>
                <Paragraph style={styles.fieldLabel}>Artikelnummer:</Paragraph>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.artikelnummerInput}
                    value={artikelnummer}
                    onChangeText={(text) => {
                      setArtikelnummer(text);
                      setSelectedProduct(null); // Clear selected product when manually typing
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
            )}

            {/* Anzahl und Einheit - nicht bei Projekt */}
            {warenausgangstyp !== 'Projekt' && (
            <View style={styles.formField}>
              <View style={styles.quantityAndUnitRow}>
                <View style={styles.quantitySection}>
                  <Paragraph style={styles.fieldLabel}>Anzahl:</Paragraph>
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
                  
                  {/* Lagerbestands-Anzeige */}
                  {selectedProduct && (
                    <View style={styles.stockInfoContainer}>
                      <Paragraph style={[
                        styles.stockInfoText,
                        anzahl > selectedProduct.stockQuantity && styles.stockExceededText
                      ]}>
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
            )}

            {/* Entsorgungsgrund */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Entsorgungsgrund:</Paragraph>
              <TouchableOpacity
                style={styles.unitDropdownButton}
                onPress={() => setAuswahlGrundDialogVisible(true)}
              >
                <Paragraph style={styles.unitDropdownText}>
                  {auswahlGrund || 'Entsorgungsgrund wählen'}
                </Paragraph>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={BRAND_DARK_BLUE}
                />
              </TouchableOpacity>
            </View>

            {/* Lagerort */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Lageort:</Paragraph>
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

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
            >
              Buchung abschließen
            </Button>
          </Card.Content>
        </Card>

        {/* Historie */}
        <Card style={styles.historyCard}>
          <Card.Content>
            <Title style={styles.historyTitle}>Letzte Warenausgänge</Title>
            {warenausgaenge.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                Noch keine Warenausgänge vorhanden.
              </Paragraph>
            ) : (
              <FlatList
                data={warenausgaenge.slice(0, 5)} // Show only last 5
                renderItem={renderWarenausgang}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </Card.Content>
        </Card>
      </ScrollView>


      {/* Vollbild-Modal für Produktliste */}
      <Modal
        visible={productsModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setProductsModalVisible(false)}
      >
        <View style={styles.fullScreenModalContainer}>
          <View style={styles.fullScreenModalHeader}>
            <Title style={styles.fullScreenModalTitle}>Artikel auswählen</Title>
            <Paragraph style={styles.fullScreenModalSubtitle}>
              Wählen Sie einen Artikel aus:
            </Paragraph>
          </View>
          
          <View style={styles.fullScreenModalContent}>
            <FlatList
              data={allProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              style={styles.fullScreenProjectsList}
              showsVerticalScrollIndicator={true}
            />
          </View>
          
          <View style={styles.fullScreenModalFooter}>
            <Button
              mode="outlined"
              onPress={() => setProductsModalVisible(false)}
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
          <Dialog.Actions>
            <Button onPress={() => setLagerortDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
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
    width: 80,
    textAlign: 'center',
    marginHorizontal: 16,
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
    height: 28,
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
});

export default WarenausgaengeScreen;
