import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import CustomAlert from './CustomAlert'; 
import db from './firebaseConfig'; 

const PhotoReviewScreen = ({ route, navigation }) => {
  const initialData = route.params.ocrData || { store_name: '', date: '', line_items: [] };
  const [ocrData, setOcrData] = useState(initialData);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const updateField = (key, value) => {
    setOcrData({ ...ocrData, [key]: value });
  };

  const updateLineItem = (index, key, value) => {
    const updatedItems = [...ocrData.line_items];
    updatedItems[index][key] = value;
    setOcrData({ ...ocrData, line_items: updatedItems });
  };

  //b3Bqdvau7KrHZHAWkN1p
  const formatPrice = (price) => parseFloat(price.replace(/[$,]/g, '')) || 0;

  const incrementQuantity = async (index) => {
    const updatedItems = [...ocrData.line_items];
    updatedItems[index].item_quantity = parseInt(updatedItems[index].item_quantity) + 1;
    setOcrData({ ...ocrData, line_items: updatedItems });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const decrementQuantity = async (index) => {
    const updatedItems = [...ocrData.line_items];
    if (updatedItems[index].item_quantity > 1) {
      updatedItems[index].item_quantity = parseInt(updatedItems[index].item_quantity) - 1;
      setOcrData({ ...ocrData, line_items: updatedItems });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setDeleteItemIndex(index);
      setDeleteAlertVisible(true);
    }
  };

  const deleteItem = (index) => {
    const updatedItems = [...ocrData.line_items];
    updatedItems.splice(index, 1);
    setOcrData({ ...ocrData, line_items: updatedItems });
    setDeleteAlertVisible(false);
  };

  const addItem = () => {
    const newItem = { item_name: '', item_value: '0', item_quantity: 1 };
    setOcrData({ ...ocrData, line_items: [...ocrData.line_items, newItem] });
  };

  const calculateTotal = () => {
    const subtotal = ocrData.line_items.reduce((acc, item) => acc + (formatPrice(item.item_value) * item.item_quantity), 0);
    const gst = subtotal * (gstPercentage / 100);
    return (subtotal + gst).toFixed(2);
  };

  const saveReceiptToFirestore = async () => {
    try {
      await db.collection('receipts').add({
        storeName: ocrData.store_name,
        date: ocrData.date,
        category: selectedCategory,
        lineItems: ocrData.line_items.map(item => ({
          itemName: item.item_name,
          itemQuantity: item.item_quantity,
          itemValue: item.item_value
        })),
        total: calculateTotal(),
        imageUrl: '', // Add an imageURL if applicable
      });
      Alert.alert("Success", "Receipt saved successfully");
      navigation.goBack();  // Optionally navigate back
    } catch (error) {
      console.error("Error saving to Firestore: ", error);
      Alert.alert("Error", "Failed to save the receipt.");
    }
  };
  

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.invoice_container}>
          <TextInput
            style={styles.title}
            value={ocrData.store_name}
            onChangeText={(text) => updateField('store_name', text)}
          />
          <TextInput
            style={styles.date}
            value={ocrData.date}
            onChangeText={(text) => updateField('date', text)}
          />
          <View style={styles.categoryContainer}>
            {['Home', 'Personal', 'Food'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category ? styles.selectedCategory : {}
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category ? styles.selectedText : {}
                ]}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {ocrData.line_items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <TextInput
                style={styles.item}
                value={item.item_name}
                onChangeText={(text) => updateLineItem(index, 'item_name', text)}
              />
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => decrementQuantity(index)}>
                  <Text style={styles.quantityButton}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.item_quantity}</Text>
                <TouchableOpacity onPress={() => incrementQuantity(index)}>
                  <Text style={styles.quantityButton}>+</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.price}
                value={`$${(parseFloat(item.item_value.replace(/[$,]/g, '')) * item.item_quantity).toFixed(2)}`}
                onChangeText={(text) => updateLineItem(index, 'item_value', text.replace(/[$,]/g, ''))}
                keyboardType="numeric"
              />
            </View>
          ))}
          <View style={styles.totalContainer}>
            <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
              <Text style={styles.addItemText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.total}>Total: ${calculateTotal()}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText} onPress={saveReceiptToFirestore}>Save</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={isDeleteAlertVisible}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onCancel={() => setDeleteAlertVisible(false)}
        onConfirm={() => deleteItem(deleteItemIndex)}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    // padding: 20,
    // marginTop: 40,
  },
  title: {
    fontSize: 48,
    color: 'blue',
    fontFamily: 'CustomFont-Bold',
  },
  date: {
    fontSize: 14,
    fontFamily: 'CustomFont-Regular',
    color: 'grey'
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 3,
    fontSize: 14,
    fontFamily: 'CustomFont-Bold',
  },

  item_quantity:{
    fontFamily: 'CustomFont-Bold',
  },
  quantityContainer:{
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantityButton:{
    paddingHorizontal: 10,
    fontSize: 18,
    padding: 10
  },
  price: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'CustomFont-Bold',
  },
  total: {
    fontSize: 14,
    fontFamily: 'CustomFont-Bold',
    color: 'blue',
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'blue'
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'CustomFont-Bold',
    fontSize: 14,
  },
  invoice_container:{
    marginTop: 40,
    padding: 20
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
    padding: 10,
    fontFamily: 'CustomFont-Regular',
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 40,
    elevation: 3,
    shadowColor: '#000',
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: 'black',
  },
  categoryText: {
    fontFamily: 'CustomFont-Regular',
    fontSize: 14,
    color: 'black',
  },
  closeIcon: {
    fontFamily: 'CustomFont-Regular',
    fontSize: 14,
    color: 'red',
    paddingLeft: 10,
  },
  selectedCategory: {
    backgroundColor: 'blue',
    color: 'white',
  },

  selectedText: {
    color: 'white',
  },

    line: {
    height: 1,
    backgroundColor: 'grey',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  addItemButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'blue',
    alignItems: 'center', 
    alignSelf: 'center', 
    justifyContent: 'center',  // Ensure the content is centered vertically
  },
  addItemText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 22,  
    textAlign: 'center', 
    textAlignVertical: 'center', 
  },


});

const alertStyles = StyleSheet.create({
  container: {
    borderRadius: 10,
    backgroundColor: 'white',
    borderColor: 'blue',
  },
  title: {
    fontFamily: 'CustomFont-Bold',
    fontSize: 14,
    color: 'blue',
  },
  message: {
    fontFamily: 'CustomFont-Regular',
    fontSize: 14,
    color: 'black',
  },
  button: {
    fontFamily: 'CustomFont-Bold',
    color: 'blue',
  },

});

export default PhotoReviewScreen;
