import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import firebase from 'react-native-firebase'; 
import { Button, Text } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import { GEOCODING_API_KEY } from 'react-native-dotenv';

import { Context as ProfileContext } from '../context/ProfileContext';
const LocationScreen = ({ navigation }) => {
  // get navigation params
  const locationId = navigation.getParam('id');
  console.log('locationId', locationId);

  // setup language
  const { t } = useTranslation();
  const language = i18next.language;
  // use context
  const { state, verifyLocation } = useContext(ProfileContext);
  // use state
  const [mapMargin, setMapMargin] = useState(1);
//  const [position, setPosition] = useState({ latitude: 0, longitude: 0 });
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({});
  // position delta constants
  const latitudeDelta = 0.01;
  const longitudeDelta = 0.01;

  // use effect
  useEffect(() => {
    console.log('LocationScreen');
    // get current latitude and longitude
    const watchId = Geolocation.watchPosition(
      pos => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        // @test
        /*
        const INIT_REGION = {
          latitude: 37.25949,
          latitudeDelta: 0.01,
          longitude: 127.046638,
          longitudeDelta: 0.01
        };
        setLatitude(INIT_REGION.latitude);
        setLongitude(INIT_REGION.longitude);
        console.log('latitude', latitude);
        console.log('longitude', longitude);
        */
      },
      error => setError(error.message)
    );

    // init geocoding
    initGeocoding();

    // unsubscribe geolocation
    return () => Geolocation.clearWatch(watchId);
  }, []);

  const initGeocoding = () => {
    Geocoder.init(GEOCODING_API_KEY, { language: language }); 
    // get intial address
    Geocoder.from(latitude, longitude)
      .then(json => {
        const addrComponent = json.results[0].address_components[1];
        console.log('addr json', json);
        console.log('addr', addrComponent);
      })
      .catch(error => console.warn(error));
  };

  // convert the location to address using geocoding
  const onRegionChange = (event) => {
    console.log('on region change event', event);
    console.log('lat', latitude);
    console.log('long', longitude);
  };

  const onRegionChangeComplete = () => {
    console.log('onRegionChangeComplete');
    // get intial address
    Geocoder.from(latitude, longitude)
    .then(json => {
      console.log('[onRegionChangeComplete] json', json);
      const name = json.results[0].address_components[1].short_name;
      const district = json.results[0].address_components[2].short_name;
      const city = json.results[0].address_components[3].short_name;
      const state = json.results[0].address_components[4].short_name;
      const country = json.results[0].address_components[5].short_name;
      // for address display
      let display = '';
      switch (language) {
        case 'ko':
          display = (district + ' ' + name);
          break;
        default:
          display = (name + ', ' + district);
          break;
      }
      const addr = {
        name: name,
        district: district,
        city: city,
        state: state,
        country: country,
        display: display
      };
      setAddress(addr);
    })
    .catch(error => console.warn(error));  
  };

  const onMapPress = (event) => {
    console.log('map press coordinate', event.nativeEvent.coordinate);
    console.log('language', language);

    // get intial address
    // @todo change lat and long if you want to update the address with map press event
    Geocoder.from(latitude, longitude)
    .then(json => {
      const name = json.results[0].address_components[1].short_name;
      const district = json.results[0].address_components[2].short_name;
      const city = json.results[0].address_components[3].short_name;
      const state = json.results[0].address_components[4].short_name;
      const country = json.results[0].address_components[5].short_name;
       // for address display
       let display = '';
       switch (language) {
         case 'ko':
           display = (district + ' ' + name).substring(25);
           break;
         default:
           display = (name + ', ' + district).substring(25);
           break;
       }
       const addr = {
         name: name,
         district: district,
         city: city,
         state: state,
         country: country,
         display: display
       };
       setAddress(addr); 
    })
    .catch(error => console.warn(error)); 
  }
  
  const onVerify = () => {
    console.log('verify button clicked');
    // get reference to the current user
    const { currentUser } = firebase.auth();
    const userId = currentUser.uid;
    // update location
    verifyLocation({ id: locationId, address: address, userId });
    // set params
    navigation.navigate('ProfileContract');
  };

  const showMap = () => {
    if (Platform.OS === 'android') {
      return (
        <View>
          <MapView
            style={{ height: 280, marginBottom: mapMargin }}
            provider={PROVIDER_GOOGLE}
            showsMyLocationButton
            mapType="standard"
            loadingEnabled
            showsUserLocation
            region={{
              latitude: latitude,
              longitude: longitude,
              latitudeDelta: latitudeDelta,
              longitudeDelta: longitudeDelta
            }}
            onRegionChange={onRegionChange}
            onRegionChangeComplete={onRegionChangeComplete}
            onPress={e => onMapPress(e)}
            onMapReady={() => setMapMargin(0)}
          >
            <Marker
              coordinate={{ latitude, longitude }}
            />
          </MapView>
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 20 }}>
              <Text style={{ paddingLeft: 5, fontSize: 20 }}>{t('LocationScreen.currentAddress')}</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{address.display}</Text>
            </View>
            <Button
              title={t('LocationScreen.verify')}
              type="solid"
              onPress={onVerify}
            />
          </View>
        </View>  
      );
    } else if (Platform.OS === 'ios') {
      return (
        <View>
          <MapView
            style={{ height: 280, marginBottom: mapMargin }}
            showsMyLocationButton
            mapType="standard"
            loadingEnabled
            showsUserLocation
            region={{
              latitude: latitude,
              longitude: longitude,
              latitudeDelta: latitudeDelta,
              longitudeDelta: longitudeDelta
            }}
            onRegionChange={onRegionChange}
            onRegionChangeComplete={onRegionChangeComplete}
            onPress={e => onMapPress(e)}
            onMapReady={() => setMapMargin(0)}
          >
            <Marker
              coordinate={{ latitude, longitude }}
            />
          </MapView>
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 20 }}>
              <Text style={{ fontSize: 20 }}>{t('LocationScreen.currentAddress')}</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{address.display}</Text>
            </View>
            <Button
              title={t('LocationScreen.verify')}
              type="solid"
              onPress={onVerify}
            />
          </View>
        </View>
      );
    }
  };
  
  return showMap();
}

LocationScreen.navigationOptions = () => {
  return {
    title: i18next.t('LocationScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  }
};


const styles = StyleSheet.create({
  mapContainer: {
    height: 250,
    alignItems: 'center'
  },
  buttonContainer: {
    position: 'absolute',
    top: '65%',
    right: '3%'
  }
});

export default LocationScreen;