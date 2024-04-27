import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import GestureRecognizer from 'react-native-swipe-gestures';
import * as Haptics from 'expo-haptics';


const data = {
  Daily: ['$156.28', '$162.47', '$174.52', '$180.66', '$195.85'],
  Weekly: ['$320.58', '$330.14', '$340.29', '$355.68', '$360.92'],
  Monthly: ['$883.21', '$892.34', '$900.12', '$910.48', '$925.67']
};

const formatDate = (date) => {
  const suffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
  const day = date.getDate();
  const dateSuffix = suffix[(day % 10) > 3 ? 0 : (day % 100 - day % 10 !== 10) * (day % 10)];
  return `${day}${dateSuffix} ${date.toLocaleString('en-us', { month: 'long' })}, ${date.getFullYear()}`;
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

export default function App() {
  const [selectedTab, setSelectedTab] = useState('Daily');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [value, setValue] = useState(data[selectedTab][currentIndex]);
  const [date, setDate] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(1)).current; // Initial opacity

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

  useEffect(() => {
    setValue(data[selectedTab][currentIndex]);
    updateDate(currentIndex);
    fadeIn(); // Trigger fade in whenever the index changes
  }, [selectedTab, currentIndex]);

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
      <StatusBar style="auto" />
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
    marginTop: 20,
  },
  valueText: {
    fontSize: 64,
    fontFamily: 'CustomFont-Bold',
    color: '#0c0212',
  },
  dateText: {
    fontFamily: 'CustomFont-Regular',
    color: 'gray',
    marginTop: 2,
  },
});
