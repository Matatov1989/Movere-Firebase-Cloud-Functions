'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const bucket = admin.storage().bucket("gs://movere-point.appspot.com/");

// Deletes the user data in the Realtime Datastore when the accounts are deleted.
exports.cleanupUserData = functions.auth.user().onDelete((user) => {
  //const uid = event.data.uid;
  //return admin.database().ref(`/users/${uid}`).remove();

//  return db.collection("Users").doc(uid).delete();
  return removeAllUserData(user.uid);

});

var removeUser;
var db;

var str1 = "1 start removeAllUserData <br>";

function removeAllUserData(uid){
  removeUser = uid;
  db = admin.firestore();
  return db.collection("Users").doc(removeUser)
  .get().then(
    doc => {
      if (doc.exists) {
        return db.collection("Users").doc(removeUser).collection("chat channels").get().
        then(sub => {
          if (sub.docs.length > 0) {
            removeChannelsFromUser();
          }
          else {
            removeUserDataAndIcon();
          }
        });
    }
  });
}

function removeChannelsFromUser(){
  str1 += "2 removeChannelsFromUser <br>";
  var count = 0;

  return db.collection("Users")
  .doc(removeUser)
  .collection("chat channels")
  .get().then(function(querySnapshot) {
    count = querySnapshot.size;
    querySnapshot.forEach(function(doc) {
        removeMessagesFromChatRoom(doc.data().channelId, doc.id, --count);
    });
  }).catch(function(error) {
  });
}

function removeMessagesFromChatRoom(idChannel, idDoc, num){
  str1 += "3 removeMessagesFromChatRoom idChannel = "+ idChannel + " --- idDoc = " + idDoc + "<br>";
  var count = 0;

  return db.collection("Chatrooms").doc(idChannel)
  .get().then(
    doc => {
      if (doc.exists) {
        return db.collection("Chatrooms").doc(idChannel).collection("messages").get().
        then(sub => {
          count = sub.docs.length;
          str1+="   count msg = " + count + "<br>";
          if (sub.docs.length > 0)
          {
            sub.forEach(function(docSub)
            {
              str1 += "    type msg = " + docSub.data().type + "<br>";
              if (docSub.data().type == "IMAGE") {
                removeMessageImageFromStorage(docSub.data().imagePath)
              }
              removeMessgeFromChannel(docSub.id, idChannel);

              if (--count == 0)
              {
                removeChannel(idChannel, idDoc, num);
              }
            })
          }
          else {
            removeChannel(idChannel, idDoc, num);
          }
        });
      }
    });
}

function removeUserDataAndIcon(){
  str1 += "9 removeUserDataAndIcon <br>";

  var docRef = db.collection("Users").doc(removeUser);
  return docRef.get().then(function(doc) {
    if (doc.exists) {

      if (doc.data().userUriPhoto.includes("firebasestorage"))
        removeUserIconFromStorage(doc.data().userUriPhoto);

      removUserData();
    } else {
    }
  }).catch(function(error) {
      console.log("Error getting document:", error);
  });
}

function removeMessageImageFromStorage(imagePath){
  str1 += "6 removeMessageImageFromStorage <br>";
  
  const file = bucket.file(imagePath);
  return file.delete();
}

function removeUserIconFromStorage(imagePath){
  str1 += "10 removeUserIconFromStorage <br>";

  const file = bucket.file(removeUser + "/iconUser");
  return file.delete();
}

function removeMessgeFromChannel(idMessage, idChannel){
  str1 += "4 removeMessgeFromChannel idMsg = " + idMessage + " ---  <br>";

  return db.collection("Chatrooms").doc(idChannel).collection("messages").doc(idMessage)
  .delete().then(function() {

  }).catch(function(error) {
      console.error("Error removing document: ", error);
  });
}

function removeChannel(idChannel, idDoc, num){
  str1 += "5 removeChannel idChannel = " + idChannel +" <br>";

  return db.collection("Chatrooms").doc(idChannel)
  .delete().then(function() {
    removeChannelFromUser(idDoc, num);
    removeChannelFromContact(idDoc);
  }).catch(function(error) {
    console.error("Error removing document: ", error);
  });
}

function removeChannelFromUser(idContact, num){
  str1 += "6 removeChannelFromUser "+idContact+"<br>";

  return db.collection("Users").doc(removeUser).collection("chat channels").doc(idContact)
  .delete().then(function() {
    if (num == 0) {
      removeUserDataAndIcon();
    }

  }).catch(function(error) {
      console.error("Error removing document: ", error);
  });

}

function removeChannelFromContact(idContact){
  str1 += "7 removeChannelFromContact <br>";

  return db.collection("Users").doc(idContact).collection("chat channels").doc(removeUser).delete();
}

function removUserData(){
  str1 += "11 removUserData <br>";

  return db.collection("Users").doc(removeUser).delete();
}