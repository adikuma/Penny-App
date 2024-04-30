import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import CustomAlert from './CustomAlert'; // Import your CustomAlert component

const PhotoReviewScreen = ({ route, navigation }) => {
  const initialData = route.params.ocrData;
  const [ocrData, setOcrData] = useState(initialData);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState(null);

  const updateField = (key, value) => {
    setOcrData({ ...ocrData, [key]: value });
  };

  const updateLineItem = (index, key, value) => {
    const updatedItems = [...ocrData.line_items];
    updatedItems[index][key] = value;
    setOcrData({ ...ocrData, line_items: updatedItems });
  };

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
      // Show confirmation dialog before deleting the item
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

  const onPickerChange = async (itemValue) => {
    setGstPercentage(parseInt(itemValue));
    await Haptics.selectionAsync();
  };

  const calculateTotal = () => {
    const subtotal = ocrData.line_items.reduce((acc, item) => acc + (formatPrice(item.item_value) * item.item_quantity), 0);
    const gst = subtotal * (gstPercentage / 100);
    return (subtotal + gst).toFixed(2);
  };


  return (
    <ScrollView style={styles.container}>
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
      <View style={styles.line} /> 
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
            value={`$${(formatPrice(item.item_value) * item.item_quantity).toFixed(2)}`}
            onChangeText={(text) => updateLineItem(index, 'item_value', text.replace(/[$,]/g, ''))}
            keyboardType="numeric"
          />
        </View>
      ))}
      <Text style={styles.total}>Total: ${calculateTotal()}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => {/* Add save functionality */}}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={isDeleteAlertVisible}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onCancel={() => setDeleteAlertVisible(false)}
        onConfirm={() => deleteItem(deleteItemIndex)}
      />
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    marginTop: 40,
    overflow: 'scroll'
  },
  title: {
    fontSize: 48,
    color: 'blue',
    fontFamily: 'CustomFont-Bold',
  },
  date: {
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'CustomFont-Regular',
    color: 'grey'
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    fontSize: 18,
    fontFamily: 'CustomFont-Bold',
    color: 'blue',
    marginTop: 20,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
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
});
const alertStyles = StyleSheet.create({
  container: {
    borderRadius: 10,
    backgroundColor: 'white',
    borderColor: 'blue',
  },
  title: {
    fontFamily: 'CustomFont-Bold',
    fontSize: 18,
    color: 'blue',
  },
  message: {
    fontFamily: 'CustomFont-Regular',
    fontSize: 16,
    color: 'black',
  },
  button: {
    fontFamily: 'CustomFont-Bold',
    color: 'blue',
  },
});

export default PhotoReviewScreen;

