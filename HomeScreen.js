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
import { MaterialIcons } from '@expo/vector-icons';


//dimension width
const screenWidth = Dimensions.get('window').width;

const expenses = {
  Daily: {
    Home: '$15.75',
    Personal: '$20.50',
    Food: '$25.25'
  },
  Weekly: {
    Home: '$350.75',
    Personal: '$200.50',
    Food: '$150.25'
  },
  Monthly: {
    Home: '$1400.00',
    Personal: '$800.00',
    Food: '$600.00'
  }
};

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
  
    //chart tiles
    const chartTitle = `${selectedTab} Expenses`;

    const [tooltipPos, setTooltipPos] = useState({
      x: 0,
      y: 0,
      visible: false,
      value: ''
    });
        
    //tootltip
    const formatTooltipValue = (value) => `$${parseFloat(value).toFixed(2)}`;

    //hover

  // Function to determine color based on value exceeding quota
  const getBarColor = (value, quota) => value > quota ? 'rgba(255, 0, 0, 0.6)' : 'rgba(0, 0, 255, 0.6)';

  // Adjusting the barChartData with direct color values
  const updatedBarChartData = () => {
      const values = data[selectedTab].slice(-7).map(value => parseFloat(value.replace(/[$,]/g, '')));
      const colors = values.map(value => getBarColor(value, quotas[selectedTab]));
      return {
          labels: ["M", "T", "W", "T", "F", "S", "S"], // Example labels for days/weeks/months
          datasets: [
              {
                  data: values,
                  color: (dataPoint, index) => colors[index], // Directly apply color based on index
              },
          ],
      };
  };
  
  const barChartData = updatedBarChartData();
  



  
    

    // datapoint click
// This function is triggered when a bar is tapped
  const handleDataPointClick = (data) => {
    const { index, value } = data;
    const formattedValue = formatTooltipValue(value); // Ensure this returns the string correctly formatted
    const x = (screenWidth / barChartData.labels.length) * index + (screenWidth / barChartData.labels.length) / 2;
    const y = 0; // You might adjust this if you want the tooltip to appear over the bar
    setTooltipPos({ x, y, visible: true, value: formattedValue });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

    
  const chartConfig = {
    backgroundGradientFrom: 'white',
    backgroundGradientTo: 'white',
    fillShadowGradient: 'blue',
    fillShadowGradientOpacity: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Default color, overridden by dataset
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.3,
    barRadius: 5,
    decimalPlaces: 0,
    propsForLabels: {
        fontSize: '12',
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ffa726"
    },
    onPress: (data) => handleDataPointClick(data),

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

    {/* Updated squaresContainer to display weekly expenses */}
    <View style={styles.squaresContainer}>
        <View style={styles.square}>
          <MaterialIcons name="home" size={24} color="#0c0212" />
          <Text style={styles.squareText}>{expenses[selectedTab].Home}</Text>
        </View>
        <View style={styles.square}>
          <MaterialIcons name="person" size={24} color="#0c0212" />
          <Text style={styles.squareText}>{expenses[selectedTab].Personal}</Text>
        </View>
        <View style={styles.square}>
          <MaterialIcons name="fastfood" size={24} color="#0c0212" />
          <Text style={styles.squareText}>{expenses[selectedTab].Food}</Text>
        </View>
      </View>


    <StatusBar style="auto" />

    <View style={styles.graphSection}>
      <Text style={styles.chartTitleText}>{`${selectedTab} Expenses (in SGD)`}</Text>
      <BarChart
        style={styles.barChart}
        data={barChartData}
        width={screenWidth - 72}
        height={220}
        chartConfig={chartConfig}
        fromZero={true}
        yAxisLabel={'$'}
        showBarTops={false}
        withHorizontalLabels={true}
        segments={2}
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
      backgroundColor: '#fff',
      paddingTop: 10, // Ensuring space from the status bar or navbar if any
    },
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 40,
      paddingVertical: 10,
      paddingHorizontal: 20,
      // backgroundColor: '#f0f0f0', // A light gray background color
      borderRadius: 40,
      marginHorizontal: 10, // Adding 10 units of margin on the left and right
      // shadowColor: '#000',
      // shadowOffset: { width: 0, height: 2 },
      // shadowOpacity: 0.1,
      // shadowRadius: 3,
      // elevation: 5,
      // borderWidth: 1,
      // borderColor: 'black',
    },
    tab: {
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
    },
    selectedTab: {
      backgroundColor: 'blue',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 1.5,
      borderWidth: 1,
      borderColor: 'black',
    },
    tabText: {
      color: 'gray',
      fontFamily: 'CustomFont-Regular',
    },
    selectedTabText: {
      color: 'white',
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
    fontSize: 14,

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
    color: '#DC143C',
  },

  exceededContainer: {
    position: 'absolute',
    top: -25, // adjust as needed based on the height of the bubble
    left: 180,
    alignSelf: 'center',
    alignItems: 'center',
  },
  exceededBubble: {
    backgroundColor: '#DC143C', 
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
    backgroundColor: '#DC143C',
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
    backgroundColor: 'white', // White background for the chart area
    borderRadius: 16,
    marginHorizontal: 20, // 20 pixels margin on each side
    marginBottom: 20,
    padding: 16, 
    alignItems: 'center', 
    shadowColor: '#000',
    // elevation: 5,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'black',
  },
  squaresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Margin on sides of the container
    marginTop: 60, // Space from the date or above component
    marginBottom: 10, // Space before the graph section


  },
  square: {
    flex: 1,
    height: 80,
    backgroundColor: 'white',
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    // elevation: 5,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'black',
  },
  squareText: {
    fontSize: 16,
    color: 'gray',
    fontFamily: 'CustomFont-Regular'
  },

  // graphSection: {
  //   backgroundColor: 'white',
  //   borderRadius: 16,
  //   borderWidth: 1,
  //   borderColor: 'black',
  //   marginTop: 10, // 10 units of space between the squares and the graph
  //   padding: 16,
  //   alignItems: 'center',
  //   shadowColor: '#000',
  //   elevation: 5,
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 4,
  // },
  chartTitleText: {
    fontSize: 16,
    color: '#0c0212',
    fontFamily: 'CustomFont-Bold',
    marginBottom: 10,
  },
  barChart: {
    marginVertical: 8,
    borderRadius: 16,
    height: 230,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Making background darker for better readability
    padding: 8,
    borderRadius: 6,
    top: 10, // Adjust this to position the tooltip above the bar
    transform: [{ translateX: -50 }], // Centering tooltip over the bar
    zIndex: 1 // Ensure it is above all other components
  },
  tooltipText: {
    color: 'white',
    fontFamily: 'CustomFont-Regular',
    fontSize: 14, // Adjust size for better readability
    textAlign: 'center' // Centering text inside the tooltip
  },
  
});
