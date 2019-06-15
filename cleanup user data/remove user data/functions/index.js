'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const bucket = admin.storage().bucket("gs://movere-point.appspot.com/");

var removeUserId;
var imageLink;
var promises = [];

exports.removeUserData = functions.auth.user().onDelete((user) => {

	var db = admin.firestore();
	removeUserId = user.uid;
	
	console.log("remove user = ", removeUserId);
	
	//remove user icon from Cloud Storage
	db.collection('Users').doc(removeUserId).get()
	.then(doc => {
		if (!doc.exists) {
			console.log('No such document!');
		} else {
			console.log('Document data link to image:', doc.data().userUriPhoto);
			if (doc.data().userUriPhoto.includes("firebasestorage")){		
				const file = bucket.file(removeUserId + "/iconUser");
				promises.push(file.delete());
			}
		}
	})
	.catch(err => {
		console.log('Error getting document', err);
	});

	const path = "/Users/" + user.uid + "/chat channels";
	
	return deleteCollection(db, path, 100)
});
  
function deleteCollection(db, collectionPath, batchSize) {
	let collectionRef = db.collection(collectionPath);
	let query = collectionRef.orderBy('channelId').limit(batchSize);

	return new Promise((resolve, reject) => {
		deleteQueryBatch(db, query, batchSize, resolve, reject);
	});
}

function deleteQueryBatch(db, query, batchSize, resolve, reject) {

	query.get()
	.then((snapshot) => {
		// When there are no documents left, we are done
		console.log("snapshot size = ", snapshot.size);
		if (snapshot.size == 0) {
			return 0;
		}

		let batch = db.batch();
		snapshot.docs.forEach((doc) => {
			console.log("user sub-doc channelId ", doc.data().channelId);
			console.log("user sub-doc id ", doc.id);

			promises.push(db.collection("Users").doc(doc.id).collection("chat channels").doc(removeUserId).delete());

			batch.delete(doc.ref);
		});

		return batch.commit().then(() => {
			return snapshot.size;
		});
	})
	.then((numDeleted) => {
		if (numDeleted === 0) {
			console.log("numDeleted = ", numDeleted);
			resolve();
			
			promises.push(db.collection("Users").doc(removeUserId).delete());

			return Promise.all(promises);
		}

		process.nextTick(() => {
			deleteQueryBatch(db, query, batchSize, resolve, reject);
		});
	})
    .catch(reject);
}