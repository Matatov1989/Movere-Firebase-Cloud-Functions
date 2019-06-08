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
      var strTitle = doc.data().eventTitle;
      if (strTitle == 'SOS'){
        console.log('Event SOS id = ', doc.id);
        var type = doc.data().eventCreatorTypeVehicle;

        promises.push(db.collection("Users").doc(doc.data().eventCreatorId)
        .update({
          "userTypeVehicle": type
        })
        .then(function() {
          console.log("Document successfully updated! id = ", doc.data().eventCreatorId);
          promises.push(db.collection("Events").doc(doc.id).delete());
        }));
      }
      else{
        console.log('Event not SOS id = ', doc.id);
        console.log('Event not SOS index = ', doc.data().eventPhoto.indexOf(doc.id));
        if (doc.data().eventPhoto.indexOf(doc.id) != -1){
          const file = bucket.file("Events/" + doc.id);
          promises.push(file.delete());
        }
        promises.push(db.collection("Events").doc(doc.id).delete());
      }
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