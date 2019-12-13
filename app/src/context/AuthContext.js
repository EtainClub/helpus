import React, { useContext } from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase'; 
import createDataContext from './createDataContext';
import NavigationService from '../NavigationService';

// reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'start_auth':
      console.log('start_auth reducer');
      return { ...state, loading: true, errorMessage: '' };
    case 'add_error':
      return { ...state, errorMessage: action.payload, loading: false };
    case 'signup':
      console.log('sigup reducer');
      return { idToken: action.payload.idToken, errorMessage: '', loading: false };
    case 'signin':
      console.log('signin reducer');
      return { 
        errorMessage: '', 
        idToken: action.payload.idToken, pushToken: action.payload.pushToken, 
        loading: false 
      };
    case 'clear_error':
      return { ...state, errorMessage: '', loading: false };
    case 'signout':
      console.log('signout reducer');
      return { idToken: null, pushToken: null, errorMessage: '', loading: false };
    default:
      return state;
  }
};

//// actions
// local login
const trySigninWithToken = dispatch => {
  return async () => {
    // get id token from storage
    let idToken = await AsyncStorage.getItem('idToken');
    if (idToken) {
      // dispatch signin action
      dispatch({ type: 'signin', payload: idToken });
      // navigate to landing screen
      NavigationService.navigate('mainFlow');
      // @test
//      NavigationService.navigate('ProfileContract');
    } else {
      NavigationService.navigate('loginFlow');
    }
  };
};

// clear error
const clearError = dispatch => () => {
  console.log('clear error dispatch');
  // dispatch clear action
  dispatch({type: 'clear_error'});
};

// signup
const signup = dispatch => {
  // use language
  const {t} = useTranslation();

  return async ({email, password, confirm_password, navigation}) => {
    // start auth action
    dispatch({
      type: 'start_auth',
    });

    // check password
    if (password !== confirm_password) {
      console.log('signup password is not matched');
      dispatch({
        type: 'add_error',
        payload: t('AuthContext.PasswordError'),
      });
      return;
    }
    // create an account using firebase
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(user => {
        console.log('firebase signup', user);
        // get the ID token
        firebase
          .auth()
          .currentUser.getIdToken(/* forceRefresh */ true)
          .then(async idToken => {
            console.log('signup firebase id token', idToken);
            // store id token for login/logout
            await AsyncStorage.setItem('idToken', idToken);
            // signup action
            dispatch({
              type: 'signup',
              payload: idToken,
            });
            // save the email in storage
            await AsyncStorage.setItem('email', email);
            // navigate
            navigation.navigate('Signin', {email});
          })
          .catch(error => {
            console.log(error);
            dispatch({
              type: 'add_error',
              payload: t('AuthContext.SignupError') + '. ' + error,
            });
          });
      })
      .catch(error => {
        console.log(error);
        dispatch({
          type: 'add_error',
          payload: t('AuthContext.SignupError') + '. ' + error,
        });
      });
  };
};

