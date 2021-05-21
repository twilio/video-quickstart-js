'use strict';

/**
 *
 */
function switchOnOff(track, isSwitchedOff) {
  if(isSwitchedOff) {
    return track.switchOn();
  } else {
    return track.switchOff();
  }
}

/**
 *
 */
function setRenderDimensions(track, renderDimensions) {
  if(track.isSwitchedOff) {
    track.switchOn();
  }
  return track.setContentPreferences(renderDimensions);
}

module.exports.switchOnOff = switchOnOff;
module.exports.setRenderDimensions = setRenderDimensions;
