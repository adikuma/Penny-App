import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Font from 'expo-font';
import HomeScreen from './HomeScreen';
import TransactionScreen from './TransactionScreen';
import CameraScreen from './CameraScreen';

const Tab = createBottomTabNavigator();

function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'CustomFont-Regular': require('./assets/fonts/LeagueMono-CondensedLight.ttf'),
          'CustomFont-Bold': require('./assets/fonts/LeagueMono-CondensedSemiBold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts', error);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={HomeScreen} 
          options={{
            tabBarButton: (props) => <TabBarButton {...props} label="Dashboard" />,
            tabBarStyle: styles.tabBar
          }}
        />
        <Tab.Screen 
          name="Scan" 
          component={CameraScreen} 
          options={{
            tabBarButton: (props) => <TabBarButton {...props} label="Scan" />,
            tabBarStyle: { ...styles.tabBar, display: 'none' } // Explicitly hide the tabBar for this screen
          }}
        />
        <Tab.Screen 
          name="History" 
          component={TransactionScreen} 
          options={{
            tabBarButton: (props) => <TabBarButton {...props} label="History" />,
            tabBarStyle: styles.tabBar
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const TabBarButton = ({ label, accessibilityState, onPress }) => {
  const focused = accessibilityState.selected;
  return (
    <TouchableOpacity onPress={onPress} style={focused ? styles.buttonFocused : styles.button}>
      <Text style={focused ? styles.textFocused : styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'white',
    height: 65,
    borderRadius: 30,
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'black',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'CustomFont-Regular',
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  buttonFocused: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: 'blue',
    padding: 8,
    margin: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'black',
  },
  text: {
    color: 'gray',
    fontFamily: 'CustomFont-Regular',
  },
  textFocused: {
    color: 'white',
    fontFamily: 'CustomFont-Bold',
  },
});

export default App;
