'use strict';

var Video = require('twilio-video');

// publish
async function connectToRoomWithDataTrack (token) {
  const localDataTrack = new Video.LocalDataTrack();

  const room = await Video.connect(token, {
    tracks: [localDataTrack]
  });

  return room;
}

// subscribe
function subscribeDataTrack (room) {
  room.participants.forEach(function(participant) {
    receiveData(participant)
  })
}

// send
function getDataTrackPromise (room, dataTrack) {
  return new Promise(function (resolve, reject){
    room.localParticipant.on('trackPublished', function(publication) {
      if (publication.track === dataTrack) {
        resolve(publication.track);
      }
    });

    room.localParticipant.on('trackPublicationFailed', function(error, track) {
      if (track === dataTrack){
        reject(error);
      }
    });
  });
}

function sendData(dataTrack, message) {
  dataTrack.send(message)
}

// receive
function receiveData (participant) {
  participant.on('trackSubscribed', function(track) {
    if (track.kind === 'data') {
      track.on('message', function(data) {
        console.log('data received', data);
      });
    }
  });
}


exports.connectToRoomWithDataTrack = connectToRoomWithDataTrack;
exports.subscribeDataTrack = subscribeDataTrack;
exports.sendData = sendData;
exports.receiveData = receiveData;
exports.getDataTrackPromise = getDataTrackPromise;