import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Image, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handlePressShutter = async () => {
    if (cameraRef.current) {
      let photo = await cameraRef.current.takePictureAsync();
      console.log(photo);
      processReceipt(photo.uri);
    }
  };

  const processReceipt = async (photoUri) => {
    try {
      let photoBase64 = await FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' });
      let res = await axios.post('https://ocr.asprise.com/api/v1/receipt', {
        'api_key': '<Your OCR Service API Key>',
        'recognizer': 'auto',
        'ref_no': 'oct_python_123',
        'file': `data:image/jpg;base64,${photoBase64}`,
      });

      let receiptData = res.data['receipts'][0];
      console.log(receiptData);
      // Further processing...
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process the receipt.');
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  if (!isFocused) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera style={styles.camera} type={type} flashMode={flashMode} ref={cameraRef}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Image source={require('./assets/cross.png')} style={styles.icon} />
          </TouchableOpacity>

          <Text style={styles.headerText}>Scan your receipts</Text>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFlashMode(
              flashMode === Camera.Constants.FlashMode.off
              ? Camera.Constants.FlashMode.on
              : Camera.Constants.FlashMode.off
            )}>
            <Image
              source={flashMode === Camera.Constants.FlashMode.off ? require('./assets/flash_off.png') : require('./assets/flash_on.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.receiptBorder} />
        <View style={styles.shutterButtonContainer}>
          <TouchableOpacity style={styles.shutterButton} onPress={handlePressShutter}>
          </TouchableOpacity>
        </View>
      </Camera>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30,
  },
  shutterButtonContainer: {
    alignSelf: 'center',
    marginBottom: 40,
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'transparent', 
    borderWidth: 3, 
    borderColor: 'white', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 70,
    height: 70,
    backgroundColor: 'white',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptBorder: {
    position: 'absolute',
    left: 30,
    right: 30,
    top: 120,
    bottom: 170,
    borderWidth: 2,
    borderColor: 'blue',
    borderRadius: 10,
    borderStyle: 'dotted' 
  },
  icon: {
    width: 24, 
    height: 24,  
    resizeMode: 'contain'
  },

  headerContainer: {
    marginTop: 50,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#DAA520',
    fontSize: 14,
    fontFamily: 'CustomFont-Regular',
  },

  iconButton: {
    padding: 10,
    borderRadius: 20,
  },
});

export default CameraScreen;
