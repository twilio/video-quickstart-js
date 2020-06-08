'use strict';

var Video = require('twilio-video');

/**
 * Connect to a Room with Data Track
 * @param {string} token - Token for joining the Room
 * @returns {CancelablePromise<Room>}
 */
async function connectToRoomWithDataTrack (token) {
  const localDataTrack = new Video.LocalDataTrack();

  const room = await Video.connect(token, {
    tracks: [localDataTrack]
  });

  return room;
}

/**
 * Subscribing to the remote Data Tracks published to the Room
 * @param {Room} room - The Room's tracks you're subscribing to
 * @param {Function} onMessageReceived - Updates UI when a message has been received
 */
function subscribeDataTrack (room, onMessageReceived) {
  room.participants.forEach(function(participant) {
    receiveData(participant, onMessageReceived)
  })
}

/**
 *  Get a Data Track Promise
 * @param {Room} room - The Room you're listening to track publications on
 * @param {DataTrack} dataTrack - The Data Track that you've published
 */
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

/**
 * Send a message with the Data Track
 * @param {DataTrack} dataTrack - Data Track to send a message on
 * @param {string} message - Message to be sent
 */
function sendData(dataTrack, message) {
  dataTrack.send(message);
}

/**
 * Handle receiving a message from Remote Participants
 * @param {RemoteParticipant} participant - RemoteParticipant that you're getting messages from
 * @param {Function} onMessageReceived - Updates UI when a message is received
 */
function receiveData (participant, onMessageReceived) {
  participant.on('trackSubscribed', function(track) {
    if (track.kind === 'data') {
      track.on('message', function(data) {
        onMessageReceived(data)
      });
    }
  });
}

exports.connectToRoomWithDataTrack = connectToRoomWithDataTrack;
exports.subscribeDataTrack = subscribeDataTrack;
exports.sendData = sendData;
exports.receiveData = receiveData;
exports.getDataTrackPromise = getDataTrackPromise;
