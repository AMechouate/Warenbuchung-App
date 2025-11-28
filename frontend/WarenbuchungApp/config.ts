/**
 * API Configuration
 * 
 * Für lokale Entwicklung:
 * - iOS Simulator: localhost funktioniert
 * - Android Emulator: 10.0.2.2 (nicht localhost!)
 * - Physische Geräte: Verwende die lokale IP-Adresse des Computers
 * 
 * WICHTIG: Wenn du ein physisches Gerät verwendest, setze USE_PHYSICAL_DEVICE auf true!
 */

import { Platform } from 'react-native';

// ============================================
// KONFIGURATION - HIER ANPASSEN!
// ============================================

// Setze auf true, wenn du ein physisches Gerät verwendest
const USE_PHYSICAL_DEVICE = false;

// Lokale IP-Adresse (für physische Geräte)
// Finde deine IP mit: ifconfig | grep "inet " | grep -v 127.0.0.1
const LOCAL_IP = '192.168.178.148';

// Backend Port
const BACKEND_PORT = 5232;

// ============================================

// Bestimme die richtige Base URL basierend auf der Platform
const getBaseUrl = () => {
  if (__DEV__) {
    // Wenn physisches Gerät verwendet wird, immer IP-Adresse verwenden
    if (USE_PHYSICAL_DEVICE) {
      return `http://${LOCAL_IP}:${BACKEND_PORT}/api`;
    }

    // Für Simulatoren/Emulatoren: Wähle URL basierend auf Platform
    if (Platform.OS === 'android') {
      // Android Emulator verwendet 10.0.2.2 für localhost des Host-Computers
      return `http://10.0.2.2:${BACKEND_PORT}/api`;
    } else if (Platform.OS === 'ios') {
      // iOS Simulator kann localhost verwenden
      return `http://localhost:${BACKEND_PORT}/api`;
    } else {
      // Web oder andere Platformen
      return `http://localhost:${BACKEND_PORT}/api`;
    }
  }
  // In Production: Verwende die Production-URL
  return 'https://your-production-domain.com/api';
};

export const API_CONFIG = {
  baseURL: getBaseUrl(),
  timeout: 10000,
};

// Exportiere auch die URLs für einfachen Zugriff
export const BACKEND_URL = `http://${LOCAL_IP}:${BACKEND_PORT}`;
export const API_BASE_URL = getBaseUrl();

// Debug: Zeige die verwendete URL beim Start
console.log('🔧 API Configuration:', {
  platform: Platform.OS,
  usePhysicalDevice: USE_PHYSICAL_DEVICE,
  baseURL: API_BASE_URL,
});