// sign in
const signin = dispatch => {
  // use language
  const { t } = useTranslation();

  return async ({email, password, navigation}) => {
    // start auth action
    dispatch({
      type: 'start_auth',
    });
    // login using firebase
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        // get the ID token
        const {currentUser} = firebase.auth();
        currentUser.getIdToken(/* forceRefresh */ true)
          .then(async idToken => {
            // save the email in storage
            await AsyncStorage.setItem('email', email);
            // store id token for login/logout
            await AsyncStorage.setItem('idToken', idToken);
            console.log('sigin user id', currentUser.uid);
            //// get message push token
            // request permission
            firebase.messaging().requestPermission();
            // get the device push token
            firebase
              .messaging()
              .getToken()
              .then(async pushToken => {
                console.log('push token', pushToken);
                // store push token 
                await AsyncStorage.setItem('fcmToken', pushToken);
                //// create a new user doc or update push token if the user exists
                const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
                userRef.get()
                .then(docSnapshot => {
                  console.log('[signin] doc snapshot', docSnapshot);
                  if (docSnapshot.exists) {
                    console.log('[signin] doc exist');
                    userRef.update({pushToken});
                  } else {
                    console.log('[signin] doc does not exist');
                    // create a user info
                    userRef.set({ 
                      pushToken,
                      name: '',
                      avatarUrl: '',
                      askCount: 0,
                      helpCount: 0,
                      votes: 0,
                      regions: [],
                      languages: [i18next.language]
                    })
                    .then(() => {
                      // create initial profile on firebase
                      console.log('[signin] creating initial profile');
                      createInitialProfile({ userId: currentUser.uid });
                    })
                    .catch(error => console.log('failed to create a user info', error));
                  }
                  // update the state with
                  dispatch({
                    type: 'signin',
                    payload: {idToken, pushToken},
                  });
                  // navigate to the main flow
                  navigation.navigate('mainFlow'); 
                })
                .catch(error => {
                  console.log('[signin] cannot get user doc', error);
                });
              }) // end of pushToken
              .catch(error => {
                console.log('getPushToken', error);
                dispatch({
                  type: 'add_error',
                  payload: t('AuthContext.getPushTokenError') + '. ' + error,
                });
              });
          }) // end of token
          .catch(error => {
            console.log('getToken', error);
            dispatch({
              type: 'add_error',
              payload: t('AuthContext.SigninTokenError') + '. ' + error,
            });
          });
      }) // end of signin
      .catch(error => {
        console.log('signin', error);
        dispatch({
          type: 'add_error',
          payload: t('AuthContext.SigninError') + '. ' + error,
        });
      });
  };
};

const createInitialProfile = ({ userId }) => {
  // initial skill state
  const INIT_SKILL = {
    id: null,
    name: '',
    votes: 0
  }
  // populate array with the initial state
  const INIT_SKILLS = new Array(5).fill(INIT_SKILL).map((item) => ({ 
    ...item, id: Math.random().toString()
  }));

  // initial location state
  const INIT_LOCATION = {
    id: null,
    name: '',
    district: '',
    city: '',
    state: '',
    country: '',
    display: '',
    votes: 0
  }
  // populate array with the initial state
  const INIT_LOCATIONS = new Array(2).fill(INIT_LOCATION).map((item) => ({ 
    ...item, id: Math.random().toString()
  }));

  // get the firebase doc ref
  const userRef = firebase.firestore().doc(`users/${userId}`);
  console.log('[createInitialProfile] userRef', userRef );
  // map over the skills and override the current skills
  INIT_SKILLS.map(async (skill, id) => {
    console.log('[createInitialProfile] skill, id', skill.name, id);
    // add new doc under the id
    userRef.collection('skills').doc(`${id}`).set({
      name: skill.name,
      votes: skill.votes
    });
  });

  // map over the locations and override current locations
  INIT_LOCATIONS.map(async (location, id) => {
    console.log('[createInitialProfile] location, id', location.name, id);
    // add new doc under the id
    userRef.collection('locations').doc(`${id}`).set({
      name: location.name,
      district: location.district,
      city: location.city,
      state: location.state,
      country: location.country,
      display: location.display,
      votes: location.votes
    });
  });
};

// sign out
const signout = dispatch => {
  return async ({ userId, navigation }) => {
    console.log('signout userId', userId);
    // remove the id token in the storage
    await AsyncStorage.removeItem('idToken');
    //// remove the push token in the firestore
    const userRef = firebase.firestore().doc(`users/${userId}`);
    // remove push token
    userRef.get()
      .then(async docSnapshot => {
        console.log('[signout] doc snapshot', docSnapshot);
        if (docSnapshot.exists) {
          console.log('[signout] doc exist');
          await userRef.update({ pushToken: null });
          // signout from firebase 
          firebase.auth().signOut()
            .then(() => {
              // dispatch signout action
              dispatch({ type: 'signout' });
              // navigate to loginFlow
              navigation.navigate('loginFlow');
            })
            .catch(error => {
              console.log('failed to signout from firebase', error);
            });
        }
      })
      .catch(error => {
        console.log('failed to remove push token', error);
      });
  };
}

export const { Provider, Context } = createDataContext(
  authReducer,
  { signin, signup, signout, clearError, trySigninWithToken },
  { token: null, pushToken: null, errorMessage: '', loading: false }
);


