import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, SnapshotViewIOS} from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Button, Icon, Badge, AirbnbRating, Overlay, Card, ListItem, Avatar, Text } from 'react-native-elements';
import Flag from 'react-native-flags';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { GiftedChat } from 'react-native-gifted-chat';
import firebase from 'react-native-firebase'; 
import ImagePicker from 'react-native-image-picker';
import uuid from 'uuid/v4'; // Import UUID to generate UUID

import { Context as ProfileContext } from '../context/ProfileContext';

const ChatScreen = ({ navigation }) => {
  console.log('chat screen');
  // setup language
  const { t } = useTranslation();

  // use context
  const { state } = useContext(ProfileContext);
  // use state
  const [chats, setChats] = useState([]);
  const [userInfo, setUserInfo] = useState('');
  const [imgSource, setImgSource] = useState({});
  const [imgUri, setImgUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imgLoading, setImgLoading] = useState(false);
  const [imgAttached, setImgAttached] = useState(false);
//  const [unsubscribeChat, setUnsubscribeChat] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [helperData, setHelperData] = useState(null);

  // get navigation params
  const caseId = navigation.getParam('caseId');
  const helperId = navigation.getParam('helperId');

  // get reference to the message list
  const chatsRef = firebase.firestore().collection('cases').doc(`${caseId}`).collection('chats');
  
  // get reference to the current user
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;

  let unsubscribe = null;

  // componentWillMount
  useEffect(() => {
    // set navigation param for voting
    navigation.setParams({ 
      handleVoting: handleVoting
    });

    return () => {
      console.log('unsubscribe message listener');
      unsubscribe();
    }
  }, []);

  // initialize the component -> componentDidMount
  const onWillFocus = async payload => {
    if (__DEV__) console.log('[ChatScreen] onWillFocus Event, paylod', payload);
    getUserInfo();
    listenToChat();
  };

  // process when a user is away from this screen
  const onWillBlur = payload => {
    //// set newChat field to false
    // case ref
    const caseRef = firebase.firestore().collection('cases').doc(`${caseId}`);
    // update newChat field
    if (userId === helperId) {
      caseRef.update({ newChatHelper: false });
    } else {
      caseRef.update({ newChatSender: false });
    }
  }

  const getUserInfo = async () => {
    const userRef = firebase.firestore().doc(`users/${userId}`);
    await userRef.get()
    .then(doc => {
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
    .onSnapshot(snapshot => {
      let messages = [];
      snapshot.docs.forEach(doc => {
        if (__DEV__) console.log('[ChatScreen] doc data', doc.data());
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
    });

    //// set newChat field to true
    // case ref
    const caseRef = firebase.firestore().collection('cases').doc(`${caseId}`);
    // update newChat field
    if (userId === helperId) {
      caseRef.update({ newChatSender: true });
    } else {
      caseRef.update({ newChatHelper: true });
    }
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
              { text: t('confirm') }
            ],
            { cancelable: true },
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
      if (__DEV__) console.log('image response', response);
      if (response.didCancel) {
        // alert for canceling avatar picking
        Alert.alert(
          t('ChatScreen.cancelPickerTitle'),
          t('ChatScreen.cancelPicker'),
          [
            { text: t('confirm') }
          ],
          { cancelable: true },
        );        
      } else if (response.error) {
        console.log('ChatScreen pickerError', response.error);
        // alert for avatar picking error
        Alert.alert(
          t('ChatScreen.pickerErrorTitle'),
          t('ChatScreen.pickerError'),
          [
            { text: t('confirm') }
          ],
          { cancelable: true },
        );
      } else {
        const source = {uri: response.uri};
        if (__DEV__) console.log('source', source);
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
              <Icon 
                type='font-awesome' 
                name="paperclip" 
                size={23} 
                color={icon_color} />
            </View>
          </TouchableOpacity>
        </View>
      );
    }
  
    return (
      <ActivityIndicator size="small" color="#0064e1" style={styles.loader} />
    );
  }

  // increase the helper's vote
  // @todo the user cannot vote more for this case
  // creat a new field in the case, vote to set flag
  handleVoting = async () => {
    console.log('vote up pressed');
    console.log('[ChatScreen|handleVoting] caseId, helperId', caseId, helperId);

    //// self cannot vote
    // check the userId
    if (userId === helperId) {
      // alert for cannot vote message
      Alert.alert(
        i18next.t('ChatScreen.cannotVoteTitle'),
        i18next.t('ChatScreen.cannotVote'),
        [
          { text: i18next.t('confirm') }
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
      if (typeof doc.data().voted != 'undefined') {
        if (!doc.data().voted) {
          // show the rating modal
          setShowRating(true);      
        } else {
          // alert for cannot vote message
          Alert.alert(
            i18next.t('ChatScreen.votedAlreadyTitle'),
            i18next.t('ChatScreen.votedAlready'),
            [
              { text: i18next.t('confirm') }
            ],
            { cancelable: true },
          );
        }
      }
    })
    .catch(error => {
      console.log('cannot get voted flag', error);
    });
  }
  
  // update the rating
  const onFinishRating = (value) => {
    setRating(value);
  };

  const onConfirmRating = async () => {
    // dismiss the modal
    setShowRating(false);
    // case reference
    const caseRef = firebase.firestore().collection('cases').doc(`${caseId}`);
    // set the vote flag
    caseRef.update({ voted: true });
    
    /*
    //// @test update add new field to users
    const usersRef = firebase.firestore().collection('users');
    const initRatings = [0, 0, 0, 0, 0];
    usersRef.get()
    .then(snapshot => {
      snapshot.forEach(async doc => {
        const userRef = firebase.firestore().doc(`users/${doc.id}`);
        userRef.update({
          ratings: initRatings
        });
      });
    });
    */

    // get helper id
    const helperRef = firebase.firestore().doc(`users/${helperId}`);
    // update the number of votes of the helper
    helperRef.update({
      votes: firebase.firestore.FieldValue.increment(1)
    });
    //// update the rate array
    // get current ratings
    let ratings = [];
    helperRef.get()
    .then(doc => {
      // get ratings
      ratings = doc.data().ratings;
      // increment
      ratings[rating-1] += 1;
      // update the db
      helperRef.update({
        ratings: ratings
      });
    })
    .catch(error => console.log(error));
  };

  // calculate the average rating
  const calucateAverageRating = (ratings) => {
    let sumRatings = 0;
    let ratingCount = 0;
    for( let i=0; i<ratings.length; i++) {
      sumRatings += (i+1)*ratings[i];
      ratingCount += ratings[i];
    }
    // check sanity and compute average
    let avgRating = 0;
    if (ratingCount > 0) {
      // average
      avgRating = (sumRatings/ratingCount).toFixed(1);
    } 
    return avgRating;
  }

  // fetch user data and build data
  const fetchUserData = async (helper) => {
    // helper ref
    const userRef = firebase.firestore().doc(`users/${helper}`);
    // get skills
    let skills = [];
    userRef.collection('skills').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        skills.push(doc.data());
      });
    })
    .catch(error => {
      console.log('cannot get skill data', error);
    });
    // get locations
    let locations = [];
    await userRef.collection('locations').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        locations.push(doc.data());
      });
    })
    .catch(error => {
      console.log('cannot get location data', error);
    });   
    // get helper data
    userRef.get()
    .then(doc => {
      // calculate average rating
      const avgRating = calucateAverageRating(doc.data().ratings);
      data = {
        username: doc.data().name,
        iconUrl: doc.data().avatarUrl,
        helpCount: doc.data().helpCount,
        askCount: doc.data().askCount,
        votes: doc.data().votes,
        rating: avgRating,
        skills: skills,
        languages: doc.data().languages,
        locations: locations
      };
      // set user data
      setHelperData(data);
    })
    .catch(error => console.log(error));

  };

  const renderHelperCard = () => {
    return (
      <Card
        containerStyle={{ margin: 0, padding: 0 }}
        title={t('LeadersScreen.userInfo')}
      >
        <ListItem
          leftAvatar={
            <View>
              <Avatar size="large" rounded
                source={{
                  uri: helperData.iconUrl,
                }} 
              />
              <Text style={{ textAlign: 'center' }}>{helperData.username}</Text>
            </View>
          }
          title={
            <View>
              <View style={{ flexDirection: 'row' }}>
                <Icon 
                  type='font-awesome' 
                  name='gift' 
                  size={20} 
                  color={'#353535'}
                />
                <View>
                  {
                    helperData.skills.map((skill, id) => {
                      if (skill.name !== '') {
                        return (
                          <Text key={id} style={{ marginLeft: 6 }}>{skill.name}</Text>
                        );
                      }
                    }) 
                  }
                </View>
              </View>
    
              <View style={{ flexDirection: 'row' }}>
                <Icon type='font-awesome' name='hand-o-left' size={20} color={'#353535'}/>
                <Text style={{ marginLeft: 6 }}>{helperData.askCount}</Text>
              </View>
    
              <View style={{ flexDirection: 'row' }}>
                <Icon type='font-awesome' name='hand-o-right' size={20} color={'#353535'}/>
                <Text style={{ marginLeft: 6 }}>{helperData.helpCount}</Text>
              </View>
    
              <View style={{ flexDirection: 'row' }}>
                <Icon type='font-awesome' name='thumbs-o-up' size={20} color={'#353535'}/>
                <Text style={{ marginLeft: 8 }}>{helperData.rating} ({helperData.votes})</Text>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <Icon type='font-awesome' name='map-marker' size={20} color={'#353535'}/>
                <View>
                  {
                    helperData.locations.map((location, id) => {
                      if (location.name !== '') {
                        return (
                          <View key={id} style={{ flexDirection: 'row' }}>
                            <Text style={{ marginLeft: 10 }}>{location.name}</Text>
                            <Badge value={location.votes} badgeStyle={{ height: 20 }}/>
                          </View>
                        );
                      }
                    }) 
                  }
                </View>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <Icon type='font-awesome' name='language' size={20} color={'#353535'}/>
                {
                  helperData.languages[0] == 'ko' ? 
                  <Flag
                    style={ Platform.OS == 'ios' ? { marginLeft: 8, marginTop: 0, paddingTop: 0 } 
                      : { marginLeft: 8 }
                    } 
                    code="KR" size={24}
                  />
                   : 
                  <Flag
                    style={ Platform.OS == 'ios' ? { marginLeft: 8, marginTop: 0, paddingTop: 0 } 
                      : { marginLeft: 8 } 
                    }
                    code="GB" size={24}
                  />
                }
                {
                  typeof helperData.languages[1] == 'undefined' ? null :
                  helperData.languages[1] == 'ko' ? <Flag code="KR" size={24}/>
                   : <Flag code="GB" size={24}/>
                }
              </View>

            </View>
          }      
        />
      </Card>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <NavigationEvents
        onWillFocus={payload => onWillFocus(payload)}
        onWillBlur={payload => onWillBlur(payload)}
      />
      <GiftedChat
        messages={chats}
        onSend={messages => onSend(messages)}
        user={{
          _id: userId,
          name: userInfo.name,
          avatar: userInfo.avatarUrl
        }}
        renderActions={this.renderCustomActions}
        onPressAvatar={(user) => {
          fetchUserData(user._id);
          setShowUserModal(true)}
        }
      />

      <Overlay
        isVisible={showUserModal}
        height={300}
        width='90%'
        overlayBackgroundColor="lightgrey"
        windowBackgroundColor="rgba(255, 255, 255, .5)"
        onBackdropPress={() => setShowUserModal(false)}
      >
        {helperData && renderHelperCard()}
      </Overlay>

      <Overlay
        isVisible={showRating}
        height={200}
        width='90%'
        onBackdropPress={() => setShowRating(false)}
      >
        <View>
          <AirbnbRating
            count={5}
            reviews={[t('ChatScreen.ratingBad'), t('ChatScreen.ratingHmm'), t('ChatScreen.ratingOk'), 
                      t('ChatScreen.ratingGood'), t('ChatScreen.ratingEx')
            ]}
            defaultRating={0}
            size={20}
            onFinishRating={onFinishRating}
          />
          <Button
            containerStyle={{ marginTop: 20 }}
            title={t('ChatScreen.ratingButton')}
            onPress={onConfirmRating} 
          />
        </View>
      </Overlay>
      </View>
  );
}

ChatScreen.navigationOptions = ({ navigation }) => {  
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
        onPress={navigation.getParam('handleVoting')}
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
