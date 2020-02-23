import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { ListItem, Divider, Text, Icon } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase';
import moment from 'moment';
import { ScrollView } from 'react-native-gesture-handler';

const NoticeListScreen = ({ navigation }) => {
  console.log('NoticeList screen');
  // setup language
  const { t } = useTranslation();
  // primary language
  const language = i18next.language;
  // state
  const [noticeData, setNoticeData] = useState([]);
  // componentDidMount
  useEffect(() => {
  }, []);

  // initialize the component -> componentDidMount
  const onWillFocus = async payload => {
    updateNoticeList();
  };

  const updateNoticeList = () => {
    // get notice list
    getNoticeList();
  };

  const getNoticeList = async () => {
    console.log('getting notice list');
    // notices ref
    const noticesRef = firebase.firestore().collection('notices');
    noticesRef.orderBy('createdAt', "desc").limit(10)
    .onSnapshot(snapshot => {
      let data = [];
      const subject = `subject-${language}`;
      // build data array
      snapshot.docs.forEach(doc => {
        data = [...data, ({
          docId: doc.id,
          createdAt: moment(doc.data().createdAt.toDate()).format('ll'),
          subject: doc.data()[subject]
        })];
        setNoticeData(data);
      });
    });
  };

  const onItemPress = ({ docId, subject, date }) => {
    // navigate to chatting with case id
    navigation.navigate('Notice', { docId, subject, language, date });
  };

  const renderItem = ({ item }) => (
    <ListItem
      title={item.subject}
      subtitle={item.createdAt}
      bottomDivider
      chevron
      onPress={() => onItemPress({ docId: item.docId, subject: item.subject, date: item.createdAt })}
    />
  );

  
  const renderNoticeList = () => {
    return (
      <ScrollView>
        <FlatList
          keyExtractor={item => item.createdAt}
          data={noticeData}
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
      {renderNoticeList()}
    </SafeAreaView>
  );
};

NoticeListScreen.navigationOptions = ({ navigation }) => {
  return {
    title: i18next.t('NoticeListScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };
}

export default NoticeListScreen;
