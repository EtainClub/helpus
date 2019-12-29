import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Platform, FlatList, TouchableOpacity } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import firebase from 'react-native-firebase'; 
import { SearchBar, Text, ButtonGroup, Card, ListItem, Avatar, CheckBox, Icon } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import { GEOCODING_API_KEY } from 'react-native-dotenv';
import { ScrollView } from 'react-native-gesture-handler';
import Leaderboard from 'react-native-leaderboard';
import { Context as ProfileContext } from '../context/ProfileContext';

const LeadersScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();
  const language = i18next.language;
  // get reference to the current user
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;
  // use context
  const { state, findUsers, getLeaderboard } = useContext(ProfileContext);
  // use state
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [field, setField] = useState('');
  const [rank, setRank] = useState(0);
  const [indicator, setIndicator] = useState(0);
  const [boardData, setBoardData] = useState([]);

  // componentDidMount
  useEffect(() => {
    console.log('LeadersScreen');
    // fetch initial board data
    updateBoard(tab);
  }, []);


  const ordinal_suffix_of = (i) => {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
  }

  // update leaderboard
  const updateBoard = (select) => {
    // set a tab
    setTab(select);
    // set field
    let property = '';
    switch (select) {
      case 0: property = "helpCount"; break;
      case 1: property = "askCount"; break;
      case 2: property = "votes"; break;
      default: property = "helpCount"; break;
    }
    setField(property);
    // fetch new data
    fetchData(property);
    // update user rank
    updatUserRank(property);
  };

  // fetch data and build board data
  const fetchData = async (property) => {
    // users on firestore
    const usersRef = firebase.firestore().collection('users');
    //// get data
    // ordering and showing only top users
    const maxElem = 10;
    usersRef.orderBy(property, "desc").limit(maxElem)
    .onSnapshot(snapshot => {
      let data = [];
      // build data array
      snapshot.docs.forEach(doc => {
        data = [...data, ({
          name: doc.data().name,
          iconUrl: doc.data().avatarUrl,
          score: doc.data()[property]
        })];
      });
      console.log('[LeadersScreen|fetchData] data', data);
      // set data
      setBoardData(data);
    });
  };

  // update user's rank
  const updatUserRank = async (property) => {
    // users on firestore
    const usersRef = firebase.firestore().collection('users');
    usersRef.orderBy(property, "desc")
    .onSnapshot(snapshot => {
      let order = 1;
      snapshot.docs.forEach(doc => {
        // match with the user id
        if (userId === doc.id) {
          // set user data
          setRank(order);
          // set indicator
          setIndicator(doc.data()[property]);
          return;
        }
        order++;
      });
    });
  };

  const renderHeader = () => {
    return (
      <View colors={[, '#1da2c6', '#1695b7']}
        style={{ backgroundColor: '#119abf', padding: 15, paddingTop: 35, alignItems: 'center' }}>
        <Text style={{ fontSize: 25, color: 'white', }}>{state.userInfo.name}</Text>
        <View style={{
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
          marginBottom: 15, marginTop: 20
        }}>
          <Text style={{ color: 'white', fontSize: 25, flex: 1, textAlign: 'right', marginRight: 40 }}>
            {ordinal_suffix_of(rank)}
          </Text>
          <FastImage style={{ flex: .66, height: 60, width: 60, borderRadius: 60 / 2 }}
            source={{ uri: state.userInfo.avatarUrl }} />
          <Text style={{ color: 'white', fontSize: 25, flex: 1, marginLeft: 40 }}>
            {indicator} {t('cases')}  
          </Text>
        </View>
        <ButtonGroup
            onPress={(select) => updateBoard(select)}
            selectedIndex={tab}
            buttons={['Helped', 'Got Helped', 'Voted']}
            containerStyle={{ height: 30 }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        {renderHeader()}
        <SearchBar
          placeholder={t('LeadersScreen.searchPlaceholder')}
          onChangeText={setSearch}
          value={search}
        />
        <Leaderboard 
          data={boardData} 
          sortBy='score' 
          labelBy='name'
          icon="iconUrl"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

LeadersScreen.navigationOptions = ({ navigation }) => {
  return {
    title: i18next.t('LeadersScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  }
};


const styles = StyleSheet.create({
  mapContainer: {
    height: 280,
    marginBottom: 0
  },
  buttonContainer: {
    position: 'absolute',
    top: '65%',
    right: '3%'
  }
});

export default LeadersScreen;