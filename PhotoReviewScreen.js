import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import CustomAlert from './CustomAlert'; 
import axios from 'axios';

const PhotoReviewScreen = ({ route, navigation }) => {
  const normalizeLineItems = data => {
    if (Array.isArray(data.line_items)) {
      return data.line_items;
    } else if (typeof data.line_items === 'object' && data.line_items !== null) {
      return [data.line_items];
    }
    return [];
  };

  const initialData = route.params.ocrData || { store_name: '', date: '', line_items: [], image_path: ''};
  initialData.line_items = normalizeLineItems(initialData);
  initialData.image_path = route.params.image_path || ''; // Add this line
  const [ocrData, setOcrData] = useState(initialData);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date());  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  
  const updateField = (key, value) => {
    setOcrData({ ...ocrData, [key]: value });
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
      setDeleteItemIndex(index);
      setDeleteAlertVisible(true);
    }
  };

  const updateLineItem = (index, key, value) => {
    const updatedItems = [...ocrData.line_items];
    updatedItems[index][key] = value;
    setOcrData({ ...ocrData, line_items: updatedItems });
  };
  
  const deleteItem = (index) => {
    const updatedItems = [...ocrData.line_items];
    updatedItems.splice(index, 1);
    setOcrData({ ...ocrData, line_items: updatedItems });
    setDeleteAlertVisible(false);
  };

  //7CLaE1M7ZuZ2IKOr
  //adityakuma0308
  
  const addItem = () => {
    const newItem = { item_name: '', item_value: '0', item_quantity: 1 };
    setOcrData({ ...ocrData, line_items: [...ocrData.line_items, newItem] });
  };

  const calculateTotal = () => {
    const subtotal = ocrData.line_items.reduce((acc, item) => acc + (formatPrice(item.item_value) * item.item_quantity), 0);
    const gst = subtotal * (gstPercentage / 100);
    return (subtotal + gst).toFixed(2);
  };

  const saveReceiptToMongoDB = async () => {

    try {
      if (!selectedCategory){
        Alert.alert('Please select a category before saving');
        return;
      }
      console.log('Image Path:', ocrData.image_path);
      const result = await axios.post('http://192.168.50.240:3000/addReceipt', {
        storeName: ocrData.store_name,
        date: ocrData.date,
        category: selectedCategory,
        description: description, // Include the description here
        lineItems: ocrData.line_items.map(item => ({
          itemName: item.item_name,
          itemQuantity: item.item_quantity,
          itemValue: item.item_value
        })),
        total: calculateTotal(),
        imageUrl: route.params.image_path, // Use route.params.image_path instead of ocrData.image_path
      });
      Alert.alert("Success", "Receipt saved successfully");
      navigation.navigate('History');  // Navigate to the TransactionScreen
    } catch (error) {
      console.error("Error saving to MongoDB: ", error);
      Alert.alert("Error", "Failed to save the receipt.");
    }
  };  
  
  //date picker logic
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    const formattedDate = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    updateField('date', formattedDate);
  };
  
  useEffect(() => {
    // Automatically set the date to today's date in the desired format when the component mounts
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    updateField('date', formattedDate);
  }, []);
  
  const displayDatePicker = () => {
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.invoice_container}>
        <TextInput
          style={styles.title}
          value={ocrData.store_name}
          onChangeText={(text) => updateField('store_name', text)}
          multiline={true}  // Allows multiple lines of input
          placeholder="Enter Title Here"  // Optional: Placeholder if needed
        />

          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInput}
              onChangeText={setDescription}
              value={description}
              placeholder="Enter invoice description (Optional)"
              multiline={true}
              numberOfLines={2} 
            />
          </View>
          <TouchableOpacity onPress={displayDatePicker} style={styles.datePickerButton}>
            <Text style={styles.datePickerText}>{ocrData.date || 'Set Date'}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChangeDate}
            />
          )}
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
        <TouchableOpacity style={styles.button} onPress={saveReceiptToMongoDB}>
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
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'white',
    backgroundColor: "#f2f2f2",

  },
  title: {
    fontSize: 36,
    color: 'blue',
    fontFamily: 'CustomFont-Bold',
    textAlign: 'left',  
    marginTop: 0,
    marginBottom: 0,  
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

  datePickerText:{
    fontFamily: 'CustomFont-Regular',    
    color: 'grey'
  },
descriptionContainer: {

},
descriptionInput: {
  borderRadius: 5,
  fontFamily: 'CustomFont-Regular',    
  fontSize: 14,
  color: 'blue'
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
