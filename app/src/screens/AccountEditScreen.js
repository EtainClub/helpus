import React, {useContext, useState, useEffect} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { Button, Card, Avatar, Input, Divider, Overlay, Badge } from 'react-native-elements';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome';
import ImagePicker from 'react-native-image-picker';
import uuid from 'uuid/v4'; // Import UUID to generate UUID
import firebase from 'react-native-firebase'; 

// custom libraries
import { Context as ProfileContext } from '../context/ProfileContext';
import Spacer from '../components/Spacer';


const AccountEditScreen = ({ navigation }) => {
  // setup language
  const { t } = useTranslation();
  // use context
  const { state, updateAvatarState, updateAccount } = useContext( ProfileContext );
  // use state
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imgUri, setImgUri] = useState('');

  // get navigation param
  const userId = navigation.getParam('userId');
  // use effect
  useEffect(() => {
    // set initial user info
    setName(state.userInfo.name);
    setAvatarUrl(state.userInfo.avatarUrl);
  }, []);

  // user clicks the update button
  onUpdatePress = () => {
    updateAccount({ userId, name, avatarUrl: state.userInfo.avatarUrl, navigation });
  }

  // user clicks the edit avatar button
  onEditAvatarPress = async () => {
    updateAvatar();
  }

  const pickerOptions = {
    title: t('AccountEditScreen.pickerTitle'),
    maxWidth: 120, // photos only
    maxHeight: 120, // photos only
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };

  // user clicks the attachment icon
  updateAvatar = async () => {
    ImagePicker.showImagePicker(pickerOptions, (response) => {
      if (response.didCancel) {
        // alert for canceling avatar picking
        Alert.alert(
          t('AccountEditScreen.cancelPickerTitle'),
          t('AccountEditScreen.cancelPicker'),
          [
            {text: t('confirm')}
          ],
          {cancelable: true},
        );
      } else if (response.error) {
        console.log('AccountEditScreen.pickerError', response.error);
        // alert for avatar picking error
        Alert.alert(
          t('AccountEditScreen.pickerErrorTitle'),
          t('AccountEditScreen.pickerError'),
          [
            {text: t('confirm')}
          ],
          {cancelable: true},
        );
      } else {
        const source = {uri: response.uri};
        console.log('source', source);
        setImgUri(response.uri);
        // upload the avatar image
        uploadImage(source, response.uri);
      }
    });
  }

  // upload image to firebase storage
  const uploadImage = (source, imageUri) => {
    const ext = imageUri.split('.').pop(); // Extract image extension
    const filename = `${uuid()}.${ext}`; // Generate unique name
//    setImgLoading(true);
    const imgRef = firebase.storage().ref(`avatar/${filename}`);
    const unsubscribe = imgRef.putFile(imageUri)
      .on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        async snapshot => {
          let state = {};
          state = {
            ...state,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Calculate progress percentage
          };
          if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
            console.log('upload success');
            // unsubscribe the event
            unsubscribe();
            // update the image url
            let url;
            await imgRef.getDownloadURL()
            .then((response) => {
              console.log('get url response', response);
              url = response;
            })
            .catch(error => {
              console.log('Failed to get url', error);
            })
            // update user info, avatar, and name
            console.log('user avatar url', url);
            updateAvatarState({ userId, avatarUrl: url });
            // refresh the screen
            setAvatarUrl(url);
          }
        },
        error => {
          console.log('AccountEditScreen uploading error', error);
          // alert for failure to upload avatar
          Alert.alert(
            t('AccountEditScreen.updateErrorTitle'),
            t('AccountEditScreen.updateError'),
            [
              {text: t('confirm')}
            ],
            {cancelable: true},
          );
        }
      );
  };
  
  return (
    <SafeAreaView>
      <View style={{ alignItems: 'center', margin: 10 }}>
        <Avatar 
          size="xlarge"
          rounded
          source={{
            uri: avatarUrl,
          }} 
          showEditButton
          onEditPress={onEditAvatarPress}
        />
        <Input 
          autoCapitalize='none'
          autoCorrect={false}
          label={t('AccountEditScreen.nameLabel')}
          placeholder={t('AccountEditScreen.namePlaceholder')}
          value={name}
          onChangeText={setName}
        />
      </View>
      <Spacer>
        <Button
            title={t('AccountEditScreen.updateButton')}
            onPress={onUpdatePress}
            leftIcon={
              <Icon
                name='check-circle-o'
                size={24}
                color='white'
              />
            }
          />
        </Spacer>
    </SafeAreaView>
  );
};

AccountEditScreen.navigationOptions = () => {
  return {
    title: i18next.t('AccountEditScreen.header'),
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
});

export default AccountEditScreen;