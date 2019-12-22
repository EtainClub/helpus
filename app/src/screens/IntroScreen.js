import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationEvents, SafeAreaView} from 'react-navigation';
import { Text, Button, Card} from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import SplashScreen from 'react-native-splash-screen';
import firebase from 'react-native-firebase'; 
// custom libraries
import {Context as AskContext} from '../context/AskContext';

const IntroScreen = ({ navigation }) => {
  SplashScreen.hide();
  console.log('IntroScreen');
  // setup language
  const { t } = useTranslation();
  // state
  const [stat, setStat] = useState({ users: 0, cases: 0 });

  // use effect
  useEffect(() => {
    // get app stat
    getAppStat();
  }, []);

  // get numbers of current users and cases
  const getAppStat = () => {
    // stat doc ref
    const statRef = firebase.firestore().doc('stat/0');
    console.log('[getAppStat] stat ref', statRef);
    statRef.get()
    .then(doc => {
      console.log('[getAppStat] doc', doc);
      const newStat = { users: doc.data().users, cases: doc.data().cases };
      setStat(newStat);
    })
    .catch(error => {
      console.log('Error getting the app stat', error);
    }); 
  };

  const introImage = () => {
    return (
    <FastImage
      source={{
        uri: 'https://facebook.github.io/react/img/logo_og.png',
        priority: FastImage.priority.normal
      }}
    />
    );
  };

  return (
    <SafeAreaView>
      <Card
        containerStyle={{ backgroundColor: '#259b9a' }}
        wrapperStyle={styles.statusContainer}>
        <View style={{ flexDirection: 'row' }}>
          <Icon
            style={styles.androidHeight}
            name='user'
            size={30}
          />
          <Text style={{ fontSize: 30, fontWeight: 'bold', marginLeft: 10 }}>{stat.users}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Icon2
            style={styles.androidHeight}
            name='hands-helping'
            size={30}
          />
          <Text style={{ fontSize: 30, fontWeight: 'bold', marginLeft: 10 }}>{stat.cases}</Text>
        </View>
      </Card>

      <Card
        containerStyle={styles.container}
        title='helpus'
        titleStyle={{ fontSize: 50 }}
        image={require('../../../assets/intro.png')}
        imageStyle={{ height: '60%' }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
          {t('subtitle')}
        </Text>
        <Button
          icon={
            <Icon2
              name='hands-helping'
              size={25}
              color='white'
            />
          }
          buttonStyle={{borderRadius: 0, marginLeft: 0, marginRight: 0, marginBottom: 0}}
          titleStyle={{fontSize: 25, fontWeight: 'bold', paddingLeft: 7 }}
          title={t('startApp')}
          onPress={() => navigation.navigate('Signin')}
        />
      </Card>
    </SafeAreaView>
  );
};

IntroScreen.navigationOptions = () => {
  return {
    header: null
  }
};

// styles
const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    justifyContent: 'space-around',
  },
  container: {
    marginBottom: 50
  },
  androidHeight: {
    paddingTop: Platform.OS === 'android' ? 6 : 3 
  },
});

export default IntroScreen;
