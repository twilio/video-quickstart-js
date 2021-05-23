'use strict';

/**
 * Switch the RemoteVideoTrack on or off.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to switch on/off.
 * @param {boolean} isSwitchedOff - Boolean value of RemoteVideoTrack.isSwitchedOff.
 */
function switchOnOff(track, isSwitchedOff) {
  if(isSwitchedOff) {
    return track.switchOn();
  } else {
    return track.switchOff();
  }
}

/**
 * Set the render dimensions of the RemoteVideoTrack.
 * @param {RemoteVideoTrack} track - The RemoteVideoTrack you want to set render dimensions for.
 * @param {object} renderDimensions - The height and width render dimensions.
 */
function setRenderDimensions(track, renderDimensions) {
  if(track.isSwitchedOff) {
    track.switchOn();
  }
  return track.setContentPreferences(renderDimensions);
}

module.exports.switchOnOff = switchOnOff;
module.exports.setRenderDimensions = setRenderDimensions;
