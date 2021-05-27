'use strict';

/**
 * Switch the RemoteVideoTrack on.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to switch on/off.
 * @returns {RemoteVideoTrack}
 */
function switchOn(track) {
  return track.switchOn();
}

/**
 * Switch the RemoteVideoTrack off.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to switch on/off.
 * @returns {RemoteVideoTrack}
 */
 function switchOff(track) {
  return track.switchOff();
}

/**
 * Set the render dimensions of the RemoteVideoTrack.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to set render dimensions for.
 * @param {object} renderDimensions - The height and width render dimensions.
 * @returns {RemoteVideoTrack}
 */
function setRenderDimensions(track, renderDimensions) {
  return track.setContentPreferences(renderDimensions);
}

module.exports.switchOn = switchOn;
module.exports.switchOff = switchOff;
module.exports.setRenderDimensions = setRenderDimensions;
