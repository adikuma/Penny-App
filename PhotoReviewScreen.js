import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';

const PhotoReviewScreen = ({ route }) => {
  const { ocrData } = route.params;

  // Ensure ocrData and ocrData.receipts[0] are valid
  if (!ocrData || !ocrData.receipts || !ocrData.receipts[0] || !ocrData.receipts[0].items) {
    return (
      <View style={styles.container}>
        <Text>No OCR Data Available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{ocrData.merchant_name || "Unknown Merchant"}</Text>
      <Text style={styles.date}>{ocrData.date || "Unknown Date"}</Text>
      {ocrData.receipts[0].items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          <Text style={styles.item}>{item.description || "Unknown Item"}</Text>
          <Text style={styles.price}>${item.price ? item.price.toFixed(2) : "N/A"}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontSize: 18,
    color: 'grey',
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  item: {
    fontSize: 16,
  },
  price: {
    fontSize: 16,
  }
});

export default PhotoReviewScreen;
