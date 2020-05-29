'use strict';

var Video = require('twilio-video');

// publish
function publishDataTrackOnConnect (token, roomName) {
  const localDataTrack = new Video.localDataTrack();

  const room = await connect(token, {
    name: roomName,
    tracks: [localDataTrack]
  });

  console.log(`Connected to room "${room.name}"!`)
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


exports.publishDataTrackOnConnect = publishDataTrackOnConnect;
exports.localSendData = localSendData;
exports.subscribeDataTrack = subscribeDataTrack;
exports.sendData = sendData;
exports.receiveData = receiveData;
