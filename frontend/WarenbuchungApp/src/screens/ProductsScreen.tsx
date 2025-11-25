/**
 * ProductsScreen.tsx
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
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Searchbar,
  Chip,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { databaseService } from '../services/database';
import { Product } from '../types';

import { useNavigation } from '@react-navigation/native';

const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const loadProducts = async () => {
    try {
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated && isOnline) {
        // Load from API
        const apiProducts = await apiService.getProducts();
        setProducts(apiProducts);
        
        // Save to local database
        for (const product of apiProducts) {
          await databaseService.saveProduct(product);
        }
      } else {
        // Load from local database
        const localProducts = await databaseService.getProducts();
        setProducts(localProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to local database
      try {
        const localProducts = await databaseService.getProducts();
        setProducts(localProducts);
        setIsOnline(false);
      } catch (localError) {
        console.error('Error loading local products:', localError);
        
        // If local database is corrupted, try to reset it
        try {
          console.log('Attempting to reset corrupted local database...');
          await databaseService.resetDatabase();
          // Try loading products again after reset
          const localProducts = await databaseService.getProducts();
          setProducts(localProducts);
          setIsOnline(false);
          Alert.alert('Info', 'Lokale Datenbank wurde zurückgesetzt. Bitte loggen Sie sich neu ein, um die aktuellen Daten zu laden.');
        } catch (resetError) {
          console.error('Error resetting local database:', resetError);
          Alert.alert('Fehler', 'Produkte konnten nicht geladen werden. Bitte starten Sie die App neu.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );


  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => {
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
      <Card style={styles.productCard}>
        <Card.Content>
          <Title>{item.name}</Title>
          <Paragraph style={styles.sku}>SKU: {item.sku}</Paragraph>
          <View style={styles.productInfo}>
            <Chip mode="outlined" style={styles.chip}>
              {item.stockQuantity} {item.unit || 'Stück'}
            </Chip>
            <Chip mode="outlined" style={styles.locationChip}>
              Lager: {displayLocationStock}
            </Chip>
            <Chip mode="outlined" style={styles.priceChip}>
              €{displayPrice}
            </Chip>
          </View>
          {item.description && (
            <Paragraph style={styles.description} numberOfLines={2}>
              {item.description}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Title>Keine Produkte gefunden</Title>
      <Paragraph style={styles.emptyText}>
        {searchQuery
          ? 'Keine Produkte entsprechen Ihrer Suche.'
          : 'Noch keine Produkte vorhanden. Erstellen Sie Ihr erstes Produkt.'}
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
        <Searchbar
          placeholder="Produkte suchen..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        {!isOnline && (
          <Chip mode="outlined" icon="wifi-off" style={styles.offlineChip}>
            Offline-Modus
          </Chip>
        )}
      </Surface>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="Produkt hinzufügen"
        onPress={() => navigation.navigate('AddProduct')}
        color="#fff"
      />
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
  },
  searchbar: {
    marginBottom: 8,
  },
  offlineChip: {
    alignSelf: 'flex-start',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
  },
  sku: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  locationChip: {
    marginRight: 8,
  },
  priceChip: {
    backgroundColor: '#e6f7ff',
    borderColor: BRAND_LIGHT_BLUE,
    borderWidth: 1,
  },
  description: {
    color: '#666',
    fontSize: 14,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: BRAND_LIGHT_BLUE,
  },
});

export default ProductsScreen;
