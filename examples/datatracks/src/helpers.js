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
  room.participants.forEach(participant => {
    participant.tracks.forEach(publication => {
      publication.on('subscribed', track => {
        dataDiv.appendChild(track.attach());
      });
    });
  });
}

// send
function sendData (room, message) {
  const dataTrackPublished = {};

  dataTrackPublished.promise = new Promise((resolve, reject) => {
    dataTrackPublished.resolve = resolve;
    dataTrackPublished.reject = reject;
  });

  room.localParticipant.on('trackPublished', publication => {
    if (publication.track === dataTrack) {
      dataTrackPublished.resolve();
    }
  });

  room.localParticipant.on('trackPublicationFailed', (error, track) => {
    if (track === dataTrack) {
      dataTrackPublished.reject(error);
    }
  });

  dataTrackPublished.promise.then(() => dataTrack.send(message));
}

// receive
function receiveData (participant) {
  participant.on('trackSubscribed', track => {
    if (track.kind === 'data') {
      track.on('message', data => {
        console.log('data received', data);
      });
    }
  });
}


exports.connectToRoomWithDataTrack = connectToRoomWithDataTrack;
exports.localSendData = localSendData;
exports.subscribeDataTrack = subscribeDataTrack;
exports.sendData = sendData;
exports.receiveData = receiveData;
