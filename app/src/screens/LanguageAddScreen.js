import React, { useContext, useState } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Text, ListItem } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';
// custom libraries
import Spacer from '../components/Spacer';
import { Context as AuthContext } from '../context/AuthContext';

// @todo guide to change primary language by drag and drop
const LanguageAddScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();

  // get navigation params
  const codeData = navigation.getParam('codeData');
  // build language list to display
  let allLanguages = [];
  if (codeData) {
    // english
    if (!codeData.includes('en')) {
      // append
      allLanguages.push('en');
    }
    // korean
    if (!codeData.includes('ko')) {
      // append
      allLanguages.push('ko');
    }
  }
  
  const onLanguagePress = async (langCode) => {
    console.log('[onLanguagePress] allLang', allLanguages, langCode);
    // return to langugae screen
    navigation.navigate('Language', { selectedLang: langCode });
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <Spacer>
          <Text style={styles.listHeaderText}>{t('LanguageAddScreen.all')}</Text>
          {
            allLanguages.map((item, i) => (
              <ListItem
                key={i}
                title={t(item)}
                onPress={() => onLanguagePress(item)} 
              />
            ))
          }
        </Spacer>  
      </ScrollView>
    </SafeAreaView>
  );
};

LanguageAddScreen.navigationOptions = () => {
  return {
    title: i18next.t('LanguageAddScreen.header'),
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

export default LanguageAddScreen;