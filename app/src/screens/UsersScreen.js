import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Platform, FlatList, TouchableOpacity } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import firebase from 'react-native-firebase'; 
import { Text, Card, ListItem, Avatar, CheckBox, Icon, Badge } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import { GEOCODING_API_KEY } from 'react-native-dotenv';
import { ScrollView } from 'react-native-gesture-handler';

import { Context as ProfileContext } from '../context/ProfileContext';
const UsersScreen = ({ navigation }) => {
  // get navigation params
  const locationId = navigation.getParam('id');
  console.log('locationId', locationId);

  // setup language
  const { t } = useTranslation();
  const language = i18next.language;
  // use context
  const { state, findUsers } = useContext(ProfileContext);
  // use state

  const INIT_REGION = {
    latitude: 37.25949,
    latitudeDelta: 0.01,
    longitude: 127.046638,
    longitudeDelta: 0.01
  };

  const [region, setRegion] = useState(null);
  const [mapMargin, setMapMargin] = useState(1);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [multiLang, setMultiLang] = useState(null);

  // componentDidMount
  useEffect(() => {
    console.log('UserScreen');
    // @DB: initialize regions collection
    //if (0) initRegions();

    // get current location
    const watchId = Geolocation.watchPosition(
      pos => {
        const newRegion = {
          latitude: __DEV__ ? INIT_REGION.latitude : pos.coords.latitude,
          latitudeDelta: INIT_REGION.latitudeDelta,
          longitude: __DEV__ ? INIT_REGION.longitude : pos.coords.longitude,
          longitudeDelta: INIT_REGION.longitudeDelta
        }
        setRegion(newRegion);
        // init geocoding
        initGeocoding(newRegion);
      },
      error => setError(error.message)
    );

    // unsubscribe geolocation
    return () => Geolocation.clearWatch(watchId);
  }, []);

  // handler for multiLang change
  useEffect(() => {
    console.log('[useEffect] multi Language?', multiLang);
    if (multiLang !== null) {
      onRegionChangeComplete();
    }
  }, [multiLang]);

  const initGeocoding = (region) => {
    Geocoder.init(GEOCODING_API_KEY, { language }); 
    console.log('[initGeocoding] region', region);
    // get intial address
    Geocoder.from(region.latitude, region.longitude)
      .then(json => {
        const addrComponent = json.results[0].address_components[1];
      })
      .catch(error => console.warn(error));
  };

  // convert the location to address using geocoding
  const onRegionChange = (regionEvent) => {
    // @todo consider use set timer to make updated less
    setRegion(regionEvent)
  };

  const onRegionChangeComplete = (event) => {
    console.log('multi Language?', multiLang);
    // get intial address
    Geocoder.from(region.latitude, region.longitude)
    .then(async json => {
      const name = json.results[0].address_components[1].short_name;
      const district = json.results[0].address_components[2].short_name;
      const city = json.results[0].address_components[3].short_name;
      const state = json.results[0].address_components[4].short_name;
      const country = json.results[0].address_components[5].short_name;
      // for address display
      let display = district;
      const addr = {
        name: name,
        district: district,
        city: city,
        state: state,
        country: country,
        display: display,
        coordinate: [region.latitude, region.longitude]
      };
      setAddress(addr);

      //// find the users in the same district
      // get reference to the current user
      const { currentUser } = firebase.auth();
      const userId = currentUser.uid;
      findUsers({ district: addr.district, userId, multiLang: false });
      
      // @todo convert local language to english or korean to find users
      // one possible solution: create another geocoder with different language and find users
      if (multiLang) {
        let otherLang = 'en';
        switch (language) {
          case 'ko':
            otherLang = 'en';
            break;
          case 'en':
            otherLang = 'ko';
          default:
            break;
        }
        const queryParams = `latlng=${region.latitude},${region.longitude}&language=${otherLang}&key=${GEOCODING_API_KEY}`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?${queryParams}`;
        let response, data;
        try {
          response = await fetch(url);
        } catch(error) {
          throw {
            code: Geocoder.Errors.FETCHING,
            message: "Error while fetching. Check your network",
            origin: error
          };
        }
        // parse data
        try {
          data = await response.json();
        } catch(error) {
          throw {
            code: Geocoder.Errors.PARSING,
            message : "Error while parsing response's body into JSON. The response is in the error's 'origin' field. Try to parse it yourself.",
				    origin : response,
          };
        }
        if (data.status === 'OK') {
          const district = data.results[0].address_components[2].short_name;
          findUsers({ district: district, userId, multiLang: true });
        }
      } // end of multipleLang
    })
    .catch(error => console.warn(error));  
  };

  const onMapPress = ({ nativeEvent }) => {
    console.log('map press coordinate', nativeEvent.coordinate);

    // update lat, long
    const newLat = nativeEvent.coordinate.latitude;
    const newLong = nativeEvent.coordinate.longitude;
    setRegion(prevState => {
      return { ...prevState, latitude: newLat, longitude: newLong }
    });

    // get address
    Geocoder.from(newLat, newLong)
    .then(json => {
      const name = json.results[0].address_components[1].short_name;
      const district = json.results[0].address_components[2].short_name;
      const city = json.results[0].address_components[3].short_name;
      const state = json.results[0].address_components[4].short_name;
      const country = json.results[0].address_components[5].short_name;
      // for address display
      let display = district;
      const addr = {
        name: name,
        district: district,
        city: city,
        state: state,
        country: country,
        display: display,
        coordinate: [newLat, newLong]
      };
      setAddress(addr);
    })
    .catch(error => console.warn(error)); 
  }
  
  const showMap = () => {
    if (Platform.OS === 'android') {
      return (
        <View>
          { region && 
            <MapView
              style={{ height: 280, marginBottom: mapMargin }}
              provider={PROVIDER_GOOGLE}
              showsMyLocationButton
              mapType="standard"
              loadingEnabled
              showsUserLocation
              initialRegion={region}
              onRegionChange={onRegionChange}
              onRegionChangeComplete={onRegionChangeComplete}
              onMapReady={() => setMapMargin(0)}
            >
            </MapView>
          }
          <View style={{ marginVertical: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                <Text style={{ paddingLeft: 5, fontSize: 16 }}>{t('UsersScreen.location')}</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{address.display}</Text>
              </View>
                <CheckBox
                  containerStyle={{ marginLeft: 'auto', marginVertical: 0, paddingVertical: 0, 
                    backgroundColor: 'white', borderWidth: 0 }}
                  title={t('UsersScreen.multiLang')}
                  textStyle={{ fontSize: 14, fontWeight: 'bold' }}
                  iconRight
                  size={20}
                  checked={multiLang}
                  onPress={() => { setMultiLang(!multiLang) }}
                />
            </View>
          </View>
        </View>  
      );
    } else if (Platform.OS === 'ios') {
      return (
        <View>
          { region && 
            <MapView
              style={{ height: 280, marginBottom: mapMargin }}
              showsMyLocationButton
              mapType="standard"
              loadingEnabled
              showsUserLocation
              initialRegion={region}
              onRegionChange={onRegionChange}
              onRegionChangeComplete={onRegionChangeComplete}
              onPress={e => onMapPress(e)}
              onMapReady={() => setMapMargin(0)}
            >
            </MapView>
          }
          <View style={{ marginVertical: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                <Text style={{ paddingLeft: 5, fontSize: 16 }}>{t('UsersScreen.location')}</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{address.display}</Text>
              </View>
                <CheckBox
                  containerStyle={{ marginLeft: 'auto', marginVertical: 0, paddingVertical: 0, 
                    backgroundColor: 'white', borderWidth: 0 }}
                  title={t('UsersScreen.multiLang')}
                  textStyle={{ fontSize: 14, fontWeight: 'bold' }}
                  iconRight
                  size={20}
                  checked={multiLang}
                  onPress={() => { setMultiLang(!multiLang) }}
                />
            </View>
          </View>
        </View>
      );
    }
  };

  const renderItem = ({item}) => (
    <Card containerStyle={{ marginHorizontal: 15, paddingHorizontal: 0, paddingVertical: 0 }}>
    <ListItem
      leftAvatar={
        <View>
          <Avatar size="large" rounded
            source={{
              uri: item.avatar,
            }} 
          />
          <Text style={{ textAlign: 'center' }}>{item.name}</Text>
        </View>
      }
      title={
        <View>
          <View style={{ flexDirection: 'row' }}>
            <Icon 
              type='font-awesome' 
              name='gift' 
              size={20} 
              color={'#353535'}
            />
            <View>
              {
                item.skills.map((skill, id) => {
                  if (skill.name !== '') {
                    return (
                      <Text key={id} style={{ marginLeft: 6 }}>{skill.name}</Text>
                    );
                  }
                }) 
              }
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Icon type='font-awesome' name='hand-o-left' size={20} color={'#353535'}/>
            <Text style={{ marginLeft: 6 }}>{item.got}</Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Icon type='font-awesome' name='hand-o-right' size={20} color={'#353535'}/>
            <Text style={{ marginLeft: 6 }}>{item.helped}</Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Icon type='font-awesome' name='thumbs-o-up' size={20} color={'#353535'}/>
            <Text style={{ marginLeft: 8 }}>{item.rating} ({item.votes})</Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Icon type='font-awesome' name='map-marker' size={20} color={'#353535'}/>
            <View>
              {
                item.locations.map((location, id) => {
                  if (location.name !== '') {
                    return (
                      <View key={id} style={{ flexDirection: 'row' }}>
                        <Text style={{ marginLeft: 10 }}>{location.name}</Text>
                        <Badge value={location.votes} badgeStyle={{ height: 20 }}/>
                      </View>
                    );
                  }
                }) 
              }
            </View>
          </View>
        </View>
      }      
    />
    </Card>
  );

  const renderUserList = () => {
    if (state.userList.length == 0) {
      return ( 
        <View style={{ marginTop: 50 }}>
          <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>{t('UsersScreen.noresult')}</Text>
        </View>
      );
    }
    return (
      <ScrollView 
        style={{ flexGrow: 1, backgroundColor: 'lightgrey' }}
      >
        <FlatList
          keyExtractor={item => item.userId}
          data={state.userList}
          renderItem={renderItem}
        />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {showMap()}
      {renderUserList()}
    </SafeAreaView>
  );
}

UsersScreen.navigationOptions = ({ navigation }) => {
  return {
    title: i18next.t('UsersScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerRight: (
      <TouchableOpacity
        onPress={() => navigation.navigate('Leaders')}
      >
      <Icon
        containerStyle={{marginRight: 25}}
        type='font-awesome' 
        name="trophy"
        size={30}
        color={'#353535'}
      />
      </TouchableOpacity>
    ),
  }
};


const styles = StyleSheet.create({
  mapContainer: {
    height: 280,
    marginBottom: 0
  },
  buttonContainer: {
    position: 'absolute',
    top: '65%',
    right: '3%'
  }
});

// @DB: initialize the regions collection from user's coordinate
const initRegions = () => {
  // get users ref
  const usersRef = firebase.firestore().collection('users');
  usersRef.get()
  .then(snapshot => {
    snapshot.forEach(async doc => {
      // remove test accounts
      const userRef = firebase.firestore().doc(`users/${doc.id}`);
      let testAccount = false;
      await userRef.get()
      .then(doc => {
        if (doc.data().tester) testAccount = true;
      })
      .catch(error => console.log(error));
      // skip the loop if the user is a tester
      if (testAccount) return;

      // get user location collection ref      
      const locationsRef = userRef.collection('locations');
      locationsRef.get()
      .then(snapshot2 => {
        // check empty
        if (snapshot2.empty) {
          return;
        }
        if (typeof snapshot2 === 'undefined')
        if (__DEV__) console.log('[userScreen|initRegions] undefined snapshot', snapshot2);

        // loop over locations
        snapshot2.forEach(async locationDoc => {
          if (!locationDoc.exists) {
            if (__DEV__) console.log('[userScreen|initRegions] doc does not exist', locationDoc);
            return;
          }
          // get coordinate
          const coordinate = locationDoc.data().coordinate;
          // check undefined
          if (typeof coordinate === 'undefined')
            return;
          
          const queryParams = `latlng=${coordinate[0]},${coordinate[1]}&language='en'&key=${GEOCODING_API_KEY}`;
          const url = `https://maps.googleapis.com/maps/api/geocode/json?${queryParams}`;
          let response, data;
          try {
            response = await fetch(url);
          } catch(error) {
            throw {
              code: Geocoder.Errors.FETCHING,
              message: "Error while fetching. Check your network",
              origin: error
            };
          }
          // parse data
          try {
            data = await response.json();
          } catch(error) {
            throw {
              code: Geocoder.Errors.PARSING,
              message : "Error while parsing response's body into JSON. The response is in the error's 'origin' field. Try to parse it yourself.",
              origin : response,
            };
          }
          if (data.status === 'OK') {
            // update region state
            const district = data.results[0].address_components[2].short_name;
            // update the new region field with english district
//            userRef.update({
//              regionsEN: firebase.firestore.FieldValue.arrayUnion(district)   
//            });

            // get region ref
            const regionRef = firebase.firestore().collection('regions').doc(district);
            regionRef.get()
            .then(docSnapshot => {
              if (docSnapshot.exists) {
                // increase the count by 1
                regionRef.update({
                  count: firebase.firestore.FieldValue.increment(1)
                })
              } else {
                // create region
                regionRef.set({
                  count: 1,
                  coordinate: coordinate
                });
              }
            })
            .catch(error => console.log(error));
          }
        });
      })
      .catch(error => console.log(error));
    });
  });
}

