import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, 
  Animated, TextInput, Image, ImageBackground
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import GestureRecognizer from 'react-native-swipe-gestures';
import * as Haptics from 'expo-haptics';
import { FlatList } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';

const data = {
  Daily: ['$156.28', '$162.47', '$174.52', '$180.66', '$195.85'],
  Weekly: ['$320.58', '$330.14', '$340.29', '$355.68', '$360.92'],
  Monthly: ['$883.21', '$892.34', '$900.12', '$910.48', '$925.67']
};

const transactions = [
  { id: '1', title: 'Sony Playstation', subtitle: 'Fifa 2022 Game', amount: '-$53.95', date: 'March 14, 2021' },
  { id: '2', title: 'Bank Transfer', subtitle: 'Salary for March', amount: '+$2500.95', date: 'April 14, 2021' },
  { id: '7', title: 'Book Store', subtitle: 'Learning React Native', amount: '-$39.99', date: 'February 10, 2021' },
  { id: '8', title: 'Grocery', subtitle: 'Weekly Food Supplies', amount: '-$76.23', date: 'February 12, 2021' },
  { id: '9', title: 'Gym Membership', subtitle: 'Monthly Subscription', amount: '-$25.00', date: 'February 15, 2021' },
  { id: '10', title: 'Online Course', subtitle: 'Advanced Photography', amount: '-$19.99', date: 'February 18, 2021' },
  { id: '11', title: 'Taxi Ride', subtitle: 'Cab to Airport', amount: '-$29.80', date: 'February 19, 2021' },
  { id: '12', title: 'Pet Supplies', subtitle: 'Dog Food & Toys', amount: '-$45.75', date: 'February 21, 2021' },
];

const formatDate = (date) => {
  const suffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
  const day = date.getDate();
  const dateSuffix = suffix[(day % 10) > 3 ? 0 : (day % 100 - day % 10 !== 10) * (day % 10)];
  return (
    <Text>
      {`${day}${dateSuffix} `}
      <Text style={{ color: 'blue' }}>{date.toLocaleString('en-us', { month: 'long' })}</Text>
      {`, ${date.getFullYear()}`}
    </Text>
  );
};

const TabBar = ({ tabs, onSelect, selectedTab }) => {
  const handlePress = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(tab);
  };

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            selectedTab === tab && styles.selectedTab
          ]}
          onPress={() => handlePress(tab)}
        >
          <Text style={[
            styles.tabText,
            selectedTab === tab && styles.selectedTabText
          ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


const TransactionItem = ({ title, subtitle, amount, date }) => {
  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={styles.avatar} />
      <View style={styles.transactionTextContent}>
        <Text style={styles.transactionTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.transactionSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionAmount}>{amount}</Text>
        <Text style={styles.transactionDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const CameraButton = () => {
  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      cameraType: 'back',
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera picker');
      } else if (response.error) {
        console.log('CameraPicker Error: ', response.error);
      } else {
        const source = { uri: response.assets[0].uri };
        console.log('Camera photo: ', source);
      }
    });
  };

  return (
    <TouchableOpacity onPress={openCamera} style={styles.cameraButton}>
      <Image
        style={styles.cameraIcon}
        source={{ uri: 'https://img.icons8.com/deco/48/camera.png' }}
      />
    </TouchableOpacity>
  );
};

export default function App() {
  const [selectedTab, setSelectedTab] = useState('Daily');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [value, setValue] = useState(data[selectedTab][currentIndex]);
  const [date, setDate] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const combinedTransactions = [...transactions];
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  //blur
  const blurAnim = useRef(new Animated.Value(0)).current;

  //blur
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const viewHeight = event.nativeEvent.layoutMeasurement.height;
    const bottomDistance = contentHeight - viewHeight - offsetY;
    const blurOpacity = bottomDistance < 100 ? (100 - bottomDistance) / 200 : 0;
    blurAnim.setValue(blurOpacity);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('http://192.168.50.240:3000/getTransactions');
        if (response.status === 200) {
          console.log("Fetched transactions:", response.data);
          setTransactions(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
    };
    fetchTransactions();
  }, []);
  
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'CustomFont-Regular': require('./assets/fonts/LeagueMono-CondensedLight.ttf'),
        'CustomFont-Bold': require('./assets/fonts/LeagueMono-CondensedSemiBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'CustomFont-Regular': require('./assets/fonts/LeagueMono-CondensedLight.ttf'),
        'CustomFont-Bold': require('./assets/fonts/LeagueMono-CondensedSemiBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      setSearchQuery('');
    }
  };

  useEffect(() => {
    setValue(data[selectedTab][currentIndex]);
    updateDate(currentIndex);
    fadeIn();
  }, [selectedTab, currentIndex]);

  const updateDate = (index) => {
    const today = new Date();
    if (selectedTab === 'Daily') {
      today.setDate(today.getDate() - index);
    } else if (selectedTab === 'Weekly') {
      today.setDate(today.getDate() - (index * 7));
    } else if (selectedTab === 'Monthly') {
      today.setMonth(today.getMonth() - index);
    }
    setDate(today);
  };

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  };

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }


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
            <TouchableOpacity onPress={toggleSearchMode} style={styles.closeSearch}>
              <Text style={styles.closeSearchText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <TouchableOpacity onPress={toggleSearchMode} style={styles.searchIconContainer}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={styles.customLine} />
      <View style={styles.transactionList}>
      <FlatList
  data={transactions}
      keyExtractor={(item) => item._id ? item._id.toString() : Math.random().toString()}
      renderItem={({ item }) => (
        <TransactionItem
          title={item.title}
          subtitle={item.subtitle}
          amount={item.amount}
          date={item.date}
        />
      )}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

      </View>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%'
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 80,
    borderRadius: 20,
  },
  
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTab: {
    backgroundColor: '#ffffff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  tabText: {
    color: 'gray',
    fontFamily: 'CustomFont-Regular',
  },
  selectedTabText: {
    color: 'blue',
  },
  valueContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  valueText: {
    fontSize: 64,
    fontFamily: 'CustomFont-Bold',
    color: '#0c0212',
  },
  dateText: {
    fontFamily: 'CustomFont-Regular',
    color: 'gray',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 0.5, 
    borderColor: 'black',
    backgroundColor: '#fff',
    borderRadius: 20, 
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,

  },
  transactionTextContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  transactionTitle: {
    fontFamily: 'CustomFont-Bold',
    fontSize: 16,
    color: '#000',
    maxWidth: '70%',
  },
  transactionSubtitle: {
    fontFamily: 'CustomFont-Regular',
    fontSize: 14,
    color: 'gray',
    maxWidth: '70%',
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontFamily: 'CustomFont-Bold',
    fontSize: 16,
    color: '#000',
  },
  transactionDate: {
    fontFamily: 'CustomFont-Regular',
    fontSize: 14,
    color: 'gray',
  },
  transactionList: {
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'blue',
    marginRight: 10,
  },
  customLine: {
    height: 1, 
    backgroundColor: 'gray',
    width: '100%' 
  },
  cameraButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,  
    width: 60,  
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#0c0212',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 16,
    flex: 1,
    paddingLeft: 10,
    marginTop: 40,
    marginBottom: 20,
    fontFamily: 'CustomFont-Bold',
  },
  searchIconContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: 'blue',
    borderRadius: 20,
  },
  searchButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'CustomFont-Regular',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginTop: 40,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 10,
    fontFamily: 'CustomFont-Regular',
  },

  closeSearch: {
    marginLeft: 5,
    marginRight: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSearchText: {
    fontSize: 16,
    color: '#000',
  },

  cameraIcon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },

});





