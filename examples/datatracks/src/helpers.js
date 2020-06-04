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
function subscribeDataTrack (room, dataDiv) {
  room.participants.forEach(function(participant) {
    receiveData(participant)
  })
}

// send
function dataTrackPromise (room) {
  return new Promise(function (resolve, reject){
    room.localParticipant.on('trackPublished', function(publication) {
      if (publication.track === dataTrack) {
        resolve(dataTrack);
      }
    });

    room.localParticipant.on('trackPublicationFailed', function(error, track) {
      if (track === dataTrack) {
        reject(error);
      }
    });
  });
}

function sendData(dataTrack, message) {
  console.log('msg about to be sent', message)
  dataTrack.send(message)
}

// receive
function receiveData (participant) {
  participant.on('trackSubscribed', function(track) {
    if (track.kind === 'data') {
      track.on('message received', function(data) {
        console.log('data received', data);
      });
    }
  });
}


exports.connectToRoomWithDataTrack = connectToRoomWithDataTrack;
exports.subscribeDataTrack = subscribeDataTrack;
exports.sendData = sendData;
exports.receiveData = receiveData;
exports.dataTrackPromise = dataTrackPromise;