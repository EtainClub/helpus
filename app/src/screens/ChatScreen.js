import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform} from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Text, Button, Input, Card, Overlay } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { GiftedChat } from 'react-native-gifted-chat';
import firebase from 'react-native-firebase'; 
import ImagePicker from 'react-native-image-picker';
import uuid from 'uuid/v4'; // Import UUID to generate UUID

const ChatScreen = ({navigation}) => {
  console.log('chat screen');
  // setup language
  const { t } = useTranslation();

  // use state
  const [chats, setChats] = useState([]);
  const [userInfo, setUserInfo] = useState('');
  const [imgSource, setImgSource] = useState({});
  const [imgUri, setImgUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imgLoading, setImgLoading] = useState(false);
  const [imgAttached, setImgAttached] = useState(false);

  
  // get params
  const caseId = navigation.getParam('caseId');

  // get reference to the message list
  const chatsRef = firebase.firestore().collection('cases').doc(`${caseId}`).collection('chats');
  
  // get reference to the current user
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;

  let unsubscribe;

  // use effect
  useEffect(() => {
    console.log('[chatScreen] caseId', caseId);
    getUserInfo();
    listenToChat();
    return () => {
      console.log('unsubscribe message listener');
      unsubscribe();
    }
  }, []);

  const getUserInfo = async () => {
    const userRef = firebase.firestore().doc(`users/${userId}`);
    await userRef.get()
    .then(doc => {
      console.log('user doc', doc.data());
      setUserInfo(doc.data());
    })
    .catch(error => {
      console.log('Failed to get user info', error);
    })
  }

  // start listener
  const listenToChat = async () => {
    console.log('[chatScreen] listenChat case', caseId);
    unsubscribe = firebase.firestore().collection('cases')
    .doc(`${caseId}`)
    .collection('chats')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot(snapshot => {
      let messages = [];
      snapshot.docs.forEach(doc => {
        console.log('[ChatScreen] doc data', doc.data());
        const createdAt = doc.data().createdAt.toDate();
        messages = [
          ...messages,({
            _id: doc.data()._id,
            text: doc.data().text,
            createdAt: createdAt,
            user: doc.data().user,
            image: doc.data().image
        })];
      });
      // update the message state
      setChats(messages);
      console.log('chats', messages);
    });
    console.log('[listenChat]unsubrribe', unsubscribe);
  }

  const onSend = async (messages = []) => {
    // get the latest message
    const message = messages[0];
    console.log('onSend message', message);


    // add the message to firestore chats 
    await chatsRef.add({
      _id: message._id,
      text: message.text,
      createdAt: new Date(),
      user: {
        _id: message.user._id,
        name: message.user.name,
        avatar: message.user.avatar
      },
      image: message.image
    })
  }

  const uploadImage = async (source, imageUri) => {
    console.log('imgSource', source);
    console.log('imgUri', imageUri);
    const ext = imageUri.split('.').pop(); // Extract image extension
    const filename = `${uuid()}.${ext}`; // Generate unique name
    setImgLoading(true);
    const imgRef = firebase.storage().ref(`chats/${filename}`);
    const unsubscribe = imgRef.putFile(imageUri)
      .on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        async snapshot => {
          let state = {};
          state = {
            ...state,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Calculate progress percentage
          };
          if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
            console.log('upload success');
            // unsubscribe the event
            unsubscribe();
            // update the image url
            let url;
            await imgRef.getDownloadURL()
            .then((response) => {
              console.log('get url response', response);
              url = response;
            })
            .catch(error => {
              console.log('Failed to get url', error);
            })
            setImageUrl(url);
            const messages = [{
              _id: uuid(),
              text: '',
              createdAt: new Date(),
              user: {
                _id: userId,
                name: userInfo.name,
                avatar: userInfo.avatarUrl
              },
              image: url
            }];
            onSend(messages);
          }
        },
        error => {
          console.log('ChatScreen uploading error', error);
          // alert for failure to upload image
          Alert.alert(
            t('ChatScreen.updateErrorTitle'),
            t('ChatScreen.updateError'),
            [
              {text: t('confirm')}
            ],
            {cancelable: true},
          );
        }
      );
  };
  
  const pickerOptions = {
    title: t('ChatScreen.pickerTitle'),
    maxWidth: 640, // photos only
    maxHeight: 640, // photos only
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };


  // user clicks the attachment icon
  onFilePickerPress = async () => {
    ImagePicker.showImagePicker(pickerOptions, (response) => {
      console.log('image response', response);
      if (response.didCancel) {
        // alert for canceling avatar picking
        Alert.alert(
          t('ChatScreen.cancelPickerTitle'),
          t('ChatScreen.cancelPicker'),
          [
            {text: t('confirm')}
          ],
          {cancelable: true},
        );        
      } else if (response.error) {
        console.log('ChatScreen pickerError', response.error);
        // alert for avatar picking error
        Alert.alert(
          t('ChatScreen.pickerErrorTitle'),
          t('ChatScreen.pickerError'),
          [
            {text: t('confirm')}
          ],
          {cancelable: true},
        );
      } else {
        const source = {uri: response.uri};
        console.log('source', source);
        setImgSource(source);
        setImgUri(response.uri);
        // upload image
        uploadImage(source, response.uri);
      }
    });
  };

  renderCustomActions = () => {
    if (true) {
      const icon_color = imgAttached ? "#0064e1" : "#808080";
      return (
        <View style={styles.customActionsContainer}>
          <TouchableOpacity onPress={onFilePickerPress}>
            <View style={styles.buttonContainer}>
              <Icon name="paperclip" size={23} color={icon_color} />
            </View>
          </TouchableOpacity>
        </View>
      );
    }
  
    return (
      <ActivityIndicator size="small" color="#0064e1" style={styles.loader} />
    );
  }

  
  return (
    <GiftedChat
      messages={chats}
      onSend={messages => onSend(messages)}
      user={{
        _id: userId,
        name: userInfo.name,
        avatar: userInfo.avatarUrl
      }}
      renderActions={this.renderCustomActions}
    />
  );
}

