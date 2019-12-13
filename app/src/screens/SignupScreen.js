import React, { useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Text, Input, Button } from 'react-native-elements';
import SplashScreen from 'react-native-splash-screen';
// custom libraries
import { Context as AuthContext } from '../context/AuthContext';
import Spacer from '../components/Spacer';

const SignupScreen = ({ navigation }) => {
  SplashScreen.hide();
  // use language
  const { t } = useTranslation();

  // use auth context; state, action, default value
  const { state, signup, clearError } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={clearError}
      />
      <Spacer>
        <Text h3>{t('SignupScreen.header')}</Text>
      </Spacer>
      <Spacer>
        <Input
          inputStyle={{ paddingLeft: 10 }} 
          label={t('SignupScreen.email')}
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
        <Input
          inputStyle={{ paddingLeft: 10 }} 
          label={t('SignupScreen.password')}
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
      <Spacer>
        <Input
          inputStyle={{ paddingLeft: 10 }} 
          label={t('SignupScreen.confirm_password')}
          leftIcon={
            <Icon
              name='lock'
              size={24}
              color='black'
            />
          }
          value={confirm_password}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Spacer>
      {state.errorMessage ? <Text style={styles.errorMessage}>{state.errorMessage}</Text> : null}
      <Spacer>
        <Button
          title={t('SignupScreen.button')}
          titleStyle={{fontSize: 24, fontWeight: 'bold'}}
          loading={state.loading}
          onPress={() =>
            signup({email, password, confirm_password, navigation})
          }
        />
      </Spacer>
      <TouchableOpacity onPress={() => navigation.navigate('Signin')}>
        <Spacer>
          <Text style={styles.textLink}>{t('SignupScreen.SigninMsg')}</Text>
        </Spacer>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

SignupScreen.navigationOptions = () => {
  return {
    header: null,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: 'red',
    marginLeft: 15,
    marginTop: 15,
  },
  textLink: {
    color: 'blue',
    fontSize: 20,
  },
});

export default SignupScreen;
