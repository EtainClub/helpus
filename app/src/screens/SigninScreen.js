import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native'; 
import AsyncStorage from '@react-native-community/async-storage';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Text, Input, Card, Button } from 'react-native-elements';
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
      <Card>
        <Text style={{ fontSize: 16, marginBottom: 10}}>
          휴대폰 번호로 가입합니다. 번호는 안전하게 보관되며 어디에도 공개되지 않습니다.
        </Text>
      </Card>
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
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType='numeric'
        />
      </Spacer>
      <Spacer>
        <Button
            buttonStyle={{borderRadius: 0, marginLeft: 0, marginRight: 0, marginBottom: 0}}
            titleStyle={{ fontSize: 25, fontWeight: 'bold' }}
            title={t('SigninScreen.verifyButton')}
            loading={state.loading}
            onPress={() => console.log('phone verification')}
          />
      </Spacer>

      <Spacer></Spacer>
      <Spacer></Spacer>

      <Spacer>
        <Input label={t('SigninScreen.verifyNumber')}
          inputStyle={{ paddingLeft: 10, borderWidth: 2 }} 
          value={email}
          onChangeText={setEmail}
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
            onPress={() => console.log('phone verification')}
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
