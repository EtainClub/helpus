import React from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase'; 
import uuid from 'uuid/v4'; // Import UUID to generate UUID

import createDataContext from './createDataContext';

// reducer
const askReducer = (state, action) => {
  switch (action.type) {
    case 'update_app_status':
      return { 
        ...state, 
        totalUsers: action.payload.totalUsers, 
        totalCases: action.payload.totalCases
      };
    case 'set_loading':
      return {...state, loading: true};
    case 'request_help':
      console.log('request_help payload', action.payload);
      return { 
        ...state, loading: true, errorMessage: '',
        message: action.payload.message,
        caseId: action.payload.caseId
      };
    case 'send_success':
      return {
        ...state, loading: false, userId: action.payload,
        requestAccepted: false, 
      };
    case 'cancel_success':
      // update the case id
      return {
        ...state,
      };
    case 'request_accepted':
      return {...state, requestAccepted: true, loading: false}
    default:
      return state;
  }
};

// get number of cases and active users of the app
const getAppStatus = dispatch => {
  return async () => {
    // get number of users
    const usersRef = firebase.firestore().collection('users');
    let totalUsers = 0;
    await usersRef.get()
      .then(snapshot => {
        totalUsers = snapshot.size;
      })
      .catch(error => {
        console.log('Error getting the cases', error);
      });

    // get number of cases
    const casesRef = firebase.firestore().collection('cases');
    let totalCases = 0;
    await casesRef.get()
      .then(snapshot => {
        totalCases = snapshot.size;
      })
      .catch(error => {
        console.log('Error getting the cases', error);
      });
    
    // update state
    dispatch({
      type: 'update_app_status',
      payload: {totalUsers, totalCases}
    });
  };
};

// ask help
const requestHelp = dispatch => {
  console.log('[requestHelp]');
  return async ({ message, navigation }) => {
    // do not request if the message is empty
    if (message === '') {
      console.log('[Ask] message is empty');
      return;
    }
    // uppdate loading state
    dispatch({
      type: 'set_loading',
    });

    console.log('[requestHelp] before sending message');

    // initial request message becomes the first all the time
    sendMessage({ dispatch, message, navigation });
  };
};

// send message
const sendMessage = async ({dispatch, message, navigation}) => {
  //// get user info
  // get user language
  const language = i18next.language;
  // get current user
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;
  // get user info
  let userRef = firebase.firestore().doc(`users/${userId}`);
  let avatarUrl = '';
  let userName = '';
  await userRef
    .get()
    .then(doc => {
      avatarUrl = doc.data().avatarUrl;
      userName = doc.data().name;
    })
    .catch(error => {
      console.log('error', error);
    });
  console.log('avatar', avatarUrl);
  console.log('userName', userName);

  //// write the message in the firestore
  // get cases ref
  let casesRef = firebase.firestore().collection('cases');
  let caseId = null;
  // messing time based on utc+0
  const date = new Date();
  // local time offset in hours from UTC+0
  const timeOffset = date.getTimezoneOffset();
  // get hors and minutes
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const messagingTime = hour*60 + minutes + timeOffset;
  // add a new document with auto generated doc id
  await casesRef.add({
    senderId: userId,
    message,
    accepted: false,
    voted: false,
    language,
    createdAt: new Date(),
    messagingTime
  })
  .then(async docRef => {
    console.log('case generated with doc id: ', docRef.id);
    caseId = docRef.id;
    // update state
    dispatch({ 
      type: 'request_help',
      payload: { caseId, message },
    });
    //// set message
    // get case ref
    let caseRef = firebase.firestore().collection('cases').doc(`${docRef.id}`);
    await caseRef.collection('chats').add({ 
      _id: uuid(), 
      text: message, 
      createdAt: new Date(),
      user: {
        _id: userId,
        avatar: avatarUrl,
        name: userName
      }
    });
    // not waiting for adding chat messge, go on to the wait screen
    // update state
    dispatch({ type: 'send_success', payload: userId });
    // navigate
    navigation.navigate('AskWait');
  })
  .catch(error => {
    console.log('Error adding a new case: ', error);
  });
};

// cancel the ask request
const cancelRequest = dispatch => {
  // 
  return async ({ caseId, navigation }) => {
    // remove the requesting case
    removeCase({ caseId });
    // update the caseId
    dispatch({ type: 'cancel_success' });
  }
}

// remove the case if a client cancels the request
const removeCase = async ({ caseId }) => {
  // get case ref
  console.log('[removeCase] caseId', caseId);
  
  const caseRef = firebase.firestore().collection('cases').doc(`${caseId}`);

  // do not remove the case if the case is already accepted
  let already_accepted = false;
  await caseRef.get()
  .then(snapshot => {
    console.log('[removecase] snapshot', snapshot);
    if (snapshot.data().accepted) {
      already_accepted = true;
    }  
  })
  .catch(error => {
    console.log('[removeCase] cannot get case accepted field', error);
  });

  // just return
  if (already_accepted) {
    console.log('the case is already accepted. cannot delete it. case id', caseId);
    return;
  }

  // first delete the sub-collection of the will-be-deleted case
  await caseRef.collection('chats').get()
  .then(snapshot => {
    // check if it exists
    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        doc.ref.delete();
      });
    }
  })
  .catch(error => {
    console.log('error! cannot delete the chats collection', error);
  });

  // now delete the doc
  await caseRef.delete()
  .then(() => {
    console.log('case deleted');
  })
  .catch(error => {
    console.log('error! cannot delete the case', error);
  });
}

// monitor acceptance
const monitorAcceptance = dispatch => {
  return async ({ caseId, userId, navigation }) => {
    console.log('caseId', caseId);
    const caseRef = firebase.firestore().collection('cases').doc(`${caseId}`);
    console.log('case data', caseRef.get());
    // set listener and unsubcribe when it is done
    const unsubscribe = caseRef
      .onSnapshot(async (docSnapshot) => {
        console.log('doc snapshot', docSnapshot);
        console.log('[monitorAcceptance] doc snapshot data', docSnapshot.data());
        // check if the data exists
        if (!docSnapshot.exists)
        {
          console.log('doc snapshot data is empty');
          return;
        }
        if (docSnapshot.data().accepted) {
          console.log('request accepted');
          // update state
          dispatch({ type: 'request_accepted' });
          // navigate to chat screen with param of user as client
          navigation.navigate('Chatting', { caseId, helperId: docSnapshot.data().helperId });
          // unsubscribe
          unsubscribe();
        }
      }, error => {
        console.log('Encountered error on listening to accepted field change', error);
      });
  };
};

export const { Provider, Context } = createDataContext(
  askReducer,
  { requestHelp, cancelRequest, monitorAcceptance, getAppStatus },
  { 
    message: '', errorMessage: '', loading: false,
    caseId: null, userId: null, senderId: null, requestAccepted:false,
    totalUsers: 0, totalCases: 0
  }
);