'use strict';

var Video = require('twilio-video');

/**
 * Creates a Room and watches for room status events.
 * @param {string} token - Token for joining the Room
 * @param {function} onStateChange - Callback for state change.
 * @returns {CancelablePromise<Room>}
 */
function createRoomAndUpdateOnStateChange(token, onStateChange) {
  return Video.connect(token, {}).then(function(room) {
    room.on('disconnected', function(room, error) {
      console.log('disconnected from ', room);
      console.log('error was  ', error);
      onStateChange();
    });
    room.on('reconnecting', function(error) {
      console.log('reconnecting after error:', error);
      onStateChange();
    });
    room.on('reconnected', function() {
      console.log('reconnected!');
      onStateChange();
    });
    return room;
  });
}

exports.createRoomAndUpdateOnStateChange = createRoomAndUpdateOnStateChange;
