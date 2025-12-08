/**
 * App.tsx
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Image, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { paperTheme, navigationColors } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProjectMaterialsScreen from './src/screens/ProjectMaterialsScreen';
import ItemHistoryScreen from './src/screens/ItemHistoryScreen';
import { apiService } from './src/services/api';
import { databaseService } from './src/services/database';
import { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database with retry logic
      let dbInitialized = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!dbInitialized && retryCount < maxRetries) {
        try {
          await databaseService.init();
          dbInitialized = true;
          console.log('Database initialized successfully');
        } catch (dbError) {
          console.error(`Database initialization attempt ${retryCount + 1} failed:`, dbError);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.error('Max database initialization retries reached');
            throw dbError;
          }
    
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Check authentication status
      //const authenticated = await apiService.isAuthenticated();
      const authenticated = true;
      setIsAuthenticated(authenticated);
      
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('./assets/polygon-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appTitle}>Warenbuchung App</Text>
        <ActivityIndicator size="large" color="#1976d2" style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme as any}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main">
                {(props) => (
                  <MainScreen
                    {...props}
                    onLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Profile"
                options={{
                  headerShown: false,
                }}
              >
                {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen
                name="ProjectMaterials"
                options={{
                  headerShown: true,
                  title: 'Projekt Materialien & Geräte',
                }}
                component={ProjectMaterialsScreen}
              />
        <Stack.Screen
          name="ItemHistory"
          options={{
            headerShown: true,
            title: 'Wareneingangshistorie',
          }}
          component={ItemHistoryScreen}
        />
            </>
          ) : (
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={handleLoginSuccess}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 300,
    height: 150,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingSpinner: {
    marginTop: 10,
  },
});
