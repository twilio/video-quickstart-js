'use strict';

var Video = require('twilio-video');

/**
 * Connect to a Room with 'manual' mode. The default mode is 'auto'.
 * @param {string} token - AccessToken for joining the Room
 * @returns {Room}
 */
function joinRoom(token) {
  return Video.connect(token, {
    name: 'my-cool-room',
    bandwidthProfile: {
      video: {
        contentPreferencesMode: 'auto',
        clientTrackSwitchOffControl: 'auto'
      }
    }
  });
}

module.exports.joinRoom = joinRoom;
