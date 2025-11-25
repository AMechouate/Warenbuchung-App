/**
 * RegisterScreen.tsx
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import React, { useState } from 'react';
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
import { RegisterRequest } from '../types';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!formData.username || !formData.password || !formData.email || 
        !formData.firstName || !formData.lastName) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Fehler', 'Passwörter stimmen nicht überein.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    try {
      await apiService.register(formData);
      Alert.alert(
        'Erfolg',
        'Registrierung erfolgreich! Sie können sich jetzt anmelden.',
        [{ text: 'OK', onPress: onRegisterSuccess }]
      );
    } catch (error: any) {
      Alert.alert(
        'Registrierung Fehler',
        error.response?.data?.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
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
              <Title style={styles.title}>Neuen Account erstellen</Title>
              <Paragraph style={styles.subtitle}>
                Füllen Sie alle Felder aus, um sich zu registrieren
              </Paragraph>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Benutzername</Text>
                <TextInput
                  value={formData.username}
                  onChangeText={(text) =>
                    setFormData({ ...formData, username: text })
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
                <Text style={styles.label}>E-Mail</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={loading}
                  outlineColor="#ccc"
                  activeOutlineColor={BRAND_LIGHT_BLUE}
                  textColor="#333"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vorname</Text>
                <TextInput
                  value={formData.firstName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, firstName: text })
                  }
                  style={styles.input}
                  mode="outlined"
                  disabled={loading}
                  outlineColor="#ccc"
                  activeOutlineColor={BRAND_LIGHT_BLUE}
                  textColor="#333"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nachname</Text>
                <TextInput
                  value={formData.lastName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lastName: text })
                  }
                  style={styles.input}
                  mode="outlined"
                  disabled={loading}
                  outlineColor="#ccc"
                  activeOutlineColor={BRAND_LIGHT_BLUE}
                  textColor="#333"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Passwort</Text>
                <TextInput
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Passwort bestätigen</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  disabled={loading}
                  outlineColor="#ccc"
                  activeOutlineColor={BRAND_LIGHT_BLUE}
                  textColor="#333"
                />
              </View>

              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.registerButton}
                buttonColor={BRAND_DARK_BLUE}
                textColor="#fff"
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Registrierung...' : 'Registrieren'}
              </Button>

              <Button
                mode="text"
                onPress={onNavigateToLogin}
                style={styles.loginButton}
                textColor={BRAND_LIGHT_BLUE}
                disabled={loading}
              >
                Bereits registriert? Anmelden
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: BRAND_DARK_BLUE,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
    fontSize: 13,
  },
  inputContainer: {
    marginBottom: 12,
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
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  loginButton: {
    marginTop: 8,
  },
});

export default RegisterScreen;
