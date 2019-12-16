import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native'; 
import AsyncStorage from '@react-native-community/async-storage';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Text, Input, Card, Button } from 'react-native-elements';
import SplashScreen from 'react-native-splash-screen';
import CountryPicker from 'react-native-country-picker-modal';
import firebase from 'react-native-firebase'; 
// custom libraries
import { Context as AuthContext } from '../context/AuthContext';
import Spacer from '../components/Spacer';

const SigninScreen = ({ navigation }) => {
  SplashScreen.hide();
  // setup language
  const { t } = useTranslation();

  // use auth context; state, action, default value
  const { state, signinPhoneNumber, confirmVerificationCode, signin, clearError } = useContext( AuthContext );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
 
  useEffect(() => {
    // get phone number from storage
    getPhoneNumberFromStorage();
    // auth change listener for android only
    let unsubscribe = null;
    if (Platform.OS === 'android') {
      unsubscribe = firebase.auth().onAuthStateChanged(user => {
        if (user) {
          console.log('[onAuthStateChanged] user', user);
          // sign in
          signin({ user, navigation });
        } else {
          console.log('[onAuthStateChanged]');
        }
      });
    }

    return () => {
      // unsubscribe the auth chnage
      if (Platform.OS === 'android')
        unsubscribe();
    };
  }, []);

  const getPhoneNumberFromStorage = async () => {
    console.log('getting phone number from storage');
    let phone = await AsyncStorage.getItem('phoneNumber');
    console.log('phone', phone);
    // set phone number if exists
    setPhoneNumber(phone);
  };

  const onSelect = (country) => {
    console.log('country', country);
  };

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={ clearError }
      />
      <Spacer>
        <Text h3>{t('SigninScreen.header')}</Text>
      </Spacer>
      <Card>
        <Text style={{ fontSize: 16, marginBottom: 10}}>
          {t('SigninScreen.guideMsg')}
        </Text>
      </Card>
      <CountryPicker
        countryCode={'KR'}
        withFlag
        withAlphaFilter
        onSelect={(country) => { console.log('onSelect'); onSelect(country)}}
      />
      <Spacer>
        <Input label={t('SigninScreen.phone')}
          inputStyle={{ paddingLeft: 10 }} 
          leftIcon={
            <Icon
              name='phone'
              size={25}
              color='black'
            />
          }
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType='numeric'
        />
      </Spacer>
      {state.errorMessage ? <Text style={styles.errorMessage}>{state.errorMessage}</Text> : null}
      <Spacer>
        <Button
            buttonStyle={{borderRadius: 0, marginLeft: 0, marginRight: 0, marginBottom: 0}}
            titleStyle={{ fontSize: 25, fontWeight: 'bold' }}
            title={t('SigninScreen.verifyButton')}
            loading={state.loading}
            onPress={() => signinPhoneNumber({ phoneNumber })}
          />
      </Spacer>

      <Spacer></Spacer>
      <Spacer></Spacer>

      <Spacer>
        <Input label={t('SigninScreen.verifyNumber')}
          inputStyle={{ paddingLeft: 10, borderWidth: 2 }} 
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType='numeric'
        />
      </Spacer>
        
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.textLink}>{t('SigninScreen.terms')}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20 }}>{t('and')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.textLink}>{t('SigninScreen.privacyPolicy')}</Text>
        </TouchableOpacity>
      </View>

      <Spacer>
        <Button
            buttonStyle={{borderRadius: 0, marginLeft: 0, marginRight: 0, marginBottom: 0}}
            titleStyle={{ fontSize: 25, fontWeight: 'bold' }}
            title={t('SigninScreen.start')}
            loading={state.loading}
            onPress={() => confirmVerificationCode({ 
              phoneNumber, 
              code, 
              confirmResult: state.confirmResult,
              navigation })}
          />
      </Spacer>

    </SafeAreaView>
  );  
};

SigninScreen.navigationOptions = () => {
  return {
    header: null
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 100
  },
  errorMessage: {
    fontSize: 16,
    color: 'red',
    marginLeft: 15,
    marginTop: 15
  },
  textLink: {
    color: 'blue',
    fontSize: 20
  }
});

export default SigninScreen;
