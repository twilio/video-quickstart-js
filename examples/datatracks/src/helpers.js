'use strict';

var Video = require('twilio-video');

/**
 * Connect to the given Room with a LocalDataTrack.
 * @param {string} token - AccessToken for joining the Room
 * @returns {CancelablePromise<Room>}
 */
async function connectToRoomWithDataTrack(token, roomName) {
  const localDataTrack = new Video.LocalDataTrack({
    name: 'chat',
  });

  const room = await Video.connect(token, {
    name: roomName,
    tracks: [localDataTrack],
  });

  return room;
}

/**
 * Send a chat message using the given LocalDataTrack.
 * @param {LocalDataTrack} dataTrack - The {@link LocalDataTrack} to send a message on
 * @param {string} message - The message to be sent
 */
function sendChatMessage(dataTrack, message) {
  dataTrack.send(message);
}

/**
 * Receive chat messages from RemoteParticipants in the given Room.
 * @param {Room} room - The Room you are currently in
 * @param {Function} onMessageReceived - Updates UI when a message is received
 */
function receiveChatMessages(room, onMessageReceived) {
  room.participants.forEach(function(participant) {
    participant.dataTracks.forEach(function(publication) {
      if (publication.isSubscribed && publication.trackName === 'chat') {
        publication.track.on('message', function(msg) {
          onMessageReceived(msg, participant);
        });
      }
    });
  });

  room.on('trackSubscribed', function(track, publication, participant) {
    if (track.kind === 'data' && track.name === 'chat') {
      track.on('message', function(msg) {
        onMessageReceived(msg, participant);
      });
    }
  });
}

exports.connectToRoomWithDataTrack = connectToRoomWithDataTrack;
exports.sendChatMessage = sendChatMessage;
exports.receiveChatMessages = receiveChatMessages;
