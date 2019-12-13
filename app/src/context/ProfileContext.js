import React from 'react';
import { Alert } from 'react-native';
import firebase from 'react-native-firebase'; 
// cumstom libraries
import createDataContext from './createDataContext';

// initial skill state
const INIT_SKILL = {
  id: null,
  name: '',
  votes: 0
}
// populate array with the initial state
const INIT_SKILLS = new Array(5).fill(INIT_SKILL).map((item) => ({ 
  ...item, id: Math.random().toString()
}));

// initial location state
const INIT_LOCATION = {
  id: null,
  name: '',
  district: '',
  city: '',
  state: '',
  country: '',
  display: '',
  votes: 0
}
// populate array with the initial state
const INIT_LOCATIONS = new Array(2).fill(INIT_LOCATION).map((item) => ({ 
  ...item, id: Math.random().toString()
}));

const INIT_USER = {
  avatar: '',
  name: '',
  skill: '',
  got: 0,
  helped: 0,
  votes: 0,
  location: ''
}

//// reducer
const profileReducer = (state, action) => {
  switch (action.type) {
    case 'update_profile':
      return { ...state, skills: action.payload.skills, locations: action.payload.locations };
    case 'update_skills':
      return { ...state, skills: action.payload };
    case 'update_locations':
      return { ...state, locations: action.payload };
    case 'update_skill':
      return {
        ...state,
        // update specific skill
        skills: state.skills.map((skill, i) => 
          i === action.payload.id ? 
          { ...skill, name: action.payload.name } 
          : skill
        ),
        // set flag to need to update the db or contract
        needUpdateContract: true
      };
    case 'verify_location':
      return {
        ...state,
        locations: state.locations.map((location, i) => 
          i === action.payload.id ? 
          { ...location, 
            name: action.payload.address.name, 
            district: action.payload.address.district,
            city: action.payload.address.city,
            state: action.payload.address.state,
            country: action.payload.address.country,
            display: action.payload.address.display,
            votes: location.votes + 1            
          } 
          : location
        ),
        // set flag to need to update the db or contract
        needUpdateContract: true
      };  
    case 'update_location':
      return {
        ...state,
        locations: state.locations.map((location, i) => 
          i === action.payload.id ? 
          { ...location, 
            name: action.payload.address.name, 
            district: action.payload.address.district,
            city: action.payload.address.city,
            state: action.payload.address.state,
            country: action.payload.address.country,
            display: action.payload.address.display,
            votes: action.payload.address.votes            
          } 
          : location
        ),
        // set flag to need to update the db or contract
        needUpdateContract: true
      };
    case 'delete_location':
      return {
        ...state,
        locations: state.locations.splice(action.payload, 1),
        needUpdateContract: true
      };
    case 'update_user_state':
      return { ...state, userInfo: action.payload };
    case 'delete_user_list':
      return { ...state, userList: [] }
    case 'update_user_list': 
      console.log('[update_user_list] payload', action.payload);
      return { ...state, 
        userList: [...state.userList, action.payload ] 
      };
    case 'update_avatar':
      return { ...state, 
        userInfo: { ...state.userInfo, avatarUrl: action.payload }
      };
    case 'update_contract':
      return { ...state, loading: true };
    case 'update_contract_success':
      return { ...state, loading: false, needUpdateContract: false };
    default:
      return state;
  }
}

//// actions
// find nearby users
const findUsers = dispatch => {
  return async ({ district, userId, multiLang }) => {
    console.log('dispatch find users', district, userId);
    if (!multiLang) {
      // delete userlist
      dispatch({
        type: 'delete_user_list',
      });
    }
    
    const usersRef = firebase.firestore().collection('users');
    // @todo consider the multi languages. need to find both en and ko regions
    // react-native-firebase v5 does not support array-contains-any
    await usersRef.where('regions', 'array-contains', district).get()
    .then(async snapshot => {
      snapshot.forEach(async doc => {             
        // exclude the self when searching
        if (doc.id !== userId) {
          //// get data from subcollection
          // get skill
          getSkillsLocations({ userId: doc.id })
          .then(userData => {
            console.log('[findUsers] user data', userData);              
            dispatch({
              type: 'update_user_list',
              payload: {
                userId: doc.id,
                avatar: doc.data().avatarUrl,
                name: doc.data().name,
                skills: userData.skills,
                locations: userData.locations,
                got: doc.data().askCount,
                helped: doc.data().helpCount,
                votes: doc.data().votes  
              }
            });
          })
          .catch(error => {
            console.log(error);
          });
        }
      });
    })
    .catch(error => {
      console.log(error);
    });
  }
};

