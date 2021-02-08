'use strict';

const Video = require('twilio-video');

/**
 * Create a screen track for your screen. You can then publish it
 * to other Participants in the Room.
 * @param {number} height - Desired vertical resolution in pixels
 * @param {number} width - Desired horizontal resolution in pixels
 * @returns {MediaStream}
 */
function createScreenStream(height, width) {
  if (typeof navigator === 'undefined'
    || !navigator.mediaDevices
    || !navigator.mediaDevices.getDisplayMedia) {
    return Promise.reject(new Error('getDisplayMedia is not supported'));
  }
  return navigator.mediaDevices.getDisplayMedia({
    video: {
      height: height,
      width: width
    }
  })
}

exports.createScreenStream = createScreenStream;