// increase the helper's vote
// @todo the user cannot vote more for this case
// creat a new field in the case, vote to set flag
onVotePress = async ({ caseId, helperId }) => {
  console.log('vote up pressed');
  console.log('[ChatScreen|onVotePress] caseId, helperId', caseId, helperId);

  //// self cannot vote
  // get reference to the current user
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;  
  // check the userId
  if (userId === helperId) {
    // alert for cannot vote message
    Alert.alert(
      i18next.t('ChatScreen.cannotVoteTitle'),
      i18next.t('ChatScreen.cannotVote'),
      [
        {text: i18next.t('confirm')}
      ],
      {cancelable: true},
    );
    return;
  }  
  // case reference
  const caseRef = firebase.firestore().collection('cases').doc(`${caseId}`);
  // get vote field
  await caseRef.get()
  .then(doc => {
    console.log('[ChatScreen|onVotePress] doc', doc);
    if (typeof doc.data().voted != 'undefined') {
      if (!doc.data().voted) {
        // set the flag
        caseRef.update({ voted: true });
        // set increment interval
        const increment = firebase.firestore.FieldValue.increment(1);
        // get helper id
        const helperRef = firebase.firestore().doc(`users/${helperId}`);
        // update the number of votes of the helper
        helperRef.update({
          votes: increment
        });
        // alert for cannot vote message
        Alert.alert(
          i18next.t('ChatScreen.votedTitle'),
          i18next.t('ChatScreen.voted'),
          [
            {text: i18next.t('confirm')}
          ],
          {cancelable: true},
        );
      } else {
        // message box
        alert(i18next.t('ChatScreen.votedAlready'));
        // alert for cannot vote message
        Alert.alert(
          i18next.t('ChatScreen.votedAlreadyTitle'),
          i18next.t('ChatScreen.votedAlready'),
          [
            {text: i18next.t('confirm')}
          ],
          {cancelable: true},
        );
      }
    }
  })
  .catch(error => {
    console.log('cannot get voted flag', error);
  });
}

ChatScreen.navigationOptions = ({navigation}) => {
  const caseId = navigation.getParam('caseId');
  const helperId = navigation.getParam('helperId');

  console.log('[ChatScreen] caseId, helperId', caseId, helperId);
  console.log('navigation', navigation);
  
  return {
    title: i18next.t('ChatScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerRight: (
      <Button
        containerStyle={styles.voteButton}
        buttonStyle={{ marginRight: 5 }} 
        title={i18next.t('ChatScreen.voteButton')}
        onPress={() => { 
          onVotePress({ caseId, helperId });
        }}
      />
    )
  };
};


const styles = StyleSheet.create({
  customActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 10
  },
  loader: {
    paddingTop: 20
  },
  voteButton: {
    paddingBottom: Platform.OS === 'android' ? 0 : 5
  }
});

export default ChatScreen;
