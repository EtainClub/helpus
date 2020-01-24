import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { NavigationEvents, SafeAreaView} from 'react-navigation';
import { Text, Button, Card, Icon } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import SplashScreen from 'react-native-splash-screen';
import firebase from 'react-native-firebase'; 
import { ScrollView } from 'react-native-gesture-handler';
// custom libraries

const IntroScreen = ({ navigation }) => {
  SplashScreen.hide();
  console.log('IntroScreen');
  // screen height
  let screenHeight = 300;
  if (Dimensions.get('window').height < 600 ) {
    screenHeight = 200;
  }
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

  const IntroImage = () => {
    return (
      <FastImage
        style={{ width: '100%', height: screenHeight }}
        source={require('../../../assets/intro.png')}  
        resizeMode={FastImage.resizeMode.contain}
      />
    );
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <Card
          containerStyle={{ backgroundColor: '#119abf' }}
          wrapperStyle={styles.statusContainer}>
          <View style={{ flexDirection: 'row' }}>
            <Icon
              containerStyle={{ paddingTop: Platform.OS === 'android' ? 8 : 3 }}
              type='font-awesome'
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
        >
          <IntroImage />
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
    </ScrollView>
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
