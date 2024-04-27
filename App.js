import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import GestureRecognizer from 'react-native-swipe-gestures';
import * as Haptics from 'expo-haptics';
import { FlatList } from 'react-native';
import { BlurView } from 'expo-blur';

const avatarUrl = 'https://via.placeholder.com/50';

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

const SwipeIndicator = () => {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const runAnimation = () => {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ]).start(() => runAnimation());
    };

    runAnimation();
    return () => anim.stopAnimation();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, alignItems: 'center', marginBottom: 0 }}>
      <Text style={styles.swipeText}>⟷</Text>
    </Animated.View>
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
  return (
    <TouchableOpacity
      onPress={() => console.log('Access Camera')}
      style={styles.cameraButton}
    >
      <Text style={styles.cameraButtonText}>Camera</Text>
    </TouchableOpacity>
  );
};

const OverlayView = () => {
  return (
    <View style={styles.overlay} />
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
  const [isScrolling, setIsScrolling] = useState(false);
  //blur
  const listRef = useRef(null); // Ref for the FlatList
  const blurAnim = useRef(new Animated.Value(0)).current; // Controls the blur opacity

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

  const onSwipeLeft = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const onSwipeRight = () => {
    if (currentIndex < data[selectedTab].length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80
  };

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <TabBar
        tabs={['Daily', 'Weekly', 'Monthly']}
        selectedTab={selectedTab}
        onSelect={setSelectedTab}
      />
      <GestureRecognizer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        config={config}
        style={styles.valueContainer}
      >
        <Animated.Text style={[styles.valueText, { opacity: fadeAnim }]}>{value}</Animated.Text>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </GestureRecognizer>
      <SwipeIndicator />
      <StatusBar style="auto" />
      <Text style={styles.sectionTitle}>Transactions</Text>
      <View style={styles.customLine} />
      <View style={styles.transactionList}>
      <FlatList
        data={combinedTransactions}
        keyExtractor={item => item.id}
        
        renderItem={({ item }) => (
          <TransactionItem
            title={item.title}
            subtitle={item.subtitle}
            amount={item.amount}
            date={item.date}
            avatarUrl={item.avatarUrl} 
          />
        )}
        onScroll={handleScroll}
        scrollEventThrottle={1}
      />
      <Animated.View
        style={[
          styles.blurOverlay,
          {
            opacity: blurAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={50} 
        />
      </Animated.View>
      </View>
      <CameraButton />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  swipeText: {
    color: '#ccc',
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 20,
    paddingLeft: 20,
    marginTop: 40,
    marginBottom: 20,
    backgroundColor: 'white',
    fontFamily: 'CustomFont-Bold',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 0.5, 
    borderColor: 'black',
    borderRadius: 20, 
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10
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
  cameraIcon: {
    width: 30,  
    height: 30, 
  },

  blurOverlay: {
    position: 'absolute',
    bottom: 0, // Align it at the bottom
    left: 0,
    right: 0,
    height: 200, // The height of the blur effect (you can adjust this)
  },

});


