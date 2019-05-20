'use strict';

var Video = require('twilio-video');

/**
 * Connect to a Room with and listne for dominant speaker change.
 * @param {string} token - Token for joining the Room
 * @param {string} roomName - Room name
 * @param {function} onDominantSpeakerChanged - Callback for dominant speaker change
 * @returns {CancelablePromise<Room>}
 */
function createRoomAndUpdateOnSpeakerchange(token, onDominantSpeakerChanged) {
  return Video.connect(token, {
    dominantSpeaker: true,
  }).then(function (room) {
    room.on('dominantSpeakerChanged', onDominantSpeakerChanged);
    return room;
  });
}

/**
 * Update the bandwidth constraints of a Room.
 * @param {Room} room - The Room whose bandwidth constraints have to be updated
 * @param {?number} maxAudioBitrate - Max audio bitrate (bps)
 * @param {?number} maxVideoBitrate - Max video bitrate (bps)
 */
function updateBandwidthConstraints(room, maxAudioBitrate, maxVideoBitrate) {
  room.localParticipant.setParameters({
    maxAudioBitrate: maxAudioBitrate,
    maxVideoBitrate: maxVideoBitrate
  });
}

exports.createRoomAndUpdateOnSpeakerchange = createRoomAndUpdateOnSpeakerchange;
exports.updateBandwidthConstraints = updateBandwidthConstraints;
