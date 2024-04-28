import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, 
  Animated, TextInput, Image, ImageBackground, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import GestureRecognizer from 'react-native-swipe-gestures';
import * as Haptics from 'expo-haptics';
import { launchCamera } from 'react-native-image-picker';
import Svg, { Circle } from 'react-native-svg';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

//dimension width
const screenWidth = Dimensions.get('window').width;


const data = {
  Daily: ['$156.28', '$162.47', '$174.52', '$180.66', '$195.85', '$50.58', '$20.14', '$60.29', '$132.68', '$160.92'],
  Weekly: ['$320.58', '$330.14', '$540.29', '$355.68', '$360.92', '$320.58', '$330.14', '$440.29', '$355.68', '$360.92'],
  Monthly: ['$883.21', '$892.34', '$900.12', '$910.48', '$925.67', '$1220.12', '$1210.48', '$2100.67']
};


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


//exceed bubble
const ExceededIndicator = ({ amount }) => {
    return (
      <View style={styles.exceededContainer}>
        <View style={styles.exceededBubble}>
          <Text style={styles.bubbleText}>Exceeded by ${Math.ceil(amount)}</Text>
        </View>
        <View style={styles.exceededArrow} />
      </View>
    );
  };
  

  
//homescreen
export default function HomeScreen({ navigation }) { 

    const quotas = {
        Daily: 70,
        Weekly: 500,
        Monthly: 1500
    };

    const [selectedTab, setSelectedTab] = useState('Daily');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [value, setValue] = useState(data[selectedTab][currentIndex]);
    const [date, setDate] = useState(new Date());
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const remainingQuota = quotas[selectedTab] - parseFloat(value.substring(1).replace(/,/g, ''));
    const progress = (remainingQuota / quotas[selectedTab]) * 100;
    const quotaExceeded = remainingQuota < 0;
    const quotaTextStyle = quotaExceeded ? styles.quotaExceeded : styles.valueText;
    const [selectedValue, setSelectedValue] = useState("");
    const [tooltipPos, setTooltipPos] = useState({
        x: 0,
        y: 0,
        visible: false,
        value: ''
      });    
    //tootltip
    const formatTooltipValue = (value) => `$${parseFloat(value).toFixed(2)}`;

    //hover
    const handleDataPointClick = (data) => {
        const { index, x, y, value } = data;
        // Display tooltip at the right position - You'll need to adjust x and y according to your graph's layout and dimensions
        setTooltipPos({ x: x, y: y - 30, visible: true, value: `$${value.toFixed(2)}` });
        // Impact feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      };
    

    //chart data
    const barChartData = {
        datasets: [
          {
            data: data[selectedTab].slice(-5).map(value => parseFloat(value.replace(/[$,]/g, ''))),
          },
        ],
      };

    // datapoint click
    const handleBarDataPointClick = (data) => {
        const { index, value } = data;
        const x = (screenWidth / barChartData.labels.length) * index + (screenWidth / barChartData.labels.length) / 2;
        const y = 0; // Static Y position, as tooltip will show at the top or bottom
        setTooltipPos({ x: x, y: y, visible: true, value: formatTooltipValue(value) });
        // Impact feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

//   const remainingQuota = quotas[selectedTab] - parseFloat(value.substring(1).replace(/,/g, '')); 
//   const quotaExceeded = remainingQuota < 0; // Check if quota is exceeded
//   const quotaTextStyle = quotaExceeded ? styles.quotaExceeded : styles.valueText;

// Within your HomeScreen component, ensure to render the ProgressBar conditionally if needed
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
        <Animated.Text style={[quotaTextStyle, { opacity: fadeAnim }]}>
          {value}
        </Animated.Text>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        {quotaExceeded && <ExceededIndicator amount={Math.abs(remainingQuota)} />}
      </GestureRecognizer>
      <StatusBar style="auto" />
      <View style={styles.graphSection}>
      <BarChart
            data={barChartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="$"
            chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                borderRadius: 20,
                },
                propsForBackgroundLines: {
                strokeWidth: 0
                }
            }}
            style={{
                marginVertical: 8,
                borderRadius: 16,
            }}
            fromZero={true}
            showValuesOnTopOfBars={true}
            onDataPointClick={handleBarDataPointClick}
            />
        {tooltipPos.visible && (
          <View style={[styles.tooltip, { top: tooltipPos.y, left: tooltipPos.x }]}>
            <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
          </View>
        )}
      </View>
    </View>
  );
};


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

  cameraIcon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },

  quotaExceeded: {
    fontSize: 64,
    fontFamily: 'CustomFont-Bold',
    color: 'red',
  },

  exceededContainer: {
    position: 'absolute',
    top: -25, // adjust as needed based on the height of the bubble
    left: 180,
    alignSelf: 'center',
    alignItems: 'center',
  },
  exceededBubble: {
    backgroundColor: '#FF4136', 
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  exceededArrow: {
    backgroundColor: '#FF4136',
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 23,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  bubbleText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'CustomFont-Regular',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between', 
  },
  graphSection: {
    alignItems: 'center', // This centers the LineChart in the middle of the view
    marginTop: 40, // You can adjust this to control the spacing
    marginBottom: 20,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 4,
    top: 10, // you can adjust this value as needed
    transform: [{ translateX: -40 }], 
  },
  tooltipText: {
    color: 'white',
    fontFamily: 'CustomFont-Regular',
  },


});





