// languages
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-community/async-storage';

// import custom libraries
import ko from './ko.json';
import en from './en.json';

// multi-languages
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (cb) => {
    const preferredLang = await AsyncStorage.getItem('language');
    if (preferredLang) {
      cb(preferredLang);
    } else {
      console.log('lang', RNLocalize.getLocales()[0].languageCode);
      cb(RNLocalize.getLocales()[0].languageCode);
    }
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18next
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    resources: { ko, en },
    react: {
      useSuspense: false
    }
  });
