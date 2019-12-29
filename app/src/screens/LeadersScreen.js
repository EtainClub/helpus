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
  // use context
  const { state, findUsers, getLeaderboard } = useContext(ProfileContext);
  // use state
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);

  const globalData = [
    { name: 'We Tu Lo', score: null, iconUrl: 'https://st2.depositphotos.com/1006318/5909/v/950/depositphotos_59094043-stock-illustration-profile-icon-male-avatar.jpg' },
    { name: 'Adam Savage', score: 12, iconUrl: 'https://www.shareicon.net/data/128x128/2016/09/15/829473_man_512x512.png' },
    { name: 'Derek Black', score: 244, iconUrl: 'http://ttsbilisim.com/wp-content/uploads/2014/09/20120807.png' },
    { name: 'Erika White', score: 0, iconUrl: 'http://www.lovemarks.com/wp-content/uploads/profile-avatars/default-avatar-eskimo-girl.png' },
    { name: 'Jimmy John', score: 20, iconUrl: 'https://static.witei.com/static/img/profile_pics/avatar4.png' },
    { name: 'Joe Roddy', score: 69, iconUrl: 'http://www.lovemarks.com/wp-content/uploads/profile-avatars/default-avatar-braindead-zombie.png' },
    { name: 'Ericka Johannesburg', score: 101, iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShPis8NLdplTV1AJx40z-KS8zdgaSPaCfNINLtQ-ENdPvrtMWz' },
    { name: 'Tim Thomas', score: 41, iconUrl: 'http://conserveindia.org/wp-content/uploads/2017/07/teamMember4.png' },
    { name: 'John Davis', score: 80, iconUrl: 'http://www.lovemarks.com/wp-content/uploads/profile-avatars/default-avatar-afro-guy.png' },
    { name: 'Tina Turner', score: 22, iconUrl: 'https://cdn.dribbble.com/users/223408/screenshots/2134810/me-dribbble-size-001-001_1x.png' },
    { name: 'Harry Reynolds', score: null, iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsSlzi6GEickw2Ft62IdJTfXWsDFrOIbwXhzddXXt4FvsbNGhp' },
    { name: 'Betty Davis', score: 25, iconUrl: 'https://landofblogging.files.wordpress.com/2014/01/bitstripavatarprofilepic.jpeg?w=300&h=300' },
    { name: 'Lauren Leonard', score: 30, iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr27ZFBaclzKcxg2FgJh6xi3Z5-9vP_U1DPcB149bYXxlPKqv-' },
  ];

  const friendData = [
    { name: 'Joe Roddy', score: 69, iconUrl: 'http://www.lovemarks.com/wp-content/uploads/profile-avatars/default-avatar-braindead-zombie.png' },
    { name: 'Ericka Johannesburg', score: 101, iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShPis8NLdplTV1AJx40z-KS8zdgaSPaCfNINLtQ-ENdPvrtMWz' },
    { name: 'Tim Thomas', score: 41, iconUrl: 'http://conserveindia.org/wp-content/uploads/2017/07/teamMember4.png' },
  ];

  // componentDidMount
  useEffect(() => {
    console.log('LeadersScreen');
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

  const renderHeader = () => {
    return (
      <View colors={[, '#1da2c6', '#1695b7']}
        style={{ backgroundColor: '#119abf', padding: 15, paddingTop: 35, alignItems: 'center' }}>
        <Text style={{ fontSize: 25, color: 'white', }}>Leaderboard</Text>
        <View style={{
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
          marginBottom: 15, marginTop: 20
        }}>
          <Text style={{ color: 'white', fontSize: 25, flex: 1, textAlign: 'right', marginRight: 40 }}>
              {ordinal_suffix_of(0)}
          </Text>
          <FastImage style={{ flex: .66, height: 60, width: 60, borderRadius: 60 / 2 }}
              source={{ uri: 'http://www.lovemarks.com/wp-content/uploads/profile-avatars/default-avatar-braindead-zombie.png' }} />
          <Text style={{ color: 'white', fontSize: 25, flex: 1, marginLeft: 40 }}>
              pts
          </Text>
        </View>
        <ButtonGroup
            onPress={setTab}
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
          data={globalData} 
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