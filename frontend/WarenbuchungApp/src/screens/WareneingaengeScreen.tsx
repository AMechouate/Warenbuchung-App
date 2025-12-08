import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
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
  Dialog,
  Portal,
  RadioButton,
  Searchbar,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { databaseService } from '../services/database';
import { Wareneingang } from '../types';
// import { BarCodeScanner } from 'expo-barcode-scanner';

const WareneingaengeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [wareneingaenge, setWareneingaenge] = useState<Wareneingang[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Form states
  const [bestellungsnummer, setBestellungsnummer] = useState('');
  const [artikelnummer, setArtikelnummer] = useState('');
  const [anzahl, setAnzahl] = useState(1);
  const [lagerort, setLagerort] = useState('');
  const [userLagerort, setUserLagerort] = useState<string>('');
  const [userLocations, setUserLocations] = useState<string[]>([]);
  const [lagerortDialogVisible, setLagerortDialogVisible] = useState(false);
  const [lieferant, setLieferant] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erfassungstyp, setErfassungstyp] = useState('Bestellung');
  
  // Modal states
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [erfassungstypModalVisible, setErfassungstypModalVisible] = useState(false);

  // Body area states - separate items for each Erfassungstyp
  interface WareneingangItem {
    id: string;
    artikelnummer: string;
    anzahl: string;
    selectedProduct: any | null;
    selectedUnit: string;
    isSaved?: boolean;
  }
  // Store items per Erfassungstyp
  const [itemsByErfassungstyp, setItemsByErfassungstyp] = useState<Record<string, WareneingangItem[]>>({});
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [currentItemIndexForProductSelection, setCurrentItemIndexForProductSelection] = useState<number | null>(null);

  // Get current items for active Erfassungstyp
  const items = itemsByErfassungstyp[erfassungstyp] || [];

  // Erfassungstypen
  const erfassungstypen = ['Bestellung', 'Projekt (Baustelle)', 'Lager', 'Ohne Bestellung'];

  // Get color for Erfassungstyp
  const getErfassungstypColor = (typ: string) => {
    switch (typ) {
      case 'Bestellung':
        return '#90CAF9';
      case 'Projekt (Baustelle)':
        return '#A5D6A7';
      case 'Lager':
        return '#FFF59D';
      case 'Ohne Bestellung':
        return '#FFCC80';
      default:
        return '#CCCCCC';
    }
  };

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
      console.error('Error loading wareneingaenge:', error);
      // Fallback to local database
      try {
        const localWareneingaenge = await databaseService.getWareneingaenge();
        setWareneingaenge(localWareneingaenge);
        setIsOnline(false);
      } catch (localError) {
        console.error('Error loading local wareneingaenge:', localError);
        Alert.alert('Fehler', 'Wareneingänge konnten nicht geladen werden.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  useFocusEffect(
    useCallback(() => {
      loadWareneingaenge();
      loadUserLagerort(); // Lagerort des Benutzers laden
    }, [])
  );

  // Helper function to update items for current Erfassungstyp
  const updateItemsForCurrentTyp = (updater: (prev: WareneingangItem[]) => WareneingangItem[]) => {
    setItemsByErfassungstyp(prev => ({
      ...prev,
      [erfassungstyp]: updater(prev[erfassungstyp] || [])
    }));
  };

  // Reset search query when Erfassungstyp changes
  useEffect(() => {
    setProductSearchQuery('');
    setCurrentItemIndexForProductSelection(null);
  }, [erfassungstyp]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWareneingaenge();
  };


  // Scanner functions - Temporäre Mock-Implementierung
  const requestCameraPermission = async () => {
    // Temporäre Mock-Implementierung
    return true;
  };

  const openScanner = async () => {
    try {
      // Load all available products
      const products = await apiService.getProducts();
      
      if (products.length === 0) {
        Alert.alert('Keine Produkte', 'Es sind keine Produkte verfügbar.');
        return;
      }

      // Create action buttons for each product
      const productActions = products.map(product => ({
        text: `${product.name} (${product.sku})`,
        onPress: () => setArtikelnummer(product.sku),
      }));

      // Add cancel button
      productActions.push({
        text: 'Abbrechen',
        style: 'cancel' as const,
      });

      Alert.alert(
        'Produkt auswählen',
        'Wählen Sie ein Produkt aus der Liste:',
        productActions
      );
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Fehler', 'Produkte konnten nicht geladen werden.');
    }
  };

  const openSupplierSearch = async () => {
    setSupplierName('');
    setSupplierModalVisible(true);
  };

  const handleSupplierSearch = async () => {
    if (supplierName.trim()) {
      setSupplierModalVisible(false);
      await searchOrdersBySupplier(supplierName.trim());
    }
  };

  const searchOrdersBySupplier = async (supplierName: string) => {
    try {
      // Simulate API call to search orders by supplier
      // In a real app, this would call an API endpoint
      const mockOrders = [
        { id: 'ORD-001', supplier: supplierName, date: '2024-01-15', status: 'Offen' },
        { id: 'ORD-002', supplier: supplierName, date: '2024-01-14', status: 'Teilweise geliefert' },
        { id: 'ORD-003', supplier: supplierName, date: '2024-01-13', status: 'Offen' },
      ];

      if (mockOrders.length === 0) {
        Alert.alert('Keine Bestellungen', `Keine Bestellungen für Lieferant "${supplierName}" gefunden.`);
        return;
      }

      // Set orders and show modal
      setOrders(mockOrders);
      setOrdersModalVisible(true);
    } catch (error) {
      console.error('Error searching orders:', error);
      Alert.alert('Fehler', 'Bestellungen konnten nicht geladen werden.');
    }
  };

  const selectOrder = (orderId: string) => {
    setBestellungsnummer(orderId);
    setOrdersModalVisible(false);
  };

  // Body area functions
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
    // If we're selecting for a specific item in the list
    if (currentItemIndexForProductSelection !== null) {
      updateItemsForCurrentTyp((prevItems) => {
        const newItems = [...prevItems];
        newItems[currentItemIndexForProductSelection].selectedProduct = product;
        newItems[currentItemIndexForProductSelection].artikelnummer = product.sku || '';
        newItems[currentItemIndexForProductSelection].selectedUnit = product.unit || 'Stück';
        return newItems;
      });
      setCurrentItemIndexForProductSelection(null);
    }
    
    setProductsModalVisible(false);
  };

  // Add new item to the list
  const addNewItem = useCallback(() => {
    const newItem: WareneingangItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      artikelnummer: '',
      anzahl: '0',
      selectedProduct: null,
      selectedUnit: 'Stück',
    };
    updateItemsForCurrentTyp((prev) => [...prev, newItem]);
  }, [erfassungstyp]);

  // Save item function
  const handleSaveItem = async (itemIndex: number) => {
    const currentItems = itemsByErfassungstyp[erfassungstyp] || [];
    const item = currentItems[itemIndex];
    if (!item) {
      return;
    }

    if (!item.selectedProduct) {
      Alert.alert('Hinweis', `Bitte wählen Sie zuerst einen Artikel für Position ${itemIndex + 1} aus.`);
      return;
    }

    const quantityValue = parseFloat(item.anzahl.replace(',', '.')) || 0;
    if (quantityValue < 0) {
      Alert.alert('Hinweis', `Die Anzahl darf nicht negativ sein für Position ${itemIndex + 1}.`);
      return;
    }

    try {
      // Markiere das Item als gespeichert
      updateItemsForCurrentTyp((prevItems) => {
        const newItems = [...prevItems];
        newItems[itemIndex].isSaved = true;
        return newItems;
      });
      
      Alert.alert('Erfolg', `Artikel "${item.selectedProduct.name}" wurde gespeichert.`);
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Fehler', 'Artikel konnte nicht gespeichert werden.');
    }
  };

  // Render item forms
  const renderItemForms = () => {
    if (items.length === 0) {
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

    return items.map((item, index) => {
      const quantityValue = parseFloat(item.anzahl.replace(',', '.')) || 0;

      return (
        <Card key={item.id} style={styles.itemFormCard}>
          <Card.Content>
            <View style={styles.itemHeader}>
              <Title style={styles.itemTitle}>
                {item.selectedProduct?.name || `Artikel ${index + 1}`}
              </Title>
              <View style={styles.itemHeaderButtons}>
                {item.isSaved ? (
                  <Chip 
                    mode="flat" 
                    icon="check-circle" 
                    style={styles.savedChip}
                    textStyle={styles.savedChipText}
                  >
                    Gespeichert
                  </Chip>
                ) : (
                  <IconButton
                    icon="content-save"
                    size={24}
                    iconColor={
                      quantityValue <= 0 || !item.selectedProduct
                        ? '#9e9e9e'
                        : BRAND_DARK_BLUE
                    }
                    disabled={quantityValue <= 0 || !item.selectedProduct}
                    onPress={() => handleSaveItem(index)}
                    style={styles.iconButton}
                  />
                )}
                <IconButton
                  icon="close"
                  size={24}
                  iconColor="#d32f2f"
                  onPress={() => {
                    Alert.alert(
                      'Artikel löschen',
                      `Möchten Sie wirklich "${item.selectedProduct?.name || `Artikel ${index + 1}`}" löschen?`,
                      [
                        { text: 'Abbrechen', style: 'cancel' },
                        {
                          text: 'Löschen',
                          style: 'destructive',
                          onPress: () => {
                            updateItemsForCurrentTyp((prev) => prev.filter((_, i) => i !== index));
                          },
                        },
                      ]
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
                    updateItemsForCurrentTyp((prevItems) => {
                      const newItems = [...prevItems];
                      newItems[index].artikelnummer = text;
                      return newItems;
                    });
                  }}
                  placeholder="z.B. DELL-XPS13-001"
                  mode="outlined"
                  dense
                  autoCapitalize="characters"
                />
                <IconButton
                  icon="magnify"
                  size={20}
                  iconColor={BRAND_DARK_BLUE}
                  onPress={async () => {
                    try {
                      if (allProducts.length === 0) {
                        await loadAllProducts();
                      }
                      setCurrentItemIndexForProductSelection(index);
                      setProductsModalVisible(true);
                    } catch (error) {
                      console.error('Error loading products:', error);
                    }
                  }}
                  style={styles.iconButton}
                />
              </View>
            </View>

            {/* Anzahl und Einheit - nebeneinander */}
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
                        updateItemsForCurrentTyp((prevItems) => {
                          const newItems = [...prevItems];
                          const current = parseFloat(newItems[index].anzahl.replace(',', '.')) || 0;
                          const newValue = Math.max(0, current - 1);
                          newItems[index].anzahl = Math.round(newValue).toString();
                          return newItems;
                        });
                      }}
                      style={styles.quantityButton}
                      iconColor="white"
                    />
                    <TextInput
                      style={styles.quantityInput}
                      value={item.anzahl}
                      onChangeText={(text) => {
                        updateItemsForCurrentTyp((prevItems) => {
                          const newItems = [...prevItems];
                          const numericValue = parseFloat(text.replace(',', '.')) || 0;
                          const clampedValue = Math.max(0, numericValue);
                          newItems[index].anzahl = Math.round(clampedValue).toString();
                          return newItems;
                        });
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
                        updateItemsForCurrentTyp((prevItems) => {
                          const newItems = [...prevItems];
                          const current = parseFloat(newItems[index].anzahl.replace(',', '.')) || 0;
                          const newValue = current + 1;
                          newItems[index].anzahl = Math.round(newValue).toString();
                          return newItems;
                        });
                      }}
                      style={styles.quantityButton}
                      iconColor="white"
                    />
                  </View>
                </View>

                {/* Einheit Spalte - nur anzeigen wenn Produkt ausgewählt */}
                {item.selectedProduct && (
                  <View style={styles.columnContainer}>
                    <Paragraph style={styles.fieldLabel}>Einheit:</Paragraph>
                    <TextInput
                      style={styles.textInput}
                      value={item.selectedUnit || item.selectedProduct?.unit || 'Stück'}
                      editable={false}
                      mode="outlined"
                      dense
                    />
                  </View>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    });
  };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productListItem}
      onPress={() => selectProduct(item)}
    >
      <View style={styles.productListItemContent}>
        <Paragraph style={styles.productListItemName}>{item.name}</Paragraph>
        <Paragraph style={styles.productListItemSku}>SKU: {item.sku}</Paragraph>
        {item.description && (
          <Paragraph style={styles.productListItemDescription} numberOfLines={2}>
            {item.description}
      </Paragraph>
        )}
        <View style={styles.productListItemDetails}>
          <Paragraph style={styles.productListItemPrice}>
            Preis: €{item.price.toFixed(2)}
          </Paragraph>
          <Paragraph style={styles.productListItemStock}>
            Bestand: {item.stockQuantity} {item.unit || 'Stück'}
          </Paragraph>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const renderOrder = ({ item }: { item: any }) => (
    <Card style={styles.wareneingangCard}>
      <Card.Content>
        <Title>{item.id}</Title>
        <View style={styles.infoRow}>
          <Paragraph style={styles.label}>Lieferant:</Paragraph>
          <Paragraph style={styles.value}>{item.supplier}</Paragraph>
        </View>
        <View style={styles.infoRow}>
          <Paragraph style={styles.label}>Datum:</Paragraph>
          <Paragraph style={styles.value}>{item.date}</Paragraph>
        </View>
        <View style={styles.infoRow}>
          <Paragraph style={styles.label}>Status:</Paragraph>
          <View style={styles.chipContainer}>
            <Chip mode="outlined" style={styles.statusChip}>
              {item.status}
            </Chip>
          </View>
        </View>
        <TouchableOpacity
          style={styles.selectOrderButton}
          onPress={() => selectOrder(item.id)}
        >
          <Button mode="contained" style={styles.selectButton}>
            Auswählen
          </Button>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  const incrementAnzahl = () => {
    setAnzahl(prev => prev + 1);
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
    } else if (text === '') {
      setAnzahl(1);
    }
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

      const wareneingangData: Wareneingang = {
        id: Date.now(), // Temporary ID for local storage
        productId: product.id,
        productName: product.name,
        quantity: anzahl,
        unitPrice: product.price,
        totalPrice: product.price * anzahl,
        supplier: '',
        batchNumber: '',
        notes: `Erfassungstyp: ${erfassungstyp}${lagerort ? `, Lagerort: ${lagerort}` : ''}${bestellungsnummer ? `, Bestellungsnummer: ${bestellungsnummer}` : ''}`,
        createdAt: new Date().toISOString(),
      };

      const isAuthenticated = await apiService.isAuthenticated();
      if (isAuthenticated && isOnline) {
        // Create API request object
        const apiRequest = {
          productId: wareneingangData.productId,
          quantity: wareneingangData.quantity,
          unitPrice: wareneingangData.unitPrice,
          supplier: wareneingangData.supplier,
          batchNumber: wareneingangData.batchNumber,
          notes: wareneingangData.notes,
        };
        const createdWareneingang = await apiService.createWareneingang(apiRequest);
        // Save to local database
        await databaseService.saveWareneingang(createdWareneingang);
      } else {
        // Save directly to local database
        await databaseService.saveWareneingang(wareneingangData, true);
      }

      Alert.alert('Erfolg', 'Wareneingang wurde erfolgreich gebucht!');
      
      // Reset form
      setBestellungsnummer('');
      setArtikelnummer('');
      setAnzahl(1);
      setLagerort('');
      setErfassungstyp('Bestellung');
      
      // Reload data to show in history
      await loadWareneingaenge();
    } catch (error) {
      console.error('Error creating wareneingang:', error);
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

  const renderWareneingang = ({ item }: { item: Wareneingang }) => (
    <Card style={styles.wareneingangCard}>
      <Card.Content>
        <Title>{item.productName}</Title>
        <View style={styles.infoRow}>
          <Paragraph style={styles.label}>Menge:</Paragraph>
          <Chip mode="outlined" style={styles.chip}>
            {item.quantity}
          </Chip>
        </View>
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
            <Paragraph style={styles.value}>{item.supplier}</Paragraph>
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
              {item.notes.replace('Lagerort: ', '').split(',')[0]}
            </Paragraph>
          </View>
        )}
        {item.notes && item.notes.includes('Bestellungsnummer:') && (
          <View style={styles.infoRow}>
            <Paragraph style={styles.label}>Bestellungsnummer:</Paragraph>
            <Paragraph style={styles.value}>
              {item.notes.split('Bestellungsnummer: ')[1]}
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_DARK_BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={[styles.header, { backgroundColor: getErfassungstypColor(erfassungstyp) }]}>
        <Title style={styles.headerTitle}>Wareneingang buchen</Title>
        {!isOnline && (
          <Chip mode="outlined" icon="wifi-off" style={styles.offlineChip}>
            Offline-Modus
          </Chip>
        )}
      </Surface>

      {/* Sticky Search/Filter/Add Bar - immer sichtbar wenn Artikel vorhanden */}
      {items.length > 0 && (
        <View style={styles.stickyBar}>
          <View style={styles.stickyBarContainer}>
            <TextInput
              style={styles.searchInput}
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
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
                // Filter functionality can be added here
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

      {/* Gesamter Inhalt scrollbar - Kopfbereich + Body-Bereich */}
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Kopfbereich - vollständig sichtbar, nicht scrollbar */}
        <View style={styles.formContainer}>
        {/* Formular */}
        <Card style={styles.formCard}>
          <Card.Content>
            {/* Erfassungstyp Dropdown */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Erfassungstyp:</Paragraph>
                <TouchableOpacity
                  style={styles.dropdownButton}
                onPress={() => setErfassungstypModalVisible(true)}
              >
                <Paragraph
                  style={[
                    styles.dropdownText,
                    erfassungstyp ? styles.dropdownTextSelected : null,
                  ]}
                >
                  {erfassungstyp || 'Erfassungstyp wählen'}
                </Paragraph>
                  <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
                </TouchableOpacity>
            </View>

            {/* Referenz (Bestellungsnummer) - nur bei Bestellung */}
            {erfassungstyp === 'Bestellung' && (
              <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Referenz (Bestellungsnummer):</Paragraph>
                <TextInput
                  style={styles.textInput}
                  value={bestellungsnummer}
                  onChangeText={setBestellungsnummer}
                  placeholder="z.B. ORD-001"
                  mode="outlined"
                  dense
                  autoCapitalize="characters"
                  autoCorrect={false}
                  keyboardType="default"
                  returnKeyType="done"
                />
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
                  placeholder="z.B. Köln Lager S03"
                  mode="outlined"
                  dense
                  autoCapitalize="words"
                  autoCorrect={true}
                  textContentType="location"
                  keyboardType="default"
                  returnKeyType="done"
                  editable={userLocations.length === 0}
                />
              )}
            </View>

            {/* Lieferant */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Lieferant:</Paragraph>
              <TextInput
                style={styles.textInput}
                value={lieferant}
                onChangeText={setLieferant}
                placeholder="z.B. Lieferant Name"
                mode="outlined"
                dense
                autoCapitalize="words"
                autoCorrect={true}
                keyboardType="default"
                returnKeyType="done"
              />
            </View>

          </Card.Content>
        </Card>
      </View>

        {/* Bodybereich - scrollbar */}
        <Card style={styles.bodyCard}>
          <Card.Content>
            {/* Titel mit Erfassungstyp - nur anzeigen wenn Artikel vorhanden */}
            {items.length > 0 && erfassungstyp && (
              <View style={styles.bodyTitleContainer}>
                <Title style={styles.bodyTitle}>
                  {erfassungstyp}
                </Title>
              </View>
            )}
            {/* Artikel-Liste */}
            {renderItemForms()}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Supplier Search Modal */}
      <Modal
        visible={supplierModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSupplierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Lieferant suchen</Title>
            <Paragraph style={styles.modalSubtitle}>
              Geben Sie den Namen des Lieferanten ein:
            </Paragraph>
            
            <TextInput
              style={styles.modalInput}
              value={supplierName}
              onChangeText={setSupplierName}
              placeholder="z.B. Apple, Dell, Samsung"
              mode="outlined"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSupplierSearch}
            />
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setSupplierModalVisible(false)}
                style={styles.modalButton}
              >
                Abbrechen
              </Button>
              <Button
                mode="contained"
                onPress={handleSupplierSearch}
                style={styles.modalButton}
                disabled={!supplierName.trim()}
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
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrdersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ordersModalContent}>
            <Title style={styles.modalTitle}>Offene Bestellungen</Title>
            <Paragraph style={styles.modalSubtitle}>
              Wählen Sie eine Bestellung aus:
            </Paragraph>
            
            <View style={styles.ordersListContainer}>
              <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                style={styles.ordersList}
                showsVerticalScrollIndicator={false}
              />
            </View>
            
            <View style={styles.ordersModalFooter}>
              <Button
                mode="outlined"
                onPress={() => setOrdersModalVisible(false)}
                style={styles.cancelButton}
              >
                Abbrechen
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Erfassungstyp Selection Dialog */}
      <Portal>
        <Dialog visible={erfassungstypModalVisible} onDismiss={() => setErfassungstypModalVisible(false)}>
          <Dialog.Title>Erfassungstyp wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => {
                setErfassungstyp(value);
                setErfassungstypModalVisible(false);
              }}
              value={erfassungstyp}
            >
              {erfassungstypen.map((typ) => (
                <TouchableOpacity
                  key={typ}
                  style={[
                    styles.erfassungstypOption,
                    erfassungstyp === typ && styles.selectedErfassungstypOption,
                  ]}
                  onPress={() => {
                    setErfassungstyp(typ);
                    setErfassungstypModalVisible(false);
                  }}
                >
                  <View style={styles.erfassungstypLabelContainer}>
                    <View
                      style={[
                        styles.erfassungstypColorDot,
                        { backgroundColor: getErfassungstypColor(typ) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.erfassungstypLabelText,
                        erfassungstyp === typ && styles.selectedErfassungstypLabelText,
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

      {/* Produktauswahl Modal */}
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
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              style={styles.fullScreenProductsList}
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
    backgroundColor: '#90CAF9', // Default color (Bestellung), will be overridden dynamically
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
  mainScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  formContainer: {
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
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
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
    marginHorizontal: 4,
    backgroundColor: 'white',
  },
  artikelnummerInput: {
    flex: 1,
    minWidth: 200,
    backgroundColor: 'white',
  },
  iconButton: {
    margin: 0,
    padding: 2,
    width: 36,
    height: 36,
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
  erfassungstypOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedErfassungstypOption: {
    backgroundColor: BRAND_LIGHT_BLUE + '20',
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
    marginRight: 12,
  },
  erfassungstypLabelText: {
    fontSize: 16,
    color: '#333',
  },
  selectedErfassungstypLabelText: {
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  dropdownTextSelected: {
    color: BRAND_DARK_BLUE,
    fontWeight: '500',
  },
  // Sticky Bar Styles
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
  // Body-Bereich Styles
  bodyCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  bodyTitleContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bodyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    borderRadius: 8,
  },
  itemFormCard: {
    marginBottom: 16,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
    flex: 1,
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
  savedChip: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  savedChipText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
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
    color: '#666',
    marginBottom: 4,
  },
  productListItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productListItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productListItemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  productListItemStock: {
    fontSize: 14,
    color: '#333',
  },
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fullScreenModalHeader: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
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
  },
  fullScreenModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalSearchbar: {
    marginTop: 16,
    elevation: 0,
  },
  fullScreenModalContent: {
    flex: 1,
    padding: 16,
  },
  fullScreenProductsList: {
    flex: 1,
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
  },
});

export default WareneingaengeScreen;
