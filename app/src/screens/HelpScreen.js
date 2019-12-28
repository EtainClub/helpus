import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { Text, Button, Card, Overlay, Icon } from 'react-native-elements';
import firebase from 'react-native-firebase'; 

// custom libraries
import { Context as HelpContext } from '../context/HelpContext';
import Spacer from '../components/Spacer';

const HelpScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();
  // use context
  const { state, askReceived, acceptRequest } = useContext(HelpContext);
  // use state
  const [showModal, setShowModal] = useState(false);
  // use state
  const [senderInfo, setSenderInfo] = useState({});
  const [senderLocation, setSenderLocation] = useState('');

  // use effect
  useEffect(() => {
  }, []);

  // update the notification
  const handleFocus = payload => {
    if(__DEV__) console.log('[HelpScreen] onWillFocus Event, paylod', payload)

    // get navigation params
    const notificationBody = navigation.getParam('notificationBody');
    const senderId = notificationBody.data.senderId;

    if(__DEV__) console.log('[HelpScreen] onWillFocus Event, notificationBody', notificationBody)

    // update the notification
    askReceived(notificationBody);
    // get sender info and profile
    getSenderInfo(senderId);
  };
  
  const getSenderInfo = async (senderId) => {
    // sender
    console.log('[HelpScreen] senderId', senderId);
    // reference to sender info
    const senderRef = firebase.firestore().doc(`users/${senderId}`);
    console.log('[HelpScreen] senderId ref', senderRef);
    await senderRef
      .get()
      .then(doc => {
        console.log('[HelpScreen] sender doc', doc);
        // set sender info
        setSenderInfo(doc.data());
      })
      .catch(error => {
        console.log('cannot get sender info', error);
      });

    // get sender locations
    let locations = [];
    await senderRef
      .collection('locations')
      .get()
      .then(snapshot => {
        console.log('[location snapshot]', snapshot);
        if (!snapshot.empty) {
          console.log('snapshot is not empty', snapshot.empty);
          snapshot.forEach(doc => {
            locations.push(doc.data());
          });
          console.log('location', locations);
          // put only the first location
          setSenderLocation(locations[0].name);
        }
      })
      .catch(error => {
        console.log('cannot get location data', error);
      });
  };

  // when a user accepts the request
  const onAcceptRequest = () => {
    // make modal invisible
    setShowModal(false);
    // handle the acceptance
    acceptRequest({ caseId: state.caseId, navigation });
  };

  // when a user declines the request
  const onDeclineRequest = () => {
    console.log('decline the reqeust, navigate to ask');
    // naviate to main
    navigation.navigate('AskMain');
  };
  
  const handleGoBack = payload => {
    console.log('[HelpScreen] handleGoBack payload', payload);
    if (!state.askAccepted) {
      // when a user is away from this screen
      onDeclineRequest();
    }
  };

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={payload => handleGoBack(payload)}
        onWillFocus={payload => handleFocus(payload)}
      />
      <View style={styles.rowContainer}>
        <Card 
          containerStyle={styles.senderCard}
          wrapperStyle={{borderColor: 'blue', flex: 1}}
          title={t('HelpScreen.senderCardTitle')}
          titleStyle={{fontSize: 24, fontWeight: 'bold'}}
        >
          <Spacer>
          <View style={styles.itemContainer}>
            <Icon
              type='font-awesome' 
              name='map-marker'
              size={20}
              color={'#353535'}
            />
            <View style={{paddingLeft: 12}}>
              <Text style={{fontSize: 20, fontWeight: 'bold'}}>{t('location')}:</Text> 
              <Text style={{fontSize: 20, fontWeight: 'bold'}}>{senderLocation ? senderLocation : t('unknownLocation')}</Text>
            </View>
          </View>
          </Spacer>
          <Spacer>
          <View style={styles.itemContainer}>
            <Icon
              type='font-awesome' 
              name='hand-o-left'
              size={20}
              color={'#353535'}
            />
            <View style={styles.columnContainer}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{t('HelpScreen.askCases')}</Text>
              <Text style={{ fontSize: 20 }}>{senderInfo.askCount? senderInfo.askCount : "0"} {t('cases')}</Text>
            </View>
          </View>
          </Spacer>
          <Spacer>
          <View style={styles.itemContainer}>
            <Icon
              type='font-awesome'
              name='hand-o-right'
              size={20}
              color={'#353535'}
            />
            <View style={styles.columnContainer}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{t('HelpScreen.helpCases')}</Text>
              <Text style={{ fontSize: 20 }}>{senderInfo.helpCount? senderInfo.helpCount : "0"} {t('cases')}</Text>
            </View>
          </View> 
          </Spacer>
          <Spacer>
          <View style={styles.itemContainer}>
            <Icon
              type='font-awesome'
              name='thumbs-o-up'
              size={20}
              color={'#353535'}
            />
            <View style={styles.columnContainer}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{t('HelpScreen.votes')}</Text>
              <Text style={{ fontSize: 20 }}>{senderInfo.votes? senderInfo.votes : "0"} {t('cases')}</Text>
            </View>
          </View> 
          </Spacer>
        </Card>
        <Card 
          containerStyle={styles.msgCard}
          wrapperStyle={{borderColor: 'blue', flex: 1, marginHorizontal: 10}}
          title={t('HelpScreen.msgCardTitle')}
          titleStyle={{fontSize: 24, fontWeight: 'bold'}}
        >
          <Text style={{fontSize: 18, fontWeight: 'bold'}}>
            {state.notificationBody}
          </Text>
        </Card>
      </View>
      <Spacer>
        <View style={styles.buttonGroup}>
          <Button containerStyle={{flex: 1, marginHorizontal: 5}}
            buttonStyle={{height: 50}}
            titleStyle={{fontSize: 24, fontWeight: 'bold'}}
            title={t('HelpScreen.acceptButton')}
            loading={state.loading}
            onPress={() => setShowModal(true)}/>
          <Button containerStyle={{flex: 1, marginHorizontal: 5}}
            buttonStyle={{height: 50, backgroundColor: 'grey'}}
            titleStyle={{fontSize: 24, fontWeight: 'bold'}}
            raised
            title={t('HelpScreen.declineButton')}
            loading={state.loading}
            onPress={() => onDeclineRequest()}/>
        </View>
      </Spacer>
        <Overlay
          overlayStyle={styles.modal}
          isVisible={showModal}
          height={500}
          width={300}
          windowBackgroundColor="rgba(255, 255, 255, .5)"
          onBackdropPress={() => setShowModal(false)}
        >
          <View>
            <Text style={styles.modalText}>{t('HelpScreen.acceptMessage')}</Text>
            <View style={styles.buttonGroup}>
              <View style={{ width: 100 }}>
                <Button
                  buttonStyle={{ height: 50 }}
                  titleStyle={{ fontSize: 24, fontWeight: 'bold' }}
                  title={t('yes')}
                  onPress={() => onAcceptRequest()}
                />
              </View>
              <View style={{ width: 100 }}>
                <Button 
                  buttonStyle={{height: 50, backgroundColor: 'grey'}}
                  titleStyle={{fontSize: 24, fontWeight: 'bold'}}
                  title={t('no')}
                  onPress={() => setShowModal(false)}
                />
              </View>
            </View>
          </View>
        </Overlay>
    </SafeAreaView>
  );
};

HelpScreen.navigationOptions = () => {
  return {
    title: i18next.t('HelpScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };
};

// styles
const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center'
  },
  modalText: {
    marginBottom: 50, 
    fontSize: 20, 
    fontWeight: 'bold',
    alignSelf: "center"
  },
  rowContainer: {
    flexDirection: 'row',
//    justifyContent: 'flex-start',
    height: 400,
    marginTop: 50,
  },
  senderCard: {
    flex: 1,
//    borderColor: 'red',
//    borderWidth: 3,
    margin: 5,
    padding: 0,
  },
  msgCard: {
    flex: 1,
//    borderColor: 'red',
//    borderWidth: 3,
    margin: 5,
    padding: 0,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: 'flex-start'
  },
  columnContainer: {
    marginHorizontal: 4
  }
});

export default HelpScreen;