const functions = require('firebase-functions');
const admin = require('firebase-admin');
const i18next = require('i18next');
const moment = require('moment');


// test accounts
const testAccounts = [
'E5Yuo3CmmHf8qRlfuhuGd5AaSwH3',
'Yt9I8EKVsJRAOTYAK62MwCEZ9EU2',
'VBqWN80r7DPLMqRBh1YtDa9SjGm1',
'Qfvz7uW5MsVw7k9pTHD550npVAT2',
'eHtWShuvY2f65HzezsbufRt184M2',
'MXWX9PZjdFdA3aFKNE1dn0aYnru2' 
];

// initialize app
//admin.initializeApp();

/*
const key_path = "/home/etain/devel/helpus/keys/firebase-admin/helpus-206eb-firebase-adminsdk-cvynd-b7571746bf.json";
var serviceAccount = require(key_path);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://helpus-206eb.firebaseio.com"
});
*/

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://helpus-206eb.firebaseio.com"
});

// send push notification
exports.sendMessage = functions.firestore
  .document('/cases/{caseId}').onCreate( async (snap, context) => {
    // context includes params
    //console.log('context: ', context );
    // get the created document data
    const docData = snap.data();
    //console.log('created document data', docData);
    // get user id from the context params
    const sender = docData.senderId;
    // get the case id
    const caseId = context.params.caseId;
    // get primary language
    const language = docData.language;
    // get utc time of message in minutes
    const messagingTime = docData.messagingTime;
    console.log('messagingTime', messagingTime);
    // setup language
    i18next.init({
      fallbackLng: language,
      debug: true, 
      resources: {
          ko: {
            "translation": {
              "header": '[helpus] 도움 요청',
            },
          },
          en: {
            "translation": {
              "header": '[helpus] HELP WANTED',
            },
          },
        },
    });
    
    // get users collection
    const users = admin.firestore().collection('users');
    // build push notification
    const payload = {
      notification: {
        title: i18next.t('header'),
        body: docData.message
      },
      data:{
        title: i18next.t('header'),
        body: docData.message,
        senderId: sender,
        caseId: caseId,
      },
    };

    // case reference
    const caseRef = admin.firestore().collection('cases').doc(`${caseId}`);
    console.log('caseRef', caseRef);    
    let accepted = false;
    // set listener and unsubcribe when it is done
    const unsubscribe = caseRef
    .onSnapshot(async (docSnapshot) => {
      console.log('case snapshot data', docSnapshot.data());
      // check if the data exists
      if (!docSnapshot.exists)
      {
        console.log('doc snapshot data is empty');
        return;
      }
      if (docSnapshot.data().accepted) {
        accpted = true;
        console.log('request accepted. accpted', accpted);
        // unsubscribe
        unsubscribe();
      }
    }, error => {
      console.log('Encountered error on listening to accepted field change', error);
    });

    //// send test message only to test accounts
    let testMessage = false;
    const testMsgPrefix = '[test]';
    if (docData.message.includes(testMsgPrefix)) {
      console.log('[test] this is a test message!');
      // send message to test accounts
      await users.get()
      .then(snapshot => {
        snapshot.docs.forEach(doc => {
          // skip the sender  
          if (doc.id == sender) {
            console.log('[test] sender is the same', sender);
            return;
          }
          // skip users not belonging to test accounts
          if (!testAccounts.includes(doc.id)) {
//            console.log('uid is not in test accounts', doc.id);
            return;
          }
          // get the push token of a user
          pushToken = doc.data().pushToken;
//          console.log('token, sending message', pushToken, payload);
          // send if push token exists
          if (pushToken) {
//            console.log('sending message uid', doc.id);
            // send notification trhough firebase cloud messaging (fcm)
            admin.messaging().sendToDevice(pushToken, payload);
          }          
        });
        testMessage = true; 
      })
      .catch(error => console.log(error));
    }

    //// send message to users who prefer the language of the message
    // users.where('languages', 'array-contains', language).get()
    await users.get()
    .then(snapshot => {
      if (testMessage) {
        console.log('[test] this is a test message!');
        return;
      }
      // check if the request has been accepted
      if (accepted) {
        console.log('the request has been accpted. so no more sending message', accepted);
        return 'the request has been accepted. so no more sending message';
      }

      snapshot.forEach(doc => {
//        console.log('doc id', doc.id);
//        console.log('doc languages', doc.data().languages);
        // do not send if the user does not prefer the language
        if (!doc.data().languages.includes(language)) {
//          console.log('user does not include the language', doc.data().languages);
          return;
        }
        // do not send notification to the sender
        if (doc.id !== sender) {
          //// check do not disturb time of a user
          let dndTime1 = null;
          let dndTime2 = null;
          // get dnd times if exist
          if (doc.data().dndTimes) {
            // ordering
            if (doc.data().dndTimes[0] < doc.data().dndTimes[1]) {
              dndTime1 = doc.data().dndTimes[0];
              dndTime2 = doc.data().dndTimes[1];
            } else {
              dndTime1 = doc.data().dndTimes[1];
              dndTime2 = doc.data().dndTimes[2];
            }
          }
//          console.log('dndTime1', dndTime1);
//          console.log('dndTime2', dndTime2);
          // send message if dnd is not set or the messaging time is outside dnd time zone
          if (!dndTime1 || messagingTime < dndTime1 || messagingTime > dndTime2) {
            // get the push token of a user
            pushToken = doc.data().pushToken;
//            console.log('token, sending message', pushToken, payload);
            // send if push token exists
            if (pushToken) {
              // send notification through firebase cloud messaging (fcm)
              admin.messaging().sendToDevice(pushToken, payload);
            }
          } else {
//            console.log( 'time is in user dnd times', doc.id, messagingTime, dndTime1, dndTime2);
          }
        } else {
          console.log( 'the sender is the same', doc.id, sender);
        }
      });
      return 'sent message to all users';
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
});