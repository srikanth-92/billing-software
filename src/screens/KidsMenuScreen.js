import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import {
  KIDS_MENU_ITEMS,
  KIDS_EVENT_COMBOS,
  KIDS_EVENT_INFO,
  getKidsMenuCategories,
  getKidsMenuByCategory,
} from '../constants/kidsMenu';

export default function KidsMenuScreen({ navigation, route }) {
  const [selectedCategory, setSelectedCategory] = useState('Mini Meals');
  const [cart, setCart] = useState([]);

  const categories = getKidsMenuCategories();

  const addToCart = (item) => {
    setCart([...cart, item]);
    Alert.alert(
      'Added to Cart! 🎉',
      `${item.name} has been added to your order.`,
      [{ text: 'OK' }]
    );
  };

  const renderEventHeader = () => (
    <View style={styles.eventHeader}>
      <Text style={styles.eventTitle}>{KIDS_EVENT_INFO.eventName}</Text>
      <Text style={styles.eventDate}>{KIDS_EVENT_INFO.date}</Text>
      <Text style={styles.eventTimings}>⏰ {KIDS_EVENT_INFO.timings}</Text>

      <View style={styles.featuresContainer}>
        {KIDS_EVENT_INFO.specialFeatures.map((feature, index) => (
          <Text key={index} style={styles.featureText}>{feature}</Text>
        ))}
      </View>
    </View>
  );

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryScrollContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryTab,
            selectedCategory === category && styles.categoryTabActive
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategory === category && styles.categoryTabTextActive
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMenuItem = (item) => (
    <View key={item.id} style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemPrice}>₹{item.price}</Text>
        </View>
      </View>

      <Text style={styles.menuItemDescription}>{item.description}</Text>

      {item.allergens && item.allergens.length > 0 && (
        <Text style={styles.menuItemAllergens}>
          Contains: {item.allergens.join(', ')}
        </Text>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addToCart(item)}
      >
        <Text style={styles.addButtonText}>Add to Order</Text>
      </TouchableOpacity>
    </View>
  );

  const renderComboSection = () => (
    <View style={styles.comboSection}>
      <Text style={styles.sectionTitle}>🎁 Special Event Combos</Text>
      {KIDS_EVENT_COMBOS.map((combo) => (
        <View key={combo.id} style={styles.comboCard}>
          <View style={styles.comboHeader}>
            <Text style={styles.comboEmoji}>{combo.emoji}</Text>
            <View style={styles.comboInfo}>
              <Text style={styles.comboName}>{combo.name}</Text>
              <Text style={styles.comboPrice}>₹{combo.price}</Text>
              {combo.savings > 0 && (
                <Text style={styles.comboSavings}>Save ₹{combo.savings}!</Text>
              )}
            </View>
          </View>

          <Text style={styles.comboDescription}>{combo.description}</Text>

          <View style={styles.comboItemsList}>
            {combo.items.map((item, index) => (
              <Text key={index} style={styles.comboItem}>✓ {item}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={styles.addComboButton}
            onPress={() => addToCart(combo)}
          >
            <Text style={styles.addButtonText}>Order This Combo</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderNotes = () => (
    <View style={styles.notesSection}>
      <Text style={styles.sectionTitle}>📝 Important Notes</Text>
      {KIDS_EVENT_INFO.notes.map((note, index) => (
        <Text key={index} style={styles.noteText}>• {note}</Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kids Menu 🎉</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Text style={styles.cartButtonText}>🛒 {cart.length}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {renderEventHeader()}
        {renderComboSection()}
        {renderCategoryTabs()}

        <View style={styles.menuSection}>
          {getKidsMenuByCategory(selectedCategory).map(renderMenuItem)}
        </View>

        {renderNotes()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Buffet on Wheels</Text>
          <Text style={styles.footerSubtext}>
            Making kids happy, one meal at a time! 🎈
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cartButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  eventHeader: {
    backgroundColor: '#FFE66D',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B6B',
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  eventDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventTimings: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  featuresContainer: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  categoryScroll: {
    backgroundColor: '#FFF',
    borderBottomWidth: 2,
    borderBottomColor: '#FFE66D',
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  categoryTabActive: {
    backgroundColor: '#FF6B6B',
  },
  categoryTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#FFF',
  },
  menuSection: {
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  menuItemAllergens: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  comboSection: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  comboCard: {
    backgroundColor: '#FFE66D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  comboHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comboEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  comboInfo: {
    flex: 1,
  },
  comboName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  comboPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  comboSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
  },
  comboDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  comboItemsList: {
    marginBottom: 12,
  },
  comboItem: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  addComboButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  notesSection: {
    padding: 16,
    backgroundColor: '#FFF',
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    marginTop: 16,
  },
  footerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
});
