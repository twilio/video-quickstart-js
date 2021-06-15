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
        contentPreferencesMode: 'manual',
        clientTrackSwitchOffControl: 'manual'
      }
    }
  });
}

/**
 * Switch on the RemoteVideoTrack.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to switch on.
 * @returns {RemoteVideoTrack}
 */
function switchOn(track) {
  return track.switchOn();
}

/**
 * Switch off the RemoteVideoTrack.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to switch off.
 * @returns {RemoteVideoTrack}
 */
 function switchOff(track) {
  return track.switchOff();
}

/**
 * Set the render dimensions of the RemoteVideoTrack.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to set render dimensions for.
 * @param {{height: number, width: number}} renderDimensions - The render dimensions for the RemoteVideoTrack.
 * @returns {RemoteVideoTrack}
 */
function setRenderDimensions(track, renderDimensions) {
  return track.setContentPreferences(renderDimensions);
}

module.exports.switchOn = switchOn;
module.exports.switchOff = switchOff;
module.exports.setRenderDimensions = setRenderDimensions;
module.exports.joinRoom = joinRoom;