import React from 'react';
//import i18next from './i18n';
import i18next from 'i18next';
import {createSwitchNavigator, createAppContainer} from 'react-navigation';
import {createBottomTabNavigator} from 'react-navigation-tabs';
import {createStackNavigator} from 'react-navigation-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-community/async-storage';
// import custom libraries
import ResolveAuthScreen from './screens/ResolveAuthScreen';
import SigninScreen from './screens/SigninScreen';
import SignupScreen from './screens/SignupScreen';
import AskScreen from './screens/AskScreen';
import AskWaitScreen from './screens/AskWaitScreen';
import HelpScreen from './screens/HelpScreen';
import AccountScreen from './screens/AccountScreen';
import AccountEditScreen from './screens/AccountEditScreen';
import ProfileScreen from './screens/ProfileScreen';
import LocationScreen from './screens/LocationScreen';
import ChatScreen from './screens/ChatScreen';
import ChatListScreen from './screens/ChatListScreen';
import SettingScreen from './screens/SettingScreen';
import UsersScreen from './screens/UsersScreen';
import LanguageScreen from './screens/LanguageScreen';
import LanguageAddScreen from './screens/LanguageAddScreen';

const askFlow = createStackNavigator(
  {
    AskMain: AskScreen,
    AskWait: AskWaitScreen,
  },
  {
    headerLayoutPreset: 'center',
  },
);
askFlow.navigationOptions = ({ screenProps: { t } }) => ({
  tabBarLabel: t('askTab'),

  /*
  tabBarIcon: <Icon2 name="hands-helping" size={20} />,
  tabBarOptions: {
    activeTintColor: '#fb8122',
    inactiveTintColor: 'gray',
    labelStyle: {
      fontSize: 15,
      margin: 0,
      padding: 0,
    },
  },*/
});

const chatFlow = createStackNavigator(
  {
    ChatList: ChatListScreen,
    Chatting: ChatScreen,
  },
  {headerLayoutPreset: 'center'},
);
chatFlow.navigationOptions = ({ screenProps: { t } }) => ({
  tabBarLabel: t('chatTab'),
});

const profileFlow = createStackNavigator(
  {
    Account: AccountScreen,
    AccountEdit: AccountEditScreen,
    ProfileContract: ProfileScreen,
    LocationVerify: LocationScreen,
    Users: UsersScreen,
  },
  {headerLayoutPreset: 'center'},
);
profileFlow.navigationOptions = ({ screenProps: { t } }) => ({
  tabBarLabel: t('userTab'),
});

const settingFlow = createStackNavigator(
  {
    Settings: SettingScreen,
    Language: LanguageScreen,
    LanguageAdd: LanguageAddScreen,
  },
  {headerLayoutPreset: 'center'},
);
settingFlow.navigationOptions = ({ screenProps: { t } }) => ({
  tabBarLabel: t('settingTab'),
});

const switchNavigator = createSwitchNavigator({
  ResolveAuth: ResolveAuthScreen,
  loginFlow: createStackNavigator({
    Signin: SigninScreen,
    Signup: SignupScreen,
  }),
  helpFlow: createStackNavigator(
    {
      Help: HelpScreen,
    },
    {headerLayoutPreset: 'center'},
  ),
  mainFlow: createBottomTabNavigator(
    {
      Ask: askFlow,
      Chat: chatFlow,
      Profile: profileFlow,
      Settings: settingFlow,
    },
    {
      defaultNavigationOptions: ({navigation}) => ({
        tabBarIcon: ({focused, horizontal, tintColor}) => {
          const {routeName} = navigation.state;
          if (routeName === 'Ask') {
            return <Icon2 name="hands-helping" size={20} color={tintColor} />;
          } else if (routeName === 'Chat') {
            return <Icon name="comments" size={20} color={tintColor} />;
          } else if (routeName === 'Profile') {
            return <Icon name="user" size={20} color={tintColor} />;
          } else if (routeName === 'Settings') {
            return <Icon name="gear" size={20} color={tintColor} />;
          }
        },
      }),
      tabBarOptions: {
        activeTintColor: '#fb8122',
        inactiveTintColor: 'gray',
        labelStyle: {
          fontSize: 15,
          margin: 0,
          padding: 0,
        },
      },
    },
  ),
});

export default createAppContainer(switchNavigator);