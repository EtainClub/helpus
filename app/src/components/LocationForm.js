import React, { useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Alert } from 'react-native';
import { Input, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

const LocationForm = (props) => {
  // setup language
  const { t } = useTranslation();
  // to check the main item
  const [checked, setCheck] = useState(false);
  const [location, setLocation] = useState(props.item);
  // id to show at front
  const id = props.id + 1;

  const updateLocation = (value) => {
    console.log('[LocationForm] value', value);
    setLocation(value);
    props.handleStateChange(props.id, value);
  }

  const onSearchPress = async () => {
    // get location permission for android device
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) { 
          if (__DEV__) Alert.alert("Location Permission Granted.");
          // navigate to the location screen
          props.navigation.navigate('LocationVerify', { id: props.id })
        }
        else {
          Alert.alert(
            t('LocationScreen.permissionFail'),
            t('LocationScreen.permissionFailText'),
            [
              {text: t('confirm')}
            ],
            {cancelable: true},
          );
        }
      } catch (err) {
        console.warn(err);
      }  
    } else if (Platform.OS === 'ios') {
      // navigate to the location screen
      props.navigation.navigate('LocationVerify', { id: props.id });
    }
  };

  showLocationWithPlaceholder = (id) => {
    return (
        <Input
          placeholder={props.placeholder}
          containerStyle={{ flex: 1 }}
          value={location}
          disabled
          onChangeText={updateLocation}
          autoCapitalize="none"
          autoCorrect={false}
          rightIcon={
            <Icon name='add-location' size={20} color='black' 
              onPress={onSearchPress} 
            />
          }
        />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.id}>{id}</Text>
      {showLocationWithPlaceholder(id)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  id: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'center',
  }
});

export default LocationForm;