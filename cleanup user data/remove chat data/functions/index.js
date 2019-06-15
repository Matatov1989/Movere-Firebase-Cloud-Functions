'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const bucket = admin.storage().bucket("gs://movere-point.appspot.com/");

var removeUserId;
var idRoom;
var promises = [];

exports.removeChatData = functions.auth.user().onDelete((user) => {

	var db = admin.firestore();
	removeUserId = user.uid;

	const path = "/Chatrooms";
 	console.log("user = ", removeUserId);

	return deleteCollection(db, path, 250)
});
  
function deleteCollection(db, collectionPath, batchSize) {
	let collectionRef = db.collection(collectionPath);
	
	let query = collectionRef.where('userIds', 'array-contains', removeUserId).limit(batchSize);

	return new Promise((resolve, reject) => {
		deleteQueryBatchRooms(db, query, batchSize, resolve, reject);
	});
}

function deleteQueryBatchRooms(db, query, batchSize, resolve, reject) {
	
	query.get()
	.then((snapshot) => {
		// When there are no documents left, we are done
		console.log("chat snapshot size = ", snapshot.size);
		if (snapshot.size == 0) {
			return 0;
		}
		
		let batch = db.batch();
		snapshot.docs.forEach((doc) => {
			
			console.log("chat doc id ", doc.id);
			idRoom = doc.id;
			
			var pathChatMessages = "/Chatrooms/" + doc.id + "/messages";
			let collectionRefMessages = db.collection(pathChatMessages);
			let queryMessages = collectionRefMessages.limit(batchSize);
			
			new Promise((resolve, reject) => {
				deleteQueryBatchMessages(db, queryMessages, batchSize, resolve, reject);
			});
						
			batch.delete(doc.ref);
		});

		return batch.commit().then(() => {
			return snapshot.size;
		});

	}).then((numDeleted) => {
		if (numDeleted === 0) {
			console.log("chat numDeleted = ", numDeleted);
			resolve();

			return Promise.all(promises);
		}

		process.nextTick(() => {
			deleteQueryBatchRooms(db, query, batchSize, resolve, reject);
		});
    })
    .catch(reject);
}

function deleteQueryBatchMessages(db, query, batchSize, resolve, reject) {

	query.get()
	.then((snapshot) => {
		// When there are no documents left, we are done
		console.log("messages snapshot size = ", snapshot.size);
		if (snapshot.size == 0) {
			return 0;
		}

		let batch = db.batch();
		snapshot.docs.forEach((doc) => {
			console.log("messages sub-doc id ", doc.id);
			
			if (doc.data().type == "IMAGE") {
				const file = bucket.file(doc.data().imagePath);
				promises.push(file.delete());
            }
			
			batch.delete(doc.ref);
		});

		return batch.commit().then(() => {
			return snapshot.size;
		});
	})
	.then((numDeleted) => {
		if (numDeleted === 0) {
			console.log("messages numDeleted = ", numDeleted);
			resolve();
			
			return;
		}

		process.nextTick(() => {
			deleteQueryBatchMessages(db, query, batchSize, resolve, reject);
		});
	})
    .catch(reject);
}