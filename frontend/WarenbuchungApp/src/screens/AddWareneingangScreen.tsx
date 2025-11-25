/**
 * AddWareneingangScreen.tsx
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  ActivityIndicator,
  Surface,
  Chip,
  IconButton,
  Paragraph,
  Dialog,
  Portal,
  RadioButton,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { databaseService } from '../services/database';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { Product, OrderSummary } from '../types';

interface WareneingangItem {
  id: string;
  product: Product | null;
  artikelnummer: string;
  anzahl: string;
  chargennummer: string;
  verfallsdatum: string;
  notizen: string;
}

const AddWareneingangScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Kopfbereich Felder
  const [erfassungstyp, setErfassungstyp] = useState('Bestellung');
  const [referenz, setReferenz] = useState('');
  const [lageort, setLageort] = useState('Lager S03');
  const [lieferant, setLieferant] = useState('');
  const [erfassungstypDialogVisible, setErfassungstypDialogVisible] = useState(false);
  
  // Bestellungssuche
  const [orderSearching, setOrderSearching] = useState(false);
  const [orderSearchResults, setOrderSearchResults] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [orderSearchDialogVisible, setOrderSearchDialogVisible] = useState(false);
  
  // Bodybereich - Liste von Artikeln
  const [items, setItems] = useState<WareneingangItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [currentArtikelnummer, setCurrentArtikelnummer] = useState('');
  const [currentSearching, setCurrentSearching] = useState(false);
  
  // Erfassungstypen
  const erfassungstypen = ['Bestellung', 'Projekt (Baustelle)', 'Lager', 'Ohne Bestellung'];

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Debounced Bestellungssuche - nur wenn Erfassungstyp "Bestellung" ist
  useEffect(() => {
    if (!referenz.trim() || erfassungstyp !== 'Bestellung' || selectedOrder) {
      setOrderSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchOrder(referenz);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenz, erfassungstyp, selectedOrder]);

  const loadProducts = async () => {
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated) {
        const apiProducts = await apiService.getProducts();
        setProducts(apiProducts);
      } else {
        const localProducts = await databaseService.getProducts();
        setProducts(localProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      const localProducts = await databaseService.getProducts();
      setProducts(localProducts);
    }
  };

  const searchProduct = async (artikelnummer: string, itemIndex: number) => {
    if (!artikelnummer.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Artikelnummer ein.');
      return;
    }

    setCurrentSearching(true);
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated) {
        // Search via API
        const searchResults = await apiService.searchProducts(artikelnummer);
        
        if (searchResults.length > 0) {
          const product = searchResults[0];
          updateItem(itemIndex, { product, artikelnummer });
          // Auto-fill supplier if available
          if (product.defaultSupplier && !lieferant) {
            setLieferant(product.defaultSupplier);
          }
        } else {
          Alert.alert('Nicht gefunden', 'Kein Produkt mit dieser Artikelnummer gefunden.');
          updateItem(itemIndex, { product: null });
        }
      } else {
        // Search locally
        const product = products.find(p => 
          p.sku.toLowerCase().includes(artikelnummer.toLowerCase()) ||
          p.name.toLowerCase().includes(artikelnummer.toLowerCase())
        );
        
        if (product) {
          updateItem(itemIndex, { product, artikelnummer });
          // Auto-fill supplier if available
          if (product.defaultSupplier && !lieferant) {
            setLieferant(product.defaultSupplier);
          }
        } else {
          Alert.alert('Nicht gefunden', 'Kein Produkt mit dieser Artikelnummer gefunden.');
          updateItem(itemIndex, { product: null });
        }
      }
    } catch (error) {
      console.error('Error searching product:', error);
      Alert.alert('Fehler', 'Fehler bei der Produktsuche.');
    } finally {
      setCurrentSearching(false);
    }
  };

  const addNewItem = () => {
    const newItem: WareneingangItem = {
      id: Date.now().toString(),
      product: null,
      artikelnummer: '',
      anzahl: '1',
      chargennummer: '',
      verfallsdatum: '',
      notizen: '',
    };
    setItems([...items, newItem]);
    setCurrentItemIndex(items.length);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (currentItemIndex === index) {
      setCurrentItemIndex(null);
    } else if (currentItemIndex !== null && currentItemIndex > index) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const updateItem = (index: number, updates: Partial<WareneingangItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, change: number) => {
    const item = items[index];
    const currentQuantity = parseInt(item.anzahl) || 0;
    const newQuantity = Math.max(1, currentQuantity + change);
    updateItem(index, { anzahl: newQuantity.toString() });
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert('Fehler', 'Bitte fügen Sie mindestens einen Artikel hinzu.');
      return;
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product) {
        Alert.alert('Fehler', `Bitte wählen Sie ein Produkt für Artikel ${i + 1} aus.`);
        return;
      }
      if (!item.anzahl || parseInt(item.anzahl) < 1) {
        Alert.alert('Fehler', `Bitte geben Sie eine gültige Anzahl für Artikel ${i + 1} ein.`);
        return;
      }
    }

    if (!lageort.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Lagerort ein.');
      return;
    }

    setLoading(true);
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      // Create all items
      for (const item of items) {
        if (!item.product) continue;
        
        if (isAuthenticated) {
          // Create via API
          const wareneingangData = {
            productId: item.product.id,
            quantity: parseInt(item.anzahl),
            unitPrice: item.product.price,
            erfassungstyp: erfassungstyp,
            referenz: referenz || null,
            location: lageort || null,
            supplier: lieferant || null,
            batchNumber: item.chargennummer || null,
            expiryDate: item.verfallsdatum ? new Date(item.verfallsdatum).toISOString() : null,
            notes: item.notizen || null,
          };

          await apiService.createWareneingang(wareneingangData);
        } else {
          // Create locally
          const wareneingangData = {
            productId: item.product.id,
            productName: item.product.name,
            quantity: parseInt(item.anzahl),
            unitPrice: item.product.price,
            totalPrice: item.product.price * parseInt(item.anzahl),
            erfassungstyp: erfassungstyp,
            referenz: referenz || null,
            location: lageort || null,
            supplier: lieferant || null,
            batchNumber: item.chargennummer || null,
            expiryDate: item.verfallsdatum ? new Date(item.verfallsdatum).toISOString() : null,
            notes: item.notizen || null,
            createdAt: new Date().toISOString(),
          };

          await databaseService.saveWareneingang(wareneingangData);
        }
      }

      Alert.alert(
        'Erfolg', 
        `${items.length} Wareneingang${items.length > 1 ? 'e' : ''} wurde${items.length > 1 ? 'n' : ''} erfolgreich erstellt!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating wareneingang:', error);
      Alert.alert('Fehler', 'Fehler beim Erstellen des Wareneingangs.');
    } finally {
      setLoading(false);
    }
  };

  const selectErfassungstyp = (typ: string) => {
    setErfassungstyp(typ);
    setErfassungstypDialogVisible(false);
    // Wenn Erfassungstyp nicht "Bestellung" ist, Bestellung und Lieferant zurücksetzen
    if (typ !== 'Bestellung') {
      setReferenz('');
      setSelectedOrder(null);
      setLieferant('');
    }
  };

  // Bestellung suchen
  const searchOrder = async (orderNumber: string) => {
    if (!orderNumber.trim() || erfassungstyp !== 'Bestellung') {
      setOrderSearchResults([]);
      return;
    }

    setOrderSearching(true);
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated) {
        const orders = await apiService.getOrders(orderNumber.trim());
        setOrderSearchResults(orders);
        
        // Wenn genau eine Bestellung gefunden wurde, automatisch auswählen
        if (orders.length === 1) {
          selectOrder(orders[0]);
        } else if (orders.length > 1) {
          // Mehrere Ergebnisse - Dialog anzeigen
          setOrderSearchDialogVisible(true);
        }
      } else {
        // Offline: Keine Bestellungssuche möglich
        setOrderSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching order:', error);
      setOrderSearchResults([]);
    } finally {
      setOrderSearching(false);
    }
  };

  // Bestellung auswählen
  const selectOrder = (order: OrderSummary) => {
    setSelectedOrder(order);
    setReferenz(order.orderNumber);
    setOrderSearchDialogVisible(false);
    
    // Automatisch den Lieferanten setzen (1:1 Beziehung - nur ein Lieferant pro Bestellung)
    if (order.supplier) {
      setLieferant(order.supplier);
    } else {
      setLieferant('');
    }
  };

  // Referenz ändern
  const handleReferenzChange = (text: string) => {
    setReferenz(text);
    
    // Wenn Referenz gelöscht oder geändert wird, Bestellung zurücksetzen
    if (!text.trim()) {
      setSelectedOrder(null);
      if (erfassungstyp === 'Bestellung') {
        setLieferant('');
      }
      setOrderSearchResults([]);
    } else if (selectedOrder && text.trim() !== selectedOrder.orderNumber) {
      // Wenn Referenz geändert wird und nicht mehr mit ausgewählter Bestellung übereinstimmt
      setSelectedOrder(null);
      if (erfassungstyp === 'Bestellung') {
        setLieferant('');
      }
      setOrderSearchResults([]);
    }
    // Die Suche wird durch useEffect mit Debounce ausgelöst
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Title style={styles.headerTitle}>Wareneingang buchen</Title>
            <View style={styles.logoContainer}>
              <Title style={styles.logoText}>POLYGON</Title>
            </View>
          </View>
        </Surface>

        {/* Kopfbereich */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Kopfbereich</Title>
            
            {/* Erfassungstyp */}
            <View style={styles.inputGroup}>
              <Title style={styles.inputLabel}>Erfassungstyp:</Title>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setErfassungstypDialogVisible(true)}
              >
                <Paragraph style={styles.dropdownText}>{erfassungstyp}</Paragraph>
                <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
              </TouchableOpacity>
            </View>

            {/* Referenz (Bestellnummer) */}
            <View style={styles.inputGroup}>
              <Title style={styles.inputLabel}>Referenz (Bestellnummer):</Title>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={referenz}
                  onChangeText={handleReferenzChange}
                  placeholder="z.B. PO-2025-001"
                  mode="outlined"
                  dense
                  editable={erfassungstyp === 'Bestellung'}
                />
                {erfassungstyp === 'Bestellung' && (
                  <IconButton
                    icon="magnify"
                    size={24}
                    iconColor={BRAND_LIGHT_BLUE}
                    onPress={() => searchOrder(referenz)}
                    disabled={orderSearching || !referenz.trim()}
                  />
                )}
              </View>
              {orderSearching && (
                <ActivityIndicator size="small" style={styles.searchIndicator} />
              )}
              {selectedOrder && (
                <Chip 
                  mode="outlined" 
                  style={styles.selectedOrderChip}
                  onClose={() => {
                    setReferenz('');
                    setSelectedOrder(null);
                    setLieferant('');
                  }}
                >
                  {selectedOrder.orderNumber} - {selectedOrder.supplier || 'Kein Lieferant'}
                </Chip>
              )}
            </View>

            {/* Lageort */}
            <View style={styles.inputGroup}>
              <Title style={styles.inputLabel}>Lageort:</Title>
              <TextInput
                style={styles.textInput}
                value={lageort}
                onChangeText={setLageort}
                placeholder="Lager S03"
                mode="outlined"
                dense
              />
            </View>

            {/* Lieferant */}
            <View style={styles.inputGroup}>
              <Title style={styles.inputLabel}>Lieferant:</Title>
              <TextInput
                style={styles.textInput}
                value={lieferant}
                onChangeText={setLieferant}
                placeholder="Lieferant Name"
                mode="outlined"
                dense
                editable={!selectedOrder || erfassungstyp !== 'Bestellung'}
                // Wenn Bestellung ausgewählt ist, Feld als read-only markieren
              />
              {selectedOrder && erfassungstyp === 'Bestellung' && (
                <Paragraph style={styles.infoText}>
                  Lieferant automatisch aus Bestellung übernommen
                </Paragraph>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Bodybereich */}
        <Card style={styles.bodyCard}>
          <Card.Content>
            <View style={styles.bodyHeader}>
              <Title style={styles.sectionTitle}>Artikel</Title>
              <Button
                mode="contained"
                icon="plus"
                onPress={addNewItem}
                style={styles.addButton}
                buttonColor={BRAND_LIGHT_BLUE}
              >
                Artikel hinzufügen
              </Button>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Paragraph style={styles.emptyStateText}>
                  Keine Artikel hinzugefügt. Klicken Sie auf "+ Artikel hinzufügen" um zu beginnen.
                </Paragraph>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={item.id} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Title style={styles.itemTitle}>Artikel {index + 1}</Title>
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#d32f2f"
                      onPress={() => removeItem(index)}
                    />
                  </View>

                  {/* Artikelnummer */}
                  <View style={styles.inputGroup}>
                    <Title style={styles.inputLabel}>Artikelnummer:</Title>
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        value={item.artikelnummer}
                        onChangeText={(text) => {
                          updateItem(index, { artikelnummer: text });
                        }}
                        placeholder="123456789"
                        mode="outlined"
                        dense
                      />
                      <IconButton
                        icon="barcode-scan"
                        size={24}
                        iconColor={BRAND_LIGHT_BLUE}
                        onPress={() => searchProduct(item.artikelnummer, index)}
                        disabled={currentSearching || !item.artikelnummer.trim()}
                      />
                    </View>
                  </View>

                  {/* Produkt Info */}
                  {item.product && (
                    <View style={styles.productInfo}>
                      <Chip mode="outlined" style={styles.productChip}>
                        {item.product.name}
                      </Chip>
                      <Chip mode="outlined" style={styles.priceChip}>
                        €{item.product.price.toFixed(2)}
                      </Chip>
                    </View>
                  )}

                  {/* Anzahl */}
                  <View style={styles.inputGroup}>
                    <Title style={styles.inputLabel}>Anzahl:</Title>
                    <View style={styles.quantityContainer}>
                      <Button
                        mode="contained"
                        onPress={() => handleQuantityChange(index, -1)}
                        style={styles.quantityButton}
                        disabled={parseInt(item.anzahl) <= 1}
                      >
                        -
                      </Button>
                      <TextInput
                        style={styles.quantityInput}
                        value={item.anzahl}
                        onChangeText={(text) => updateItem(index, { anzahl: text })}
                        keyboardType="numeric"
                        mode="outlined"
                        dense
                      />
                      <Button
                        mode="contained"
                        onPress={() => handleQuantityChange(index, 1)}
                        style={styles.quantityButton}
                      >
                        +
                      </Button>
                    </View>
                  </View>

                  {/* Chargennummer */}
                  <View style={styles.inputGroup}>
                    <Title style={styles.inputLabel}>Chargennummer (optional):</Title>
                    <TextInput
                      style={styles.textInput}
                      value={item.chargennummer}
                      onChangeText={(text) => updateItem(index, { chargennummer: text })}
                      placeholder="Chargennummer"
                      mode="outlined"
                      dense
                    />
                  </View>

                  {/* Verfallsdatum */}
                  <View style={styles.inputGroup}>
                    <Title style={styles.inputLabel}>Verfallsdatum (optional):</Title>
                    <TextInput
                      style={styles.textInput}
                      value={item.verfallsdatum}
                      onChangeText={(text) => updateItem(index, { verfallsdatum: text })}
                      placeholder="YYYY-MM-DD"
                      mode="outlined"
                      dense
                    />
                  </View>

                  {/* Notizen */}
                  <View style={styles.inputGroup}>
                    <Title style={styles.inputLabel}>Notizen (optional):</Title>
                    <TextInput
                      style={styles.textInput}
                      value={item.notizen}
                      onChangeText={(text) => updateItem(index, { notizen: text })}
                      placeholder="Notizen"
                      mode="outlined"
                      dense
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  {index < items.length - 1 && <Divider style={styles.itemDivider} />}
                </View>
              ))
            )}

            {/* Submit Button */}
            {items.length > 0 && (
              <View style={styles.submitContainer}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  disabled={loading}
                  loading={loading}
                >
                  {items.length} Artikel buchen
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Erfassungstyp Dialog */}
      <Portal>
        <Dialog visible={erfassungstypDialogVisible} onDismiss={() => setErfassungstypDialogVisible(false)}>
          <Dialog.Title>Erfassungstyp wählen</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={selectErfassungstyp} value={erfassungstyp}>
              {erfassungstypen.map((typ) => (
                <RadioButton.Item key={typ} label={typ} value={typ} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErfassungstypDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Bestellungssuche Dialog */}
      <Portal>
        <Dialog 
          visible={orderSearchDialogVisible} 
          onDismiss={() => setOrderSearchDialogVisible(false)}
        >
          <Dialog.Title>Bestellung auswählen</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.orderSearchResults}>
              {orderSearchResults.length === 0 ? (
                <Paragraph>Keine Bestellungen gefunden</Paragraph>
              ) : (
                orderSearchResults.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderResultItem}
                    onPress={() => selectOrder(order)}
                  >
                    <Paragraph style={styles.orderResultText}>
                      {order.orderNumber}
                    </Paragraph>
                    {order.supplier && (
                      <Paragraph style={styles.orderResultSupplier}>
                        Lieferant: {order.supplier}
                      </Paragraph>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOrderSearchDialogVisible(false)}>Schließen</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoContainer: {
    position: 'absolute',
    right: 16,
  },
  logoText: {
    color: BRAND_LIGHT_BLUE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerCard: {
    elevation: 2,
    marginBottom: 16,
  },
  bodyCard: {
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    marginTop: 8,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  productChip: {
    backgroundColor: '#e3f2fd',
  },
  priceChip: {
    backgroundColor: '#e8f5e8',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  quantityInput: {
    width: 80,
    marginHorizontal: 16,
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    paddingVertical: 8,
  },
  searchIndicator: {
    marginTop: 8,
  },
  selectedOrderChip: {
    marginTop: 8,
    backgroundColor: '#e3f2fd',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  orderSearchResults: {
    maxHeight: 300,
  },
  orderResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderResultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  orderResultSupplier: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default AddWareneingangScreen;
