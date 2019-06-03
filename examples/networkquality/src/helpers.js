'use strict';

var Video = require('twilio-video');

/**
 * Connect to a Room with the Dominant Speaker API enabled.
 * This API is available only in Small Group or Group Rooms.
 * @param {string} token - Token for joining the Room
 * @param {string} roomName - Room name
 * @returns {CancelablePromise<Room>}
 */
function connectToRoomWithDominantSpeaker(token, roomName) {
  return Video.connect(token, {
    dominantSpeaker: true,
    name: roomName
  });
}

/**
 * Listen to changes in the dominant speaker and update your application.
 * @param {Room} room - The Room you just joined
 * @param {function} updateDominantSpeaker - Updates the app UI with the new dominant speaker
 * @returns {void}
 */
function setupDominantSpeakerUpdates(room, updateDominantSpeaker) {
  room.on('dominantSpeakerChanged', function(participant) {
    console.log('A new RemoteParticipant is now the dominant speaker:', participant);
    updateDominantSpeaker(participant);
  });
}

exports.connectToRoomWithDominantSpeaker = connectToRoomWithDominantSpeaker;
exports.setupDominantSpeakerUpdates = setupDominantSpeakerUpdates;


