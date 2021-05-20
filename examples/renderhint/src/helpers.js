'use strict';

/**
 *
 */
function switchOnOff(track, state) {
  if(state === 'on') {
    track.switchOn();
  } else {
    track.switchOff();
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
