'use strict';

var Video = require('twilio-video');

/**
 * Creates a Room and handles dominant speaker changes.
 * @param {string} token - Token for joining the Room
 * @returns {CancelablePromise<Room>}
 */
function createRoomAndUpdateOnStateChange(token, onStateChange) {
  return Video.connect(token, {
    dominantSpeaker: true,
  }).then(function(room) {
    room.on('disconnected', onStateChange);
    room.on('reconnected', onStateChange);
    room.on('reconnecting', onStateChange);
    return room;
  });
}

exports.createRoomAndUpdateOnStateChange = createRoomAndUpdateOnStateChange;
