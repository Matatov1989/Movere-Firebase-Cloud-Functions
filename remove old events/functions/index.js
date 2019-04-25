'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
var db;
//var count = 0;

// Cut off time. Child nodes older than this will be deleted.
const CUT_OFF_TIME = 2 * 60 * 60 * 1000; // 2 Hours in milliseconds.

/**
 * This database triggered function will check for child nodes that are older than the
 * cut-off time. Each child needs to have a `timestamp` attribute.
 */
exports.removeOldEvents = functions.https.onRequest((req, res) => {
   db = admin.firestore();
   db.collection("Events")
     .where("eventStop", "<", new Date())
     .get()
     .then(querySnapshot => {
       var promises = [];
       querySnapshot.forEach(doc => {
         console.log(doc.id);
         promises.push(
           db
             .collection("Events")
             .doc(doc.id)
             .delete()
         );
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
