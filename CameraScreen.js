import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Image, Alert, Modal } from 'react-native';
import { Camera } from 'expo-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import PhotoReviewScreen from './PhotoReviewScreen';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off); // State to track flash mode
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back); // State to track camera type
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const [photo, setPhoto] = useState(null);

  const handlePressShutter = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      setPhoto(photo);
    } else {
      Alert.alert('Camera not ready', 'Please wait for the camera to be ready.');
    }
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null); // Clear the photo and return to the camera view
  };

  const handleUsePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const localUri = photo.uri;
      const filename = localUri.split('/').pop();
      const newPath = FileSystem.documentDirectory + filename;
  
      await FileSystem.moveAsync({
        from: localUri,
        to: newPath,
      });
  
      const data = new FormData();
      data.append('image', {
        uri: newPath,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      });
      data.append('description', 'This is a test description');
  
      const response = await fetch('http://192.168.50.240:5000/process_receipt', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.ok) {
        const jsonResponse = await response.json();
        console.log(jsonResponse);
        Alert.alert('Success', 'Receipt processed successfully');
        setPhoto(null);
        navigation.navigate('PhotoReview', { ocrData: jsonResponse }); // Make sure this matches the screen name in the stack navigator
      } else {    
        console.error('Failed to process the receipt.');
        Alert.alert('Error', 'Failed to process the receipt.');
      }
    } catch (error) {
      console.error('Error handling in handleUsePhoto:', error);  
      Alert.alert('Error', error.message);
    }
  };
  
  const toggleFlash = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  const toggleCamera = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Use Heavy impact for significant actions
            navigation.goBack();
        }}>
          <Image style={styles.icon} source={require('./assets/cross.png')} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Scan your receipts</Text>
        <TouchableOpacity onPress={toggleFlash}>
          <Image style={styles.icon} source={flashMode === Camera.Constants.FlashMode.off ? require('./assets/flash_off.png') : require('./assets/flash_on.png')} />
        </TouchableOpacity>
      </View>
      {!photo && isFocused && (
        <View style={styles.cameraContainer}>
          <Camera style={styles.camera} type={cameraType} ref={cameraRef} flashMode={flashMode}>
          </Camera>
        </View>
      )}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.shutterButton} onPress={handlePressShutter}>
            <View style={styles.innerCircle} /> 
          </TouchableOpacity>
          <TouchableOpacity style={styles.reverseButton} onPress={toggleCamera}>
            <Image style={styles.reverseIcon} source={require('./assets/reverse.png')} />
          </TouchableOpacity>
        </View>
      </View>
          {photo && (
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!photo}
        onRequestClose={() => setPhoto(null)}
      >
        <View style={styles.previewContainer}>
        <Text style={styles.previewText}>Preview of your captured photo!</Text>
          <Image style={styles.previewImage} source={{ uri: photo.uri }} />
          <View style={styles.previewButtonContainer}>
            <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={handleRetry}>
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.usePhotoButton]} onPress={handleUsePhoto}>
              <Text style={styles.buttonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
    marginVertical: 20, 
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 50,
    marginBottom: 10,
    backgroundColor: 'black',
  },
  footer: {
    bottom: 20, 
    marginTop: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'black',
  },

  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  reverseIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  iconShutter: {
    width: 70,
    height: 70,
  },
  shutterButton: {
    alignItems: 'center',
  },
  headerText: {
    color: 'yellow',
    fontSize: 14,
    fontFamily: 'CustomFont-Regular',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', 
    padding: 20,
    borderRadius: 20, // Adding rounded corners to the container as well
  },
  previewImage: {
    flex: 1,
    width: '90%', 
    maxHeight: '70%', // Adjusting the max height
    borderRadius: 20, // Adding rounded corners to the image
    borderWidth: 1,
    borderColor: 'black',
  },
  previewButtonContainer: {
    width: '100%', 
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 10, // Padding at the bottom
    
  },
  button: {
    borderRadius: 30, // Rounded corners
    paddingVertical: 10, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
    marginHorizontal: 10, // Margin between buttons
    marginVertical: 20, // Margin between buttons
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    backgroundColor: 'blue', 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    borderWidth: 1,
    borderColor: 'black',
  },
  buttonText: {
    color: 'white', 
    fontFamily: 'CustomFont-Regular',
    fontSize: 14,
  },
  shutterButton: {
    width: 80, 
    height: 80,
    backgroundColor: 'transparent', 
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 70,
    height: 70,
    backgroundColor: 'white',
    borderRadius: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reverseButton: {
    position: 'absolute',
    left: 120,
    padding: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    borderRadius: 100
  },
  previewText: {
    color: 'blue',
    fontFamily: 'CustomFont-Regular',
    fontSize: 16,
    marginBottom: 10,
  },  
});

export default CameraScreen;
