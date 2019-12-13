import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { ListItem, Divider, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase';
import moment from 'moment';
import { ScrollView } from 'react-native-gesture-handler';

const ChatListScreen = ({navigation}) => {
  console.log('chatlist screen');
  // setup language
  const {t} = useTranslation();
  // state
  const [search, setSearch] = useState('');
  const [askCases, setAskCases] = useState([]);
  const [helpCases, setHelpCases] = useState([]);
  // set navigation params
  useEffect(() => {
    //
    updateChatList();
    navigation.setParams({updateChatList});
  }, []);

  const updateChatList = () => {
    // get chat list of sender
    getCaseList('senderId');
    // get chat list of heper
    getCaseList('helperId');
  };

  const getCaseList = async userIdType => {
    console.log('getting chat list');
    // get user id
    const {currentUser} = firebase.auth();
    // cases ref
    const casesRef = firebase.firestore().collection('cases');
    console.log('casesRef', casesRef);
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
        console.log('snapshot', snapshot);
        snapshot.forEach(doc => {
          let docItem = doc.data();
          // check sanity, acceptance
          if (!docItem.accepted) {
            console.log('Warning the case is not accepted!!!', docItem);
          } else {
            console.log('[ChatListScreen] docItem', docItem);
            docItem.docId = doc.id;
            docItem.createdAt = moment(docItem.createdAt.toDate()).format('ll');
            matchedCases.push(docItem);
            console.log(doc.id, '=>', docItem);
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

  const onItemPress = ({caseId, helperId}) => {
    // navigate to chatting with case id
    navigation.navigate('Chatting', {caseId, helperId});
  };

  const renderItem = ({item}) => (
    <ListItem
      title={item.message}
      subtitle={item.createdAt}
      leftIcon={ item.voted ? { name: 'thumb-up' } : {} } 
      bottomDivider
      chevron
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
        style={{marginRight: 25}}
        name="refresh"
        size={30}
        color={'#353535'}
      />
      </TouchableOpacity>
    ),
  };
}

export default ChatListScreen;
