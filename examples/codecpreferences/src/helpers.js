'use strict';

var Video = require('twilio-video');

/**
 * Connect to a Room with the given codec preferences.
 * @param {string} token - Token for joining the Room
 * @param {string} roomName - Room name
 * @param {Array<AudioCodecName>} preferredAudioCodecs - Preferred audio codecs
 * @param {Array<VideoCodecName>} preferredVideoCodecs - Preferred video codecs
 * @returns {CancelablePromise<Room>}
 */
function connectWithPreferredCodecs(token, roomName, preferredAudioCodecs, preferredVideoCodecs) {
  return Video.connect(token, {
    preferredAudioCodecs: preferredAudioCodecs,
    preferredVideoCodecs: preferredVideoCodecs,
    name: roomName
  });
}

exports.connectWithPreferredCodecs = connectWithPreferredCodecs;