/*
// @DB: initialize the regions collection from regionEN
const initRegions0 = () => {
  // get users ref
  const usersRef = firebase.firestore().collection('users');
  usersRef.get()
  .then(snapshot => {
    snapshot.forEach(async doc => {
      // skip test accounts
      const userRef = firebase.firestore().doc(`users/${doc.id}`);
      await userRef.get()
      .then(doc => {
        if (!doc.data().tester) {
          // get user location collection ref      
          const locationsRef = userRef.collection('locations');
          locationsRef.get()
          .then(snapshot => {
            // check empty
            if (snapshot.empty) {
              return;
            }
            if (typeof snapshot === 'undefined')
            if (__DEV__) console.log('[userScreen|initRegions] undefined snapshot', snapshot);

            // loop over locations
            snapshot.forEach(async locationDoc => {
              if (!locationDoc.exists) {
                if (__DEV__) console.log('[userScreen|initRegions] doc does not exist', locationDoc);
                return;
              }
              // get coordinate
              const coordinate = locationDoc.data().coordinate;
              // check undefined
              if (typeof coordinate === 'undefined')
                return;
              // get district
              const district = doc.data().regionEN;

          // get coordinate
          const coordinates = doc.data().coordinates;
          // get region ref
          const regionRef = firebase.firestore().collection('regions').doc(district);
          regionRef.get()
          .then(docSnapshot => {
            if (docSnapshot.exists) {
              // increase the count by 1
              regionRef.update({
                count: firebase.firestore.FieldValue.increment(1)
              })
            } else {
              // create region
              regionRef.set({
                count: 1,
                coordinate: coordinates
              });
            }
          })
          .catch(error => console.log(error));
        }
      })
      .catch(error => console.log(error));
    }) // end of forEach
  }) // end of users.get()
  .catch(error => console.log(error));
}
*/

export default UsersScreen;