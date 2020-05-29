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
    console.log(`Participant "${participant.identity}" added ${track.kind} Track ${track.sid}`);
    if (track.kind === 'data') {
      track.on('message', data => {
        console.log(data);
      });
    }
  });
}


exports.publishDataTrackOnConnect = publishDataTrackOnConnect;
exports.localSendData = localSendData;
exports.sendData = sendData;
exports.receiveData = receiveData;
