'use strict';

/** 
  * Get the Tracks of the given Participant.
  * @param {string} participant - A participant to get tracks
*/
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(function(publication) {
    return publication.track;
  }).map(function(publication){
    return publication.track;
  });
}

/**
  * Enable and disable tracks.
  * @param {local participant} localUser - The local user that is enabling/disabling.
  * @param {string} mute - The current state of the mute button.
  * @returns {void}
*/

 function muteAudio(localUser, mute) {
  getTracks(localUser).forEach(function(track) {
    if (track.kind === 'audio') {
      if (mute) {
        track.disable();
      } else {
        track.enable();
      }
    }
  });
 }

 function muteVideo(localUser, mute) {
  getTracks(localUser).forEach(function(track) {
    if (track.kind === 'video') {
      if (mute) {
        track.disable();
      } else {
        track.enable();
      }
    }
  });
 }

exports.muteAudio = muteAudio;
exports.muteVideo = muteVideo;