import React, { useContext, useState } from 'react';
import firebase from 'react-native-firebase';
import { Linking, StyleSheet } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Text, Divider, Button } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';
// custom libraries
import Spacer from '../components/Spacer';

// @todo guide to change primary language by drag and drop
const NoticeScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();

  // get navigation params
  const docId = navigation.getParam('docId');
  const language = navigation.getParam('language');
  const subject = navigation.getParam('subject');
  const date = navigation.getParam('date');
  // get reference to the notice
  const bodyRef = firebase.firestore().collection('notices').doc(`${docId}`).collection('body').doc(`${language}`);

  // state
  const [body, setBody] = useState('');
  const [imgUrl, setImgUrl] = useState(null);
  const [link, setLink] = useState(null);

  // get body
  bodyRef.get()
  .then(doc => {
    console.log('doc data', doc.data());
    setBody(doc.data().body);
    if (doc.data().imgUrl !== '')
      setImgUrl(doc.data().imgUrl);
    if (doc.data().link !== '')
      setLink(doc.data().link);
  })
  .catch(error => console.log(error));

  console.log('bodyRef', bodyRef);
  return (
    <SafeAreaView>
      <ScrollView>
        <Spacer>
          <Text>{date}</Text>
          <Text h4>{subject}</Text>
        </Spacer>
        <Divider />
        <Spacer>
          <Text>{body}</Text>
          {
            link &&
            <Button
              buttonStyle={{ margin: 20, justifyContent: 'center' }} 
              title={t('NoticeScreen.button')} 
              onPress={() => Linking.openURL(link)}
            />
          }
        </Spacer>
      </ScrollView>
    </SafeAreaView>
  );
};

NoticeScreen.navigationOptions = () => {
  return {
    title: i18next.t('NoticeScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
      alignText: 'center'
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };
};

// styles
const styles = StyleSheet.create({
  listHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'blue',
    marginLeft: 10,
  },
});

export default NoticeScreen;