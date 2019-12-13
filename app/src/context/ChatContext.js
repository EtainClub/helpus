import React from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase'; 
import createDataContext from './createDataContext';

// chat reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case 'update_chats':
      return {
        ...state, 
        chats: [
          ...state.chats,
          action.payload
        ]
      };
    case 'append_message':
      return {
        ...state, msgId: state.msgId+1,
        messageArray: [
          ...state.messageArray,
          action.payload
        ]
      };
    case 'update_messageArray':
      return {
        ...state, messageArray: action.payload
      }
    default:
      return state;
  }
}

//// actions

// send message
const sendMessage = dispatch => {
  return async ({ message, caseId }) => {
    console.log('[ChatContext] message', message);

    //// append the message into firestore
    // get reference to the message list
    const msgRef = firebase.firestore().collection('cases').doc(`${caseId}`);
    // append a new messages
    message.user.name = "android";
    await msgRef.collection('chats').add({
      _id: message._id,
      text: message.text,
      createdAt: new Date(),
      user: {
        _id: message.user._id,
        name: message.user.name
      }
    })

//    dispatch({ 
//      type: 'append_message', 
//      payload: messages[0]
//    });
 
  };
};


export const { Provider, Context } = createDataContext(
  chatReducer,
  { sendMessage },
  { chats: [], messageArray: [], msgId: 1 }
);