
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const MAX_USERS = 500;
const HALF_YEAR_MILLISECOND = 15724800000;
const THREE_MONTHS_MILLISECOND = 7862400000;
const DAY_MILLISECOND = 86400000;
const THREE_MONTHS_PLUS_DAY_MILLISECOND = THREE_MONTHS_MILLISECOND + DAY_MILLISECOND;

var db;


exports.reminderAboutVisit = functions.https.onRequest((req, res) => 
{
	var todayMillisecomd = new Date();
	db = admin.firestore();
	db.collection("Users")
		.where("userTimeStamp", "<", todayMillisecomd - THREE_MONTHS_MILLISECOND)
		.where("userTimeStamp", ">", todayMillisecomd - THREE_MONTHS_PLUS_DAY_MILLISECOND)
		.limit(MAX_USERS)
		.get()
		.then(querySnapshot => {
			var promises = [];
			querySnapshot.forEach(doc => 
			{
				console.log(doc.id);
         
				// Notification details.
				var payload = {
					notification: {
						title: 'Test !',
						body: `Hi ${doc.data().userName}, you haven't attended the program for a long time.`
					}
				};

				promises.push(
					admin.messaging().sendToDevice(doc.data().userFirebaseToken, payload).then(response => {
						console.log("Successfully sent invite message:", response)
						console.log(response.results[0].error)
					}).catch((err) => { console.log("Error sending Push", err) })
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
