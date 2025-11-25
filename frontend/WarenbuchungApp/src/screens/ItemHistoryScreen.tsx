/**
 * ItemHistoryScreen.tsx
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
  FlatList,
  Text,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Surface,
  IconButton,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { Booking } from '../types';
import { apiService } from '../services/api';

type RootStackParamList = {
  ItemHistory: { 
    itemId: number; 
    itemType: 'material' | 'device'; 
    itemName: string;
    productSku?: string;
    bookingHistory: Booking[];
  };
};

type ItemHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ItemHistory'>;
type ItemHistoryScreenRouteProp = RouteProp<RootStackParamList, 'ItemHistory'>;

interface Props {
  navigation: ItemHistoryScreenNavigationProp;
  route: ItemHistoryScreenRouteProp;
}

const ItemHistoryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId, itemType, itemName, productSku, bookingHistory } = route.params;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBookings(bookingHistory);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const confirmDeleteBooking = (bookingId: number) => {
    Alert.alert(
      'Buchung löschen',
      'Möchten Sie diese Buchung wirklich annullieren?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => handleDeleteBooking(bookingId),
        },
      ]
    );
  };

  const handleDeleteBooking = async (bookingId: number) => {
    try {
      setLoading(true);
      await apiService.deleteWareneingang(bookingId);
      setBookings(prev => {
        const updated = prev.filter(booking => booking.id !== bookingId);
        if (updated.length === 0) {
          navigation.goBack();
        }
        return updated;
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      Alert.alert('Fehler', 'Die Buchung konnte nicht gelöscht werden.');
    } finally {
      setLoading(false);
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Title style={styles.bookingTitle}>
            Letzter Wareneingang: {item.quantity} {item.unit}
          </Title>
          <IconButton
            icon="close"
            size={20}
            iconColor="#d32f2f"
            onPress={() => confirmDeleteBooking(item.id)}
          />
        </View>
        <View style={styles.bookingDetails}>
          <Paragraph style={styles.bookingDate}>
            📅 {formatDate(item.timestamp)}
          </Paragraph>
          <Paragraph style={styles.bookingTime}>
            🕐 {formatTime(item.timestamp)}
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_LIGHT_BLUE} />
        <Paragraph style={styles.loadingText}>Lade Wareneingangshistorie...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>{itemName}</Title>
          <Paragraph style={styles.headerSubtitle}>
            {productSku ? (
              <>
                Artikelnummer:{' '}
                <Text style={styles.headerSubtitleHighlight}>{productSku}</Text>
              </>
            ) : (
              'Artikelnummer unbekannt'
            )}
          </Paragraph>
        </View>
      </Surface>

      {/* Bookings List */}
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph style={styles.emptyText}>
              Keine Buchungen gefunden
            </Paragraph>
          </View>
        }
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    padding: 16,
    elevation: 2,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  headerSubtitleHighlight: {
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  bookingHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_DARK_BLUE,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default ItemHistoryScreen;
