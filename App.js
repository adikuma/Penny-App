import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen';
import TransactionScreen from './TransactionScreen';
import CameraScreen from './CameraScreen';

const Tab = createBottomTabNavigator();

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#e91e63',
          tabBarShowLabel: true,
          tabBarStyle: { ...styles.tabBar },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}>
                <Image
                  source={require('./assets/home.png')}
                  style={styles.icon}
                />
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{
            tabBarLabel: 'Camera',
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}>
                <Image
                  source={require('./assets/camera.png')}
                  style={styles.icon}
                />
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Transactions" 
          component={TransactionScreen}
          options={{
            tabBarLabel: 'Transactions',
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}>
                <Image
                  source={require('./assets/history.png')}
                  style={styles.icon}
                />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
    borderRadius: 30,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  iconText: {
    fontSize: 10,
    color: '#2c3e50'
  }
});

export default App;
