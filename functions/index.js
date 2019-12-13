const functions = require('firebase-functions');
const admin = require('firebase-admin');
const i18next = require('i18next');
const moment = require('moment');

/*
var serviceAccount = require("path/to/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://etainclub-896c9.firebaseio.com"
});
*/

// initialize app
admin.initializeApp();

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
              "header": '[helpus] help wanted',
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

    // send message to users who prefer the language of the message
    // users.where('languages', 'array-contains', language).get()
    await users.get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        console.log('doc id', doc.id);
        console.log('doc languages', doc.data().languages);
        // do not send if the user does not prefer the language
        if (!doc.data().languages.includes(language)) {
          console.log('user does not incude the language', doc.data().languages);
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
          console.log('dndTime1', dndTime1);
          console.log('dndTime2', dndTime2);
          // send message if dnd is not set or the messaging time is outside dnd time zone
          if (!dndTime1 || messagingTime < dndTime1 || messagingTime > dndTime2) {
            // get the push token of a user
            pushToken = doc.data().pushToken;
            console.log('token, sending message', pushToken, payload);
            // send if push token exists
            if (pushToken) {
              // send notification trhough firebase cloud messaging (fcm)
              admin.messaging().sendToDevice(pushToken, payload);
            }
          } else {
            console.log( 'time is in user dnd times', doc.id, messagingTime, dndTime1, dndTime2);
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