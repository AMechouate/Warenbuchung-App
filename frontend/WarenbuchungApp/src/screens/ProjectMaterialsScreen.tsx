/**
 * ProjectMaterialsScreen.tsx
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Surface,
  Button,
  IconButton,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { apiService } from '../services/api';
import { Product } from '../types';

// Global storage for booking history (simple in-memory solution)
const globalBookingHistory: { [key: string]: Booking[] } = {};

// Types
interface Project {
  id: number;
  name: string;
  description: string;
  status: 'Aktiv' | 'Pausiert' | 'Abgeschlossen';
  startDate: string;
  endDate: string;
}

interface Booking {
  id: number;
  itemId: number;
  itemType: 'material' | 'device';
  quantity: number;
  unit: string;
  timestamp: string;
}

interface Material {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  supplier?: string;
  assignedDate: string;
  lastBooking?: Booking;
  bookingHistory?: Booking[];
}

interface Device {
  id: number;
  name: string;
  type: string;
  location?: string;
  assignedDate: string;
  quantity: number;
  lastBooking?: Booking;
  bookingHistory?: Booking[];
}

type RootStackParamList = {
  ProjectMaterials: { project: Project };
};

type ProjectMaterialsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ProjectMaterials'>;
  route: RouteProp<RootStackParamList, 'ProjectMaterials'>;
};

const ProjectMaterialsScreen: React.FC<ProjectMaterialsScreenProps> = ({
  navigation,
  route,
}) => {
  const { project } = route.params;
  const [materials, setMaterials] = useState<Material[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<('alle' | 'materialien' | 'geräte' | 'filter3' | 'filter4')[]>(['alle']);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<('alle' | 'materialien' | 'geräte' | 'filter3' | 'filter4')[]>(['alle']);

  const showFilterOptions = () => {
    setFilterModalVisible(true);
  };

  const toggleFilter = (filterValue: 'alle' | 'materialien' | 'geräte' | 'filter3' | 'filter4') => {
    if (filterValue === 'alle') {
      // If "alle" is selected, clear all other filters
      setFilter(['alle']);
    } else {
      // Remove "alle" if it exists and toggle the selected filter
      const newFilter = filter.filter(f => f !== 'alle');
      if (newFilter.includes(filterValue)) {
        // Remove the filter if it's already selected
        const updatedFilter = newFilter.filter(f => f !== filterValue);
        // If no filters are selected, default to "alle"
        setFilter(updatedFilter.length > 0 ? updatedFilter : ['alle']);
      } else {
        // Add the filter
        setFilter([...newFilter, filterValue]);
      }
    }
  };

  const applyFilter = () => {
    setAppliedFilter([...filter]);
    setFilterModalVisible(false);
  };

  // Mock data - in einer echten App würde das von der API kommen
  const mockMaterials: Material[] = [
    {
      id: 1,
      name: 'Stahlträger 200x100',
      quantity: 0,
      unit: 'Stück',
      supplier: 'Stahlbau GmbH',
      assignedDate: '2025-01-20',
      bookingHistory: [
        {
          id: 1,
          itemId: 1,
          itemType: 'material',
          quantity: 5,
          unit: 'Stück',
          timestamp: '2025-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          itemId: 1,
          itemType: 'material',
          quantity: 3,
          unit: 'Stück',
          timestamp: '2025-01-14T14:20:00.000Z',
        },
        {
          id: 3,
          itemId: 1,
          itemType: 'material',
          quantity: 8,
          unit: 'Stück',
          timestamp: '2025-01-13T09:15:00.000Z',
        },
      ],
    },
    {
      id: 2,
      name: 'Beton C25/30',
      quantity: 0,
      unit: 'm³',
      supplier: 'Betonwerk Müller',
      assignedDate: '2025-01-22',
      bookingHistory: [
        {
          id: 4,
          itemId: 2,
          itemType: 'material',
          quantity: 12,
          unit: 'm³',
          timestamp: '2025-01-16T11:45:00.000Z',
        },
        {
          id: 5,
          itemId: 2,
          itemType: 'material',
          quantity: 7,
          unit: 'm³',
          timestamp: '2025-01-15T16:30:00.000Z',
        },
      ],
    },
    {
      id: 3,
      name: 'Dämmstoff',
      quantity: 0,
      unit: 'm²',
      supplier: 'Dämmstoff AG',
      assignedDate: '2025-01-18',
      bookingHistory: [
        {
          id: 11,
          itemId: 3,
          itemType: 'material',
          quantity: 20,
          unit: 'm²',
          timestamp: '2025-01-17T08:20:00.000Z',
        },
      ],
    },
    {
      id: 4,
      name: 'Elektrokabel NYM-J 3x2.5',
      quantity: 0,
      unit: 'm',
      supplier: 'Elektro Handel',
      assignedDate: '2025-01-25',
      bookingHistory: [],
    },
    {
      id: 5,
      name: 'Zement',
      quantity: 0,
      unit: 't',
      supplier: 'Baustoffe Müller',
      assignedDate: '2025-01-28',
      bookingHistory: [
        {
          id: 12,
          itemId: 5,
          itemType: 'material',
          quantity: 2,
          unit: 't',
          timestamp: '2025-01-18T13:15:00.000Z',
        },
        {
          id: 13,
          itemId: 5,
          itemType: 'material',
          quantity: 1,
          unit: 't',
          timestamp: '2025-01-17T15:30:00.000Z',
        },
      ],
    },
  ];

  const mockDevices: Device[] = [
    {
      id: 1,
      name: 'Kran Liebherr LTM 1060',
      type: 'Mobilkran',
      location: 'Baustelle A',
      assignedDate: '2025-01-15',
      quantity: 0,
      bookingHistory: [
        {
          id: 9,
          itemId: 1,
          itemType: 'device',
          quantity: 1,
          unit: 'Stück',
          timestamp: '2025-01-19T08:30:00.000Z',
        },
        {
          id: 10,
          itemId: 1,
          itemType: 'device',
          quantity: 1,
          unit: 'Stück',
          timestamp: '2025-01-18T14:15:00.000Z',
        },
      ],
    },
    {
      id: 2,
      name: 'Bagger CAT 320',
      type: 'Bagger',
      location: 'Gerätepark',
      assignedDate: '2025-01-20',
      quantity: 0,
      bookingHistory: [
        {
          id: 14,
          itemId: 2,
          itemType: 'device',
          quantity: 1,
          unit: 'Stück',
          timestamp: '2025-01-20T09:45:00.000Z',
        },
        {
          id: 15,
          itemId: 2,
          itemType: 'device',
          quantity: 1,
          unit: 'Stück',
          timestamp: '2025-01-19T16:20:00.000Z',
        },
      ],
    },
    {
      id: 3,
      name: 'Betonschneider',
      type: 'Handwerkzeug',
      location: 'Werkstatt',
      assignedDate: '2025-01-10',
      quantity: 0,
      bookingHistory: [],
    },
    {
      id: 4,
      name: 'Schweißgerät',
      type: 'Elektrowerkzeug',
      location: 'Container B',
      assignedDate: '2025-01-28',
      quantity: 0,
      bookingHistory: [
        {
          id: 16,
          itemId: 4,
          itemType: 'device',
          quantity: 1,
          unit: 'Stück',
          timestamp: '2025-01-21T11:30:00.000Z',
        },
      ],
    },
    {
      id: 5,
      name: 'Rüttler',
      type: 'Betonwerkzeug',
      location: 'Baustelle B',
      assignedDate: '2025-01-25',
      quantity: 0,
      bookingHistory: [
        {
          id: 17,
          itemId: 5,
          itemType: 'device',
          quantity: 2,
          unit: 'Stück',
          timestamp: '2025-01-22T14:15:00.000Z',
        },
        {
          id: 18,
          itemId: 5,
          itemType: 'device',
          quantity: 1,
          unit: 'Stück',
          timestamp: '2025-01-21T10:45:00.000Z',
        },
      ],
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load real products from API
      const products = await apiService.getProducts();
      
      // Filter for Paket products (materials) and other products (devices)
      const paketProducts = products.filter(p => p.unit === 'Paket');
      const otherProducts = products.filter(p => p.unit !== 'Paket');
      
      // Convert API products to Material format
      const materialsFromAPI: Material[] = paketProducts.map(product => ({
        id: product.id,
        name: product.name,
        quantity: 0, // Start with 0, user can adjust
        unit: product.unit,
        supplier: 'API Product', // We could enhance this with real supplier data
        assignedDate: new Date().toISOString().split('T')[0],
        bookingHistory: [],
      }));
      
      // Convert API products to Device format
      const devicesFromAPI: Device[] = otherProducts.map(product => ({
        id: product.id + 1000, // Offset to avoid ID conflicts
        name: product.name,
        type: product.description || 'Gerät',
        location: 'Lager',
        assignedDate: new Date().toISOString().split('T')[0],
        quantity: 0, // Start with 0, user can adjust
        bookingHistory: [],
      }));
      
      // Load materials and devices with persistent booking history
      const materialsWithHistory = await loadPersistentBookingHistory(materialsFromAPI, 'material');
      const devicesWithHistory = await loadPersistentBookingHistory(devicesFromAPI, 'device');
      
      setMaterials(materialsWithHistory);
      setDevices(devicesWithHistory);
      
    } catch (error) {
      Alert.alert('Fehler', 'Projektmaterialien konnten nicht geladen werden');
      
      // Fallback to mock data if API fails
      const materialsWithHistory = await loadPersistentBookingHistory(mockMaterials, 'material');
      const devicesWithHistory = await loadPersistentBookingHistory(mockDevices, 'device');
      
      setMaterials(materialsWithHistory);
      setDevices(devicesWithHistory);
    } finally {
      setLoading(false);
    }
  };

  const loadPersistentBookingHistory = async (items: (Material | Device)[], type: 'material' | 'device') => {
    const results = [];
    for (const item of items) {
      const persistentHistory = getPersistentBookingHistory(item.id, type);
      results.push({
        ...item,
        bookingHistory: persistentHistory,
        lastBooking: persistentHistory.length > 0 ? persistentHistory[persistentHistory.length - 1] : undefined
      });
    }
    return results;
  };

  const getPersistentBookingHistory = (itemId: number, type: 'material' | 'device'): Booking[] => {
    const key = `booking_history_${type}_${itemId}`;
    return globalBookingHistory[key] || [];
  };

  const savePersistentBookingHistory = (itemId: number, type: 'material' | 'device', bookingHistory: Booking[]) => {
    const key = `booking_history_${type}_${itemId}`;
    globalBookingHistory[key] = bookingHistory;
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktiv':
      case 'Verfügbar':
        return '#4CAF50';
      case 'Abgeschlossen':
      case 'Verwendet':
        return '#2196F3';
      case 'Pausiert':
      case 'Bestellt':
        return '#FF9800';
      case 'In Verwendung':
        return '#9C27B0';
      case 'Wartung':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const updateQuantity = (id: number, type: 'material' | 'device', change: number) => {
    if (type === 'material') {
      setMaterials(prev => prev.map(item => {
        if (item.id === id) {
          const currentValue = parseFloat(item.quantity.toString());
          const step = item.unit === 'Paket' ? 0.5 : 1;
          const newValue = Math.max(0, currentValue + (change * step));
          return { ...item, quantity: newValue };
        }
        return item;
      }));
    } else {
      setDevices(prev => prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ));
    }
  };

  const handleBooking = (id: number, type: 'material' | 'device', quantity: number, unit: string) => {
    const now = new Date();
    const booking: Booking = {
      id: Date.now(),
      itemId: id,
      itemType: type,
      quantity: quantity,
      unit: unit,
      timestamp: now.toISOString(),
    };

    if (type === 'material') {
      setMaterials(prev => prev.map(item => {
        if (item.id === id) {
          const newBookingHistory = [...(item.bookingHistory || []), booking];
          // Save to persistent storage
          savePersistentBookingHistory(id, type, newBookingHistory);
          return { 
            ...item, 
            lastBooking: booking, 
            quantity: 0,
            bookingHistory: newBookingHistory
          };
        }
        return item;
      }));
    } else {
      setDevices(prev => prev.map(item => {
        if (item.id === id) {
          const newBookingHistory = [...(item.bookingHistory || []), booking];
          // Save to persistent storage
          savePersistentBookingHistory(id, type, newBookingHistory);
          return { 
            ...item, 
            lastBooking: booking, 
            quantity: 0,
            bookingHistory: newBookingHistory
          };
        }
        return item;
      }));
    }
  };

  const openHistory = (id: number, type: 'material' | 'device', name: string) => {
    const item = type === 'material' 
      ? materials.find(m => m.id === id)
      : devices.find(d => d.id === id);
    
    navigation.navigate('ItemHistory', { 
      itemId: id, 
      itemType: type, 
      itemName: name,
      bookingHistory: item?.bookingHistory || []
    });
  };

  const renderMaterial = ({ item }: { item: Material }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Title style={styles.itemName}>{item.name}</Title>
            <Paragraph style={styles.itemDetails}>
              {item.supplier && `${item.supplier}`}
            </Paragraph>
          </View>
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => handleBooking(item.id, 'material', item.quantity, item.unit)}
            style={[
              styles.bookingButton,
              item.quantity === 0 && styles.bookingButtonDisabled
            ]}
            labelStyle={[
              styles.bookingButtonLabel,
              item.quantity === 0 && styles.bookingButtonLabelDisabled
            ]}
            disabled={item.quantity === 0}
          >
            Buchen
          </Button>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => openHistory(item.id, 'material', item.name)}
          >
            <MaterialCommunityIcons 
              name="dots-vertical" 
              size={24} 
              color={BRAND_DARK_BLUE} 
            />
          </TouchableOpacity>
        </View>
        </View>
        
        <View style={styles.quantityContainer}>
          <Paragraph style={styles.quantityLabel}>Menge:</Paragraph>
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              iconColor="white"
              style={[styles.quantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateQuantity(item.id, 'material', -1)}
            />
            <TextInput
              style={styles.quantityInput}
              value={item.quantity.toString().replace('.', ',')}
              mode="outlined"
              dense
              keyboardType="numeric"
              onChangeText={(text) => {
                // Allow decimal numbers with comma for Paket unit
                if (item.unit === 'Paket') {
                  const decimalRegex = /^\d*,\d*$/;
                  const integerRegex = /^\d+$/;
                  
                  if (text === '' || integerRegex.test(text) || decimalRegex.test(text)) {
                    const newQuantity = parseFloat(text.replace(',', '.')) || 0;
                    setMaterials(prev => prev.map(m => 
                      m.id === item.id ? { ...m, quantity: Math.max(0, newQuantity) } : m
                    ));
                  }
                } else {
                  const newQuantity = parseInt(text) || 0;
                  setMaterials(prev => prev.map(m => 
                    m.id === item.id ? { ...m, quantity: Math.max(0, newQuantity) } : m
                  ));
                }
              }}
            />
            <IconButton
              icon="plus"
              size={20}
              iconColor="white"
              style={[styles.quantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateQuantity(item.id, 'material', 1)}
            />
          </View>
          <Paragraph style={styles.unitText}>{item.unit}</Paragraph>
        </View>

        {item.lastBooking && (
          <View style={styles.lastBookingContainer}>
            <Paragraph style={styles.lastBookingText}>
              Letzter Wareneingang: {item.lastBooking.quantity} {item.lastBooking.unit} • {formatDate(item.lastBooking.timestamp)} {new Date(item.lastBooking.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Paragraph>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderDevice = ({ item }: { item: Device }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Title style={styles.itemName}>{item.name}</Title>
            <Paragraph style={styles.itemDetails}>
              {item.type}{item.location && ` • ${item.location}`}
            </Paragraph>
          </View>
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => handleBooking(item.id, 'device', item.quantity, 'Stück')}
            style={[
              styles.bookingButton,
              item.quantity === 0 && styles.bookingButtonDisabled
            ]}
            labelStyle={[
              styles.bookingButtonLabel,
              item.quantity === 0 && styles.bookingButtonLabelDisabled
            ]}
            disabled={item.quantity === 0}
          >
            Buchen
          </Button>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => openHistory(item.id, 'device', item.name)}
          >
            <MaterialCommunityIcons 
              name="dots-vertical" 
              size={24} 
              color={BRAND_DARK_BLUE} 
            />
          </TouchableOpacity>
        </View>
        </View>
        
        <View style={styles.quantityContainer}>
          <Paragraph style={styles.quantityLabel}>Anzahl:</Paragraph>
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              iconColor="white"
              style={[styles.quantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateQuantity(item.id, 'device', -1)}
            />
            <TextInput
              style={styles.quantityInput}
              value={item.quantity.toString()}
              mode="outlined"
              dense
              keyboardType="numeric"
              onChangeText={(text) => {
                const newQuantity = parseInt(text) || 0;
                setDevices(prev => prev.map(d => 
                  d.id === item.id ? { ...d, quantity: Math.max(0, newQuantity) } : d
                ));
              }}
            />
            <IconButton
              icon="plus"
              size={20}
              iconColor="white"
              style={[styles.quantityButton, { backgroundColor: BRAND_LIGHT_BLUE }]}
              onPress={() => updateQuantity(item.id, 'device', 1)}
            />
          </View>
          <Paragraph style={styles.unitText}>Stück</Paragraph>
        </View>

        {item.lastBooking && (
          <View style={styles.lastBookingContainer}>
            <Paragraph style={styles.lastBookingText}>
              Letzter Wareneingang: {item.lastBooking.quantity} {item.lastBooking.unit} • {formatDate(item.lastBooking.timestamp)} {new Date(item.lastBooking.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Paragraph>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const getFilteredData = () => {
    if (appliedFilter.includes('alle')) {
      return [
        ...materials.map(item => ({ type: 'material', data: item })),
        ...devices.map(item => ({ type: 'device', data: item }))
      ];
    }
    
    const filteredItems = [];
    
    if (appliedFilter.includes('materialien')) {
      filteredItems.push(...materials.map(item => ({ type: 'material', data: item })));
    }
    
    if (appliedFilter.includes('geräte')) {
      filteredItems.push(...devices.map(item => ({ type: 'device', data: item })));
    }
    
    if (appliedFilter.includes('filter3')) {
      filteredItems.push(...materials.filter(item => item.supplier?.includes('Stahl')).map(item => ({ type: 'material', data: item })));
    }
    
    if (appliedFilter.includes('filter4')) {
      filteredItems.push(...devices.filter(item => item.location?.includes('Baustelle')).map(item => ({ type: 'device', data: item })));
    }
    
    // Remove duplicates based on id and type
    const uniqueItems = filteredItems.filter((item, index, self) => 
      index === self.findIndex(t => t.data.id === item.data.id && t.type === item.type)
    );
    
    return uniqueItems;
  };

  const getFilterLabel = (filterValue: string) => {
    switch (filterValue) {
      case 'alle': return 'Alle';
      case 'materialien': return 'Materialien';
      case 'geräte': return 'Geräte';
      case 'filter3': return 'Filter 3';
      case 'filter4': return 'Filter 4';
      default: return 'Alle';
    }
  };

  const getFilterCount = (filterValue: string) => {
    switch (filterValue) {
      case 'alle': return materials.length + devices.length;
      case 'materialien': return materials.length;
      case 'geräte': return devices.length;
      case 'filter3': return materials.filter(item => item.supplier?.includes('Stahl')).length;
      case 'filter4': return devices.filter(item => item.location?.includes('Baustelle')).length;
      default: return 0;
    }
  };

  const getFilterDisplayText = () => {
    if (appliedFilter.includes('alle')) {
      return 'Alle';
    }
    if (appliedFilter.length === 1) {
      return getFilterLabel(appliedFilter[0]);
    }
    return `${appliedFilter.length} Filter`;
  };

  const renderItem = ({ item }: { item: { type: string; data: Material | Device } }) => {
    if (item.type === 'material') {
      return renderMaterial({ item: item.data as Material });
    } else {
      return renderDevice({ item: item.data as Device });
    }
  };

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
        <Title style={styles.projectTitle}>{project.name}</Title>
        <Paragraph style={styles.projectDescription}>
          {project.description}
        </Paragraph>
        <View style={styles.projectInfo}>
          <Chip
            icon="circle"
            textStyle={{ color: 'white' }}
            style={[styles.statusChip, { backgroundColor: getStatusColor(project.status) }]}
          >
            {project.status}
          </Chip>
          <Paragraph style={styles.projectDates}>
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </Paragraph>
        </View>
      </Surface>

      {/* Filter */}
      <Surface style={styles.filterContainer}>
        <View style={styles.filterButtonContainer}>
          <Button
            mode="contained"
            onPress={showFilterOptions}
            style={styles.filterDropdownButton}
            labelStyle={styles.filterDropdownButtonLabel}
            icon="filter"
          >
            {getFilterDisplayText()} ({getFilteredData().length})
          </Button>
        </View>
      </Surface>

      <FlatList
        data={getFilteredData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerStyle={styles.listContainer}
      />

      {/* Filter Selection Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>Filter wählen</Title>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {['alle', 'materialien', 'geräte', 'filter3', 'filter4'].map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterOption,
                  filter.includes(filterOption as any) && styles.selectedFilterOption
                ]}
                onPress={() => toggleFilter(filterOption as any)}
              >
                <View style={styles.filterOptionContent}>
                  <View style={styles.checkbox}>
                    {filter.includes(filterOption as any) && <View style={styles.checkboxSelected} />}
                  </View>
                  <Text style={[
                    styles.filterOptionText,
                    filter.includes(filterOption as any) && styles.selectedFilterOptionText
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
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  projectDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
    color: '#666',
  },
  projectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDates: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    padding: 16,
    elevation: 2,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  filterButtonContainer: {
    alignItems: 'center',
  },
  filterDropdownButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    borderRadius: 8,
    minWidth: 200,
  },
  filterDropdownButtonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedFilterOption: {
    backgroundColor: BRAND_LIGHT_BLUE,
    borderColor: BRAND_DARK_BLUE,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: BRAND_DARK_BLUE,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedFilterOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchButtonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  searchButton: {
    backgroundColor: BRAND_DARK_BLUE,
    borderRadius: 8,
    paddingVertical: 12,
  },
  searchButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemCard: {
    margin: 16,
    marginTop: 0,
    elevation: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    margin: 0,
    borderRadius: 20,
  },
  quantityInput: {
    width: 60,
    marginHorizontal: 8,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bookingButton: {
    backgroundColor: BRAND_LIGHT_BLUE,
    borderRadius: 8,
  },
  bookingButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  bookingButtonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingButtonLabelDisabled: {
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  historyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginLeft: 12,
  },
  lastBookingContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: BRAND_LIGHT_BLUE,
  },
  lastBookingText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  listContainer: {
    paddingBottom: 16,
  },
});

export default ProjectMaterialsScreen;