// get skills and locations from db
const getSkillsLocations = async ({ userId }) => {
  // user ref
  const userRef = firebase.firestore().doc(`users/${userId}`);

  // get skills
  let skills = [];
  await userRef.collection('skills').get()
  .then(snapshot => {
    if (snapshot.empty) {
      console.log('No matching docs');
      return;
    }
    console.log('[getSkillsLocations] got skills', snapshot);  
    snapshot.forEach(doc => {
      skills.push(doc.data());
    });
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
    console.log('[getSkillsLocations] got locations', snapshot);  
    snapshot.forEach(doc => {
      locations.push(doc.data());
    });
  })
  .catch(error => {
    console.log('cannot get location data', error);
  }); 
  
  const userData = { skills, locations };
  console.log('[getSkillsLocations] userData', userData);

  return userData;
};

// update skill with id
const updateSkill = dispatch => {
  return ({ id, skillName }) => {
    console.log('dispatch update skill');
    dispatch({
      type: 'update_skill',
      payload: { id, name: skillName }
    });
  }
};

// update location with id
const updateLocation = dispatch => {
  return ({ id, address, userId }) => {
    console.log('dispatch update location', id, address, userId);
    // sanity check
    if (!userId) return;
    if (typeof id === 'undefined') return; 
    
    dispatch({
      type: 'update_location',
      payload: { id, address }
    });

    // update location on db
    // @todo for location, use number of verification instead of votes.
    const userRef = firebase.firestore().doc(`users/${userId}`);
    userRef.collection('locations').doc(`${id}`).update({
      name: address.name,
      district: address.district,
      city: address.city,
      state: address.state,
      country: address.country,
      display: address.display
    });
    // update the regions
    userRef.update({
      regions: firebase.firestore.FieldValue.arrayUnion(address.district)
    });
  }
};

// verify location with id and update on DB
const verifyLocation = dispatch => {
  return ({ id, address, userId, verify }) => {
    console.log('dispatch update location', id, address, userId);
    // sanity check
    if (!userId) return;
    if (typeof id === 'undefined') return; 
    
    dispatch({
      type: 'verify_location',
      payload: { id, address }
    });

    // update location on db with increment of verification
    // @todo for location, use number of verification instead of votes.
    const userRef = firebase.firestore().doc(`users/${userId}`);
    userRef.collection('locations').doc(`${id}`).update({
      name: address.name,
      district: address.district,
      city: address.city,
      state: address.state,
      country: address.country,
      display: address.display, 
      votes: firebase.firestore.FieldValue.increment(1)
    });
    // update the regions
    userRef.update({
      regions: firebase.firestore.FieldValue.arrayUnion(address.district)
    });    
  }
};

// delete location; just make it empty
const deleteLocation = dispatch => {
  return async ({ id, userId }) => {
    if (__DEV__) console.log('[deleteLocation] userId and id', userId, id);
    // check sanity
    if (!userId) return;
    if (typeof id === 'undefined') return; 

    // update the state 
    dispatch({
      type: 'update_location',
      payload: { 
        id, 
        address: {
          name: '',
          district: '',
          city: '',
          state: '',
          country: '',
          display: '',
          votes: 0,
        } 
      }
    });

    // delete the doc of given id
    const userRef = firebase.firestore().doc(`users/${userId}`);
    // get the district
    userRef.collection('locations').doc(`${id}`).get()
    .then(snapshot => {
      console.log('delete location snapshot data', snapshot.data());
      const district = snapshot.data().district;
      userRef.collection('locations').doc(`${id}`).update({
        name: '',
        district: '',
        city: '',
        state: '',
        country: '',  
        display: '',    
        votes: 0
      });
      // update the regions too
      userRef.update({
        regions: firebase.firestore.FieldValue.arrayRemove(district)
      });  
    })
    .catch(error => {
      console.log(error);
    });
  }
}

// update avatar url
const updateAvatarState = dispatch => {
  return async ({ userId, avatarUrl }) => {

    // reference to user info
    const userRef = firebase.firestore().doc(`users/${userId}`);
    // update name and avatar url
    await userRef.update({
      avatarUrl
    });     
    dispatch({
      type: 'update_avatar',
      payload: avatarUrl
    });
  }
};

// update user account
const updateAccount = dispatch => {
  return async ({ userId, name, avatarUrl, navigation }) => {
    const userInfo = { userId, name, avatarUrl };
    console.log('[updateUserInfo]', userInfo);
    //// update db
    // reference to user info
    const userRef = firebase.firestore().doc(`users/${userId}`);
    // update name and avatar url
    await userRef.update({
      name, avatarUrl
    }); 
    // update user state
    dispatch({
      type: 'update_user_state',
      payload: userInfo
    });
    // navigate
    navigation.navigate('Account');
  }
};

