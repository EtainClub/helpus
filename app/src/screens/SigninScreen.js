import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native'; 
import AsyncStorage from '@react-native-community/async-storage';
import { NavigationEvents, SafeAreaView} from 'react-navigation';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Text, Input, Button } from 'react-native-elements';
import SplashScreen from 'react-native-splash-screen';
// custom libraries
import { Context as AuthContext } from '../context/AuthContext';
import Spacer from '../components/Spacer';

const SigninScreen = ({ navigation }) => {
  SplashScreen.hide();
  // setup language
  const { t } = useTranslation();

  // use auth context; state, action, default value
  const { state, signin, clearError } = useContext( AuthContext );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
 
  useEffect(() => {
    // get email from storage
    getEmailFromStorage();
  }, []);

  const getEmailFromStorage = async () => {
    console.log('getting email from storage');
    let email_storage = await AsyncStorage.getItem('email');
    console.log('email', email_storage);
    // set email if exists
    setEmail(email_storage);
  };

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={clearError}
      />
      <Spacer>
        <Text h3>{t('SigninScreen.header')}</Text>
      </Spacer>
      <Spacer>
        <Input label={t('SigninScreen.email')}
          inputStyle={{ paddingLeft: 10 }} 
          leftIcon={
            <Icon
              name='envelope-o'
              size={24}
              color='black'
            />
          }
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Spacer>
      <Spacer>
        <Input label={t('SigninScreen.password')}  
          inputStyle={{ paddingLeft: 10 }} 
          leftIcon={
            <Icon
              name='lock'
              size={24}
              color='black'
            />
          }
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Spacer>
      {state.errorMessage ? <Text style={styles.errorMessage}>{state.errorMessage}</Text> : null}
      <Spacer>
        <Button title={t('SigninScreen.button')} 
          titleStyle={{ fontSize: 24, fontWeight: 'bold' }}
          loading={state.loading}
          onPress={() => {signin({ email, password, navigation })} }
        />
      </Spacer>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Spacer>
          <Text style={styles.textLink}>{t('SigninScreen.SignupMsg')}</Text>
        </Spacer>
      </TouchableOpacity>
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
