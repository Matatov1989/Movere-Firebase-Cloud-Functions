'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const bucket = admin.storage().bucket("gs://movere-point.appspot.com/");
var db;

exports.removeOldEvents = functions.https.onRequest((req, res) => {
  db = admin.firestore();
  db.collection("Events")
  .where("eventStop", "<", new Date())
  .get()
  .then(querySnapshot => {
    var promises = [];

    querySnapshot.forEach(doc => {
      console.log('Event id = ', doc.id);
      var strLen = doc.data().eventPhoto.length;
      if (strLen > 0){
        const file = bucket.file("Events/" + doc.id);
        promises.push(file.delete());
      }
      promises.push(db.collection("Events").doc(doc.id).delete());
    });
    return Promise.all(promises);
    })
    .then(() => {
      console.log('Successful');
      res.send('Successful');
    })
    .catch(error => {
      console.log('Error ', error);
      res.status(500).send('Error ', error);
    });
 });
