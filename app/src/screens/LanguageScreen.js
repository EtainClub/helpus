import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, Linking, Alert, Share, TouchableOpacity } from 'react-native';
import { NavigationEvents, SafeAreaView } from 'react-navigation';
import { Text, Button, CheckBox, SearchBar, ListItem, Divider } from 'react-native-elements';
import DraggableFlatList from 'react-native-draggable-flatlist'
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-community/async-storage';
import firebase from 'react-native-firebase'; 
// custom libraries
import Spacer from '../components/Spacer';

const LanguageScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();
  // primary language
  const language = i18next.language;

  // get user doc
  const { currentUser } = firebase.auth();
  const userId = currentUser.uid;
  const userRef = firebase.firestore().doc(`users/${userId}`);

  // use state
  const [languageData, setLanguageData] = useState([]); 
  const [langChecks, setLangChecks] = useState([]);
  const [codeData, setCodeData] = useState([]); 
  const [removeFlag, setRemoveFlag] = useState(false);

  // handling component mount 
  useEffect(() => {
    getLanguages();
    // set navigation param
    navigation.setParams({
      onRemovePress: onRemovePress,
    });
  }, []);

  // handling language data change
  useEffect(() => {
    console.log('[useEffect]languageData', languageData);
    // build codeData checkList from languageData
    let codeList = [];
    let checkList = [];
    for (let i=0; i<languageData.length; i++) {
      codeList.push(languageData[i].code);
      checkList.push({ checked: false, code: languageData[i].code });
    }
    // update code data state
    setCodeData(codeList);
    // update check state
    setLangChecks(checkList);
    // update navigation param
    navigation.setParams({
      checks: checkList
    });
    // update db
    updateDB(codeList);
  }, [languageData]);

  // update language on db
  const updateDB = (codeList) => {
    console.log('[updateDB]');
    // update only the language field
    if (codeList.length > 0) {
      console.log('[updateDB] codeData', codeList);
      userRef.update({
        languages: codeList
      });
    }
  };

  // get language data from db
  const getLanguages = async () => {
    console.log('[getLanguages]');
    let langList = [];
    userRef.get()
    .then(async snapshot => {
      const languages = snapshot.data().languages;
      if (languages) {
        console.log('[getLanguages] data', languages);
        // build lists
        for (let i=0; i<languages.length; i++) {
          langList.push({
            key: `item-${i}`,
            code: languages[i],
          });
        }
      }
      else {
        langList.push({
          key: 'item-0',
          code: language,
        });
      }
      // update language data state
      setLanguageData(langList);   
      // save the primary language in asyncstorage
      await AsyncStorage.setItem('language', language);
    })
    .catch(error => console.log(error));  
  };

  const onWillFocus = () => {
    console.log('[onWillFocus]');
    // get navigation params
    const selectedCode = navigation.getParam('selectedLang');
    if (selectedCode) {
      console.log('[onWillFocus] selectedCode', selectedCode);
      // get length of current list
      const len = languageData.length;
      console.log('language length', len);
      // append language
      const newLang = {
        key: `item-${len+1}`,
        code: selectedCode,
      };  
      // append an item to the list
      setLanguageData(prevList => {
        const newList = [...prevList, newLang];
        return newList;
      });       
      // append only code 
      setCodeData(prevState => {
        const newList = [...prevState, selectedCode];
        return newList;
      });
    }
    // clear param
    navigation.setParams({
      selectedLang: null
    });
  };

  // update language list when move finishes
  const onLanguageMoved = async ({ data }) => {
    console.log('[onLanguageMoved] before updating languagedata', data);
    setLanguageData(data);
    // change display language
    i18next.changeLanguage(data[0].code);
    // update primary language in asyncstorage
    console.log('[onLanguageMoved] update primary lang', data[0].code);
    await AsyncStorage.setItem('language', data[0].code);
  };

  // update language check state
  const onLanguageCheck = (id) => {
    let checkList = [...langChecks];
    checkList[id].checked = !langChecks[id].checked;
    console.log('[onLanguageCheck]langChecks', langChecks);
    console.log('[onLanguageCheck]checkList', checkList);
    setLangChecks(checkList);
    // set navigation params
    navigation.setParams({
      checks: checkList
    });
  };

  // render language item
  const renderItem = ({ item, index, move, moveEnd, isActive }) => {
    return (
      <TouchableOpacity
        style={{
          height: 30,
          backgroundColor: isActive ? 'grey' : 'white',
        }}
        onLongPress={move}
        onPressOut={moveEnd}
      >
        {
          removeFlag ? 
            <View style={{ flexDirection: 'row' }}>          
              <CheckBox
                containerStyle={{ backgroundColor: 'white', borderWidth: 0 }}            
                title={t(item.code)}
                textStyle={{ fontSize: 20, fontWeight: 'bold' }}
                size={25}
                checked={langChecks[index].checked}
                onPress={() => onLanguageCheck(index)}
              />
            </View>  
          :
            <Text style={{ fontSize: 20, fontWeight: 'bold', paddingHorizontal: 10 }}>
            {index+1} {t(item.code)}
            </Text>
        }
      </TouchableOpacity>
    );
  };

  // @todo cannot access state, but set value to state is possible
  const onRemovePress = (checks) => {
    console.log('[onRemovePress] checks', checks);
    // get number of all languages
    const numLang = checks.length;
    // count the number of checked languages
    let numChecked = 0;
    for (let i=0; i<numLang; i++) {
      if (checks[i].checked)
        numChecked++;
    }
    console.log('[onRemovePress] numChecked', numChecked);
    // return if not checked
    if (numChecked == 0 && numLang != 1) 
    {
      setRemoveFlag(true);    
      return;
    }
    // sanity check: cannot remove all languages
    if (numLang == numChecked || numLang == 1) {
      Alert.alert(
        t('LanguageScreen.languageTitle'),
        t('LanguageScreen.languageError'),
        [
          { text: t('confirm') }
        ],
        { cancelable: true },
      );
      // reset remove flag
      setRemoveFlag(false);
      // update navigation param
      let checkList = [];
      for (let i=0; i<numLang; i++) {
        checkList.push({ checked: false, code: checks[i].code });
      }
      navigation.setParams({
        checks: checkList
      });
      // update check state
      setLangChecks(checkList);
    } else {
      // open a modal
      Alert.alert(
        t('LanguageScreen.languageTitle'),
        t('LanguageScreen.languageText'),
        [
          { text: t('yes'), onPress: () => onLangRemove(checks) },
        ],
        { cancelable: true },
      );  
    }
  };
  
  // remove language
  const onLangRemove = async (checks) => {
    console.log('[onLangRemove]checks', checks);
    // build new languageData, then useEffect handles the db update
    let langList = [];
    let checkList = [];
    for (let i=0; i<checks.length; i++) {
      // if not check, append the lang
      if (!checks[i].checked) {
        langList.push({
          key: `item-${i}`,
          code: checks[i].code
        });
        checkList.push({
          checked: false,
          code: checks[i].code
        })
      }
    }
    // update languageData
    setLanguageData(langList);
    // reset remove flag
    setRemoveFlag(false);
    // clear navigation param
    navigation.setParams({
      checks: checkList
    });
    // update display language if there is only one language left
    if (langList.length == 1) {
      // save the primary language in asyncstorage
      await AsyncStorage.setItem('language', langList[0].code);
      // change display language
      i18next.changeLanguage(langList[0].code);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationEvents
        onWillFocus={onWillFocus}
      />
      <Text style={styles.listHeaderText}>{t('LanguageScreen.use')}</Text>
      <View style={{ height: 100 }}>
      <DraggableFlatList
        data={languageData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `draggable-item-${item.key}`}
        scrollPercent={5}
        onMoveEnd={({ data }) => onLanguageMoved({ data })}
      />
      </View>
      <Button
        type="solid"
        buttonStyle={{ height: 50, margin: 20 }}
        titleStyle={{ fontSize: 24, fontWeight: 'bold' }}     
        title={t('LanguageScreen.add')}
        onPress={() => navigation.navigate('LanguageAdd', { codeData })}
        icon={
          <Icon
            style={{ marginHorizontal: 5 }}
            name="add"
            size={30}
            color='white'
          />
        }
      />
    </SafeAreaView>
  );
};


LanguageScreen.navigationOptions = ({ navigation }) => {
  const onRemovePress = navigation.getParam('onRemovePress');
  const checks = navigation.getParam('checks');
  console.log('[navigationOptions] checks', checks);

  return {
    title: i18next.t('LanguageScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
      alignText: 'center'
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerRight: (
      <TouchableOpacity
        onPress={() => onRemovePress(checks)}
      >
      <Text style={{ marginRight: 25, fontSize: 20, color: 'black' }}>
        {i18next.t('remove')}
      </Text>
      </TouchableOpacity>
    ),
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

export default LanguageScreen;