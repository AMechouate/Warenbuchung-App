/**
 * AddProductScreen.tsx
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
  Text,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  ActivityIndicator,
} from 'react-native-paper';
import { apiService } from '../services/api';
import { BRAND_LIGHT_BLUE, BRAND_DARK_BLUE } from '../theme';
import { CreateProductRequest } from '../types';
import { useNavigation } from '@react-navigation/native';

const AddProductScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    sku: '',
    price: 0,
    stockQuantity: 0,
    locationStock: 0,
    unit: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAddProduct = async () => {
    // Validation
    if (!formData.name || !formData.sku || !formData.unit) {
      Alert.alert('Fehler', 'Bitte füllen Sie Name, SKU und Einheit aus.');
      return;
    }

    if (formData.price < 0) {
      Alert.alert('Fehler', 'Preis muss positiv sein.');
      return;
    }

    if (formData.stockQuantity < 0) {
      Alert.alert('Fehler', 'Bestandsmenge muss positiv sein.');
      return;
    }

    if (formData.locationStock < 0) {
      Alert.alert('Fehler', 'Lagebestand muss positiv sein.');
      return;
    }

    setLoading(true);
    try {
      await apiService.createProduct(formData);
      Alert.alert(
        'Erfolg',
        'Produkt erfolgreich hinzugefügt!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Fehler',
        error.response?.data?.message || 'Produkt konnte nicht hinzugefügt werden.'
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
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Neues Produkt hinzufügen</Title>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Produktname *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
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
              <Text style={styles.label}>Beschreibung</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                disabled={loading}
                outlineColor="#ccc"
                activeOutlineColor={BRAND_LIGHT_BLUE}
                textColor="#333"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>SKU (Artikelnummer) *</Text>
              <TextInput
                value={formData.sku}
                onChangeText={(text) =>
                  setFormData({ ...formData, sku: text })
                }
                style={styles.input}
                mode="outlined"
                autoCapitalize="characters"
                disabled={loading}
                outlineColor="#ccc"
                activeOutlineColor={BRAND_LIGHT_BLUE}
                textColor="#333"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Preis (€)</Text>
              <TextInput
                value={formData.price.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, price: parseFloat(text) || 0 })
                }
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
                disabled={loading}
                outlineColor="#ccc"
                activeOutlineColor={BRAND_LIGHT_BLUE}
                textColor="#333"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bestandsmenge</Text>
              <TextInput
                value={formData.stockQuantity.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, stockQuantity: parseInt(text) || 0 })
                }
                style={styles.input}
                mode="outlined"
                keyboardType="number-pad"
                disabled={loading}
                outlineColor="#ccc"
                activeOutlineColor={BRAND_LIGHT_BLUE}
                textColor="#333"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Lagebestand</Text>
              <TextInput
                value={formData.locationStock.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, locationStock: parseFloat(text) || 0 })
                }
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
                disabled={loading}
                outlineColor="#ccc"
                activeOutlineColor={BRAND_LIGHT_BLUE}
                textColor="#333"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Einheit (z.B. Stück, kg, Liter) *</Text>
              <TextInput
                value={formData.unit}
                onChangeText={(text) =>
                  setFormData({ ...formData, unit: text })
                }
                style={styles.input}
                mode="outlined"
                disabled={loading}
                outlineColor="#ccc"
                activeOutlineColor={BRAND_LIGHT_BLUE}
                textColor="#333"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                textColor={BRAND_DARK_BLUE}
                disabled={loading}
              >
                Abbrechen
              </Button>

              <Button
                mode="contained"
                onPress={handleAddProduct}
                style={styles.addButton}
                buttonColor={BRAND_DARK_BLUE}
                textColor="#fff"
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Speichern...' : 'Hinzufügen'}
              </Button>
            </View>
          </Card.Content>
        </Card>
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
    padding: 20,
    paddingTop: 60,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: BRAND_DARK_BLUE,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default AddProductScreen;
