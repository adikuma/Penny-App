import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import CustomAlert from "./CustomAlert";
import axios from "axios";

const TransactionDetail = ({ route, navigation }) => {
  const { item } = route.params;
  console.log("Items Received: ", item.lineItems);

  const initialData = route.params.ocrData || {
    store_name: "",
    date: "",
    line_items: [],
  };
  const [ocrData, setOcrData] = useState(initialData);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [transactionDetails, setTransactionDetails] = useState({
    storeName: item.storeName,
    date: item.date,
    description: item.description,
    lineItems: item.lineItems,
    total: item.total,
    category: item.category,
  });

  const [date, setDate] = useState(transactionDetails.date);
  const [selectedCategory, setSelectedCategory] = useState(
    transactionDetails.category
  );

  const formatPrice = (price) => parseFloat(price.replace(/[$,]/g, "")) || 0;

  //7CLaE1M7ZuZ2IKOr
  //adityakuma0308
  const calculateTotal = () => {
    const subtotal = transactionDetails.lineItems.reduce(
      (acc, item) => acc + formatPrice(item.itemValue) * item.itemQuantity,
      0
    );
    const gst = subtotal * (gstPercentage / 100);
    return (subtotal + gst).toFixed(2);
  };

  const saveReceiptToMongoDB = async () => {
    try {
      if (!selectedCategory) {
        Alert.alert("Please select a category before saving");
        return;
      }
      const result = await axios.post("http://192.168.50.240:3000/addReceipt", {
        storeName: ocrData.store_name,
        date: ocrData.date,
        category: selectedCategory,
        description: description, // Include the description here
        lineItems: ocrData.line_items.map((item) => ({
          itemName: item.item_name,
          itemQuantity: item.item_quantity,
          itemValue: item.item_value,
        })),
        total: calculateTotal(),
        imageUrl: "",
      });
      Alert.alert("Success", "Receipt saved successfully");
      navigation.navigate("History");
    } catch (error) {
      console.error("Error saving to MongoDB: ", error);
      Alert.alert("Error", "Failed to save the receipt.");
    }
  };

    const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
    
  };


  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.invoice_container}>
        <View style={styles.headerContainer}>
        <TextInput
            style={styles.title}
            value={transactionDetails.storeName}
            multiline={true} // Allows multiple lines of input
            placeholder="Enter Title Here" // Optional: Placeholder if needed
          />
          <TouchableOpacity onPress={handleBack} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>X</Text>
          </TouchableOpacity>
        </View>
          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInput}
              value={transactionDetails.description}
              placeholder="Enter invoice description (Optional)"
              multiline={true}
              numberOfLines={2}
            />
          </View>
            <Text style={styles.datePickerText}>
              {transactionDetails.date}
            </Text>
          <View style={styles.categoryContainer}>
            {["Home", "Personal", "Food"].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category ? styles.selectedCategory : {},
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category ? styles.selectedText : {},
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {transactionDetails.lineItems.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <TextInput
                style={styles.item}
                value={item.itemName}
              />
              <View style={styles.quantityContainer}>

                <Text style={styles.quantity}> x {item.itemQuantity}</Text>
              </View>
              <TextInput
                style={styles.price}
                value={`$${(
                  parseFloat(item.itemValue.replace(/[$,]/g, "")) *
                  item.itemQuantity
                ).toFixed(2)}`}
                keyboardType="numeric"
              />
            </View>
          ))}
          <View style={styles.totalContainer}>
            <Text style={styles.total}>Total: ${calculateTotal()}</Text>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: "white",
  },
  title: {
    fontSize: 36,
    color: "blue",
    fontFamily: "CustomFont-Bold",
    textAlign: "left",
    marginTop: 0,
    marginBottom: 0,
  },

  date: {
    fontSize: 14,
    fontFamily: "CustomFont-Regular",
    color: "grey",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    flex: 3,
    fontSize: 14,
    fontFamily: "CustomFont-Bold",
  },

  item_quantity: {
    fontFamily: "CustomFont-Bold",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    paddingHorizontal: 10,
    fontSize: 18,
    padding: 10,
  },
  price: {
    flex: 1,
    textAlign: "right",
    fontFamily: "CustomFont-Bold",
  },
  total: {
    fontSize: 14,
    fontFamily: "CustomFont-Bold",
    color: "blue",
    textAlign: "right",
    justifyContent: 'right'
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "blue",
  },
  button: {
    backgroundColor: "blue",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  buttonText: {
    color: "white",
    fontFamily: "CustomFont-Bold",
    fontSize: 14,
  },
  invoice_container: {
    marginTop: 40,
    padding: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 10,
    padding: 10,
    fontFamily: "CustomFont-Regular",
  },
  categoryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 40,
    elevation: 3,
    shadowColor: "#000",
    backgroundColor: "white",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: "black",
  },
  categoryText: {
    fontFamily: "CustomFont-Regular",
    fontSize: 14,
    color: "black",
  },
  closeIcon: {
    fontFamily: "CustomFont-Regular",
    fontSize: 14,
    color: "red",
    paddingLeft: 10,
  },
  selectedCategory: {
    backgroundColor: "blue",
    color: "white",
  },

  selectedText: {
    color: "white",
  },

  line: {
    height: 1,
    backgroundColor: "grey",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "right",
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'right',
    alignItems: 'right',
    alignSelf: 'right'

  },
  addItemButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "blue",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center", // Ensure the content is centered vertically
  },
  addItemText: {
    color: "white",
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    textAlignVertical: "center",
  },

  datePickerText: {
    fontFamily: "CustomFont-Regular",
    color: "grey",
  },
  descriptionContainer: {},
  descriptionInput: {
    borderRadius: 5,
    fontFamily: "CustomFont-Regular",
    fontSize: 14,
    color: "blue",
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exitButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "rgba(128, 128, 128, 0.5)",
    borderRadius: 100,
  },


});

const alertStyles = StyleSheet.create({
  container: {
    borderRadius: 10,
    backgroundColor: "white",
    borderColor: "blue",
  },
  title: {
    fontFamily: "CustomFont-Bold",
    fontSize: 14,
    color: "blue",
  },
  message: {
    fontFamily: "CustomFont-Regular",
    fontSize: 14,
    color: "black",
  },
  button: {
    fontFamily: "CustomFont-Bold",
    color: "blue",
  },
});

export default TransactionDetail;
