import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { ListItem, Divider, Text, Icon, Badge } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase';
import moment from 'moment';
import { ScrollView } from 'react-native-gesture-handler';

const ChatListScreen = ({ navigation }) => {
  console.log('chatlist screen');
  // setup language
  const { t } = useTranslation();
  // state
  const [search, setSearch] = useState('');
  const [askCases, setAskCases] = useState([]);
  const [helpCases, setHelpCases] = useState([]);

  // get reference to the current user
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;
  
  // componentDidMount
  useEffect(() => {
    // set navigation params
    navigation.setParams({ updateChatList });
  }, []);

  // initialize the component -> componentDidMount
  const onWillFocus = async payload => {
    if (__DEV__) console.log('[ChatListScreen] onWillFocus Event, paylod', payload);
    updateChatList();
  };

  const updateChatList = () => {
    // get chat list of sender
    getCaseList('senderId');
    // get chat list of heper
    getCaseList('helperId');

    ///////////////////////////////////////////
    /*
    //// @db update db new field to users
    const usersRef = firebase.firestore().collection('users');
    usersRef.get()
    .then(snapshot => {
      snapshot.forEach(async doc => {
        const userRef = firebase.firestore().doc(`users/${doc.id}`);
        userRef.update({
          tester: false
        });
      });
    });
    */
    /////////////////////////////////////////
  };

  const getCaseList = async userIdType => {
    console.log('getting chat list');
    // get user id
    const {currentUser} = firebase.auth();
    // cases ref
    const casesRef = firebase.firestore().collection('cases');
    console.log('casesRef', casesRef);


    /*
    //// @DB update add newChat field to all cases
    casesRef.get()
    .then(snapshot => {
      snapshot.forEach(async doc => {
        const caseRef = firebase.firestore().doc(`cases/${doc.id}`);
        // delete newChat field and add two new fields
        caseRef.update({
          newChat: firebase.firestore.FieldValue.delete(),
//          newChat: false,
//          newChatHelper: false,
//          newChatSender: false
        });
      });
    });
    */
   
    // query
    let matchedCases = [];
    // get chat list of sender
    await casesRef
      .where(userIdType, '==', currentUser.uid)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No matching docs');
          return;
        }
        snapshot.forEach(doc => {
          let docItem = doc.data();
          // check sanity, acceptance
          if (!docItem.accepted) {
            console.log('Warning the case is not accepted!!!', docItem);
          } else {
            //console.log('[ChatListScreen] docItem', docItem);
            docItem.docId = doc.id;
            docItem.createdAt = moment(docItem.createdAt.toDate()).format('ll');
            matchedCases.push(docItem);
            if (__DEV__) console.log(doc.id, '=>', docItem);
          }
        });
        // update state
        if (userIdType === 'senderId') {
          setAskCases(matchedCases);
        } else {
          setHelpCases(matchedCases);
        }
        console.log('matchedCases', matchedCases);
      })
      .catch(error => {
        console.log('cannot query cases', error);
      });
  };

  const onItemPress = ({ caseId, helperId }) => {
    //// reset newchat field
    // case reference
    const caseRef = firebase.firestore().collection('cases').doc(`${caseId}`);
    // update the newChat field
    if (userId === helperId) {
      caseRef.update({ newChatHelper: false });
    } else {
      caseRef.update({ newChatSender: false });
    }
    // navigate to chatting with case id
    navigation.navigate('Chatting', { caseId, helperId });
  };

  const renderItem = ({item}) => (
    <ListItem
      title={item.message}
      titleStyle={ userId === item.helperId ? item.newChatHelper && { color: 'blue' }
                   : item.newChatSender && { color: 'blue' }
      }
      subtitle={item.createdAt}
      leftIcon={ 
        type='font-awesome', 
        item.voted ? { name: 'thumb-up', color: 'black' } : { name: 'thumb-up', color: 'lightgrey' }
      } 
      bottomDivider
      rightIcon={ userId === item.helperId ? item.newChatHelper && <Badge status="warning" />
                  : item.newChatSender && <Badge status="warning" />
      }
      onPress={() => onItemPress({caseId: item.docId, helperId: item.helperId})}
    />
  );

  const renderSenderChatList = () => {
    return (
      <ScrollView style={{ height: 280 }}>
        <FlatList
          keyExtractor={item => item.docId}
          data={askCases}
          renderItem={renderItem}
        />
      </ScrollView>
    );
  };

  const renderHelperChatList = () => {
    return (
      <ScrollView style={{ height: 300, marginBottom: 0 }}>
        <FlatList
          keyExtractor={item => item.docId}
          data={helpCases}
          renderItem={renderItem}
        />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationEvents
        onWillFocus={payload => onWillFocus(payload)}
      />
      <View style={{alignItems: 'center', backgroundColor: 'lightgrey'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>{i18next.t('ChatListScreen.askCases')}</Text>
      </View>
      {renderSenderChatList()}
      <Divider style={{backgroundColor: 'grey', height: 3}} />
      <View style={{alignItems: 'center', backgroundColor: 'lightgrey'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>{i18next.t('ChatListScreen.helpCases')}</Text>
      </View>
      {renderHelperChatList()}
    </SafeAreaView>
  );
};

ChatListScreen.navigationOptions = ({ navigation }) => {
  return {
    title: i18next.t('ChatListScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerRight: (
      <TouchableOpacity
        onPress={navigation.getParam('updateChatList')}
      >
      <Icon
        containerStyle={{marginRight: 25}}
        type='font-awesome' 
        name="refresh"
        size={30}
        color={'#353535'}
      />
      </TouchableOpacity>
    ),
  };
}

export default ChatListScreen;
