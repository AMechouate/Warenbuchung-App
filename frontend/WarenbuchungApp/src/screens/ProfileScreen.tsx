/**
 * ProfileScreen.tsx
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
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Switch,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE, navigationColors } from '../theme';
import { databaseService } from '../services/database';
import { User } from '../types';
import { useNavigation } from '@react-navigation/native';

interface ProfileScreenProps {
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await apiService.getStoredUser();
      setUser(userData);
      
      const isAuthenticated = await apiService.isAuthenticated();
      setIsOnline(isAuthenticated);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            await apiService.logout();
            onLogout();
          },
        },
      ]
    );
  };

  const handleSyncData = async () => {
    try {
      Alert.alert('Info', 'Synchronisation wird implementiert');
    } catch (error) {
      Alert.alert('Fehler', 'Synchronisation fehlgeschlagen');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Cache leeren',
      'Möchten Sie den lokalen Cache wirklich leeren? Alle offline Daten gehen verloren.',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Leeren',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearDatabase();
              Alert.alert('Erfolg', 'Cache wurde geleert');
            } catch (error) {
              Alert.alert('Fehler', 'Cache konnte nicht geleert werden');
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

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Benutzerprofil" />
      </Appbar.Header>
      <ScrollView>
        <Card style={styles.card} elevation={1}>
          <Card.Content>
            <Title>Benutzerinformationen</Title>
          {user ? (
            <View style={styles.userInfo}>
              <Paragraph style={styles.label}>Benutzername:</Paragraph>
              <Paragraph style={styles.value}>{user.username}</Paragraph>
              
              <Paragraph style={styles.label}>E-Mail:</Paragraph>
              <Paragraph style={styles.value}>{user.email}</Paragraph>
              
              {user.firstName && (
                <>
                  <Paragraph style={styles.label}>Vorname:</Paragraph>
                  <Paragraph style={styles.value}>{user.firstName}</Paragraph>
                </>
              )}
              
              {user.lastName && (
                <>
                  <Paragraph style={styles.label}>Nachname:</Paragraph>
                  <Paragraph style={styles.value}>{user.lastName}</Paragraph>
                </>
              )}
              
              <Paragraph style={styles.label}>Status:</Paragraph>
              <Paragraph style={styles.value}>
                {user.isActive ? 'Aktiv' : 'Inaktiv'}
              </Paragraph>
            </View>
          ) : (
            <Paragraph>Keine Benutzerdaten verfügbar</Paragraph>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} elevation={0}>
        <Card.Content>
          <Title>Verbindungsstatus</Title>
          <View style={styles.statusRow}>
            <Paragraph>Online-Modus:</Paragraph>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              disabled={true}
            />
          </View>
          <Paragraph style={styles.statusText}>
            {isOnline
              ? 'Verbunden mit dem Server'
              : 'Offline-Modus aktiv'}
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} elevation={0}>
        <Card.Content>
          <Title>Datenverwaltung</Title>
          <List.Item
            title="Daten synchronisieren"
            description="Lokale Daten mit dem Server synchronisieren"
            left={(props) => <List.Icon {...props} icon="sync" />}
            onPress={handleSyncData}
          />
          <Divider />
          <List.Item
            title="Cache leeren"
            description="Alle lokalen Daten löschen"
            left={(props) => <List.Icon {...props} icon="delete" />}
            onPress={handleClearCache}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card} elevation={0}>
        <Card.Content>
          <Title>App-Informationen</Title>
          <View style={styles.appInfo}>
            <Paragraph style={styles.label}>Version:</Paragraph>
            <Paragraph style={styles.value}>1.1.0</Paragraph>
            
            <Paragraph style={styles.label}>Build:</Paragraph>
            <Paragraph style={styles.value}>2025.10.13</Paragraph>
            
            <Paragraph style={styles.label}>Entwickler:</Paragraph>
            <Paragraph style={styles.value}>Adam Mechouate</Paragraph>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.logoutContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={BRAND_LIGHT_BLUE}
          textColor="#fff"
        >
          Abmelden
        </Button>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: navigationColors.headerBackground,
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 12,
    elevation: 1,
    backgroundColor: 'white',
  },
  userInfo: {
    marginTop: 8,
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
    marginTop: 8,
  },
  value: {
    color: '#333',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  statusText: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  appInfo: {
    marginTop: 8,
  },
  logoutContainer: {
    margin: 16,
    marginBottom: 32,
  },
  logoutButton: {
    paddingVertical: 8,
  },
});

export default ProfileScreen;
