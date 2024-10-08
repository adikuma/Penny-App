import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  TextInput,
  Image,
  ImageBackground,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import * as Font from "expo-font";
import * as Haptics from "expo-haptics";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const TransactionItem = ({ item }) => {
  const navigation = useNavigation();
  const [isImageModalVisible, setImageModalVisible] = useState(false);

  const handleImageClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageModalVisible(true);
};

  const handleCloseModal = () => {
    setImageModalVisible(false);
  };

  const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };
  
  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate("TransactionDetail", { item });
      }}
    >
      <TouchableOpacity onPress={handleImageClick}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
      </TouchableOpacity>
      <View style={styles.transactionTextContent}>
        <Text style={styles.transactionTitle}>{item.storeName}</Text>
        <Text style={styles.transactionSubtitle}>{item.description}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionAmount}>{item.total}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <ImageModal
        visible={isImageModalVisible}
        imageUrl={item.imageUrl}
        onClose={handleCloseModal}
      />
    </TouchableOpacity>
  );
};

const ImageModal = ({ visible, imageUrl, onClose }) => {
  const handleCloseModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image source={{ uri: imageUrl }} style={styles.modalImage} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseModal}
          >
            <Text style={styles.closeButtonText}>x</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function App() {
  const [selectedTab, setSelectedTab] = useState("Daily");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [transactions, setTransactions] = useState([]); // Moved transactions state declaration here
  const combinedTransactions = [...transactions]; // Moved combinedTransactions declaration here
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const blurAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const viewHeight = event.nativeEvent.layoutMeasurement.height;
    const bottomDistance = contentHeight - viewHeight - offsetY;
    const blurOpacity = bottomDistance < 100 ? (100 - bottomDistance) / 200 : 0;
    blurAnim.setValue(blurOpacity);
  };

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const response = await axios.get(
          "http://192.168.50.240:3000/getTransactions"
        );
        if (response.status === 200 && response.data) {
          console.log("Fetched transactions from MongoDB:", response.data);
          setTransactions(response.data);
        } else {
          setError("No data received");
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setError("Failed to load transactions");
      }
      setIsLoading(false);
    }

    fetchTransactions();
  }, []);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "CustomFont-Regular": require("./assets/fonts/LeagueMono-CondensedLight.ttf"),
        "CustomFont-Bold": require("./assets/fonts/LeagueMono-CondensedSemiBold.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      setSearchQuery("");
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("http://192.168.50.240:3000/getTransactions");
      if (response.status === 200) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);


    //refresh
    const onRefresh = React.useCallback(() => {
      setRefreshing(true);
      fetchTransactions().then(() => setRefreshing(false));
    }, []);
  

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter((transaction) =>
        transaction.storeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  useEffect(() => {
    updateDate(currentIndex);
    fadeIn();
  }, [selectedTab, currentIndex]);

  const updateDate = (index) => {
    const today = new Date();
    if (selectedTab === "Daily") {
      today.setDate(today.getDate() - index);
    } else if (selectedTab === "Weekly") {
      today.setDate(today.getDate() - index * 7);
    } else if (selectedTab === "Monthly") {
      today.setMonth(today.getMonth() - index);
    }
    setDate(today);
  };

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  const sortedTransactions = transactions.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB - dateA;
  });

  const sortedFilteredTransactions = filteredTransactions.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB - dateA;
  });
  console.log('Sorted: ', {sortedTransactions});


  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {isSearchMode ? (
          <View style={styles.searchBarContainer}>
            <TextInput
              autoFocus
              placeholder="Search..."
              style={styles.searchBar}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={toggleSearchMode}
              style={styles.closeSearch}
            >
              <Text style={styles.closeSearchText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity
              onPress={toggleSearchMode}
              style={styles.searchIconContainer}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={styles.customLine} />
      <View style={styles.transactionList}>
      <FlatList
          data={searchQuery.trim() === "" ? sortedTransactions : sortedFilteredTransactions}
          keyExtractor={(item) =>
            item._id ? item._id.toString() : Math.random().toString()
          }
          renderItem={({ item }) => <TransactionItem item={item} />}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 80,
    borderRadius: 20,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedTab: {
    backgroundColor: "#ffffff",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  tabText: {
    color: "gray",
    fontFamily: "CustomFont-Regular",
  },
  selectedTabText: {
    color: "blue",
  },
  valueContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  valueText: {
    fontSize: 64,
    fontFamily: "CustomFont-Bold",
    color: "#0c0212",
  },
  dateText: {
    fontFamily: "CustomFont-Regular",
    color: "gray",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 0.5,
    borderColor: "black",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  transactionTextContent: {
    flex: 1,
    justifyContent: "center",
    marginRight: 10,
  },
  transactionTitle: {
    fontFamily: "CustomFont-Bold",
    fontSize: 16,
    color: "#000",
    maxWidth: "70%",
  },
  transactionSubtitle: {
    fontFamily: "CustomFont-Regular",
    fontSize: 14,
    color: "gray",
    maxWidth: "70%",
  },
  transactionDetails: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontFamily: "CustomFont-Bold",
    fontSize: 16,
    color: "#000",
  },
  transactionDate: {
    fontFamily: "CustomFont-Regular",
    fontSize: 14,
    color: "gray",
  },
  transactionList: {
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "blue",
    marginRight: 10,
  },
  customLine: {
    height: 1,
    backgroundColor: "gray",
    width: "100%",
  },
  cameraButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0c0212",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 20,
    marginTop: 60,
  },
  sectionTitle: {
    fontSize: 20, // Adjusted for better fit
    flex: 1,
    fontFamily: "CustomFont-Bold",
  },
  searchIconContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: "blue",
    borderRadius: 20,
  },
  searchButtonText: {
    fontSize: 14,
    color: "white",
    fontFamily: "CustomFont-Regular",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 14,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    fontFamily: "CustomFont-Regular",
  },

  closeSearch: {
    marginLeft: 5,
    marginRight: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeSearchText: {
    fontSize: 16,
    color: "#000",
  },

  cameraIcon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalImage: {
    width: 300,
    height: 300,
    resizeMode: "cover",
    borderRadius: 20,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(128, 128, 128, 0.5)",
    borderRadius: 20,
    paddingHorizontal: 16,
    padding: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
});
