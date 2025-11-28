/**
 * LoginScreen.tsx
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { LoginRequest } from '../types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
}) => {
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: 'admin',
    password: 'admin123',
  });
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<string>('Testing...');
  const statusRef = useRef<string>('Testing...');

  useEffect(() => {
    let isMounted = true;
    
    // Test API connection on component mount
    const testApi = async () => {
      console.log('🚀 LoginScreen: Testing API connection...');
      if (isMounted) {
        setApiStatus('Testing...');
        statusRef.current = 'Testing...';
      }
      try {
        const isConnected = await apiService.testConnection();
        if (isMounted) {
          const newStatus = isConnected ? '✅ Connected' : '❌ Failed';
          setApiStatus(newStatus);
          statusRef.current = newStatus;
        }
      } catch (error) {
        console.error('Error testing API connection:', error);
        if (isMounted) {
          setApiStatus('❌ Failed');
          statusRef.current = '❌ Failed';
        }
      }
    };
    
    testApi();
    
    // Retry connection test every 5 seconds if failed
    const interval = setInterval(async () => {
      if (!isMounted) return;
      
      const currentStatus = statusRef.current;
      if (currentStatus === '❌ Failed' || currentStatus === 'Testing...') {
        try {
          const isConnected = await apiService.testConnection();
          if (isMounted) {
            const newStatus = isConnected ? '✅ Connected' : '❌ Failed';
            setApiStatus(newStatus);
            statusRef.current = newStatus;
          }
        } catch (error) {
          if (isMounted) {
            setApiStatus('❌ Failed');
            statusRef.current = '❌ Failed';
          }
        }
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      Alert.alert('Fehler', 'Bitte geben Sie Benutzername und Passwort ein.');
      return;
    }

    setLoading(true);
    try {
      await apiService.login(credentials);
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert(
        'Login Fehler',
        error.response?.data?.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/polygon-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Title style={styles.title}>Warenbuchung App</Title>
              <Paragraph style={styles.subtitle}>
                Melden Sie sich an, um fortzufahren
              </Paragraph>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Benutzername</Text>
                <TextInput
                  value={credentials.username}
                  onChangeText={(text) =>
                    setCredentials({ ...credentials, username: text })
                  }
                  style={styles.input}
                  mode="outlined"
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={loading}
                  outlineColor="#ccc"
                  activeOutlineColor={BRAND_LIGHT_BLUE}
                  textColor="#333"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Passwort</Text>
                <TextInput
                  value={credentials.password}
                  onChangeText={(text) =>
                    setCredentials({ ...credentials, password: text })
                  }
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  disabled={loading}
                  outlineColor="#ccc"
                  activeOutlineColor={BRAND_LIGHT_BLUE}
                  textColor="#333"
                />
              </View>

              {/* API Status */}
              <View style={styles.apiStatusContainer}>
                <Text style={styles.apiStatusLabel}>Backend Status:</Text>
                <Text style={styles.apiStatusText}>{apiStatus}</Text>
              </View>

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                buttonColor={BRAND_DARK_BLUE}
                textColor="#fff"
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Anmeldung...' : 'Anmelden'}
              </Button>

              <Button
                mode="text"
                onPress={onNavigateToRegister}
                style={styles.registerButton}
                disabled={loading}
              >
                Neuen Account erstellen
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
    marginTop: -30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  logo: {
    width: 400,
    height: 200,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: BRAND_DARK_BLUE,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_DARK_BLUE,
    marginBottom: 6,
  },
  input: {
    marginBottom: 0,
  },
  apiStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  apiStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_DARK_BLUE,
  },
  apiStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 8,
  },
});

export default LoginScreen;
