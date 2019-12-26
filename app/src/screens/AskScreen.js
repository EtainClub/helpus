import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Platform, PermissionsAndroid, Alert } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Text, Button, Input, Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import SplashScreen from 'react-native-splash-screen';
import Geolocation from 'react-native-geolocation-service';

// custom libraries
import {Context as AskContext} from '../context/AskContext';
import Spacer from '../components/Spacer';

const AskScreen = ({navigation}) => {
  SplashScreen.hide();
  console.log('AskScreen');
  // setup language
  const {t} = useTranslation();
  // use auth context; state, action, default value
  const {state, requestHelp, getAppStatus} = useContext(AskContext);
  // state
  const [message, setMessage] = useState('');
  // coordinate
  const [coordinate, setCoordinate] = useState(null);

  // use effect: componentDidMount
  useEffect(() => {
    getAppStatus();
//    Geolocation.requestAuthorization();
//    console.log('Geolocation service1', Geolocation.getCurrentPosition((position)=>{console.log(position)}));
    // get user's coordinate
    getCoordinate();
  }, []);

  const getCoordinate = async () => {
    // get location permission for android device
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) { 
          if (__DEV__) Alert.alert("Location Permission Granted.");
          // get location
          Geolocation.getCurrentPosition((position) => {
            if (__DEV__) console.log('[AskScreen|getCoordinate] position', position);
            // update the coordinate
            setCoordinate(position.coords);
          },
          (error) => {
            console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }); 
        }
        else {
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
    } else if (Platform.OS == 'ios') {
      // @todo get permission for ios
    }
  };

  const showRemoveIcon = () => {
//    if (message !== '') {
      return (
        <Icon
          style={{ left: 30, top: 5 }} 
          reverse
          name='close'
          size={20}
          color={'#353535'}
          onPress={() => {setMessage('')}}
        />
      );
//    }
  }

  return (
    <SafeAreaView>
      <Card
        containerStyle={{backgroundColor: '#259b9a'}}
        wrapperStyle={styles.statusContainer}>
        <View style={{flexDirection: 'row'}}>
          <Icon
            style={styles.androidHeight}
            name='user'
            size={30}
          />
          <Text style={{ fontSize: 30, fontWeight: 'bold', marginLeft: 10 }}>{state.totalUsers}</Text>
        </View>
        <View style={{flexDirection: 'row'}}>
          <Icon2
            style={styles.androidHeight}
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
          onPress={() => {
            // prohibit the double requesting
            if (!state.loading) {
              requestHelp({ message, coordinate, navigation });
            }
          }}
        />
      </Spacer>
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
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center'
  },
  androidHeight: {
    paddingTop: Platform.OS === 'android' ? 6 : 3 
  },
  returnKey: Platform.OS === 'android' ? false : true
});

export default AskScreen;
