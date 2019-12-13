/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

 // issue with gesture??
import 'react-native-gesture-handler'
// this is necessary even though it does not use directly
import i18n from './src/i18n';
// react, react-native
import React, { useEffect } from 'react';
import { YellowBox, Alert } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import firebase from 'react-native-firebase';
import { useTranslation } from 'react-i18next';
// contexts
import { Provider as AuthProvider } from './src/context/AuthContext';
import { Provider as AskProvider } from './src/context/AskContext';
import { Provider as HelpProvider } from './src/context/HelpContext';
import { Provider as ProfileProvider } from './src/context/ProfileContext';
import { Provider as ChatProvider } from './src/context/ChatContext';
import Navigator from './src/Navigator';
import NavigationService from './src/NavigationService';
import i18next from 'i18next';
YellowBox.ignoreWarnings(['Require cycle:']);

export default () => {
  // setup language
  const { t } = useTranslation();

  const AppContainer = Navigator;

//  let preferredLang;
  // use effect
  useEffect(() => {
    // get lang
//    getLanguage();
    // check permission
    checkPermission();

    if (__DEV__) console.log('after checkPermission');

    // notification listener (triggered when a particular notification has been received)
    // if the app is foreground, we need to navigate the screen
    const listenerFG = firebase.notifications().onNotification(async notification => {
      if (__DEV__) console.log('onNotification', notification);
      if (__DEV__) alert('onNotification');
      
      // check sanity: senderId exists?
      if (notification.data.senderId) {
        Alert.alert(
          t('AppScreen.title'),
          t('AppScreen.message'),
          [
            {text: t('yes'), onPress: () => NavigationService.navigate('Help', {notificationBody: notification})},
          ],
          {cancelable: true},
        );
      }
    });

    // notification opened (listen for notification is clicked/ tapped/ opened in foreground and backgroud)
    // when we open the notification, handle here
    const listenerBG = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
        if (__DEV__) alert('onNotificationOpened');
        if (__DEV__) console.log('onNotificationOpened', notificationOpen);
        
        // check sanity: senderId exists?
        if (notificationOpen.notification.data.senderId) {
          // navigate to Help screen
          NavigationService.navigate('Help', {notificationBody: notificationOpen.notification});
        }
      });

    // listener for when app is closed
    listenerForAppClosed();

    /*
    // Triggered for data only payload in foreground
    const messageListener = firebase.messaging().onMessage((message) => {
      // 
      if (__DEV__) alert('onMessage');
      //process data message
      if (__DEV__) console.log(JSON.stringify(message));
    });
    */

    /*
    // notification displayed (triggered when a particular notificaiton has been displayed)
    const notificationDisplayedListener = firebase
      .notifications()
      .onNotificationDisplayed( async notification => {
        if (__DEV__) alert('displayed');
        if (__DEV__) console.log('onNotificationDisplayed', notification);
      });
    */  
    // stop listening
    return () => {
      if (__DEV__) console.log('unsubscribe notification listener');
      //notificationDisplayedListener();
      listenerFG();
      listenerBG();
      //messageListener();
    };
  }, []);

  //const getLanguage = async () => {
  //  preferredLang = await AsyncStorage.getItem('language');
  //  console.log('prefered lang', preferredLang);
  //};

  // check push notification permission
  const checkPermission = async () => {
    // check if the user is logged in
    let userSigned = null;
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        userSigned = user
      }
    });
    if (!userSigned) return;

    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      // has permission. get token
      getToken();
      if (__DEV__) console.log('permision enabled');
//      if (__DEV__) alert('has permission. got fcm token');
    } else {
      // no permission. request it
      requestPermission();
      if (__DEV__) console.log('permision requesting...');
//      if (__DEV__) alert('requesting permission');
    }
    // 
  };

  // get firebse cloud messaing (fcm) token
  const getToken = async () => {
    // get token from storage
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    // get token from firebase if not exist
    if (!fcmToken) {
      fcmToken = await firebase.messaging().getToken();
      if (__DEV__) console.log('fcmToken', fcmToken);
      if (fcmToken) {
        // user has a device token
        await AsyncStorage.setItem('fcmToken', fcmToken);
//        if (__DEV__) alert('setToken');
      }
    }
  };

  const requestPermission = async () => {
    try {
      // request the permisson
      await firebase.messaging().requestPermission();
      // user has permission, get token
      getToken();
    } catch (error) {
      // request rejected
      if (__DEV__) console.log('fcm permission request rejected', error);
      Alert.alert(
        t('App.permissionErrorTitle'),
        t('App.permissionErrorText'),
        [
          {text: t('confirm')}
        ],
        {cancelable: true},
      );
    }
  };

  // listen the notification being opened or clicked when the app is closed
  const listenerForAppClosed = async () => {
    // app closed
    const notificationOpen = await firebase
      .notifications()
      .getInitialNotification();
    if (notificationOpen) {
      if (__DEV__) alert('getInitialNotification');
      // app was opened by a notification
      if (__DEV__) console.log('getInitialNotification', notificationOpen);

      // get information about the notification that was opened
      const notification = notificationOpen.notification;
      //// ignore the same notification id since the same notification is received again, don't know why.
      // get noti id from storage
      // @todo use then
      const notiId = await AsyncStorage.getItem('notiId');
      // set noti id to storage
      await AsyncStorage.setItem('notiId', notification.notificationId);
      if (notification.notificationId === notiId) {
        if (__DEV__) console.log('notification id is the same');
      } else {
        if (__DEV__) console.log('navigating to helpscreen...');
        // check sanity: senderId exists?
        if (notification.data.senderId) {
          // navigate to Help screen
          NavigationService.navigate('Help', {notificationBody: notification});
        }
      }
    }
  };

  const translation = (scope, options) => {
    return i18next.t(scope, { locale: 'en', ...options });
  };

  return (
    <ChatProvider>
      <ProfileProvider>
        <HelpProvider>
          <AskProvider>
            <AuthProvider>
              <AppContainer
                ref={navigationRef => {NavigationService.setTopLevelNavigator(navigationRef);}}
                screenProps={{ 
                  t: translation
                }}
              />
            </AuthProvider>
          </AskProvider>
        </HelpProvider>
      </ProfileProvider>
    </ChatProvider>
  );
}
