import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Platform, Alert, Dimensions, PermissionsAndroid } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Text, Button, Input, Card, Icon } from 'react-native-elements';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import SplashScreen from 'react-native-splash-screen';
import Geolocation from 'react-native-geolocation-service';
import { ScrollView } from 'react-native-gesture-handler';
// custom libraries
import {Context as AskContext} from '../context/AskContext';
import Spacer from '../components/Spacer';

// text size
let textSize = 24;
if (Dimensions.get('window').height < 600 ) {
  textSize = 18;
}

const AskScreen = ({ navigation }) => {
  SplashScreen.hide();
  console.log('AskScreen');
  // setup language
  const { t } = useTranslation();
  // use auth context; state, action, default value
  const { state, requestHelp, getAppStatus, checkRegion } = useContext(AskContext);
  // state
  const [message, setMessage] = useState('');

  // componentDidMount
  useEffect(() => {
  }, []);

  // called before the screen is focused
  const onWillFocus = () => {
    // get number of users and cases
    getAppStatus();
    // check if a user sets a region
    checkRegion();
  };

  // show icon for removing message
  const showRemoveIcon = () => {
    return (
      <Icon
        reverse
        name='close'
        size={16}
        color={'#353535'}
        onPress={() => {setMessage('')}}
      />
    );
  };

  // handle requestion action
  const handleRequest = async () => {

    console.log('[AskScreen] handleRequest');

    // prohibit the double requesting
    if (state.loading) {
      console.log('[handleRequest] aldreay requested.');
      return;
    }

    // check if the region is set. if so, request help
    if (state.region) {
      // handle android 
      if (Platform.OS === 'android') {
        try {
          // get location permission if it is not granted, 
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) { 
            // get location
            let coordinate = null;
            Geolocation.getCurrentPosition((position) => {
              if (__DEV__) console.log('[AskScreen|getCoordinate] position', position);
              // set coordinate
              coordinate = position.coords;
              // request help
              requestHelp({ message, coordinate, navigation });
            },
            (error) => {
              console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });        
          } else {
            Alert.alert(
              t('LocationScreen.permissionFail'),
              t('LocationScreen.permissionFailText'),
              [
                { text: t('confirm') }
              ],
              { cancelable: true },
            );
          }
        } catch (err) {
          console.warn(err);
        } 
      } else if (Platform.OS =='ios') {
        // @todo get permission for ios and request help
        // get location
        let coordinate = null;
        Geolocation.getCurrentPosition((position) => {
          if (__DEV__) console.log('[AskScreen|getCoordinate] position', position);
          // set coordinate
          coordinate = position.coords;
          // request help
          requestHelp({ message, coordinate, navigation });
        },
        (error) => {
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });  
      }      
    } else { // guide to set location
      Alert.alert(
        t('AskScreen.locationGuide'),
        t('AskScreen.locationGuideText'),
        [
          { text: t('confirm') }
        ],
        { cancelable: true },
      );
    }
  };

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillFocus={onWillFocus}
      />
      <ScrollView>
      <Card
        containerStyle={{backgroundColor: '#119abf'}}
        wrapperStyle={styles.statusContainer}>
        <View style={{flexDirection: 'row'}}>
          <Icon
            containerStyle={{ paddingTop: Platform.OS === 'android' ? 8 : 3 }}
            type='font-awesome'
            name='user'
            size={32}
          />
          <Text style={{ fontSize: 30, fontWeight: 'bold', marginLeft: 10 }}>{state.totalUsers}</Text>
        </View>
        <View style={{flexDirection: 'row'}}>
          <Icon2
            style={{ paddingTop: Platform.OS === 'android' ? 8 : 3 }}
            name='hands-helping'
            size={30}
          />
          <Text style={{ fontSize: 30, fontWeight: 'bold', marginLeft: 10 }}>{state.totalCases}</Text>
        </View>
      </Card>
      <Card>
        <Spacer>
          <View style={styles.guide}>
            <Text style={styles.guideText}>{t('AskScreen.guideText')}</Text> 
            {showRemoveIcon()}
          </View>
        </Spacer>
        <TextInput
          style={styles.input}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder={t('AskScreen.placeholder')}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={styles.returnKey}
        />
      </Card>
      <Spacer>
        <Button
          buttonStyle={{ height: 100 }} 
          titleStyle={{ fontSize: 30, fontWeight: 'bold' }}
          title={t('AskScreen.button')}
          loading={state.loading}
          onPress={handleRequest}
        />
      </Spacer>
      </ScrollView>
    </SafeAreaView>
  );
};

AskScreen.navigationOptions = () => {
  return {
    title: i18next.t('AskScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };
};

// styles
const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    justifyContent: 'space-around',
  },
  guide: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  input: {
    height: 150, // 300
    padding: 10,
    fontSize: 18,
    borderColor: 'grey',
    borderWidth: 3,
  },
  guideText: {
    fontSize: textSize,
    fontWeight: 'bold',
    alignSelf: 'center'
  },
  returnKey: Platform.OS === 'android' ? false : true
});

export default AskScreen;
