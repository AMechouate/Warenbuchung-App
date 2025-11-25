/**
 * config.ts
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import { Platform } from 'react-native';

// API Configuration
// Für Entwicklung: automatische Erkennung basierend auf Platform
// Für Produktion: Server-Domain

export const API_CONFIG = {
  // Entwicklung - verschiedene URLs für verschiedene Umgebungen
  // iOS Simulator: localhost
  // Android Emulator: 10.0.2.2 (spezielles IP für Host-Machine)
  // Physische Geräte: Netzwerk-IP
  development: {
    ios: 'http://localhost:5232/api',           // iOS Simulator
    android: 'http://10.0.2.2:5232/api',        // Android Emulator
    network: 'http://192.168.8.131:5232/api',   // Physische Geräte (aktuelle Netzwerk-IP)
  },

  // Produktion (Server)
  production: 'https://deine-domain.com/api',
};

// Automatische URL-Auswahl basierend auf Platform
// Hinweis: Für physische Geräte wird die Netzwerk-IP benötigt
// Für Simulatoren/Emulatoren wird automatisch die richtige URL gewählt
const getDevelopmentUrl = (): string => {
  // Platform-spezifische Auswahl
  if (Platform.OS === 'ios') {
    return API_CONFIG.development.ios;  // localhost für iOS Simulator
  } else if (Platform.OS === 'android') {
    return API_CONFIG.development.android;  // 10.0.2.2 für Android Emulator
  }
  // Fallback: Netzwerk-IP für physische Geräte oder andere Plattformen
  return API_CONFIG.development.network;
};

// Automatische Auswahl basierend auf __DEV__
export const API_BASE_URL = __DEV__ 
  ? getDevelopmentUrl()
  : API_CONFIG.production;

// Debug: Log the configuration
if (__DEV__) {
  console.log('🔧 API Configuration:', {
    isDev: __DEV__,
    platform: Platform.OS,
    baseUrl: API_BASE_URL
  });
}

