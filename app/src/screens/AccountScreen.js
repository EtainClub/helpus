import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, PermissionsAndroid, Alert, TouchableOpacity } from 'react-native';
import { Button, Text, Card, Avatar, Divider } from 'react-native-elements';
import { SafeAreaView, NavigationEvents } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase'; 
import { ScrollView } from 'react-native-gesture-handler';
// custom libraries
import { Context as ProfileContext } from '../context/ProfileContext';
import Spacer from '../components/Spacer';

const AccountScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();

  // use profile context
  const { state, updateUserInfoState, updateLocations } = useContext( ProfileContext );

  // get reference to the current user
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;

  // use effect
  useEffect(() => {
    getUserInfo();
  }, []);

  
  getUserInfo = async () => {
    // reference to user info
    console.log('[accountscreen] getUserInfo');
    const userRef = firebase.firestore().doc(`users/${userId}`);
    await userRef.get()
    .then(doc => {
      // check if the user detailed info exists
      if (!doc.data().name) {
        console.log('name is undefined');
      } 
      // read the ask and help cases
      countAskHelpCases()
      .then(counts => {
        // update user state with initial state
        updateUserInfoState({ 
          userId: currentUser.uid,
          name: doc.data().name || null,
          avatarUrl: doc.data().avatarUrl || null,
          votes: doc.data().votes || 0,
          askCount: counts.askCount,
          helpCount: counts.helpCount
        });
      });
    })
    .catch(error => {
      console.log('Failed to get user info', error);
    });

    // get locations
    let locations = [];
    await userRef.collection('locations').get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log('No matching docs');
        return;
      }  
      snapshot.forEach(doc => {
        locations.push(doc.data());
      });
      updateLocations({ locations });
    })
    .catch(error => {
      console.log('cannot get location data', error);
    });

    // @test
    console.log('[accountScreen] state locations', state.locations);
  }

  countAskHelpCases = async () => {
    // reference to cases
    const casesRef = firebase.firestore().collection('cases');
    // query
    let askCount = 0;
    await casesRef.where('senderId', '==', userId).get()
    .then(snapshot => {
      askCount = snapshot.size;
      console.log('askcount', askCount);
    })
    .catch(error => {
      console.log('cannot query ask cases', error);
    });    

    let helpCount = 0;
    await casesRef.where('helperId', '==', userId).get()
    .then(snapshot => {
      helpCount = snapshot.size;
      console.log('helpCount', helpCount);
    })
    .catch(error => {
      console.log('cannot query help cases', error);
    });    
    let counts = { askCount, helpCount };

    //// update the db
    // user ref
    const userRef = firebase.firestore().doc(`users/${userId}`);
    // update
    userRef.update({ askCount, helpCount });

    return counts;
  }

  onProfilePress = () => {
    navigation.navigate('ProfileContract');
  }

  onEditAvatarPress = () => {
    navigation.navigate('AccountEdit', { userId: currentUser.uid });
  }

  onUsersPress = async () => {
    // get location permission for android device
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) { 
          if (__DEV__) Alert.alert("Location Permission Granted.");
          // navigate to the location screen
          navigation.navigate('Users', { id: currentUser.uid })
        }
        else {
          Alert.alert(
            t('LocationScreen.permissionFail'),
            t('LocationScreen.permissionFailText'),
            [
              {text: t('confirm')}
            ],
            {cancelable: true},
          );
        }
      } catch (err) {
        console.warn(err);
      }  
    } else if (Platform.OS === 'ios') {
      // navigate to the location screen
      navigation.navigate('Users', { id: currentUser.uid });
    }    
  }

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillFocus={getUserInfo}
      />
      <ScrollView>
        <Card wrapperStyle={styles.accountContainer}>
          <Avatar 
            size="large"
            rounded
            source={{
              uri: state.userInfo.avatarUrl,
            }} 
            showEditButton
            onEditPress={onEditAvatarPress}
          />
          <View style={styles.nickContainer}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{state.userInfo.name}</Text>
            </View>
            <Spacer>
              <View style={{ flexDirection: "row" }}>
              <Icon
                name='map-marker'
                size={20}
              />
              <Text style={{ fontSize: 16, marginLeft: 7 }}>{ state.locations[0].name ? 
                state.locations[0].name
                : t('AccountScreen.locationPlaceholder')}</Text>
              </View>
            </Spacer>
            <Button
              type="outline"
              buttonStyle={{ height: 20 }}
              titleStyle={{ fontSize: 16, fontWeight: 'bold' }}     
              title={t('AccountScreen.usersButton')}
              onPress={onUsersPress}
            />
          </View>
        </Card>

        <Card
          title={t('AccountScreen.profileTitle')}
        >
          <Spacer>
          <View style={styles.accountContainer}>
            <Icon
              name='hand-o-left'
              size={40}
              color={'#353535'}
            />
            <View style={{ marginHorizontal: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{t('AccountScreen.askCases')}</Text>
              <Text style={{ fontSize: 16 }}>{state.userInfo.askCount? state.userInfo.askCount : "0"} {t('cases')}</Text>
            </View>
          </View>
          </Spacer>
          <Spacer>
          <View style={styles.accountContainer}>
            <Icon
              name='hand-o-right'
              size={40}
              color={'#353535'}
            />
            <View style={{ marginHorizontal: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{t('AccountScreen.helpCases')}</Text>
              <Text style={{ fontSize: 16 }}>{state.userInfo.helpCount? state.userInfo.helpCount : "0"} {t('cases')}</Text>
            </View>
          </View>
          </Spacer>
          <Spacer>
          <View style={styles.accountContainer}>
            <Icon
              name='thumbs-o-up'
              size={40}
              color={'#353535'}
            />
            <View style={{ marginHorizontal: 25 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{t('AccountScreen.votes')}</Text>
              <Text style={{ fontSize: 16 }}>{state.userInfo.votes? state.userInfo.votes : "0"} {t('cases')}</Text>
            </View>
          </View>
          </Spacer>
          <Spacer>
          <Button
            buttonStyle={{ height: 50 }}
            titleStyle={{ fontSize: 24, fontWeight: 'bold' }}     
            title={t('AccountScreen.profileButton')}
            onPress={onProfilePress}
          />
          </Spacer>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

AccountScreen.navigationOptions = () => {
  return {
    title: i18next.t('AccountScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  }
};

// styles
const styles = StyleSheet.create({
  accountContainer: {
    flexDirection: "row",
    justifyContent: 'flex-start'
  },
  nickContainer: {
    marginHorizontal: 20
  }
});

export default AccountScreen;