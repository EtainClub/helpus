import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, Image, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Button, Text, Card, Divider, Overlay, Badge } from 'react-native-elements';
import { SafeAreaView, NavigationEvents } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import firebase from 'react-native-firebase'; 
import { ScrollView } from 'react-native-gesture-handler';

// custom libraries
import { Context as ProfileContext } from '../context/ProfileContext';
import Spacer from '../components/Spacer';
import ItemForm from '../components/ItemForm';
import LocationForm from '../components/LocationForm';

const ProfileScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();
  // use context
  const { 
    state, 
    updateContract, updateSkill, updateLocation, 
    updateSkills, updateSkillsDB, updateLocations, deleteLocation
  } = useContext( ProfileContext );

  // use state
  const [editSkill, setEditSkill] = useState(false);
  const [editLocation, setEditLocation] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // use effect
  useEffect(() => {
    getUserProfile();
    console.log('state skills', state.skills);
    console.log('state locations', state.locations);
  }, []);

  // get user profile info from db
  getUserProfile = async () => {
    // get reference to the current user
    const { currentUser } = firebase.auth();
    const userId = currentUser.uid;
    // reference to user 
    const userRef = firebase.firestore().doc(`users/${userId}`);
    console.log('[ProfileScreen] userRef', userRef);
    // get skills
    let skills = [];
    await userRef.collection('skills').get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log('No matching docs');
        return;
      }  
      snapshot.forEach(doc => {
        skills.push(doc.data());
      });
      updateSkills({ skills });
    })
    .catch(error => {
      console.log('cannot get skill data', error);
    });
    
    // get locations
    let locations = [];
    await userRef.collection('locations').get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log('No matching docs');
        return;
      }  
      snapshot.forEach(doc => {
        locations.push(doc.data());
      });
      updateLocations({ locations });
    })
    .catch(error => {
      console.log('cannot get location data', error);
    });
  }


  onSkillAddPress = () => {
    setEditSkill(true);
  }

  handleSkillStateChange = (id, value) => {
    // update state
    updateSkill({ id, skillName: value });
  }

  // show skill edit section
  showSkillEdit = () => {
    // show skill edit section 
    if (editSkill) {
      return state.skills.map((skill, id) => 
        <ItemForm
          key={id} 
          item={skill.name} 
          id={id}
          placeholder={t('ProfileScreen.skillPlaceholder')} 
          handleStateChange={handleSkillStateChange} />
      );
    }
  }

  // show skill list
  showSkillList = () => {
    // do not display during edit
    if (editSkill) {
      return;
    }
    // display the list only if it exists
    if (state.skills.length > 0) {
      return (
        <>
        <Divider style={styles.divider} />
        <FlatList 
          keyExtractor={this.keyExtractor}
          data={state.skills} 
          renderItem={({ item }) => {
            // do not display it the skillname is empty
            if (item.name === '') return;
            return (
              <View style={styles.itemContainer}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={styles.itemText}>{ item.name }</Text>
                  <Badge value={item.votes} badgeStyle={{ height: 20 }}/>
                </View>
              </View>
            );
          }}
        />
        </>
      );
    }
  }

  // a user clicks the add button of location card
  onLocationAddPress = async () => {
    // show the edit
    setEditLocation(true);
  }
  
  // delete the location
  onDeleteLocation = (id) => {
    // @test
    console.log('[ondeletelocation] userid, id', state.userInfo.userId, id);
    // alert
    Alert.alert(
      t('ProfileScreen.deleteLocation'),
      t('ProfileScreen.deleteLocationText'),
      [
        { text: t('yes'), onPress: () => deleteLocation({ userId: state.userInfo.userId, id }) }
      ],
      { cancelable: true },
    );
  };

  // handle location state change
  handleLocationStateChange = (id, value) => {
    console.log('handleLocationStateChange', id, value);
    // update location state
    updateLocation({ id, locationName: value });
  }

  // show location edit section
  showLocationEdit = () => {
    // show skill edit section 
    if (editLocation) {
      return state.locations.map((location, id) => 
        <LocationForm 
          key={location.id} 
          item={location.display} 
          id={id}
          navigation={navigation}
          placeholder={t('ProfileScreen.locationPlaceholder')} 
          handleStateChange={handleLocationStateChange} />
      );
    }
  }

  // show location list
  showLocationList = () => {
    // do not display during edit
    if (editLocation) {
      return;
    }
    // display the list only if it exists
    if (state.locations.length > 0) {
      return (
        <>
        <Divider style={styles.divider} />
        <FlatList 
          keyExtractor={this.keyExtractor}
          data={state.locations} 
          renderItem={({ item, index }) => {
            // do not display if the name is empty
            if (item.name === '') return;
            return (
              <View style={styles.itemContainer}>
                <View style={{ flexDirection: "row", justifyContent: 'flex-start' }}>
                  <Text style={styles.itemText}>{ item.display }</Text>
                  <Badge value={item.votes} badgeStyle={{ height: 20 }}/>
                </View>
                <Icon name='trash-o' size={20} onPress={() => onDeleteLocation(index)} />
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
    // @todo implement function to update contract
    updateContract({ 
      userId: state.userInfo.userId, 
      skills: state.skills, 
      locations: state.locations 
    });
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
            title={t('ProfileScreen.updateButton')}
          />
      );
    }
  }

  closeSkillEdit = () => {
    setEditSkill(false);
    console.log('skills', state.skills);
    // update skills on db
    updateSkillsDB({ 
      userId: state.userInfo.userId, 
      skills: state.skills, 
    });
  }

  showSkillEditIcon = () => {
    if (editSkill) {
      return (
        <TouchableOpacity onPress={closeSkillEdit}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{t('save')}</Text>
        </TouchableOpacity>
      );  
    }
    return (
      <TouchableOpacity
        onPress={onSkillAddPress}
      >  
      <Icon
        name='pencil'
        size={30}
        color={'#353535'}
      />
      </TouchableOpacity>
    );
  }

  showLocationEditIcon = () => {
    if (editLocation) {
      return (
        <TouchableOpacity onPress={closeLocationEdit}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{t('close')}</Text>
        </TouchableOpacity>
      );  
    }
    return (
      <TouchableOpacity
        onPress={onLocationAddPress}
      >
      <Icon
        name='pencil'
        size={30}
        color={'#353535'}
      />
      </TouchableOpacity>
    );
  }

  closeLocationEdit = () => {
    setEditLocation(false);
    console.log('locations', state.locations);
  }

  // navigation event
  const onWillFocus = ()=> {
    setEditLocation(false);
  }

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillFocus={onWillFocus}
      />
      <ScrollView>
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
              {showSkillEditIcon()}
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
              {showLocationEditIcon()}
          </View>
          {showLocationEdit()}
          {showLocationList()}
        </Card>

        

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
            <Text style={styles.modalText}>{t('ProfileScreen.acceptMessage')}</Text>
          </Spacer>
          <View style={styles.buttonGroup}>
            <View style={{ width: 100 }}>
              <Button 
                title={t('yes')}
                onPress={() => onAccept()}
              />
            </View>
            <View style={{ width: 100 }}>
              <Button 
                title={t('no')}
                onPress={() => setShowModal(false)}
                buttonStyle={{backgroundColor: 'grey'}}
              />
            </View>
          </View>
          </View>
        </Overlay>

      </ScrollView>
    </SafeAreaView>
  );
};

ProfileScreen.navigationOptions = () => {
  return {
    title: i18next.t('ProfileScreen.header'),
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
  modal: {
    justifyContent: 'center'
  },
  modalText: {
    marginBottom: 50, 
    fontSize: 20, 
    fontWeight: 'bold',
    alignSelf: 'center'
  },
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
    justifyContent: 'space-around'
  },
});

export default ProfileScreen;


/*
Smart Contract button
       <Spacer>
          <View style={{ margin: 30 }}>
            <Button
              buttonStyle={{ height: 50 }}
              titleStyle={{ fontSize: 24, fontWeight: 'bold' }}    
              onPress={() => setShowModal(true)}
              icon={
                <Icon2
                  style={{ marginHorizontal: 5 }}
                  name="ethereum"
                  size={30}
                />
              }
              title={t('ProfileScreen.updateButton')}
              disabled
              loading={state.loading}
            />
          </View>
        </Spacer>
*/