'use strict';

var Video = require('twilio-video');

/**
 * add/removes css attribute per dominant speaker change.
 * @param {Participant} speaker - Participant
 * @param {boolean} add - boolean true when new speaker is detected. false for old speaker
 * @returns {void}
 */
function updateDominantSpeaker(speaker, add) {
  if (speaker) {
    const participantDiv = document.getElementById(speaker.sid);
    if (participantDiv) {
      participantDiv.classList[add ? 'add' : 'remove']('dominent_speaker');
    }
  }
}

/**
 * Creates a Room and handles dominant speaker changes.
 * @param {string} token - Token for joining the Room
 * @returns {CancelablePromise<Room>}
 */
let dominantSpeaker = null;
function createRoomAndUpdateOnSpeakerchange(token) {
  return Video.connect(token, {
    dominantSpeaker: true,
  }).then(function(room) {
    room.on('dominantSpeakerChanged', function(participant) {
      updateDominantSpeaker(dominantSpeaker, false);
      dominantSpeaker = participant;
      updateDominantSpeaker(dominantSpeaker, true);
    });
    return room;
  });
}

exports.createRoomAndUpdateOnSpeakerchange = createRoomAndUpdateOnSpeakerchange;
