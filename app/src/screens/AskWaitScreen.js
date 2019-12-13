import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Text, Button, Input, Card, Overlay } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import * as RNLocalize from 'react-native-localize';

// custom libraries
import { Context as AskContext } from '../context/AskContext';
import { Context as HelpContext } from '../context/HelpContext';
import Spacer from '../components/Spacer';

const AskWaitScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();
  // use auth context; state, action, default value
  const { state, cancelRequest, monitorAcceptance } = useContext( AskContext );
  // use state
  const [startTime, setStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElpased] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [timerId, setTimerId] = useState(null);

  // set initial time when the component starts
  useEffect(() => {
    // set timer
    const intervalId = setInterval(() => {
      setTimeElpased(() => new Date() - startTime);
    }, 1000);
    // set the timer id
    setTimerId(intervalId);
    // start to monitor acceptance
    monitorAcceptance({ caseId: state.caseId, userId: state.userId, navigation });

    // clear the interval when the compoment will be unmount
    return () => clearInterval(intervalId);
  }, []);

  onCancelPress = () => {
    // show the confirm modal
    setShowModal(true);
  }

  // cancel the request
  onCancelRequest = () => {
    // make the modal invisible
    setShowModal(false);
    // clear the timer 
    if (timerId) clearInterval(timerId);
    // cancel request
    cancelRequest({ caseId: state.caseId, navigation });
    // navigate to the ask screen
    navigation.navigate('AskMain');
  }

  
  showSpinner = () => {
    if (!state.requestAccepted) {
      return (
        <View style={styles.spinner}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }
  }

  // go to ask if the request has been accepted
  skipFlow = () => {
    console.log('[askWait] requestAccepted', state.requestAccepted);
    if (state.requestAccepted) {
      // clear the timer 
      if (timerId) clearInterval(timerId);
      navigation.navigate('AskMain');
    }
  }

  handleGoBack = () => {
    console.log('[AskWait] handleGoBack');
    if (!state.requestAccepted) {
      // when a user is away from this screen, cancel the request
      cancelRequest({ caseId: state.caseId });
    }
  }

  showTimer = () => {
    // detect language
    const lang = RNLocalize.getLocales()[0].languageCode;
    if (lang === 'en') {
      return (
        <Text style={styles.timeText}>
          {t('AskWaitScreen.time')}: {moment(timeElapsed).format('mm [M] ss [S]')}
        </Text>
      );
    }
    return (
      <Text style={styles.timeText}>
        {t('AskWaitScreen.time')}: {moment(timeElapsed).format('mm [분] ss [초]')}
      </Text>
    );
  };

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={handleGoBack}
        onWillFocus={skipFlow}
      />
      <Card containerStyle={styles.spinnerContainer}>
        {showSpinner()}
      </Card>
      <Card>
        {showTimer()}
        <Overlay
          overlayStyle={styles.modal}
          isVisible={showModal}
          height={500}
          width={300}
          windowBackgroundColor="rgba(255, 255, 255, .5)"
          onBackdropPress={() => setShowModal(false)}
        >
          <View>
            <Spacer> 
              <Text style={styles.modalText}>{t('AskWaitScreen.cancelMessage')}</Text>
            </Spacer>
            <View style={styles.buttonGroup}>
              <View style={{ width: 100 }}>
                <Button 
                  title={t('yes')}
                  onPress={() => onCancelRequest()}
                >
                </Button>
              </View>
              <View style={{ width: 100 }}>
                <Button
                  buttonStyle={{ backgroundColor: 'grey' }} 
                  title={t('no')}
                  onPress={() => setShowModal(false)}
                >
                </Button>
              </View>
            </View>
          </View>
        </Overlay>
      </Card>
      <Spacer>
        <Button
          buttonStyle={{ height: 100 }} 
          titleStyle={{ fontSize: 30, fontWeight: 'bold' }}
          title={t('AskWaitScreen.button')}
          onPress={() => {onCancelPress()}} />
      </Spacer>
    </SafeAreaView>
  );
};

AskWaitScreen.navigationOptions = () => {
  return {
    title: i18next.t('AskWaitScreen.header'),
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
    alignSelf: 'center'
  },
  timeText: {
    fontSize: 20, 
    fontWeight: 'bold',
    alignSelf: 'center'
  },
  spinnerContainer: {
    height: 200,
    justifyContent: 'center'
  },
  spinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
});

export default AskWaitScreen;