// update user info state
const updateUserInfoState = dispatch => {
  return ( userInfo ) => {
    console.log('[updateUserInfoState]', userInfo);
    // update state
    const userState = { 
      userId: userInfo.userId, 
      name: userInfo.name,
      avatarUrl: userInfo.avatarUrl,
      votes: userInfo.votes,
      askCount: userInfo.askCount,
      helpCount: userInfo.helpCount 
    };
    dispatch({
      type: 'update_user_state',
      payload: userState
    });
  }
};

// update proifle state
const updateProfileInfo = dispatch => {
  return ({ skills, locations }) => {
    dispatch({ 
      type: 'update_profile',
      payload: {
        skills,
        locations
      }
  })
  };
}

// update skills state
const updateSkills = dispatch => {
  return ({ skills }) => {
    dispatch({ 
      type: 'update_skills',
      payload: skills,
    });
  }
}

// update locations state
const updateLocations = dispatch => {
  return ({ locations }) => {
    console.log('[updateLocations] locations', locations);
    dispatch({ 
      type: 'update_locations',
      payload: locations,
    });
  }
}

/*
// create initial profile and upload on firebase
const createInitialProfile = dispatch => {
  return async ({ userId }) => {
    // get the firebase doc ref
    const userRef = firebase.firestore().doc(`users/${userId}`);
    console.log('[createInitialProfile] userRef', userRef );
    // map over the skills and override the current skills
    skills.map(async (skill, id) => {
      console.log('[createInitialProfile] skill, id', skill.name, id);
      // add new doc under the id
      userRef.collection('skills').doc(`${id}`).set({
        name: skill.name,
        votes: skill.votes
      });
    });

    // map over the locations and override current locations
    locations.map(async (location, id) => {
      console.log('[createInitialProfile] location, id', location.name, id);
      // add new doc under the id
      userRef.collection('locations').doc(`${id}`).set({
        name: location.name,
        votes: location.votes
      });
    });
  };
};
*/

// update db
const updateSkillsDB = dispatch => {
  return async ({ userId, skills }) => {
    console.log('[updateSkillsDB]');

    // check sanity
    if (__DEV__) console.log('[deleteLocation] userId', userId);
    if (!userId) return;

    //// put skills on firestore
    // get the firebase doc ref
    const userRef = firebase.firestore().doc(`users/${userId}`);
    // map over the skills and override the current skills
    // @todo update only the ones that need to be updated
    skills.map(async (skill, id) => {
      console.log('[updateSkillsDB] skill, id', skill.name, id);
      // add new doc under the id
      userRef.collection('skills').doc(`${id}`).set({
        name: skill.name,
        votes: skill.votes
      });
    });
  }
};

// update smart contract
const updateContract = dispatch => {
  return async ({ userId, skills, locations }) => {
    console.log('[updateContract]');
    dispatch({ type: 'update_contract' });
    //// put skills and locations on firestore
    // get the firebase doc ref
    const userRef = firebase.firestore().doc(`users/${userId}`);
    console.log('[updateContract] userRef', userRef );
    // map over the skills and override the current skills
    // @todo update only the ones that need to be updated
    skills.map(async (skill, id) => {
      console.log('[updateContract] skill, id', skill.name, id);
      // add new doc under the id
      userRef.collection('skills').doc(`${id}`).set({
        name: skill.name,
        votes: skill.votes
      });
    });

    // map over the locations and override current locations
    // @todo update only the ones that need to be updated
    locations.map(async (location, id) => {
      console.log('[updateContract] location, id', location.name, id);
      // add new doc under the id
      userRef.collection('locations').doc(`${id}`).set({
        name: location.name,
        votes: location.votes
      });
    });

    dispatch({ type: 'update_contract_success' });
  };
};


//// reduer, actions, state
export const { Provider, Context } = createDataContext(
  profileReducer,
  { updateContract,
    updateUserInfoState, updateAccount, updateAvatarState,
    updateSkill, updateLocation, verifyLocation, updateProfileInfo,
    updateSkills, updateSkillsDB, updateLocations, deleteLocation,
    findUsers,
  },
  { 
    userInfo: {}, 
    skills: INIT_SKILLS, skill: '', locations: INIT_LOCATIONS, location: '', 
    userList: [],
    needUpdateContract: false, loading: false 
  }
);

    /*
    // first remove the current existing skill documents
    await userRef.collection('skills').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
//        console.log('skill doc', doc);
        doc.ref.delete();
      });
    })
    .catch(error => {
      console.log('error! cannot delete the skills collection', error);
    })

    // remove the current existing locations documents
    await userRef.collection('locations').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
//        console.log('location doc', doc);
        doc.ref.delete();
      });
    })
    .catch(error => {
      console.log('error! cannot delete the locations collection', error);
    })
    */
