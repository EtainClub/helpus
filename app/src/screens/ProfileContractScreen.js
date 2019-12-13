import React, { useState, useContext } from 'react';
import { View, TextInput, Image, FlatList, StyleSheet, Alert } from 'react-native';
import { Button, Text, Card, Divider, Overlay, Badge } from 'react-native-elements';
import { SafeAreaView, NavigationEvents } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

// custom libraries
import { Context as ProfileContext } from '../context/ProfileContext';
import Spacer from '../components/Spacer';

const ProfileScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();
/*
  // use context
  const { 
    state, 
    addSkill, deleteSkill, addLocation, deleteLocation,
    updateContract 
  } = useContext( ProfileContext );

  // use state
  const [editSkill, setEditSkill] = useState(false);
  const [skill, setSkill] = useState('');
  const [editLocation, setEditLocation] = useState(false);
  const [location, setLocation] = useState('');
  const [showModal, setShowModal] = useState(false);

  onSkillAddPress = () => {
    // check maximum skills
    if (state.skills.length >= 5) {
      Alert.alert( t('ProfileScreen.noMoreSkill') );
      return;
    }
    // show the edit
    setEditSkill(true);
  }

  // call action to append skill to the list
  onSkillAppend = () => {
    // if the skill is empty, hide the input box 
    if (skill == '' ) {
      setEditSkill(false);
    } else {
      // hide the input box
      setEditSkill(false);
      // reset the skill 
      setSkill('');
      // add skill
      addSkill(skill);
    }
  }

  // when a user clicks the delete button
  onDeleteSkill = (skillName) => {
    deleteSkill(skillName, state.skills);
  }
  
  // show skill edit section
  showSkillEdit = () => {
    // show skill edit section 
    if (editSkill) {
      return (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={setSkill}
            placeholder={t('ProfileScreen.skillPlaceholder')}
            value={skill}
          />
          <Button 
            style={styles.button}
            type="clear"
            title={t('ProfileScreen.appendButton')}
            onPress={onSkillAppend}
          />
        </View>
      );
    }
  }

  // show skill list
  showSkillList = () => {
    // display the list only if it exists
    if (state.skills.length > 0) {
      return (
        <>
        <Divider style={styles.divider} />
        <FlatList 
          keyExtractor={skill => skill.name}
          data={state.skills} 
          renderItem={({ item }) => {
            return (
              <View style={styles.itemContainer}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={styles.itemText}>{ item.name }</Text>
                  <Badge value={90} badgeStyle={{ height: 20 }}/>
                </View>
                <Icon
                  name='trash-o'
                  size={20}
                  color={'#353535'}
                  onPress={() => onDeleteSkill(item.name)} 
                />
              </View>
            );
          }}
        />
        </>
      );
    }
  }

  // a user clicks the add button of location card
  onLocationAddPress = () => {
    // check maximum locations
    if (state.locations.length >= 2) {
      Alert.alert( t('ProfileScreen.noMoreLocation') );
      return;
    }
    // show the edit
    setEditLocation(true);
  }


  // call action to append location to the list
  onLocationAppend = () => {
    // if the skill is empty, hide the input box 
    if (location == '' ) {
      setEditLocation(false);
    } else {
      // hide the input box
      setEditLocation(false);
      // reset the skill 
      setLocation('');
      // add skill
      addLocation(location);
    }
  }

  onLocationAppend = () => {
    // if the location is empty, hide the input box 
    if (location == '' ) {
      setEditLocation(false);
    } else {
      // hide the input box
      setEditLocation(false);
      // reset the skill 
      setLocation('');
      // add skill
      addLocation(location);
    }
  }
  
  // when a user clicks the delete button
  onDeleteLocation = (locationName) => {
    deleteLocation(locationName, state.locations);
  }

  // show location edit section
  showLocationEdit = () => {
    // show location edit section 
    if (editLocation) {
      return (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={setLocation}
            placeholder={t('ProfileScreen.locationPlaceholder')}
            value={location}
          />
          <Button 
            style={styles.button}
            type="clear"
            title={t('ProfileScreen.appendButton')}
            onPress={onLocationAppend}
          />
        </View>
      );
    }
    
  }

  // show location list
  showLocationList = () => {
    // display the list only if it exists
    if (state.locations.length > 0) {
      return (
        <>
        <Divider style={styles.divider} />
        <FlatList 
          keyExtractor={location => location.name}
          data={state.locations} 
          renderItem={({ item }) => {
            return (
              <View style={styles.itemContainer}>
                <Text style={styles.itemText}>{ item.name }</Text>
                <Icon
                  name='trash-o'
                  size={20}
                  color={'#353535'}
                  onPress={() => onDeleteLocation(item.name)} 
                />
              </View>
            );
          }}
        />
        </>
      );
    }
  }

  // update data on blockhain
  onAccept = () => {
    // make the modal invisible
    setShowModal(false);
    // update the contract
    updateContract();
  }

  // show update contract button when necessary
  showContractUpdate = () => {
    // @todo how to check the skills or locations of state are different from the contract's state
    if (state.needUpdateContract) {
      return (
          <Button
            onPress={() => setShowModal(true)}
            icon={
              <Icon2
                name="ethereum"
                size={30}
              />
            }
            title={t('ProfileScreen.contractButton')}
          />
      );
    }
  }

  return (
    <SafeAreaView forceInset={{ top: 'always' }}>
      <View>
        <Card>
          <View style={styles.skillContainer}>
              <Icon
                name='handshake-o'
                size={40}
                color={'#353535'}
              />
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>{t('ProfileScreen.skillDomain')}</Text>
                <Text style>{t('ProfileScreen.skillDomainDesc')}</Text>
              </View>
              <Icon
                name='plus-circle'
                size={30}
                color={'#353535'}
                onPress={onSkillAddPress}
              />
          </View>
          {showSkillEdit()}
          {showSkillList()}
        </Card>

        <Card>
          <View style={styles.skillContainer}>
              <Icon
                name='map-marker'
                size={40}
                color={'#353535'}
              />
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>{t('ProfileScreen.location')}</Text>
                <Text style>{t('ProfileScreen.locationDesc')}</Text>
              </View>
              <Icon
                name='plus-circle'
                size={30}
                color={'#353535'}
                onPress={onLocationAddPress}
              />
          </View>
          {showLocationEdit()}
          {showLocationList()}
        </Card>

        <Spacer>
          <View style={{ margin: 30 }}>
            <Button
              onPress={() => setShowModal(true)}
              icon={
                <Icon2
                  style={{ marginHorizontal: 5 }}
                  name="ethereum"
                  size={30}
                />
              }
              title={t('ProfileScreen.contractButton')}
              disabled={!state.needUpdateContract}
              loading={state.loading}
            />
          </View>
        </Spacer>

        <Overlay
          isVisible={showModal}
          height="auto"
          onBackdropPress={() => setShowModal(false)}
        >
          <View>
            <Text>{t('ProfileScreen.acceptMessage')}</Text>
            <View style={styles.buttonGroup}>
              <View style={{ flex: 1 }}>
                <Button 
                  title={t('yes')}
                  onPress={() => onAccept()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button 
                  title={t('no')}
                  onPress={() => setShowModal(false)}
                />
              </View>
            </View>
          </View>
        </Overlay>

      </View>
    </SafeAreaView>
  );
  */
};

ProfileContractScreen.navigationOptions = () => {
  return {
    title: i18next.t('ProfileContractScreen.header'),
    headerStyle: {
      backgroundColor: '#07a5f3',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  }
};

// styles
const styles = StyleSheet.create({
  skillContainer: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  divider: {
    backgroundColor: '#e6e6e6',
    height: 3,
    marginTop: 10
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingRight: 5
  },
  textContainer: {
    marginLeft: 5
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10
  },
  textHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'blue'
  },
  input: {
    paddingLeft: 5,
    width: 300,
    borderColor: 'grey',
    borderWidth: 2,
    fontSize: 16
  },
  buttonGroup: {
    flexDirection: 'row',
  },
});

export default ProfileContractScreen;