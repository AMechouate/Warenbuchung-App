/**
 * MainScreen.tsx
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import React, { useState, useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider as PaperProvider, Text } from 'react-native-paper';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { navigationColors } from '../theme';
import { apiService } from '../services/api';

import WareneingaengeScreen from './WareneingaengeScreen';
import WarenausgaengeScreen from './WarenausgaengeScreen';
import SettingsScreen from './SettingsScreen';
import { MainTabParamList } from '../types';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainScreenProps {
  onLogout: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);

  const loadUserData = async () => {
    try {
      const userData = await apiService.getStoredUser();
      console.log('🔍 Loaded user data:', userData);
      console.log('🔍 isAdmin:', userData?.isAdmin);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  return (
    <PaperProvider>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => {
          const HeaderRight = () => {
            const rootNavigation = (navigation as any).getParent() || navigation;
            return (
              <View style={styles.headerRight}>
                {user ? (
                  <Pressable 
                    onPress={() => {
                      rootNavigation.navigate('Profile');
                    }}
                  >
                  <View style={styles.greetingCircle}>
                    <Text style={styles.greetingText}>Hallo !</Text>
                    <Text style={styles.usernameText}>{user.username}</Text>
                  </View>
                </Pressable>
                ) : null}
              </View>
            );
          };

          return {
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

              if (route.name === 'Wareneingaenge') {
                iconName = focused ? 'truck-delivery' : 'truck-delivery-outline';
              } else if (route.name === 'Warenausgaenge') {
                iconName = focused ? 'truck-fast' : 'truck-fast-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'cog' : 'cog-outline';
              } else {
                iconName = 'help';
              }

              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: navigationColors.tabBarActive,
            tabBarInactiveTintColor: navigationColors.tabBarInactive,
            tabBarStyle: { 
              backgroundColor: navigationColors.tabBarBackground,
              borderTopWidth: 0,
              elevation: 8,
              paddingBottom: 0,
              paddingTop: 8,
            },
            tabBarSafeAreaInsets: { bottom: 0 },
            tabBarHideOnKeyboard: false,
            headerStyle: {
              backgroundColor: navigationColors.headerBackground,
            },
            headerTintColor: navigationColors.headerTint,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerRight: HeaderRight,
          };
        }}
      >
        <Tab.Screen
          name="Wareneingaenge"
          component={WareneingaengeScreen}
          options={{
            title: 'Eingänge',
            headerTitle: 'Wareneingänge',
          }}
        />
        <Tab.Screen
          name="Warenausgaenge"
          component={WarenausgaengeScreen}
          options={{
            title: 'Ausgänge',
            headerTitle: 'Warenausgänge',
          }}
        />
        {/* Settings Screen - only visible for Admin users */}
        {user?.isAdmin && (
          <Tab.Screen
            name="Settings"
            options={{
              title: 'Einstellungen',
              headerTitle: 'Einstellungen',
            }}
          >
            {(props) => <SettingsScreen {...props} />}
          </Tab.Screen>
        )}
      </Tab.Navigator>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    paddingRight: 16,
  },
  greetingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: navigationColors.headerBackground,
    borderWidth: 2,
    borderColor: navigationColors.headerTint,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginTop: 20,
  },
  greetingText: {
    color: navigationColors.headerTint,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  usernameText: {
    color: navigationColors.headerTint,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default MainScreen;
