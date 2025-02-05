'use strict';

const Video = require('twilio-video');

/**
 * Create a LocalVideoTrack for your screen. You can then share it
 * with other Participants in the Room.
 * @param {number} height - Desired vertical resolution in pixels
 * @param {number} width - Desired horizontal resolution in pixels
 * @returns {Promise<LocalVideoTrack>}
 */
function createScreenTrack(height, width) {
  if (typeof navigator === 'undefined'
    || !window.CitrixWebRTC
    || !window.CitrixWebRTC.getDisplayMedia) {
    return Promise.reject(new Error('getDisplayMedia is not supported'));
  }
  return window.CitrixWebRTC.getDisplayMedia({
    video: {
      height: height,
      width: width
    }
  }).then(function(stream) {
    return new Video.LocalVideoTrack(stream.getVideoTracks()[0]);
  });
}

exports.createScreenTrack = createScreenTrack;
