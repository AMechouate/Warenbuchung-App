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
  const [submitting, setSubmitting] = useState(false);
  const [erfassungstyp, setErfassungstyp] = useState('Bestellung');
  
  // Modal states
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [erfassungstypModalVisible, setErfassungstypModalVisible] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadWareneingaenge();
    }, [])
  );

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

  const selectErfassungstyp = (typ: string) => {
    setErfassungstyp(typ);
    setErfassungstypModalVisible(false);
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
      <Surface style={styles.header}>
        <Title style={styles.headerTitle}>Wareneingang buchen</Title>
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
            {/* Erfassungstyp Dropdown */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Erfassungstyp:</Paragraph>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    const actions = erfassungstypen.map(typ => ({
                      text: typ,
                      onPress: () => setErfassungstyp(typ),
                    }));
                    actions.push({
                      text: 'Abbrechen',
                      style: 'cancel' as const,
                    });
                    Alert.alert('Erfassungstyp wählen', 'Wählen Sie einen Erfassungstyp:', actions);
                  }}
                >
                  <Paragraph style={styles.dropdownText}>{erfassungstyp}</Paragraph>
                  <IconButton icon="chevron-down" size={20} iconColor={BRAND_DARK_BLUE} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bestellungsnummer - nur bei Bestellung */}
            {erfassungstyp === 'Bestellung' && (
              <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Bestellungsnummer:</Paragraph>
              <View style={styles.inputContainer}>
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
                <IconButton
                  icon="magnify"
                  size={24}
                  iconColor={BRAND_LIGHT_BLUE}
                  onPress={openSupplierSearch}
                  style={styles.scanButton}
                />
              </View>
            </View>
            )}

            {/* Artikelnummer */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Artikelnummer:</Paragraph>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={artikelnummer}
                  onChangeText={setArtikelnummer}
                  placeholder="z.B. DELL-XPS13-001"
                  mode="outlined"
                  dense
                  autoCapitalize="characters"
                  autoCorrect={false}
                  keyboardType="default"
                  returnKeyType="done"
                />
                <Button
                  mode="contained"
                  icon="barcode"
                  onPress={openScanner}
                  style={styles.barcodeButton}
                  labelStyle={styles.barcodeButtonLabel}
                >
                  Scan
                </Button>
              </View>
            </View>

            {/* Anzahl */}
            <View style={styles.formField}>
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
            </View>

            {/* Lagerort */}
            <View style={styles.formField}>
              <Paragraph style={styles.fieldLabel}>Lagerort:</Paragraph>
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
              />
            </View>

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
            <Title style={styles.historyTitle}>Letzte Wareneingänge</Title>
            {wareneingaenge.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                Noch keine Wareneingänge vorhanden.
              </Paragraph>
            ) : (
              <FlatList
                data={wareneingaenge.slice(0, 5)} // Show only last 5
                renderItem={renderWareneingang}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            )}
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
    marginHorizontal: 16,
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
  historyCard: {
    elevation: 2,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
});

export default WareneingaengeScreen;
